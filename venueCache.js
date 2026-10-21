import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapVenuesFromApi } from './venueModel';

const VENUE_CACHE_KEY = 'lapangan.venues.cache';

export async function loadCachedVenues() {
  const storedValue = await AsyncStorage.getItem(VENUE_CACHE_KEY);
  if (!storedValue) return null;

  let cachedData;
  try {
    cachedData = JSON.parse(storedValue);
  } catch (parseError) {
    console.warn('Cache lapangan tidak dapat dibaca dan akan dihapus.', parseError);
    await AsyncStorage.removeItem(VENUE_CACHE_KEY);
    return null;
  }

  try {
    return {
      venues: mapVenuesFromApi(cachedData?.venues),
      savedAt: cachedData.savedAt,
    };
  } catch (cacheError) {
    console.warn('Cache lapangan tidak valid dan akan dihapus.', cacheError);
    await AsyncStorage.removeItem(VENUE_CACHE_KEY);
    return null;
  }
}

export async function saveCachedVenues(venues) {
  await AsyncStorage.setItem(VENUE_CACHE_KEY, JSON.stringify({
    venues,
    savedAt: new Date().toISOString(),
  }));
}
