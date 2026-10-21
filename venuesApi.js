import { mapVenuesFromApi } from './venueModel';
import { supabasePublishableKey, supabaseUrl } from './supabaseClient';

const venuesApiUrl = supabaseUrl
  ? `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/venues?select=*`
  : '';

function createApiError(kind, message) {
  const error = new Error(message);
  error.kind = kind;
  return error;
}

export async function fetchVenues(signal, accessToken) {
  if (!venuesApiUrl || !supabasePublishableKey) {
    throw createApiError('configuration', 'Konfigurasi Supabase belum lengkap. Isi URL dan publishable key di .env.local.');
  }

  let response;
  try {
    response = await fetch(venuesApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        apikey: supabasePublishableKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal,
    });
  } catch (requestError) {
    if (requestError?.name === 'AbortError') throw requestError;
    throw createApiError('network', 'Tidak dapat terhubung ke API lapangan. Periksa koneksi internet dan coba lagi.');
  }

  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      const message = response.status === 401 || response.status === 403
        ? 'Akses ke API lapangan ditolak. Periksa konfigurasi akses Supabase.'
        : response.status === 404
          ? 'Data lapangan tidak ditemukan di API.'
          : response.status === 429
            ? 'API lapangan sedang menerima terlalu banyak permintaan. Coba beberapa saat lagi.'
            : `Permintaan data lapangan ditolak (HTTP ${response.status}).`;
      throw createApiError('client', message);
    }
    if (response.status >= 500) {
      throw createApiError('server', `Server API lapangan sedang bermasalah (HTTP ${response.status}). Coba beberapa saat lagi.`);
    }
    throw createApiError('http', `API lapangan mengembalikan HTTP ${response.status}.`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (parseError) {
    if (parseError?.name === 'AbortError') throw parseError;
    throw createApiError('response', 'Respons API lapangan bukan JSON yang valid.');
  }

  return mapVenuesFromApi(payload);
}
