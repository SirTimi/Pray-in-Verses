import {
  Stack,
} from 'expo-router';

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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

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