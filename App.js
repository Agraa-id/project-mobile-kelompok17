import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  clearLegacyLocalAccount,
  getRememberedEmail,
  loginUser,
  logoutUser,
  registerUser,
  restoreSession,
  setRememberedEmail,
} from './authStorage';
import HomeScreen from './HomeScreen';

export default function App() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([clearLegacyLocalAccount(), restoreSession(), getRememberedEmail()])
      .then(([, sessionUser, savedEmail]) => {
        if (!mounted) return;
        setUser(sessionUser);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
        }
      })
      .catch((restoreError) => {
        if (mounted) setError(restoreError.message || 'Sesi tidak dapat dipulihkan. Coba masuk kembali.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  async function handleSubmit() {
    setError('');
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi harus terdiri dari minimal 8 karakter.');
      return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setError('Nama minimal terdiri dari 2 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      let signedInUser;
      if (mode === 'register') {
        const result = await registerUser(name.trim(), normalizedEmail, password);
        if (result.needsEmailConfirmation) {
          setNotice('Akun dibuat di Supabase. Periksa email untuk konfirmasi, lalu masuk.');
          setMode('login');
          setPassword('');
          return;
        }
        signedInUser = result.user;
      } else {
        signedInUser = await loginUser(normalizedEmail, password);
      }
      await setRememberedEmail(rememberEmail ? normalizedEmail : '');
      setUser(signedInUser);
      setPassword('');
    } catch (submissionError) {
      setError(submissionError.message || 'Autentikasi gagal. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    if (isGuest) {
      setIsGuest(false);
      setMode('login');
      setError('');
      return;
    }

    setSubmitting(true);
    try {
      await logoutUser();
      setUser(null);
      setPassword('');
      setMode('login');
    } catch {
      setError('Sesi tidak dapat dihapus. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGuestLogin() {
    setError('');
    setNotice('');
    setPassword('');
    setIsGuest(true);
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  if (user || isGuest) {
    return (
      <HomeScreen
        user={user}
        isGuest={isGuest}
        onSignIn={() => { setIsGuest(false); setMode('login'); }}
        onSignOut={handleLogout}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Brand />
          <View style={styles.spacer} />
          <Text style={styles.cityLabel}>JAKARTA <Text style={styles.cityPin}>/</Text> ID</Text>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <Text style={styles.eyebrow}>RUANG UNTUK MAIN</Text>
          <Text style={styles.heroTitle}>Pertandingan{'\n'}dimulai di sini.</Text>
          <Text style={styles.heroSubtitle}>Temukan lapangan. Kumpulkan tim. Gaskeun.</Text>
          <View style={styles.court}>
            <View style={styles.courtHalfway} />
            <View style={styles.courtCenter}><View style={styles.courtDot} /></View>
            <View style={styles.courtGoal} />
          </View>
        </View>
        <View style={styles.formSection}>
          <View style={styles.formHeading}>
            <View>
              <Text style={styles.formTitle}>{mode === 'login' ? 'Masuk akun' : 'Buat akun'}</Text>
              <Text style={styles.formSubtitle}>{mode === 'login' ? 'Lanjutkan rencana mainmu.' : 'Satu langkah lagi menuju lapangan.'}</Text>
            </View>
            <View style={styles.modeBadge}><Text style={styles.modeBadgeText}>{mode === 'login' ? '01' : '02'}</Text></View>
          </View>

          {mode === 'register' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nama kamu"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
            </View>
          )}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>KATA SANDI</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 8 karakter"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'register' ? 'new-password' : 'password'}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
          {mode === 'login' && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberEmail }}
              onPress={() => setRememberEmail((current) => !current)}
              style={styles.rememberRow}
            >
              <View style={[styles.checkbox, rememberEmail && styles.checkboxChecked]}>
                {rememberEmail && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Ingat email di perangkat ini</Text>
            </Pressable>
          )}
          {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
          {!!notice && <Text accessibilityRole="alert" style={styles.successText}>{notice}</Text>}
          <Pressable onPress={handleSubmit} disabled={submitting} style={styles.submitButton}>
            {submitting ? <ActivityIndicator color={colors.white} /> : (
              <Text style={styles.submitText}>{mode === 'login' ? 'Masuk' : 'Daftar'} <Text style={styles.submitArrow}>→</Text></Text>
            )}
          </Pressable>
          {mode === 'login' && (
            <>
              <View style={styles.guestDivider}>
                <View style={styles.guestDividerLine} />
                <Text style={styles.guestDividerText}>ATAU</Text>
                <View style={styles.guestDividerLine} />
              </View>
              <Pressable onPress={handleGuestLogin} style={styles.guestButton}>
                <Text style={styles.guestButtonText}>Jelajahi sebagai tamu</Text>
                <Text style={styles.guestButtonArrow}>→</Text>
              </Pressable>
            </>
          )}
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}</Text>
            <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              <Text style={styles.switchAction}>{mode === 'login' ? 'Daftar' : 'Masuk'}</Text>
            </Pressable>
          </View>
          <Text style={styles.localNotice}>Autentikasi online memakai akun Supabase.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
      <Text style={styles.brandName}>LAPANGAN</Text>
    </View>
  );
}

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  authScroll: { flexGrow: 1, paddingBottom: 28 },
  topBar: {
    minHeight: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  brandMarkText: { color: colors.lime, fontSize: 18, fontWeight: '900' },
  brandName: { marginLeft: 10, color: colors.deep, fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  spacer: { flex: 1 },
  cityLabel: { color: colors.deep, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  cityPin: { color: colors.coral },
  hero: {
    minHeight: 224,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 24,
    backgroundColor: colors.green,
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    top: -62,
    right: -30,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(215,243,106,0.22)',
  },
  eyebrow: { color: colors.coral, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroTitle: { marginTop: 10, color: colors.white, fontSize: 34, lineHeight: 38, fontWeight: '900' },
  heroSubtitle: { marginTop: 8, color: '#DAE7DF', fontSize: 13 },
  court: {
    position: 'absolute',
    right: 24,
    bottom: 18,
    width: 112,
    height: 66,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.37)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  courtHalfway: { position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.37)' },
  courtCenter: {
    position: 'absolute',
    top: 16,
    left: 39,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.37)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.lime },
  courtGoal: { position: 'absolute', top: 20, left: 0, width: 11, height: 26, borderWidth: 1, borderLeftWidth: 0, borderColor: 'rgba(255,255,255,0.37)' },
  formSection: { paddingHorizontal: 24, paddingTop: 21 },
  formHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  formTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  formSubtitle: { marginTop: 3, color: colors.muted, fontSize: 12 },
  modeBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  modeBadgeText: { color: colors.deep, fontSize: 11, fontWeight: '900' },
  field: { marginBottom: 11 },
  fieldLabel: { marginBottom: 6, color: colors.deep, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  input: {
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 14,
  },
  rememberRow: { alignSelf: 'flex-start', minHeight: 32, flexDirection: 'row', alignItems: 'center', marginTop: -2, marginBottom: 7 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.muted, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkboxTick: { color: colors.white, fontSize: 12, fontWeight: '900' },
  rememberText: { marginLeft: 9, color: colors.muted, fontSize: 12 },
  errorText: { marginBottom: 9, color: '#B3422B', fontSize: 12 },
  successText: { marginBottom: 9, color: colors.green, fontSize: 12, lineHeight: 18 },
  submitButton: {
    height: 48,
    marginTop: 3,
    paddingHorizontal: 17,
    borderRadius: 5,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  submitArrow: { fontSize: 18 },
  guestDivider: { height: 37, flexDirection: 'row', alignItems: 'center', gap: 10 },
  guestDividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  guestDividerText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  guestButton: {
    height: 46,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: { color: colors.green, fontSize: 13, fontWeight: '900' },
  guestButtonArrow: { marginLeft: 8, color: colors.green, fontSize: 18 },
  switchRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  switchPrompt: { color: colors.muted, fontSize: 12 },
  switchAction: { color: colors.green, fontSize: 12, fontWeight: '900' },
  localNotice: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  logoutButton: { paddingVertical: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 4 },
  logoutText: { color: colors.deep, fontSize: 12, fontWeight: '800' },
  homeContent: { flex: 1, paddingHorizontal: 24, paddingTop: 42 },
  homeTitle: { marginTop: 9, color: colors.ink, fontSize: 32, fontWeight: '900' },
  homeSubtitle: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 20 },
  accountPanel: { marginTop: 28, padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.deep, fontSize: 18, fontWeight: '900' },
  identity: { flex: 1, marginLeft: 12 },
  userName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  userEmail: { marginTop: 3, color: colors.muted, fontSize: 12 },
  divider: { height: 1, marginVertical: 15, backgroundColor: colors.line },
  storageRow: { minHeight: 31, flexDirection: 'row', alignItems: 'center' },
  storageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral },
  secureDot: { backgroundColor: colors.green },
  storageLabel: { flex: 1, marginLeft: 9, color: colors.ink, fontSize: 12 },
  storageType: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  notice: { marginTop: 14, padding: 13, borderRadius: 4, backgroundColor: '#EAF0E6' },
  noticeText: { color: colors.deep, fontSize: 11, lineHeight: 16 },
  homeFooter: { paddingHorizontal: 24, paddingVertical: 20 },
  footerText: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
});
