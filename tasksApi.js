import { supabasePublishableKey, supabaseUrl } from './supabaseClient';

const tasksApiUrl = supabaseUrl
  ? `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/venue_tasks`
  : '';

function createApiError(message) {
  return new Error(message);
}

function headers(accessToken, includeJson = false) {
  return {
    apikey: supabasePublishableKey,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function readResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw createApiError(payload?.message || `Permintaan gagal (HTTP ${response.status}).`);
  }
  return payload;
}

export async function fetchTasks(accessToken, signal) {
  if (!tasksApiUrl || !supabasePublishableKey) {
    throw createApiError('Konfigurasi Supabase belum lengkap.');
  }
  const response = await fetch(`${tasksApiUrl}?select=*&order=created_at.asc`, {
    headers: headers(accessToken),
    signal,
  });
  return readResponse(response);
}

export async function createTask(accessToken, title) {
  const response = await fetch(tasksApiUrl, {
    method: 'POST',
    headers: { ...headers(accessToken, true), Prefer: 'return=representation' },
    body: JSON.stringify({ title: title.trim(), completed: false }),
  });
  const payload = await readResponse(response);
  return payload[0];
}

export async function updateTask(accessToken, id, completed) {
  const response = await fetch(`${tasksApiUrl}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...headers(accessToken, true), Prefer: 'return=representation' },
    body: JSON.stringify({ completed }),
  });
  const payload = await readResponse(response);
  return payload[0];
}

export async function deleteTask(accessToken, id) {
  const response = await fetch(`${tasksApiUrl}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(accessToken),
  });
  await readResponse(response);
}
