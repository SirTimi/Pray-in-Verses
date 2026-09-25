import * as SecureStore from 'expo-secure-store';

const GUEST_MODE_KEY = 'piv.guest-mode.v1';

export async function setGuestModeEnabled(enabled: boolean) {
  if (enabled) {
    await SecureStore.setItemAsync(GUEST_MODE_KEY, '1');
    return;
  }

  await SecureStore.deleteItemAsync(GUEST_MODE_KEY);
}

export async function isGuestModeEnabled() {
  return (await SecureStore.getItemAsync(GUEST_MODE_KEY)) === '1';
}
