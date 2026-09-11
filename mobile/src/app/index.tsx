import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { getMe } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const MIN_SPLASH_MS = 1450;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function LaunchScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 14,
          stiffness: 100,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(copyOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [copyOpacity, logoOpacity, logoScale]);

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

      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0C338E" />
            <Stop offset="38%" stopColor="#315180" />
            <Stop offset="64%" stopColor="#6A7486" />
            <Stop offset="78%" stopColor="#E2B76B" />
            <Stop offset="100%" stopColor="#10233F" />
          </SvgLinearGradient>
          <SvgLinearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFD36A" stopOpacity="0.96" />
            <Stop offset="100%" stopColor="#F4B72B" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="390" height="844" fill="url(#sky)" />
        <Circle cx="300" cy="648" r="96" fill="url(#sunGlow)" opacity="0.7" />
        <Circle cx="303" cy="650" r="9" fill="#FFF4C5" />
        <Path d="M0 664 C54 636 105 645 155 670 C207 694 262 666 318 650 C350 641 372 642 390 648 L390 844 L0 844 Z" fill="#42546E" opacity="0.9" />
        <Path d="M0 704 C44 672 89 675 129 697 C171 719 209 712 248 687 C287 662 330 665 390 694 L390 844 L0 844 Z" fill="#263D5D" opacity="0.95" />
        <Path d="M0 742 C52 714 103 719 148 738 C195 757 245 742 292 719 C333 700 359 706 390 723 L390 844 L0 844 Z" fill="#142945" />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBlock}>
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <Image
              source={require('../../assets/images/PIV-logo.png')}
              resizeMode="contain"
              style={[styles.logo, styles.logoWhite]}
            />
          </Animated.View>

          <Animated.View style={[styles.statementBlock, { opacity: copyOpacity }]}>
            <Text style={styles.statement}>Pray Scripture.</Text>
            <Text style={styles.statement}>Live Scripture.</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: copyOpacity }]}>
          <View style={styles.goldLine} />
          <Text style={styles.footerText}>A CLOSER WALK</Text>
          <Text style={styles.footerText}>A BRIGHTER TOMORROW</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C338E',
  },
  safeArea: {
    flex: 1,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 68,
  },
  logo: {
    width: 210,
    height: 176,
  },
  logoWhite: {
    tintColor: '#FFFFFF',
  },
  statementBlock: {
    marginTop: 44,
    alignItems: 'center',
  },
  statement: {
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
    fontSize: 27,
    lineHeight: 36,
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(6, 17, 42, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 26,
    alignItems: 'center',
  },
  goldLine: {
    width: 34,
    height: 2,
    marginBottom: 19,
    backgroundColor: '#F6BF21',
  },
  footerText: {
    color: '#F6F7FB',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 2.6,
  },
});
