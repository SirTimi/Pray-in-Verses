import { useState } from 'react';
import {
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
import { ArrowRight } from 'lucide-react-native';

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
    description: 'Go step by step, from book to chapter\nto verse and turn every verse into prayer.',
  },
  {
    title: 'Pray Together',
    description: 'Join the Prayer Wall & share your\nprayers, be encouraged, and pray for\nothers around the world.',
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

function CommunityVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.communityArtStage, compact && styles.communityArtStageCompact]}>
      <Image
        source={require('../../../assets/images/prayers-around-the-world.png')}
        resizeMode="contain"
        style={styles.communityArt}
      />
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const compact = height < 760;

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

        <View style={styles.slideContent}>
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
        </View>

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
  communityArtStage: {
    flex: 1,
    width: '100%',
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityArtStageCompact: {
    minHeight: 285,
  },
  communityArt: {
    width: '100%',
    height: '100%',
    maxWidth: 360,
    maxHeight: 430,
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
