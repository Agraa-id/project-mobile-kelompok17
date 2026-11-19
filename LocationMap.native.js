import MapView, { Circle, Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

export default function LocationMap({
  mapRef,
  location,
  geofenceCenter,
  geofenceRadius,
  onSelectGeofence,
}) {
  if (!location) {
    return (
      <View style={styles.emptyMap}>
        <Text style={styles.emptyText}>Peta akan tampil setelah lokasi ditemukan.</Text>
      </View>
    );
  }

  const coordinate = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{ ...coordinate, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      onLongPress={({ nativeEvent }) => onSelectGeofence(nativeEvent.coordinate)}
      showsCompass
      showsScale
    >
      <Marker coordinate={coordinate} title="Lokasi saya" description="Posisi GPS perangkat." pinColor="#14564A" />
      {!!geofenceCenter && (
        <>
          <Circle
            center={geofenceCenter}
            radius={geofenceRadius}
            strokeColor="rgba(242, 116, 86, 0.9)"
            fillColor="rgba(242, 116, 86, 0.16)"
            strokeWidth={2}
          />
          <Marker coordinate={geofenceCenter} title="Area pantau" pinColor="#F27456" />
        </>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  emptyMap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#123B35', fontSize: 11, fontWeight: '700' },
});
