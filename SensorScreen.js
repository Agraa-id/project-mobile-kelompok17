import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
  Platform,
} from 'react-native';

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
  blue: '#2878C8',
  red: '#D84C4C',
};

const GRAVITY = 9.81;
const UPDATE_INTERVAL_MS = 100;
const SHAKE_THRESHOLD_G = 0.75;
const SHAKE_COOLDOWN_MS = 1400;
const HISTORY_LENGTH = 24;

export default function SensorScreen() {
  const [sensorData, setSensorData] = useState({ x: 0, y: 0, z: 0 });
  const [history, setHistory] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [shakeDetected, setShakeDetected] = useState(false);
  const [error, setError] = useState('');
  const previousSample = useRef(null);
  const lastShakeAt = useRef(0);

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return undefined;

    let mounted = true;
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = Accelerometer.addListener((measurement) => {
      if (!mounted) return;

      const { x, y, z } = measurement;
      setSensorData({ x, y, z });
      setHistory((current) => [...current.slice(-(HISTORY_LENGTH - 1)), { x, y, z }]);

      const previous = previousSample.current;
      if (previous) {
        const movement = Math.sqrt(
          (x - previous.x) ** 2 + (y - previous.y) ** 2 + (z - previous.z) ** 2,
        );
        const now = Date.now();
        if (movement >= SHAKE_THRESHOLD_G && now - lastShakeAt.current >= SHAKE_COOLDOWN_MS) {
          lastShakeAt.current = now;
          setShakeDetected(true);
          if (Platform.OS !== 'web') Vibration.vibrate(180);
          setTimeout(() => {
            if (mounted) setShakeDetected(false);
          }, SHAKE_COOLDOWN_MS);
        }
      }
      previousSample.current = { x, y, z };
    });

    return () => {
      mounted = false;
      subscription.remove();
      previousSample.current = null;
    };
  }, [isActive]);

  async function toggleSensor() {
    if (Platform.OS === 'web') {
      setError('Sensor gerak tidak dapat dijalankan di browser pada build ini. Gunakan aplikasi Android atau iOS.');
      return;
    }

    if (isActive) {
      setIsActive(false);
      setShakeDetected(false);
      return;
    }

    setError('');
    setIsStarting(true);
    try {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) {
        setError('Accelerometer tidak tersedia pada perangkat ini. Coba jalankan di ponsel.');
        return;
      }

      const currentPermission = await Accelerometer.getPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await Accelerometer.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Izin sensor gerak belum diberikan. Aktifkan izin lalu coba lagi.');
        return;
      }

      previousSample.current = null;
      lastShakeAt.current = 0;
      setHistory([]);
      setIsActive(true);
    } catch (sensorError) {
      setError(sensorError.message || 'Sensor tidak dapat diakses saat ini.');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FITUR PERANGKAT</Text>
          <Text style={styles.title}>Sensor gerak</Text>
          <Text style={styles.subtitle}>Lihat gerakan perangkat secara langsung.</Text>
        </View>
        <View style={[styles.statusPill, isActive && styles.statusPillActive]}>
          <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
          <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
            {isActive ? 'LIVE' : 'JEDA'}
          </Text>
        </View>
      </View>

      <View style={styles.sensorPanel}>
        <View style={styles.panelHeading}>
          <View>
            <Text style={styles.panelEyebrow}>ACCELEROMETER</Text>
            <Text style={styles.panelTitle}>Data sumbu perangkat</Text>
          </View>
          <Text style={styles.unitLabel}>m/s²</Text>
        </View>

        <View style={styles.axisRow}>
          <AxisValue axis="X" value={sensorData.x * GRAVITY} color={colors.red} />
          <AxisValue axis="Y" value={sensorData.y * GRAVITY} color={colors.green} />
          <AxisValue axis="Z" value={sensorData.z * GRAVITY} color={colors.blue} />
        </View>

        <View style={[styles.shakeBanner, shakeDetected && styles.shakeBannerDetected]}>
          <View style={[styles.shakeMark, shakeDetected && styles.shakeMarkDetected]}>
            <Text style={styles.shakeMarkText}>{shakeDetected ? '!' : '~'}</Text>
          </View>
          <View style={styles.shakeCopy}>
            <Text style={[styles.shakeTitle, shakeDetected && styles.shakeTitleDetected]}>
              {shakeDetected ? 'Guncangan terdeteksi' : 'Deteksi guncangan'}
            </Text>
            <Text style={styles.shakeCaption}>
              {shakeDetected ? 'Perangkat bergerak cukup kuat.' : 'Goyangkan perangkat untuk mencoba.'}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isStarting || Platform.OS === 'web', selected: isActive }}
          disabled={isStarting || Platform.OS === 'web'}
          onPress={toggleSensor}
          style={[styles.actionButton, isActive && styles.actionButtonStop, isStarting && styles.actionButtonDisabled]}
        >
          {isStarting ? <ActivityIndicator color={colors.white} /> : (
            <Text style={styles.actionButtonText}>
              {Platform.OS === 'web'
                ? 'Sensor tersedia di aplikasi mobile'
                : isActive
                  ? 'Hentikan sensor'
                  : 'Mulai sensor'}
            </Text>
          )}
        </Pressable>
        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionTitle}>Perubahan data</Text>
          <Text style={styles.sectionCaption}>Pembacaan terbaru, diperbarui setiap 0,1 detik.</Text>
        </View>
        <Text style={styles.sampleCount}>{history.length.toString().padStart(2, '0')}</Text>
      </View>

      <View style={styles.chartPanel}>
        {[
          { axis: 'X', key: 'x', color: colors.red },
          { axis: 'Y', key: 'y', color: colors.green },
          { axis: 'Z', key: 'z', color: colors.blue },
        ].map((item) => (
          <View key={item.key} style={styles.chartRow}>
            <Text style={[styles.chartAxis, { color: item.color }]}>{item.axis}</Text>
            <View style={styles.chartBars}>
              {Array.from({ length: HISTORY_LENGTH }, (_, index) => {
                const sample = history[index];
                const magnitude = sample ? Math.abs(sample[item.key]) : 0;
                const barHeight = sample ? Math.max(3, Math.min(24, magnitude * 18)) : 3;
                return (
                  <View key={`${item.key}-${index}`} style={styles.chartSlot}>
                    <View style={[styles.chartBar, { height: barHeight, backgroundColor: item.color, opacity: sample ? 0.9 : 0.14 }]} />
                  </View>
                );
              })}
            </View>
            <Text style={styles.chartLatest}>
              {history.length ? `${(sensorData[item.key] * GRAVITY).toFixed(1)}` : '--'}
            </Text>
          </View>
        ))}
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>DATA LOKAL PERANGKAT</Text>
          <Text style={styles.chartFooterText}>{isActive ? 'SAMPLING 10 HZ' : 'BELUM AKTIF'}</Text>
        </View>
      </View>

      <View style={styles.infoBand}>
        <Text style={styles.infoTitle}>Tentang data ini</Text>
        <Text style={styles.infoText}>
          {Platform.OS === 'web'
            ? 'Sensor gerak tidak tersedia pada versi browser ini. Buka aplikasi di perangkat Android atau iOS untuk membaca accelerometer.'
            : 'Accelerometer membaca percepatan pada sumbu X, Y, dan Z. Nilai mentah dalam g ditampilkan sebagai m/s²; data hanya dibaca saat sensor aktif.'}
        </Text>
      </View>
    </ScrollView>
  );
}

function AxisValue({ axis, value, color }) {
  return (
    <View style={styles.axisCard}>
      <Text style={[styles.axisLabel, { color }]}>{axis}</Text>
      <Text style={styles.axisValue}>{value.toFixed(2)}</Text>
      <Text style={styles.axisUnit}>m/s²</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  header: { minHeight: 116, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 7, color: colors.ink, fontSize: 25, fontWeight: '900' },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 11 },
  statusPill: { minHeight: 28, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusPillActive: { borderColor: '#B9DCC6', backgroundColor: '#E8F3E9' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.muted },
  statusDotActive: { backgroundColor: colors.green },
  statusText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  statusTextActive: { color: colors.green },
  sensorPanel: { marginHorizontal: 22, marginTop: 18, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  panelTitle: { marginTop: 4, color: colors.deep, fontSize: 14, fontWeight: '900' },
  unitLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  axisRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  axisCard: { flex: 1, minHeight: 91, paddingVertical: 10, borderRadius: 4, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  axisLabel: { fontSize: 11, fontWeight: '900' },
  axisValue: { marginTop: 4, color: colors.ink, fontSize: 19, fontWeight: '900', fontVariant: ['tabular-nums'] },
  axisUnit: { marginTop: 1, color: colors.muted, fontSize: 8 },
  shakeBanner: { minHeight: 57, marginTop: 12, paddingHorizontal: 10, borderRadius: 4, backgroundColor: '#F1F4EC', flexDirection: 'row', alignItems: 'center' },
  shakeBannerDetected: { backgroundColor: '#FFF0E8' },
  shakeMark: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  shakeMarkDetected: { backgroundColor: colors.coral },
  shakeMarkText: { color: colors.deep, fontSize: 20, fontWeight: '900' },
  shakeCopy: { flex: 1, marginLeft: 9 },
  shakeTitle: { color: colors.deep, fontSize: 11, fontWeight: '900' },
  shakeTitleDetected: { color: '#A9452D' },
  shakeCaption: { marginTop: 3, color: colors.muted, fontSize: 9 },
  actionButton: { minHeight: 44, marginTop: 13, borderRadius: 4, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  actionButtonStop: { backgroundColor: colors.coral },
  actionButtonDisabled: { opacity: 0.65 },
  actionButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  errorText: { marginTop: 10, color: '#A9452D', fontSize: 10, lineHeight: 15 },
  sectionHeading: { paddingHorizontal: 22, paddingTop: 23, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  sectionCaption: { marginTop: 4, color: colors.muted, fontSize: 9 },
  sampleCount: { marginLeft: 'auto', color: colors.green, fontSize: 13, fontWeight: '900' },
  chartPanel: { marginHorizontal: 22, paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8, borderRadius: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chartRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartAxis: { width: 13, fontSize: 10, fontWeight: '900' },
  chartBars: { flex: 1, height: 28, flexDirection: 'row', alignItems: 'center', gap: 3 },
  chartSlot: { flex: 1, height: 28, alignItems: 'center', justifyContent: 'center' },
  chartBar: { width: '100%', maxWidth: 7, borderRadius: 2 },
  chartLatest: { width: 35, color: colors.ink, textAlign: 'right', fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  chartFooter: { minHeight: 28, marginTop: 5, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartFooterText: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  infoBand: { marginHorizontal: 22, marginTop: 14, padding: 13, borderLeftWidth: 3, borderLeftColor: colors.coral, backgroundColor: '#F0EFE5' },
  infoTitle: { color: colors.deep, fontSize: 10, fontWeight: '900' },
  infoText: { marginTop: 5, color: colors.muted, fontSize: 9, lineHeight: 15 },
});
