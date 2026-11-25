import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { requireSupabase } from '../supabaseClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const supportsPushNotifications = true;

export async function getRegisteredDevices() {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Masuk ke akun sebelum melihat perangkat terdaftar.');

  const { data, error } = await client
    .from('week11_push_tokens')
    .select('expo_push_token, platform, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function registerCurrentDevice() {
  const client = requireSupabase();
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    throw new Error('Push notification hanya tersedia di aplikasi Android atau iOS.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifikasi Lapangan',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Izin notifikasi ditolak. Aktifkan notifikasi untuk aplikasi di pengaturan perangkat.');
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('Project ID Expo tidak ditemukan. Periksa konfigurasi EAS aplikasi.');
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sesi akun tidak ditemukan. Masuk kembali sebelum mendaftarkan perangkat.');

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error: registrationError } = await client.rpc('register_week11_push_token', {
    p_expo_push_token: tokenResult.data,
    p_platform: Platform.OS,
  });
  if (registrationError) throw registrationError;

  return tokenResult.data;
}

export async function sendPushNotification({ title, body, screen }) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('send-week11-notification', {
    body: {
      title,
      body,
      data: { screen, id: String(Date.now()) },
    },
  });
  if (error) {
    let message = error.message || 'Edge Function gagal mengirim notifikasi.';
    if (error.context && typeof error.context.json === 'function') {
      try {
        const responseBody = await error.context.json();
        if (typeof responseBody?.error === 'string') message = responseBody.error;
      } catch {
        message = error.message || 'Edge Function mengembalikan respons yang tidak valid.';
      }
    }
    throw new Error(message);
  }
  return data;
}
