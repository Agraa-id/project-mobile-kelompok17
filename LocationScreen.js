import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LocationMap from './LocationMap';

const colors = {
  green: '#14564A',
  deep: '#123B35',
  lime: '#D7F36A',
  coral: '#F27456',
  paper: '#F8F7F0',
  ink: '#18231F',
  muted: '#7C8981',
  line: '#DDE3D9',
  white: '#FFFFFF',
};

const GEOFENCE_RADIUS_METERS = 500;
const ADDRESS_REFRESH_DISTANCE_METERS = 100;

function distanceBetween(first, second) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatAddress(address) {
  return [...new Set([
    address.name,
    address.street,
    address.district,
    address.city,
    address.region,
    address.country,
  ].filter(Boolean))].join(', ');
}

export default function LocationScreen() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState(null);
  const [geofenceEvent, setGeofenceEvent] = useState('');
  const mapRef = useRef(null);
  const geofenceCenterRef = useRef(null);
  const lastGeocodedCoords = useRef(null);
  const lastInsideGeofence = useRef(null);
  const screenActive = useRef(true);

  useEffect(() => {
    screenActive.current = true;
    return () => {
      screenActive.current = false;
    };
  }, []);

  const updateAddress = useCallback(async (coords) => {
    const previousCoords = lastGeocodedCoords.current;
    if (previousCoords && distanceBetween(previousCoords, coords) < ADDRESS_REFRESH_DISTANCE_METERS) {
      return;
    }

    lastGeocodedCoords.current = { latitude: coords.latitude, longitude: coords.longitude };
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (!screenActive.current) return;

      const formattedAddress = results.length ? formatAddress(results[0]) : '';
      setAddress(formattedAddress || 'Alamat tidak tersedia.');
      setAddressError(formattedAddress ? '' : 'Alamat tidak ditemukan untuk koordinat ini.');
    } catch (geocodeError) {
      if (!screenActive.current) return;
      setAddress('Alamat tidak tersedia.');
      setAddressError(geocodeError.message || 'Alamat tidak dapat dimuat.');
    }
  }, []);

  const handleLocationUpdate = useCallback((nextLocation) => {
    setLocation(nextLocation);
    updateAddress(nextLocation.coords);

    if (!geofenceCenterRef.current) {
      const center = {
        latitude: nextLocation.coords.latitude,
        longitude: nextLocation.coords.longitude,
      };
      geofenceCenterRef.current = center;
      setGeofenceCenter(center);
    }

    const inside = distanceBetween(nextLocation.coords, geofenceCenterRef.current) <= GEOFENCE_RADIUS_METERS;
    const previousState = lastInsideGeofence.current;
    lastInsideGeofence.current = inside;
    setIsInsideGeofence(inside);

    if (previousState !== null && previousState !== inside) {
      setGeofenceEvent(inside ? 'Kamu memasuki area pantau.' : 'Kamu keluar dari area pantau.');
    }
  }, [updateAddress]);

  useEffect(() => {
    if (!isMonitoring) return undefined;

    let active = true;
    let subscription;
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 20,
      },
      (nextLocation) => {
        if (active) handleLocationUpdate(nextLocation);
      },
    ).then((watcher) => {
      if (active) subscription = watcher;
      else watcher.remove();
    }).catch((watchError) => {
      if (!active) return;
      setError(watchError.message || 'Pemantauan lokasi gagal dimulai.');
      setIsMonitoring(false);
    });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [handleLocationUpdate, isMonitoring]);

  async function getCurrentLocation() {
    setIsLocating(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError(Platform.OS === 'web'
          ? 'Browser menolak lokasi. Izinkan Location untuk localhost lewat ikon izin di address bar, lalu coba lagi.'
          : 'Izin lokasi ditolak. Aktifkan izin lokasi untuk memakai peta.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!screenActive.current) return;
      handleLocationUpdate(currentLocation);
    } catch (locationError) {
      setError(Platform.OS === 'web'
        ? 'Browser tidak dapat membaca lokasi. Izinkan Location untuk localhost di address bar dan aktifkan layanan lokasi perangkat.'
        : locationError.message || 'Lokasi tidak dapat diakses saat ini.');
    } finally {
      if (screenActive.current) setIsLocating(false);
    }
  }

  async function toggleMonitoring() {
    if (isMonitoring) {
      setIsMonitoring(false);
      setGeofenceEvent('Pemantauan lokasi dihentikan.');
      return;
    }

    if (!location) {
      setError('Ambil lokasi terlebih dahulu sebelum memantau area.');
      return;
    }

    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Izin lokasi tidak tersedia. Ambil lokasi lagi untuk memberi izin.');
        return;
      }

      setError('');
      setGeofenceEvent('Pemantauan area dimulai.');
      setIsMonitoring(true);
    } catch (permissionError) {
      setError(permissionError.message || 'Status izin lokasi tidak dapat diperiksa.');
    }
  }

  function chooseGeofenceCenter(coordinate) {
    const center = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    geofenceCenterRef.current = center;
    setGeofenceCenter(center);

    if (!location) return;
    const inside = distanceBetween(location.coords, center) <= GEOFENCE_RADIUS_METERS;
    lastInsideGeofence.current = inside;
    setIsInsideGeofence(inside);
    setGeofenceEvent('Titik area pantau diperbarui.');
  }

  function centerMapOnLocation() {
    if (!location) return;
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 350);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FITUR LOKASI</Text>
          <Text style={styles.title}>Peta lapangan</Text>
          <Text style={styles.subtitle}>Lihat posisi dan pantau area di sekitar lapangan.</Text>
        </View>
        <View style={[styles.statusPill, isMonitoring && styles.statusPillActive]}>
          <View style={[styles.statusDot, isMonitoring && styles.statusDotActive]} />
          <Text style={[styles.statusText, isMonitoring && styles.statusTextActive]}>
            {isMonitoring ? 'MEMANTAU' : 'JEDA'}
          </Text>
        </View>
      </View>

      <View style={styles.mapSection}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Lokasi saat ini</Text>
            <Text style={styles.sectionCaption}>
              {Platform.OS === 'web'
                ? 'GPS memakai izin browser; peta interaktif tersedia di aplikasi mobile.'
                : 'Tekan lama peta untuk memilih area pantau.'}
            </Text>
          </View>
          {!!location && (
            <Pressable accessibilityRole="button" onPress={centerMapOnLocation} style={styles.recenterButton}>
              <Text style={styles.recenterText}>Pusatkan</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.mapFrame}>
          <LocationMap
            mapRef={mapRef}
            location={location}
            geofenceCenter={geofenceCenter}
            geofenceRadius={GEOFENCE_RADIUS_METERS}
            onSelectGeofence={chooseGeofenceCenter}
          />
          {!location && (
            <View style={styles.mapOverlay}>
              {isLocating ? (
                <ActivityIndicator color={colors.green} />
              ) : (
                <Text style={styles.mapOverlayText}>Ambil lokasi untuk membuka peta.</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.locationPanel}>
        <View style={styles.panelHeading}>
          <View>
            <Text style={styles.panelEyebrow}>GPS PERANGKAT</Text>
            <Text style={styles.panelTitle}>{location ? 'Koordinat ditemukan' : 'Belum ada lokasi'}</Text>
          </View>
          {!!location && (
            <Text style={styles.accuracyText}>
              ±{Math.round(location.coords.accuracy || 0)} m
            </Text>
          )}
        </View>

        {location ? (
          <>
            <CoordinateRow label="Latitude" value={location.coords.latitude.toFixed(6)} />
            <CoordinateRow label="Longitude" value={location.coords.longitude.toFixed(6)} />
            <View style={styles.addressRow}>
              <Text style={styles.coordinateLabel}>Alamat</Text>
              <View style={styles.addressCopy}>
                <Text style={styles.addressText}>{address || 'Mencari alamat...'}</Text>
                {!!addressError && <Text style={styles.addressError}>{addressError}</Text>}
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.emptyCaption}>Izinkan akses lokasi untuk membaca koordinat dan alamat.</Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isLocating }}
          disabled={isLocating}
          onPress={getCurrentLocation}
          style={[styles.primaryButton, isLocating && styles.buttonDisabled]}
        >
          {isLocating
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.primaryButtonText}>{location ? 'Perbarui lokasi' : 'Ambil lokasi'}</Text>}
        </Pressable>
        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.geofencePanel}>
        <View style={styles.panelHeading}>
          <View>
            <Text style={styles.panelEyebrow}>GEOFENCING</Text>
            <Text style={styles.panelTitle}>Area pantau 500 m</Text>
          </View>
          <View style={[
            styles.geofenceBadge,
            isMonitoring && isInsideGeofence && styles.geofenceBadgeInside,
            isMonitoring && isInsideGeofence === false && styles.geofenceBadgeOutside,
          ]}>
            <Text style={styles.geofenceBadgeText}>
              {!isMonitoring
                ? 'SIAP DIPANTAU'
                : isInsideGeofence
                  ? 'DI DALAM AREA'
                  : 'DI LUAR AREA'}
            </Text>
          </View>
        </View>
        <Text style={styles.geofenceCaption}>
          Area ditandai dari titik pilihan di peta. Pemantauan berhenti saat layar ditutup.
        </Text>
        {!!geofenceEvent && (
          <Text accessibilityRole="alert" style={styles.eventText}>{geofenceEvent}</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isMonitoring }}
          onPress={toggleMonitoring}
          style={[styles.monitorButton, isMonitoring && styles.monitorButtonStop]}
        >
          <Text style={styles.monitorButtonText}>
            {isMonitoring ? 'Hentikan pemantauan' : 'Mulai pemantauan area'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.infoBand}>
        <Text style={styles.infoTitle}>Hemat baterai</Text>
        <Text style={styles.infoText}>
          GPS memakai akurasi seimbang, jeda 10 detik, dan filter jarak 20 meter. Pelacakan aktif hanya saat layar ini terbuka dan pemantauan dinyalakan.
        </Text>
      </View>
    </ScrollView>
  );
}

function CoordinateRow({ label, value }) {
  return (
    <View style={styles.coordinateRow}>
      <Text style={styles.coordinateLabel}>{label}</Text>
      <Text style={styles.coordinateValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  header: {
    minHeight: 116,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 7, color: colors.ink, fontSize: 25, fontWeight: '900' },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 11 },
  statusPill: {
    minHeight: 28,
    marginLeft: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillActive: { borderColor: '#B9DCC6', backgroundColor: '#E8F3E9' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.muted },
  statusDotActive: { backgroundColor: colors.green },
  statusText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  statusTextActive: { color: colors.green },
  mapSection: { marginTop: 18 },
  sectionHeading: {
    minHeight: 48,
    marginHorizontal: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  sectionCaption: { marginTop: 4, color: colors.muted, fontSize: 9 },
  recenterButton: { minHeight: 34, marginLeft: 'auto', paddingHorizontal: 11, justifyContent: 'center', borderRadius: 4, backgroundColor: colors.lime },
  recenterText: { color: colors.deep, fontSize: 10, fontWeight: '900' },
  mapFrame: { height: 285, marginHorizontal: 22, borderRadius: 5, overflow: 'hidden', backgroundColor: '#E7EDE7' },
  mapOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,247,240,0.8)' },
  mapOverlayText: { color: colors.deep, fontSize: 11, fontWeight: '800' },
  locationPanel: { marginHorizontal: 22, marginTop: 15, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  panelHeading: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  panelTitle: { marginTop: 4, color: colors.deep, fontSize: 14, fontWeight: '900' },
  accuracyText: { color: colors.green, fontSize: 10, fontWeight: '900' },
  coordinateRow: { minHeight: 36, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coordinateLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  coordinateValue: { color: colors.ink, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] },
  addressRow: { minHeight: 48, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-start' },
  addressCopy: { flex: 1, marginLeft: 12 },
  addressText: { color: colors.ink, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  addressError: { marginTop: 3, color: colors.coral, fontSize: 9 },
  emptyCaption: { marginTop: 10, color: colors.muted, fontSize: 10, lineHeight: 15 },
  primaryButton: { minHeight: 44, marginTop: 10, borderRadius: 4, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  errorText: { marginTop: 9, color: '#A9452D', fontSize: 10, lineHeight: 15 },
  geofencePanel: { marginHorizontal: 22, marginTop: 14, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  geofenceBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, backgroundColor: '#EFF1EB' },
  geofenceBadgeInside: { backgroundColor: '#E8F3E9' },
  geofenceBadgeOutside: { backgroundColor: '#FFF0E8' },
  geofenceBadgeText: { color: colors.deep, fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  geofenceCaption: { marginTop: 8, color: colors.muted, fontSize: 10, lineHeight: 15 },
  eventText: { marginTop: 9, color: colors.green, fontSize: 10, fontWeight: '800' },
  monitorButton: { minHeight: 42, marginTop: 12, borderRadius: 4, backgroundColor: colors.deep, alignItems: 'center', justifyContent: 'center' },
  monitorButtonStop: { backgroundColor: colors.coral },
  monitorButtonText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  infoBand: { marginHorizontal: 22, marginTop: 14, padding: 13, borderLeftWidth: 3, borderLeftColor: colors.coral, backgroundColor: '#F0EFE5' },
  infoTitle: { color: colors.deep, fontSize: 10, fontWeight: '900' },
  infoText: { marginTop: 5, color: colors.muted, fontSize: 9, lineHeight: 15 },
});
