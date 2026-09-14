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
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import {
  BookOpen,
  ChevronRight,
  FileText,
  Heart,
  List,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

const NAVY = '#071C50';
const BLUE = '#0B3BA7';
const BLUE_SOFT = '#EAF2FF';
const GOLD = '#F4B400';
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

function CurvedPrayerArrow() {
  return (
    <View pointerEvents="none" style={styles.curvedArrowWrap}>
      <View style={styles.curvedArrowGlow} />
      <Svg width="100%" height="100%" viewBox="0 0 110 96">
        <Path
          d="M14 12 C 56 -4 96 16 74 50 C 62 68 74 78 94 84"
          stroke={GOLD}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M80 70 L96 84 L84 96"
          stroke={GOLD}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

function ScriptureToPrayerVisual({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.visualStage, compact && styles.visualStageCompact]}>
      <View style={styles.softBlob} />
      <View style={styles.goldGlow} />

      <View style={[styles.paperCard, styles.scriptureCard]}>
        <View style={styles.scriptureHeadingRow}>
          <View style={styles.scriptureIconBox}>
            <BookOpen size={17} color={BLUE} strokeWidth={2.1} />
          </View>
          <View>
            <Text style={styles.cardEyebrow}>SCRIPTURE</Text>
            <Text style={styles.cardReference}>Philippians 4:6</Text>
          </View>
        </View>
        <Text style={styles.scriptureText}>
          “Do not be anxious{`\n`}about anything, but in{`\n`}everything by prayer{`\n`}and petition...”
        </Text>
      </View>

      <CurvedPrayerArrow />

      <View style={[styles.paperCard, styles.prayerCard]}>
        <View style={styles.prayerLabelRow}>
          <View style={styles.prayerSparkleBox}>
            <Sparkles size={17} color="#B47B00" fill="#FFE58A" />
          </View>
          <View style={styles.prayerLabel}>
            <Text style={styles.prayerLabelText}>YOUR PRAYER</Text>
          </View>
        </View>
        <Text style={styles.prayerText}>
          Lord, help me to bring{`\n`}every concern to You.{`\n`}Teach me to trust You{`\n`}in all things...
        </Text>
        <View style={styles.prayerAccent} />
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

function SnakeConnector({ flip }: { flip: boolean }) {
  const d = flip
    ? 'M12 2 C 12 14 48 10 48 20 C 48 30 18 26 18 33'
    : 'M48 2 C 48 14 12 10 12 20 C 12 30 42 26 42 33';
  const arrowD = flip ? 'M11 27 L18 34 L25 28' : 'M35 27 L42 34 L49 28';

  return (
    <View style={styles.flowArrowWrap}>
      <Svg width="60" height="36" viewBox="0 0 60 36">
        <Path d={d} stroke={GOLD} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path
          d={arrowD}
          stroke={GOLD}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

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
            {index < FLOW_STEPS.length - 1 && <SnakeConnector flip={index % 2 === 0} />}
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

function Globe() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 220 150">
      <Defs>
        <RadialGradient id="globeGrad" cx="38%" cy="32%" r="75%">
          <Stop offset="0%" stopColor="#F4F8FF" stopOpacity={1} />
          <Stop offset="55%" stopColor="#D3E4FC" stopOpacity={1} />
          <Stop offset="100%" stopColor="#A2C2ED" stopOpacity={1} />
        </RadialGradient>
      </Defs>

      {/* sphere body */}
      <Circle cx="110" cy="78" r="62" fill="url(#globeGrad)" />

      {/* meridians */}
      <Path d="M110 16 L110 140" stroke="#A9C6F0" strokeWidth={1.3} fill="none" opacity={0.85} />
      <Path d="M110 16 A 44 62 0 0 1 110 140" stroke="#A9C6F0" strokeWidth={1.3} fill="none" opacity={0.85} />
      <Path d="M110 16 A 44 62 0 0 0 110 140" stroke="#A9C6F0" strokeWidth={1.3} fill="none" opacity={0.85} />
      <Path d="M110 16 A 20 62 0 0 1 110 140" stroke="#A9C6F0" strokeWidth={1} fill="none" opacity={0.55} />
      <Path d="M110 16 A 20 62 0 0 0 110 140" stroke="#A9C6F0" strokeWidth={1} fill="none" opacity={0.55} />

      {/* parallels */}
      <Ellipse cx="110" cy="78" rx="62" ry="15" stroke="#A9C6F0" strokeWidth={1.3} fill="none" opacity={0.85} />
      <Ellipse cx="110" cy="50" rx="53" ry="8" stroke="#A9C6F0" strokeWidth={1.1} fill="none" opacity={0.65} />
      <Ellipse cx="110" cy="106" rx="53" ry="8" stroke="#A9C6F0" strokeWidth={1.1} fill="none" opacity={0.65} />

      {/* outline */}
      <Circle cx="110" cy="78" r="62" fill="none" stroke="#89ADE2" strokeWidth={1.6} />

      {/* shine */}
      <Ellipse cx="85" cy="52" rx="22" ry="13" fill="#FFFFFF" opacity={0.32} />
    </Svg>
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
        <Globe />
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
    width: 270,
    height: 236,
    borderRadius: 132,
    left: 18,
    top: 54,
    backgroundColor: '#EDF3FF',
    transform: [{ rotate: '-6deg' }],
  },
  goldGlow: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    right: 4,
    bottom: 12,
    backgroundColor: '#FFF7D7',
    opacity: 0.82,
  },
  paperCard: {
    position: 'absolute',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDF0F5',
    shadowColor: '#13264B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  scriptureCard: {
    width: 224,
    left: 13,
    top: 28,
    transform: [{ rotate: '-4deg' }],
  },
  prayerCard: {
    width: 232,
    right: 5,
    bottom: 15,
    borderColor: '#F1E0A4',
    transform: [{ rotate: '2.5deg' }],
  },
  scriptureHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scriptureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE_SOFT,
  },
  cardEyebrow: {
    color: BLUE,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.15,
    marginBottom: 2,
  },
  cardReference: {
    color: NAVY,
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
  },
  scriptureText: {
    marginTop: 14,
    color: '#40506A',
    fontSize: 14,
    lineHeight: 21,
  },
  curvedArrowWrap: {
    position: 'absolute',
    width: 110,
    height: 96,
    right: 26,
    top: 150,
    zIndex: 8,
  },
  curvedArrowGlow: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    right: 4,
    bottom: 1,
    backgroundColor: '#FFF2BF',
    opacity: 0.78,
  },
  prayerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerSparkleBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3C8',
  },
  prayerLabel: {
    borderRadius: 999,
    backgroundColor: '#FFF5D5',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  prayerLabelText: {
    color: '#9C6C00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.75,
  },
  prayerText: {
    marginTop: 13,
    color: '#202B3D',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  prayerAccent: {
    width: 42,
    height: 3,
    borderRadius: 2,
    marginTop: 14,
    backgroundColor: GOLD,
    opacity: 0.72,
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
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityStage: {
    width: '100%',
    height: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  communityStageCompact: {
    height: 350,
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
    top: 6,
    left: 8,
    transform: [{ rotate: '-3deg' }],
  },
  communityTwo: {
    top: 172,
    right: 6,
    transform: [{ rotate: '3deg' }],
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
    width: 220,
    height: 150,
    left: '50%',
    marginLeft: -110,
    bottom: -4,
  },
  globeAvatarLeft: {
    position: 'absolute',
    left: 27,
    top: 59,
  },
  globeAvatarRight: {
    position: 'absolute',
    right: 31,
    top: 59,
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