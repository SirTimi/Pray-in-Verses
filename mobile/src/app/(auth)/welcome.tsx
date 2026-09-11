import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import {
  ArrowDown,
  ArrowDownRight,
  BookOpen,
  ChevronRight,
  FileText,
  Globe2,
  Heart,
  List,
  MessageCircle,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

const NAVY = '#071C50';
const BLUE = '#0B3BA7';
const BLUE_SOFT = '#EAF2FF';
const GOLD = '#F4B400';
const GOLD_SOFT = '#FFF8DF';
const MUTED = '#66758D';
const BORDER = '#E2E8F0';
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const PAGES = [
  {
    title: 'Turn Scripture\nInto Prayer',
    description: 'Take a Bible verse, and turn it\ninto a meaningful prayer\nin seconds.',
  },
  {
    title: 'Pray Through\nEvery Verse',
    description: 'Go step by step — from book\nto chapter to verse — and turn\nevery verse into prayer.',
  },
  {
    title: 'Pray Together',
    description: 'Join the Prayer Wall — share\nyour prayers, be encouraged,\nand pray for others around\nthe world.',
  },
] as const;

function ScriptureToPrayerVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.visualStage, compact && styles.visualStageCompact]}>
      <View style={styles.softBlob} />

      <View style={[styles.paperCard, styles.scriptureCard]}>
        <Text style={styles.cardReference}>Philippians 4:6</Text>
        <Text style={styles.scriptureText}>
          “Do not be anxious{`\n`}about anything, but in{`\n`}everything by prayer{`\n`}and petition...”
        </Text>
      </View>

      <View style={styles.arrowBubble}>
        <ArrowDownRight size={31} color={GOLD} strokeWidth={2.3} />
      </View>

      <View style={[styles.paperCard, styles.prayerCard]}>
        <View style={styles.prayerLabelRow}>
          <Sparkles size={17} color={GOLD} fill="#FFE58A" />
          <View style={styles.prayerLabel}>
            <Text style={styles.prayerLabelText}>YOUR PRAYER</Text>
          </View>
        </View>
        <Text style={styles.prayerText}>
          Lord, help me to bring{`\n`}every concern to You.{`\n`}Teach me to trust You{`\n`}in all things...
        </Text>
      </View>
    </View>
  );
}

const FLOW_STEPS = [
  { title: 'Book', subtitle: 'Choose a book of the Bible', Icon: BookOpen },
  { title: 'Chapter', subtitle: 'Select a chapter', Icon: FileText },
  { title: 'Verse', subtitle: 'Pick a verse', Icon: List },
  { title: 'Prayer', subtitle: 'Get a guided prayer', Icon: Sparkles },
];

function VerseFlowVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.flowStage, compact && styles.flowStageCompact]}>
      {FLOW_STEPS.map(({ title, subtitle, Icon }, index) => {
        const prayer = index === FLOW_STEPS.length - 1;
        return (
          <View key={title} style={styles.flowGroup}>
            <View style={[styles.flowCard, prayer && styles.flowPrayerCard]}>
              <View style={[styles.flowIconBox, prayer && styles.flowIconGold]}>
                <Icon size={22} color={prayer ? '#B47B00' : BLUE} strokeWidth={2.1} />
              </View>
              <View style={styles.flowCopy}>
                <Text style={styles.flowTitle}>{title}</Text>
                <Text style={styles.flowSubtitle}>{subtitle}</Text>
              </View>
              <ChevronRight size={19} color="#9AA7BB" strokeWidth={2} />
            </View>
            {index < FLOW_STEPS.length - 1 && (
              <View style={styles.flowArrowWrap}>
                <ArrowDown size={19} color={GOLD} strokeWidth={2.2} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Avatar({ style }: { style?: object }) {
  return (
    <View style={[styles.avatar, style]}>
      <UserRound size={26} color="#88A5D6" strokeWidth={1.8} />
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
        <View>
          <Text style={styles.communityName}>{name}</Text>
          <Text style={styles.communityTime}>{time}</Text>
        </View>
      </View>
      <Text style={styles.communityPrayer}>{prayer}</Text>
      <View style={styles.communityActions}>
        <View style={styles.metaRow}>
          <Heart size={15} color="#EF4A3D" fill="#EF4A3D" />
          <Text style={styles.metaText}>{count}</Text>
        </View>
        <View style={styles.metaRow}>
          <Sparkles size={15} color={BLUE} />
          <Text style={[styles.metaText, styles.prayText]}>Pray</Text>
        </View>
      </View>
    </View>
  );
}

function CommunityVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.communityStage, compact && styles.communityStageCompact]}>
      <View style={styles.communityGlow} />
      <CommunityCard
        name="Sarah M."
        time="2h ago"
        prayer="Praying for peace and\nhealing for my family. 🙏"
        count={24}
        style={styles.communityOne}
      />
      <CommunityCard
        name="David K."
        time="5h ago"
        prayer="Lord, give me strength\ntoday. 💙"
        count={18}
        style={styles.communityTwo}
      />

      <View style={styles.globeWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 240 120">
          <Circle cx="120" cy="92" r="88" fill="#DFEAFF" />
          <Path d="M44 88 C66 72 87 68 104 76 C123 85 135 69 152 65 C174 60 196 73 211 88" stroke="#B8CFF1" strokeWidth="3" fill="none" />
          <Path d="M78 43 C91 52 91 63 84 71 C78 79 80 91 96 99" stroke="#B8CFF1" strokeWidth="3" fill="none" />
          <Path d="M154 42 C142 53 143 66 156 74 C169 82 166 95 157 104" stroke="#B8CFF1" strokeWidth="3" fill="none" />
        </Svg>
        <Globe2 size={104} color="#ABC4EA" strokeWidth={1.1} style={styles.globeIcon} />
        <Avatar style={styles.globeAvatarLeft} />
        <Avatar style={styles.globeAvatarRight} />
      </View>
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
    translate.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 280,
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
        <View style={styles.topRow}>
          <Pressable onPress={finish} hitSlop={14} style={styles.skipButton}>
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
          <Text style={[styles.title, compact && styles.titleCompact]}>{PAGES[page].title}</Text>
          <Text style={[styles.description, compact && styles.descriptionCompact]}>{PAGES[page].description}</Text>

          <View style={styles.visualArea}>
            {page === 0 && <ScriptureToPrayerVisual compact={compact} />}
            {page === 1 && <VerseFlowVisual compact={compact} />}
            {page === 2 && <CommunityVisual compact={compact} />}
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
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>{page === 2 ? 'Get Started' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  topRow: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipButton: {
    minWidth: 52,
    minHeight: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '600',
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    marginTop: 22,
    color: NAVY,
    fontFamily: SERIF_FONT,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.45,
  },
  titleCompact: {
    marginTop: 10,
    fontSize: 29,
    lineHeight: 32,
  },
  description: {
    marginTop: 14,
    color: MUTED,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  descriptionCompact: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 18,
  },
  visualArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
  },
  visualStage: {
    width: '100%',
    height: 372,
    position: 'relative',
  },
  visualStageCompact: {
    height: 315,
    transform: [{ scale: 0.9 }],
  },
  softBlob: {
    position: 'absolute',
    width: 245,
    height: 245,
    borderRadius: 123,
    left: 22,
    top: 48,
    backgroundColor: '#EDF3FF',
  },
  paperCard: {
    position: 'absolute',
    width: 205,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#1A2B50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  scriptureCard: {
    left: 24,
    top: 40,
    transform: [{ rotate: '-5deg' }],
  },
  prayerCard: {
    right: 20,
    bottom: 22,
    transform: [{ rotate: '4deg' }],
  },
  cardReference: {
    color: NAVY,
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  scriptureText: {
    marginTop: 12,
    color: '#40506A',
    fontSize: 14,
    lineHeight: 20,
  },
  arrowBubble: {
    position: 'absolute',
    right: 56,
    top: 174,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3C8',
    zIndex: 5,
  },
  prayerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  prayerLabel: {
    borderRadius: 999,
    backgroundColor: '#FFF5D5',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  prayerLabelText: {
    color: '#B17A00',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  prayerText: {
    marginTop: 12,
    color: '#202B3D',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  flowStage: {
    width: '100%',
    paddingTop: 26,
  },
  flowStageCompact: {
    paddingTop: 8,
    transform: [{ scale: 0.92 }],
  },
  flowGroup: {
    alignItems: 'center',
  },
  flowCard: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    shadowColor: '#1A2B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  flowPrayerCard: {
    borderColor: '#F0D17E',
    backgroundColor: '#FFFCF3',
  },
  flowIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE_SOFT,
  },
  flowIconGold: {
    backgroundColor: '#FFF3C8',
  },
  flowCopy: {
    flex: 1,
    marginLeft: 12,
  },
  flowTitle: {
    color: '#17233A',
    fontSize: 15,
    fontWeight: '700',
  },
  flowSubtitle: {
    marginTop: 2,
    color: MUTED,
    fontSize: 11,
  },
  flowArrowWrap: {
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityStage: {
    width: '100%',
    height: 360,
    position: 'relative',
    overflow: 'hidden',
  },
  communityStageCompact: {
    height: 310,
    transform: [{ scale: 0.92 }],
  },
  communityGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    left: 40,
    bottom: -15,
    backgroundColor: '#EDF3FF',
  },
  communityCard: {
    position: 'absolute',
    width: 220,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#17284E',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 4,
  },
  communityOne: {
    top: 16,
    right: 6,
  },
  communityTwo: {
    top: 147,
    right: 0,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCE9FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  communityName: {
    color: '#17233A',
    fontSize: 13,
    fontWeight: '800',
  },
  communityTime: {
    marginTop: 1,
    color: '#9AA5B5',
    fontSize: 9,
  },
  communityPrayer: {
    marginTop: 10,
    color: '#243149',
    fontSize: 13,
    lineHeight: 18,
  },
  communityActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#7A879B',
    fontSize: 10,
    fontWeight: '600',
  },
  prayText: {
    color: BLUE,
    fontWeight: '700',
  },
  globeWrap: {
    position: 'absolute',
    width: 250,
    height: 128,
    left: 31,
    bottom: -4,
  },
  globeIcon: {
    position: 'absolute',
    left: 74,
    top: 14,
    opacity: 0.55,
  },
  globeAvatarLeft: {
    position: 'absolute',
    left: 20,
    top: 37,
  },
  globeAvatarRight: {
    position: 'absolute',
    right: 16,
    top: 50,
  },
  bottomArea: {
    width: '100%',
    paddingTop: 4,
  },
  dotsRow: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8DEE8',
  },
  dotActive: {
    backgroundColor: BLUE,
  },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
