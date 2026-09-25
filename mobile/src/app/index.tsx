import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ApiError } from '@/services/api';
import { getMe } from '@/services/auth';
import { isGuestModeEnabled, setGuestModeEnabled } from '@/services/guest';
import { useAuthStore } from '@/stores/auth.store';

const MIN_SPLASH_MS = 1650;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function LaunchScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: 120,
        damping: 14,
        stiffness: 95,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [opacity, scale, translateY]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const startedAt = Date.now();
      let destination: '/(app)' | '/(auth)/welcome' = '/(auth)/welcome';

      const rememberedGuest = await isGuestModeEnabled();

      if (rememberedGuest) {
        setUser(null);
        destination = '/(app)';
      } else {
        try {
          const user = await getMe();
          setUser(user);
          await setGuestModeEnabled(false);
          destination = '/(app)';
        } catch (error) {
          setUser(null);

          const unavailable =
            !(error instanceof ApiError) ||
            error.status >= 500;

          if (unavailable) {
            // When auth cannot be checked because the device/server is offline,
            // still allow public cached Scripture content in read-only mode.
            destination = '/(app)';
          }
        }
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPLASH_MS) {
        await sleep(MIN_SPLASH_MS - elapsed);
      }

      if (!cancelled) {
        router.replace(destination);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router, setUser]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Animated.Image
        accessibilityLabel="Pray in Verses. Pray the Bible Verse by Verse."
        source={require('../../assets/images/PIV-logo.png')}
        resizeMode="contain"
        style={[
          styles.logoLockup,
          {
            opacity,
            transform: [
              { scale },
              { translateY },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoLockup: {
    width: 260,
    height: 260,
  },
});
