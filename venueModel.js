function requiredText(value, field, index) {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`Data lapangan ke-${index + 1} tidak memiliki field "${field}" yang valid.`);
  }
  return String(value).trim();
}

function formatPrice(value, index) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return requiredText(value, 'price', index);
}

export function mapVenueFromApi(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`Data lapangan ke-${index + 1} bukan objek yang valid.`);
  }

  return {
    id: requiredText(item.id, 'id', index),
    name: requiredText(item.name, 'name', index),
    sport: requiredText(item.sport, 'sport', index),
    location: requiredText(item.location, 'location', index),
    price: formatPrice(item.price, index),
    rating: item.rating == null ? 'Baru' : requiredText(item.rating, 'rating', index),
    surface: item.surface == null ? 'Informasi permukaan belum tersedia' : requiredText(item.surface, 'surface', index),
    image: requiredText(item.image, 'image', index),
  };
}

export function mapVenuesFromApi(payload) {
  const items = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(items)) {
    throw new Error('Format respons API tidak valid. API harus mengirim array data lapangan.');
  }

  const venues = items.map(mapVenueFromApi);
  const ids = new Set();
  for (const venue of venues) {
    if (ids.has(venue.id)) {
      throw new Error(`API mengirim ID lapangan duplikat: ${venue.id}.`);
    }
    ids.add(venue.id);
  }
  return venues;
}
