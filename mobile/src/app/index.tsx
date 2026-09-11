import { useEffect } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/colors';
import { getAccessToken } from '@/services/api';
import { getMe } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const MIN_SPLASH_MS = 1200;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function LaunchScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const startedAt = Date.now();
      let destination: '/(app)' | '/(auth)/welcome' = '/(auth)/welcome';

      try {
        const token = await getAccessToken();

        if (token) {
          const user = await getMe();
          setUser(user);
          destination = '/(app)';
        }
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
      <StatusBar style="light" />

      <View style={styles.sunGlow} />
      <View style={styles.hillBack} />
      <View style={styles.hillMid} />
      <View style={styles.hillFront} />

      <View style={styles.brandBlock}>
        <Image
          source={require('../../assets/images/logo-glow.png')}
          resizeMode="contain"
          style={styles.logo}
        />

        <Text style={styles.brandName}>Pray in Verses</Text>
        <Text style={styles.brandTagline}>Pray the Bible Verse by Verse</Text>
      </View>

      <View style={styles.statementBlock}>
        <Text style={styles.statement}>Pray Scripture.</Text>
        <Text style={styles.statement}>Live Scripture.</Text>
      </View>

      <View style={styles.footerBlock}>
        <View style={styles.goldRule} />
        <Text style={styles.footerText}>A CLOSER WALK</Text>
        <Text style={styles.footerText}>A BRIGHTER TOMORROW</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
  },
  sunGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    bottom: 70,
    left: '50%',
    marginLeft: -160,
    backgroundColor: '#F6C453',
    opacity: 0.28,
  },
  hillBack: {
    position: 'absolute',
    width: 520,
    height: 230,
    borderRadius: 260,
    left: -150,
    bottom: 50,
    backgroundColor: '#315B8E',
    transform: [{ rotate: '-10deg' }],
    opacity: 0.78,
  },
  hillMid: {
    position: 'absolute',
    width: 560,
    height: 250,
    borderRadius: 280,
    right: -190,
    bottom: 5,
    backgroundColor: '#183F73',
    transform: [{ rotate: '8deg' }],
  },
  hillFront: {
    position: 'absolute',
    width: 620,
    height: 250,
    borderRadius: 310,
    left: -170,
    bottom: -115,
    backgroundColor: '#0A2855',
    transform: [{ rotate: '-4deg' }],
  },
  brandBlock: {
    position: 'absolute',
    top: '17%',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  logo: {
    width: 132,
    height: 132,
  },
  brandName: {
    marginTop: 6,
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  brandTagline: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  statementBlock: {
    position: 'absolute',
    left: 36,
    bottom: '27%',
  },
  statement: {
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 26,
    lineHeight: 34,
  },
  footerBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 38,
    alignItems: 'center',
  },
  goldRule: {
    width: 38,
    height: 2,
    marginBottom: 12,
    backgroundColor: colors.gold,
  },
  footerText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 2.4,
  },
});
