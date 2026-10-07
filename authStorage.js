import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { supabase, requireSupabase } from './supabaseClient';

const PROFILE_KEY = 'lapangan.profile';
const REMEMBERED_EMAIL_KEY = 'lapangan.preferences.rememberedEmail';
const LEGACY_ACCOUNT_KEY = 'lapangan.auth.account';
const LEGACY_SESSION_KEY = 'lapangan.auth.session';

function toProfile(user) {
  return {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pemain',
    email: user.email || '',
  };
}

async function saveProfile(user) {
  const profile = toProfile(user);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function registerUser(name, email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;

  return {
    user: data.user ? toProfile(data.user) : null,
    needsEmailConfirmation: !data.session,
  };
}

export async function loginUser(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return saveProfile(data.user);
}

export async function restoreSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  if (!data.session?.user) {
    await AsyncStorage.removeItem(PROFILE_KEY);
    return null;
  }

  return saveProfile(data.session.user);
}

export async function logoutUser() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  await AsyncStorage.removeItem(PROFILE_KEY);
}

export async function getRememberedEmail() {
  return AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
}

export async function setRememberedEmail(email) {
  if (email) return AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  return AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

export async function clearLegacyLocalAccount() {
  if (Platform.OS === 'web') {
    await AsyncStorage.multiRemove([LEGACY_ACCOUNT_KEY, LEGACY_SESSION_KEY]);
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(LEGACY_ACCOUNT_KEY),
    SecureStore.deleteItemAsync(LEGACY_SESSION_KEY),
  ]);
}

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
