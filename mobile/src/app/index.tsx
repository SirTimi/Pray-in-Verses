import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/colors';
import { getMe } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const MIN_SPLASH_MS = 1300;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function LaunchScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const copyTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 110,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(copyOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(copyTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [copyOpacity, copyTranslateY, logoOpacity, logoScale]);

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
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blueOrb} />
      <View style={styles.goldOrb} />
      <View style={styles.smallBlueOrb} />

      <View style={styles.centerContent}>
        <Animated.Image
          source={require('../../assets/images/PIV-logo.png')}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.copyBlock,
            {
              opacity: copyOpacity,
              transform: [{ translateY: copyTranslateY }],
            },
          ]}
        >
          <Text style={styles.statement}>Pray Scripture.</Text>
          <Text style={styles.statement}>Live Scripture.</Text>
          <Text style={styles.supportingText}>
            Turn God&apos;s Word into prayer, reflection and a closer walk with Him.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footerBlock, { opacity: copyOpacity }]}>
        <View style={styles.goldRule} />
        <Text style={styles.footerText}>SCRIPTURE • PRAYER • REFLECTION</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFEF8',
  },
  blueOrb: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    top: -150,
    right: -120,
    backgroundColor: '#E4ECFF',
  },
  goldOrb: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    left: -195,
    bottom: -165,
    backgroundColor: '#FFF0B8',
    opacity: 0.82,
  },
  smallBlueOrb: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    right: -32,
    bottom: '28%',
    backgroundColor: '#EFF4FF',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 52,
  },
  logo: {
    width: 210,
    height: 160,
  },
  copyBlock: {
    alignItems: 'center',
    marginTop: 26,
  },
  statement: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  supportingText: {
    maxWidth: 310,
    marginTop: 14,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerBlock: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 38,
    alignItems: 'center',
  },
  goldRule: {
    width: 36,
    height: 3,
    marginBottom: 12,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  footerText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
});
