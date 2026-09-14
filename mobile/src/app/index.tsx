import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { getMe } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const MIN_SPLASH_MS = 1450;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function LaunchScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.025)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 1050,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [opacity, scale]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const startedAt = Date.now();
      let destination: '/(app)' | '/(auth)/welcome' = '/(auth)/welcome';

      try {
        const user = await getMe();
        setUser(user);
        destination = '/(app)';
      } catch {
        setUser(null);
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
      <StatusBar style="light" />
      <Animated.Image
        accessibilityLabel="Pray in Verses. Pray Scripture. Live Scripture. A closer walk, a brighter tomorrow."
        source={require('../../assets/images/intro/splash-ideal.jpg')}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#062A69',
    overflow: 'hidden',
  },
});
