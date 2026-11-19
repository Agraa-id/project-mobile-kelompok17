import { StyleSheet, Text, View } from 'react-native';

export default function LocationMap({ location, geofenceCenter, geofenceRadius }) {
  return (
    <View style={styles.map}>
      <Text style={styles.title}>Peta interaktif tersedia di Android dan iOS.</Text>
      <Text style={styles.caption}>GPS browser tetap dapat dipakai setelah izin lokasi diberikan.</Text>
      {location && (
        <Text style={styles.caption}>
          {`GPS: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`}
        </Text>
      )}
      {geofenceCenter && (
        <Text style={styles.caption}>
          {`Area pantau: radius ${geofenceRadius} m`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { color: '#123B35', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  caption: { marginTop: 8, color: '#7C8981', fontSize: 10, textAlign: 'center' },
});
