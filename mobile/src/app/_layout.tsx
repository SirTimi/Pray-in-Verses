import {
  Stack,
  useRouter,
} from 'expo-router';

import * as Notifications
  from 'expo-notifications';

import * as SplashScreen
  from 'expo-splash-screen';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  useEffect,
} from 'react';

import {
  colors,
} from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const lastNotificationResponse =
    Notifications.useLastNotificationResponse();

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (!lastNotificationResponse) return;

    const response = lastNotificationResponse;
    const data =
      response.notification.request.content.data;

    if (
      response.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER &&
      (data?.kind === 'prayer-reminder' ||
        data?.kind === 'prayer-reminder-test')
    ) {
      router.push('/(app)/reminders');
    }

    Notifications.clearLastNotificationResponse();
  }, [lastNotificationResponse, router]);

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor:
              colors.background,
          },
        }}
      />
    </>
  );
}
