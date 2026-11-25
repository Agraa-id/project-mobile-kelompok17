export const supportsPushNotifications = false;

export async function getRegisteredDevices() {
  return [];
}

export async function registerCurrentDevice() {
  throw new Error('Push notification perangkat hanya tersedia di aplikasi Android atau iOS.');
}

export async function sendPushNotification() {
  throw new Error('Push notification perangkat hanya tersedia di aplikasi Android atau iOS.');
}
