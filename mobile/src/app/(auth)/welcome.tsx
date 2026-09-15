import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { ArrowRight, Heart, UserRound } from 'lucide-react-native';

const NAVY = '#061B50';
const BLUE = '#0D43B6';
const MUTED = '#60739A';
const PAPER = '#FFFEFB';
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const PAGES = [
  {
    title: 'Turn Scripture\nInto Prayer',
    description: 'Take a Bible verse, and turn it into\na meaningful prayer in seconds.',
  },
  {
    title: 'Pray Through\nEvery Verse',
    description: 'Go step by step — from book to chapter\nto verse — and turn every verse into prayer.',
  },
  {
    title: 'Pray Together',
    description: 'Join the Prayer Wall — share your\nprayers, be encouraged, and pray for\nothers around the world.',
  },
] as const;

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      source={require('../../../assets/images/PIV-logo.png')}
      resizeMode="contain"
      style={[styles.brandLogo, compact && styles.brandLogoCompact]}
    />
  );
}

function ScriptureToPrayerVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.scriptureArtStage, compact && styles.scriptureArtStageCompact]}>
      <Image
        source={require('../../../assets/images/onboarding/scripture-prayer-art.jpg')}
        resizeMode="contain"
        style={styles.scriptureArt}
      />
    </View>
  );
}

function VerseFlowVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.flowArtStage, compact && styles.flowArtStageCompact]}>
      <Image
        source={require('../../../assets/images/guided-bible-image.png')}
        resizeMode="contain"
        style={styles.flowArt}
      />
    </View>
  );
}

function Avatar({ style }: { style?: object }) {
  return (
    <View style={[styles.avatar, style]}>
      <UserRound size={29} color="#7F9FD4" strokeWidth={1.8} />
    </View>
  );
}

function CommunityCard({
  name,
  time,
  prayer,
  count,
  style,
}: {
  name: string;
  time: string;
  prayer: string;
  count: number;
  style?: object;
}) {
  return (
    <View style={[styles.communityCard, style]}>
      <View style={styles.communityHeader}>
        <Avatar />
        <View style={styles.communityHeaderCopy}>
          <Text style={styles.communityName}>{name}</Text>
          <Text style={styles.communityTime}>{time}</Text>
        </View>
      </View>

      <Text style={styles.communityPrayer}>{prayer}</Text>

      <View style={styles.communityActions}>
        <View style={styles.metaRow}>
          <Heart size={18} color="#FF493D" fill="#FF493D" />
          <Text style={styles.metaText}>{count}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.prayHandsSmall}>🙏</Text>
          <Text style={styles.prayText}>Pray</Text>
        </View>
      </View>
    </View>
  );
}

function CommunityVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.communityStage, compact && styles.communityStageCompact]}>
      <View style={styles.communityGlow} />
      <View style={styles.goldArc} />

      <View style={styles.globeWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 320 230">
          <Circle cx="160" cy="178" r="146" fill="#E3EEFF" />
          <Path
            d="M24 168 C75 125 111 122 151 142 C198 166 222 116 294 157"
            stroke="#BBD2F6"
            strokeWidth="3"
            fill="none"
          />
          <Path
            d="M68 105 C90 121 94 139 80 158 C65 178 74 198 102 217"
            stroke="#BBD2F6"
            strokeWidth="3"
            fill="none"
          />
          <Path
            d="M214 99 C195 119 197 139 221 151 C245 163 242 190 226 213"
            stroke="#BBD2F6"
            strokeWidth="3"
            fill="none"
          />
          <Path
            d="M40 194 C104 159 190 160 288 202"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="5 6"
            fill="none"
            opacity="0.9"
          />
        </Svg>

        <Avatar style={styles.globeAvatarOne} />
        <Avatar style={styles.globeAvatarTwo} />
        <Avatar style={styles.globeAvatarThree} />
      </View>

      <CommunityCard
        name="Sarah M."
        time="2h ago"
        prayer={'Praying for peace and\nhealing for my family. 🙏'}
        count={24}
        style={styles.communityOne}
      />
      <CommunityCard
        name="David K."
        time="5h ago"
        prayer={'Lord, give me strength\ntoday. 💙'}
        count={18}
        style={styles.communityTwo}
      />
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;
  const compact = height < 760;

  useEffect(() => {
    opacity.setValue(0);
    translate.setValue(7);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, page, translate]);

  function finish() {
    router.replace('/(auth)/login');
  }

  function next() {
    if (page === 2) {
      finish();
      return;
    }
    setPage((value) => value + 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.decorTopLeft} />
        <View style={styles.decorBottomRight} />

        <View style={[styles.topRow, page === 0 && styles.topRowPageOne]}>
          {page < 2 ? <BrandLogo compact={compact || page === 0} /> : <View />}
          <Pressable onPress={finish} hitSlop={16} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity,
              transform: [{ translateY: translate }],
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              page === 0 && styles.titlePageOne,
              page === 2 && styles.titleCommunity,
              compact && styles.titleCompact,
            ]}
          >
            {PAGES[page].title}
          </Text>

          <Text
            style={[
              styles.description,
              page === 0 && styles.descriptionPageOne,
              compact && styles.descriptionCompact,
            ]}
          >
            {PAGES[page].description}
          </Text>

          <View style={[styles.visualArea, page === 0 && styles.visualAreaPageOne]}>
            {page === 0 ? <ScriptureToPrayerVisual compact={compact} /> : null}
            {page === 1 ? <VerseFlowVisual compact={compact} /> : null}
            {page === 2 ? <CommunityVisual compact={compact} /> : null}
          </View>
        </Animated.View>

        <View style={styles.bottomArea}>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={({ pressed }) => [
              styles.primaryButton,
              page === 0 && styles.primaryButtonPageOne,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                page === 0 && styles.primaryButtonTextPageOne,
              ]}
            >
              {page === 2 ? 'Get Started' : 'Next'}
            </Text>
            {page === 0 ? <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} /> : null}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PAPER,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  decorTopLeft: {
    position: 'absolute',
    top: -125,
    left: -145,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#FFF7DF',
    opacity: 0.82,
  },
  decorBottomRight: {
    position: 'absolute',
    right: -145,
    bottom: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#FFF1BF',
    opacity: 0.58,
  },
  topRow: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRowPageOne: {
    height: 88,
  },
  brandLogo: {
    width: 132,
    height: 96,
  },
  brandLogoCompact: {
    width: 90,
    height: 64,
  },
  skipButton: {
    position: 'absolute',
    right: 0,
    top: 8,
    minWidth: 68,
    minHeight: 46,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    color: '#405779',
    fontSize: 17,
    fontWeight: '600',
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: NAVY,
    fontFamily: SERIF_FONT,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  titlePageOne: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.45,
  },
  titleCommunity: {
    marginTop: 10,
    fontSize: 41,
    lineHeight: 46,
  },
  titleCompact: {
    fontSize: 29,
    lineHeight: 33,
  },
  description: {
    marginTop: 17,
    color: MUTED,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 350,
  },
  descriptionPageOne: {
    marginTop: 13,
    maxWidth: 310,
    fontSize: 15,
    lineHeight: 21,
  },
  descriptionCompact: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 19,
  },
  visualArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 330,
  },
  visualAreaPageOne: {
    minHeight: 280,
  },
  scriptureArtStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptureArtStageCompact: {
    transform: [{ scale: 0.93 }],
  },
  scriptureArt: {
    width: '82%',
    maxWidth: 310,
    aspectRatio: 540 / 583,
    borderRadius: 20,
  },
  flowArtStage: {
    flex: 1,
    width: '100%',
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowArtStageCompact: {
    minHeight: 285,
  },
  flowArt: {
    width: '100%',
    height: '100%',
    maxWidth: 360,
    maxHeight: 430,
  },
  communityStage: {
    width: '100%',
    height: 430,
    position: 'relative',
    overflow: 'hidden',
  },
  communityStageCompact: {
    height: 355,
    transform: [{ scale: 0.88 }],
  },
  communityGlow: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    left: 5,
    bottom: -42,
    backgroundColor: '#EEF4FF',
  },
  goldArc: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    left: 4,
    bottom: -38,
    borderWidth: 8,
    borderColor: '#FFE8A9',
    opacity: 0.85,
  },
  communityCard: {
    position: 'absolute',
    width: 245,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 17,
    shadowColor: '#263A67',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 17,
    elevation: 7,
    zIndex: 5,
  },
  communityOne: {
    top: 6,
    left: 8,
  },
  communityTwo: {
    top: 160,
    right: 0,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  communityHeaderCopy: {
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCE9FF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  communityName: {
    color: NAVY,
    fontSize: 17,
    fontWeight: '800',
  },
  communityTime: {
    marginTop: 2,
    color: '#8C9CB6',
    fontSize: 12,
  },
  communityPrayer: {
    marginTop: 13,
    color: '#14254B',
    fontSize: 16,
    lineHeight: 22,
  },
  communityActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#657796',
    fontSize: 14,
    fontWeight: '700',
  },
  prayHandsSmall: {
    fontSize: 15,
  },
  prayText: {
    color: '#0D55D6',
    fontSize: 15,
    fontWeight: '800',
  },
  globeWrap: {
    position: 'absolute',
    width: 340,
    height: 245,
    left: -4,
    bottom: -22,
  },
  globeAvatarOne: {
    position: 'absolute',
    left: 36,
    top: 94,
  },
  globeAvatarTwo: {
    position: 'absolute',
    left: 64,
    bottom: 14,
  },
  globeAvatarThree: {
    position: 'absolute',
    right: 33,
    bottom: 18,
  },
  bottomArea: {
    width: '100%',
    paddingTop: 2,
  },
  dotsRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#CBD5E7',
  },
  dotActive: {
    backgroundColor: BLUE,
  },
  primaryButton: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    borderRadius: 32,
    backgroundColor: BLUE,
    shadowColor: '#0B44B2',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 7,
  },
  primaryButtonPageOne: {
    minHeight: 58,
    borderRadius: 29,
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  primaryButtonTextPageOne: {
    fontSize: 18,
  },
});