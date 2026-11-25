import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getRegisteredDevices,
  registerCurrentDevice,
  sendPushNotification,
  supportsPushNotifications,
} from './pushNotifications';

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

const destinations = [
  { label: 'Notif', value: 'week11' },
  { label: 'Jelajah', value: 'explore' },
  { label: 'Jadwal', value: 'tasks' },
  { label: 'Akun', value: 'account' },
];

export default function Week11Screen({
  user,
  isGuest,
  receivedNotification,
  onSignIn,
}) {
  const [devices, setDevices] = useState([]);
  const [title, setTitle] = useState('Update Lapangan');
  const [body, setBody] = useState('Ada informasi baru untuk akunmu.');
  const [destination, setDestination] = useState('week11');
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isGuest || !user || !supportsPushNotifications) return undefined;

    let active = true;
    getRegisteredDevices()
      .then((registeredDevices) => {
        if (active) setDevices(registeredDevices);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Perangkat terdaftar tidak dapat dimuat.');
      })
      .finally(() => {
        if (active) setIsLoadingDevices(false);
      });

    return () => {
      active = false;
    };
  }, [isGuest, user]);

  async function handleRegisterDevice() {
    setIsRegistering(true);
    setError('');
    setNotice('');
    try {
      const token = await registerCurrentDevice();
      const registeredDevices = await getRegisteredDevices();
      setDevices(registeredDevices);
      setNotice(`Perangkat terdaftar. Token: ${token}`);
    } catch (registrationError) {
      setError(registrationError.message || 'Perangkat tidak dapat didaftarkan.');
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleSendNotification() {
    if (!title.trim() || !body.trim()) {
      setError('Isi judul dan pesan notifikasi.');
      return;
    }
    if (!devices.length) {
      setError('Daftarkan perangkat terlebih dahulu sebelum mengirim notifikasi.');
      return;
    }

    setIsSending(true);
    setError('');
    setNotice('');
    try {
      const result = await sendPushNotification({
        title: title.trim(),
        body: body.trim(),
        screen: destination,
      });
      const failures = Array.isArray(result.errors) && result.errors.length
        ? ` ${result.errors.length} gagal: ${result.errors[0]}`
        : '';
      const warning = typeof result.warning === 'string' ? ` ${result.warning}` : '';
      setNotice(
        `Provider menerima ${result.accepted} notifikasi dari ${result.total} perangkat.${failures}${warning}`,
      );
    } catch (sendError) {
      setError(sendError.message || 'Notifikasi tidak dapat dikirim.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>WEEK 11 · PUSH NOTIFICATION</Text>
          <Text style={styles.title}>Notifikasi Lapangan</Text>
          <Text style={styles.subtitle}>Daftarkan perangkat, kirim pesan, lalu buka tujuan dari notifikasi.</Text>
        </View>
        <View style={[styles.statusPill, devices.length > 0 && styles.statusPillActive]}>
          <View style={[styles.statusDot, devices.length > 0 && styles.statusDotActive]} />
          <Text style={[styles.statusText, devices.length > 0 && styles.statusTextActive]}>
            {devices.length > 0 ? `${devices.length} TERDAFTAR` : 'BELUM TERDAFTAR'}
          </Text>
        </View>
      </View>

      {!supportsPushNotifications ? (
        <View style={styles.infoBand}>
          <Text style={styles.infoTitle}>Perlu aplikasi Android atau iOS</Text>
          <Text style={styles.infoText}>
            Browser tidak mendukung push notification Expo. Jalankan development build di perangkat untuk meminta izin, mendaftarkan token, dan menerima push.
          </Text>
        </View>
      ) : isGuest ? (
        <View style={styles.accountPanel}>
          <Text style={styles.panelTitle}>Masuk untuk mendaftarkan perangkat</Text>
          <Text style={styles.description}>Push token disimpan untuk akun Lapangan yang sedang aktif.</Text>
          <Pressable accessibilityRole="button" onPress={onSignIn} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Masuk atau daftar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionNumber}>01</Text>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Daftarkan perangkat</Text>
              <Text style={styles.sectionCaption}>Minta izin, dapatkan Expo Push Token, simpan ke Supabase.</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelEyebrow}>DEVICE REGISTRATION</Text>
                <Text style={styles.panelTitle}>Perangkat akun</Text>
              </View>
              {isLoadingDevices && <ActivityIndicator color={colors.green} />}
            </View>
            {devices.length ? devices.map((device) => (
              <View key={device.expo_push_token} style={styles.deviceRow}>
                <View style={styles.deviceMark}><Text style={styles.deviceMarkText}>✓</Text></View>
                <View style={styles.deviceCopy}>
                  <Text style={styles.deviceTitle}>{device.platform.toUpperCase()}</Text>
                  <Text style={styles.tokenText} numberOfLines={1}>{device.expo_push_token}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.description}>Belum ada perangkat yang terhubung ke akun ini.</Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isRegistering }}
              disabled={isRegistering}
              onPress={handleRegisterDevice}
              style={[styles.primaryButton, isRegistering && styles.buttonDisabled]}
            >
              {isRegistering
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.primaryButtonText}>Minta izin & daftarkan perangkat</Text>}
            </Pressable>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionNumber}>02</Text>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Kirim push dari server</Text>
              <Text style={styles.sectionCaption}>Edge Function mengirim pesan ke token milik akun ini.</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.fieldLabel}>JUDUL NOTIFIKASI</Text>
            <TextInput
              accessibilityLabel="Judul notifikasi"
              maxLength={100}
              onChangeText={setTitle}
              placeholder="Judul"
              style={styles.input}
              value={title}
            />
            <Text style={styles.fieldLabel}>ISI PESAN</Text>
            <TextInput
              accessibilityLabel="Isi pesan notifikasi"
              maxLength={500}
              onChangeText={setBody}
              placeholder="Pesan yang dikirim ke perangkat"
              style={[styles.input, styles.messageInput]}
              value={body}
              multiline
            />
            <Text style={styles.fieldLabel}>TUJUAN SAAT NOTIFIKASI DITEKAN</Text>
            <View style={styles.destinationRow}>
              {destinations.map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: destination === item.value }}
                  onPress={() => setDestination(item.value)}
                  style={[styles.destinationButton, destination === item.value && styles.destinationButtonActive]}
                >
                  <Text style={[styles.destinationText, destination === item.value && styles.destinationTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSending || !devices.length }}
              disabled={isSending || !devices.length}
              onPress={handleSendNotification}
              style={[styles.sendButton, (!devices.length || isSending) && styles.buttonDisabled]}
            >
              {isSending
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.primaryButtonText}>Kirim notifikasi ke perangkat</Text>}
            </Pressable>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionNumber}>03</Text>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Terima & buka notifikasi</Text>
              <Text style={styles.sectionCaption}>Pesan foreground dan payload saat notifikasi ditekan.</Text>
            </View>
          </View>

          <View style={styles.notificationCard}>
            {receivedNotification ? (
              <>
                <Text style={styles.panelEyebrow}>NOTIFIKASI TERAKHIR</Text>
                <Text style={styles.notificationTitle}>{receivedNotification.title}</Text>
                <Text style={styles.notificationBody}>{receivedNotification.body}</Text>
                <Text style={styles.payloadLabel}>PAYLOAD</Text>
                <Text style={styles.payloadValue}>{JSON.stringify(receivedNotification.data, null, 2)}</Text>
              </>
            ) : (
              <>
                <View style={styles.bellMark}><Text style={styles.bellMarkText}>!</Text></View>
                <Text style={styles.notificationTitle}>Belum ada notifikasi</Text>
                <Text style={styles.notificationBody}>Kirim notifikasi uji, lalu tekan notifikasi di perangkat untuk membuka tujuan.</Text>
              </>
            )}
          </View>

          {!!notice && <Text accessibilityRole="alert" style={styles.noticeText}>{notice}</Text>}
          {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: {
    minHeight: 128,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.coral, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 7, color: colors.ink, fontSize: 23, fontWeight: '900' },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 10, lineHeight: 15 },
  statusPill: {
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusPillActive: { borderColor: '#B9DCC6', backgroundColor: '#E8F3E9' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  statusDotActive: { backgroundColor: colors.green },
  statusText: { color: colors.muted, fontSize: 7, fontWeight: '900' },
  statusTextActive: { color: colors.green },
  sectionHeading: { minHeight: 56, marginHorizontal: 22, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  sectionNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, color: colors.deep, textAlign: 'center', textAlignVertical: 'center', fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingTop: 7 },
  sectionCopy: { flex: 1, marginLeft: 10 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  sectionCaption: { marginTop: 3, color: colors.muted, fontSize: 9, lineHeight: 13 },
  panel: { marginHorizontal: 22, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  panelHeader: { minHeight: 43, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  panelTitle: { marginTop: 4, color: colors.deep, fontSize: 14, fontWeight: '900' },
  description: { marginTop: 8, color: colors.muted, fontSize: 10, lineHeight: 15 },
  deviceRow: { minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  deviceMark: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E8F3E9', alignItems: 'center', justifyContent: 'center' },
  deviceMarkText: { color: colors.green, fontSize: 14, fontWeight: '900' },
  deviceCopy: { flex: 1, marginLeft: 9 },
  deviceTitle: { color: colors.deep, fontSize: 9, fontWeight: '900' },
  tokenText: { marginTop: 3, color: colors.muted, fontSize: 8 },
  primaryButton: { minHeight: 44, marginTop: 13, borderRadius: 4, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  buttonDisabled: { opacity: 0.55 },
  fieldLabel: { marginTop: 11, color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  input: { minHeight: 42, marginTop: 6, paddingHorizontal: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 4, color: colors.ink, fontSize: 11 },
  messageInput: { minHeight: 68, paddingTop: 10, textAlignVertical: 'top' },
  destinationRow: { marginTop: 8, flexDirection: 'row', gap: 6 },
  destinationButton: { flex: 1, minHeight: 34, borderWidth: 1, borderColor: colors.line, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  destinationButtonActive: { borderColor: colors.green, backgroundColor: colors.green },
  destinationText: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  destinationTextActive: { color: colors.white },
  sendButton: { minHeight: 44, marginTop: 14, borderRadius: 4, backgroundColor: colors.deep, alignItems: 'center', justifyContent: 'center' },
  notificationCard: { marginHorizontal: 22, padding: 16, borderRadius: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  bellMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  bellMarkText: { color: colors.deep, fontSize: 18, fontWeight: '900' },
  notificationTitle: { marginTop: 8, color: colors.deep, fontSize: 13, fontWeight: '900' },
  notificationBody: { marginTop: 5, color: colors.muted, fontSize: 10, lineHeight: 15 },
  payloadLabel: { marginTop: 13, color: colors.coral, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  payloadValue: { marginTop: 5, color: colors.ink, fontSize: 9, lineHeight: 14, fontFamily: 'monospace' },
  noticeText: { marginHorizontal: 22, marginTop: 10, color: colors.green, fontSize: 10, lineHeight: 15 },
  errorText: { marginHorizontal: 22, marginTop: 10, color: '#A9452D', fontSize: 10, lineHeight: 15 },
  accountPanel: { margin: 22, padding: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white },
  infoBand: { margin: 22, padding: 15, borderLeftWidth: 3, borderLeftColor: colors.coral, backgroundColor: '#F0EFE5' },
  infoTitle: { color: colors.deep, fontSize: 11, fontWeight: '900' },
  infoText: { marginTop: 6, color: colors.muted, fontSize: 10, lineHeight: 16 },
});
