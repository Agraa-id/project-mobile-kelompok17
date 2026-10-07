import { mapVenuesFromApi } from './venueModel';
import { supabasePublishableKey, supabaseUrl } from './supabaseClient';

const venuesApiUrl = supabaseUrl
  ? `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/venues?select=*`
  : '';

export async function fetchVenues(signal) {
  if (!venuesApiUrl || !supabasePublishableKey) {
    throw new Error('Konfigurasi Supabase belum lengkap. Isi URL dan publishable key di .env.local.');
  }

  let response;
  try {
    response = await fetch(venuesApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        apikey: supabasePublishableKey,
      },
      signal,
    });
  } catch (requestError) {
    if (requestError.name === 'AbortError') throw requestError;
    throw new Error(`Tidak dapat terhubung ke API lapangan: ${requestError.message}`);
  }

  if (!response.ok) {
    throw new Error(`API lapangan mengembalikan HTTP ${response.status}.`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Respons API lapangan bukan JSON yang valid.');
  }

  return mapVenuesFromApi(payload);
}
