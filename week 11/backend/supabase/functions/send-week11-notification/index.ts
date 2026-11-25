// Supabase Edge Runtime resolves this remote ESM import.
// eslint-disable-next-line import/no-unresolved
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return respond(405, { error: 'Only POST requests are supported.' });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return respond(401, { error: 'Authentication is required.' });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return respond(400, { error: 'Request body must be valid JSON.' });
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return respond(400, { error: 'Request body must be an object.' });
  }

  const { title, body, data } = input as Record<string, unknown>;
  if (typeof title !== 'string' || !title.trim() || title.length > 100) {
    return respond(400, { error: 'Title must contain 1 to 100 characters.' });
  }
  if (typeof body !== 'string' || !body.trim() || body.length > 500) {
    return respond(400, { error: 'Body must contain 1 to 500 characters.' });
  }
  if (data !== undefined && (!data || typeof data !== 'object' || Array.isArray(data))) {
    return respond(400, { error: 'Notification data must be a JSON object.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(500, { error: 'Notification server is not configured.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const accessToken = authorization.slice('Bearer '.length);
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return respond(401, { error: 'The current session is invalid.' });
  }

  const { data: devices, error: deviceError } = await supabase
    .from('week11_push_tokens')
    .select('expo_push_token')
    .eq('user_id', user.id);
  if (deviceError) {
    return respond(500, { error: 'Registered devices could not be loaded.' });
  }
  if (!devices?.length) {
    return respond(404, { error: 'No push-enabled device is registered for this account.' });
  }
  if (devices.length > 100) {
    return respond(400, { error: 'This account has more registered devices than one request can send.' });
  }

  const messages = devices.map(({ expo_push_token }) => ({
    to: expo_push_token,
    sound: 'default',
    channelId: 'default',
    title: title.trim(),
    body: body.trim(),
    data: data || {},
  }));

  let providerResponse: Response;
  try {
    providerResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return respond(502, { error: 'Expo Push Service could not be reached. Try again later.' });
  }

  let providerPayload: { data?: { status?: string; message?: string; details?: { error?: string } }[] };
  try {
    providerPayload = await providerResponse.json();
  } catch {
    return respond(502, { error: 'Expo Push Service returned an invalid response.' });
  }
  if (!providerResponse.ok || !Array.isArray(providerPayload.data)) {
    return respond(502, { error: 'Expo Push Service rejected the notification request.' });
  }

  const tickets = providerPayload.data;
  const invalidTokens = tickets.flatMap((ticket, index) => (
    ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered'
      ? [devices[index].expo_push_token]
      : []
  ));
  let cleanupWarning: string | undefined;
  if (invalidTokens.length) {
    const { error: cleanupError } = await supabase
      .from('week11_push_tokens')
      .delete()
      .in('expo_push_token', invalidTokens);
    if (cleanupError) cleanupWarning = 'Expired device tokens could not be removed.';
  }

  const accepted = tickets.filter((ticket) => ticket.status === 'ok').length;
  const errors = tickets
    .filter((ticket) => ticket.status === 'error')
    .map((ticket) => ticket.message || 'Push provider rejected a notification.');
  if (!accepted) {
    return respond(502, {
      error: errors[0] || 'Push provider rejected all notifications.',
      accepted,
      total: devices.length,
      errors,
      ...(cleanupWarning ? { warning: cleanupWarning } : {}),
    });
  }

  return respond(200, {
    accepted,
    total: devices.length,
    errors,
    ...(cleanupWarning ? { warning: cleanupWarning } : {}),
  });
});
