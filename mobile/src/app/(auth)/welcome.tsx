import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  Book,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Globe2,
  Hash,
  Heart,
  MessageCircle,
  Quote,
  Sparkles,
  Users,
} from 'lucide-react-native';

import AppButton from '@/components/ui/AppButton';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const PAGES = [
  {
    eyebrow: 'SCRIPTURE TO PRAYER',
    title: 'Turn Scripture\nInto Prayer',
    description:
      'Move from simply reading a verse to intentionally praying through it.',
  },
  {
    eyebrow: 'VERSE BY VERSE',
    title: 'Pray Through\nEvery Verse',
    description:
      'Choose a book, chapter and verse, then receive structured prayer guidance.',
  },
  {
    eyebrow: 'PRAYER WALL',
    title: 'Pray Together',
    description:
      'Share prayer requests, encourage one another, and pray with believers everywhere.',
  },
] as const;

function VerseToPrayerIllustration() {
  return (
    <View style={styles.showcasePanel}>
      <View style={styles.panelGlowBlue} />
      <View style={styles.panelGlowGold} />

      <View style={[styles.paperCard, styles.verseCard]}>
        <View style={styles.cardTopRow}>
          <View style={styles.blueIconBox}>
            <BookOpen size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.cardTopCopy}>
            <Text style={styles.microLabel}>SCRIPTURE</Text>
            <Text style={styles.cardReference}>Philippians 4:6</Text>
          </View>
          <Quote size={18} color="#BAC4D5" strokeWidth={1.8} />
        </View>

        <Text style={styles.verseCopy}>
          “Do not be anxious about anything, but in everything by prayer and petition...”
        </Text>
      </View>

      <View style={styles.transformConnector}>
        <View style={styles.connectorLine} />
        <View style={styles.goldArrowBubble}>
          <Sparkles size={22} color="#B77A00" strokeWidth={2.2} />
        </View>
        <View style={styles.connectorLine} />
      </View>

      <View style={[styles.paperCard, styles.prayerCard]}>
        <View style={styles.cardTopRow}>
          <View style={styles.goldIconBox}>
            <Sparkles size={18} color="#9A6900" strokeWidth={2.2} />
          </View>
          <View style={styles.cardTopCopy}>
            <Text style={[styles.microLabel, styles.microLabelGold]}>YOUR PRAYER</Text>
            <Text style={styles.prayerCardTitle}>A prayer from the verse</Text>
          </View>
        </View>

        <Text style={styles.prayerCopy}>
          Lord, help me bring every concern to You. Teach me to trust You in all things.
        </Text>
      </View>

      <View style={styles.panelFooterPill}>
        <Sparkles size={13} color={colors.primary} strokeWidth={2.1} />
        <Text style={styles.panelFooterText}>Scripture becomes something you can pray</Text>
      </View>
    </View>
  );
}

function ScripturePathIllustration() {
  const steps = [
    { icon: BookOpen, number: '01', title: 'Book', subtitle: 'Choose a book of the Bible' },
    { icon: Book, number: '02', title: 'Chapter', subtitle: 'Select a chapter' },
    { icon: Hash, number: '03', title: 'Verse', subtitle: 'Pick the verse to pray' },
    { icon: Sparkles, number: '04', title: 'Prayer', subtitle: 'Receive guided prayer points' },
  ];

  return (
    <View style={styles.showcasePanel}>
      <View style={styles.pathHeaderRow}>
        <View>
          <Text style={styles.pathKicker}>YOUR PRAYER FLOW</Text>
          <Text style={styles.pathHeaderTitle}>Simple. Focused. Scripture-led.</Text>
        </View>
        <View style={styles.pathHeaderIcon}>
          <BookOpen size={20} color={colors.primary} strokeWidth={2.2} />
        </View>
      </View>

      <View style={styles.pathStage}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index === steps.length - 1;

          return (
            <View key={step.title}>
              <View style={[styles.pathCard, active && styles.pathCardActive]}>
                <View style={[styles.pathIcon, active && styles.pathIconActive]}>
                  <Icon
                    size={20}
                    color={active ? '#9A6900' : colors.primary}
                    strokeWidth={2.1}
                  />
                </View>

                <View style={styles.pathTextBlock}>
                  <View style={styles.pathTitleRow}>
                    <Text style={styles.pathNumber}>{step.number}</Text>
                    <Text style={styles.pathTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.pathSubtitle}>{step.subtitle}</Text>
                </View>

                <ChevronRight
                  size={19}
                  color={active ? '#B77A00' : '#A6B0C0'}
                  strokeWidth={2}
                />
              </View>

              {index < steps.length - 1 && (
                <View style={styles.pathConnector}>
                  <View style={styles.pathConnectorLine} />
                  <ChevronDown size={15} color="#C18A11" strokeWidth={2} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PrayerMeta({ count }: { count: number }) {
  return (
    <View style={styles.communityMetaRow}>
      <View style={styles.communityMetaItem}>
        <Heart size={13} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.communityMetaText}>{count}</Text>
      </View>
      <View style={styles.communityMetaItem}>
        <MessageCircle size={13} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.communityMetaText}>Pray</Text>
      </View>
    </View>
  );
}

function CommunityIllustration() {
  return (
    <View style={[styles.showcasePanel, styles.communityPanel]}>
      <View style={styles.worldGlow} />
      <View style={styles.worldRingOne} />
      <View style={styles.worldRingTwo} />

      <View style={styles.communityTopRow}>
        <View style={styles.communityBadge}>
          <Users size={15} color={colors.primary} strokeWidth={2.1} />
          <Text style={styles.communityBadgeText}>PRAYER WALL</Text>
        </View>
        <Globe2 size={21} color="#8EADE0" strokeWidth={1.8} />
      </View>

      <View style={[styles.communityCard, styles.communityCardOne]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>SM</Text>
        </View>
        <View style={styles.communityTextBlock}>
          <Text style={styles.communityName}>Sarah M.</Text>
          <Text style={styles.communityPrayer}>
            Praying for peace and healing for my family. 🙏
          </Text>
          <PrayerMeta count={24} />
        </View>
      </View>

      <View style={[styles.communityCard, styles.communityCardTwo]}>
        <View style={styles.avatarCircleAlt}>
          <Text style={styles.avatarText}>DK</Text>
        </View>
        <View style={styles.communityTextBlock}>
          <Text style={styles.communityName}>David K.</Text>
          <Text style={styles.communityPrayer}>Lord, give me strength today.</Text>
          <PrayerMeta count={18} />
        </View>
      </View>

      <View style={styles.communityFooterCard}>
        <View style={styles.communityFooterIcon}>
          <Users size={16} color={colors.primary} strokeWidth={2.1} />
        </View>
        <View style={styles.communityFooterCopy}>
          <Text style={styles.communityFooterTitle}>You are not praying alone</Text>
          <Text style={styles.communityFooterText}>Give support. Receive encouragement.</Text>
        </View>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(14)).current;

  const current = useMemo(() => PAGES[page], [page]);
  const isLast = page === PAGES.length - 1;
  const compact = height < 760;

  useEffect(() => {
    contentOpacity.setValue(0);
    contentTranslateY.setValue(14);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY, page]);

  function finishOnboarding() {
    router.replace('/(auth)/login');
  }

  function nextPage() {
    if (isLast) {
      finishOnboarding();
      return;
    }

    setPage((currentPage) => currentPage + 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.decorativeAuraBlue} />
      <View style={styles.decorativeAuraGold} />

      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>0{page + 1}</Text>
            <View style={styles.stepBadgeDivider} />
            <Text style={styles.stepBadgeTotal}>03</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={finishOnboarding}
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
          >
            <Text style={styles.skipText}>Skip</Text>
            <ChevronRight size={16} color={colors.primaryDark} strokeWidth={2.2} />
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={[styles.headerBlock, compact && styles.headerBlockCompact]}>
            <Text style={styles.eyebrow}>{current.eyebrow}</Text>
            <Text style={[styles.title, compact && styles.titleCompact]}>{current.title}</Text>
            <Text style={styles.description}>{current.description}</Text>
          </View>

          <View style={[styles.illustrationContainer, compact && styles.illustrationContainerCompact]}>
            {page === 0 && <VerseToPrayerIllustration />}
            {page === 1 && <ScripturePathIllustration />}
            {page === 2 && <CommunityIllustration />}
          </View>
        </Animated.View>

        <View style={styles.bottomBlock}>
          <View style={styles.progressRow}>
            {PAGES.map((_, index) => (
              <View
                key={index}
                style={[styles.progressTrack, index === page && styles.progressTrackActive]}
              />
            ))}
          </View>

          <AppButton
            label={isLast ? 'Get Started' : 'Continue'}
            onPress={nextPage}
            style={styles.nextButton}
          />

          <Text style={styles.bottomHint}>
            {isLast ? 'Your prayer journey starts here.' : 'Three quick steps to get you started.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFEF8',
  },
  decorativeAuraBlue: {
    position: 'absolute',
    top: -135,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EEF3FF',
    opacity: 0.9,
  },
  decorativeAuraGold: {
    position: 'absolute',
    left: -115,
    bottom: -150,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#FFF5CD',
    opacity: 0.7,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  topRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 12,
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepBadgeDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
    backgroundColor: '#DDE3EC',
  },
  stepBadgeTotal: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButton: {
    minWidth: 64,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  skipButtonPressed: {
    opacity: 0.65,
  },
  skipText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  animatedContent: {
    flex: 1,
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  headerBlockCompact: {
    marginTop: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 9,
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 36,
  },
  description: {
    marginTop: spacing.md,
    maxWidth: 330,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  illustrationContainer: {
    flex: 1,
    minHeight: 330,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  illustrationContainerCompact: {
    minHeight: 290,
    paddingVertical: spacing.sm,
  },
  showcasePanel: {
    width: '100%',
    maxWidth: 360,
    minHeight: 330,
    alignSelf: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECF3',
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: spacing.lg,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 4,
  },
  panelGlowBlue: {
    position: 'absolute',
    top: -55,
    right: -45,
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: '#EEF4FF',
  },
  panelGlowGold: {
    position: 'absolute',
    bottom: -55,
    left: -42,
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: '#FFF7D9',
  },
  paperCard: {
    borderWidth: 1,
    borderColor: '#E6EAF1',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.base,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  verseCard: {
    width: '91%',
    alignSelf: 'flex-start',
    transform: [{ rotate: '-1.5deg' }],
  },
  prayerCard: {
    width: '91%',
    alignSelf: 'flex-end',
    borderColor: '#F0D88B',
    backgroundColor: '#FFFCF1',
    transform: [{ rotate: '1.2deg' }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blueIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  goldIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  cardTopCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  microLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  microLabelGold: {
    color: '#936B00',
  },
  cardReference: {
    marginTop: 2,
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  prayerCardTitle: {
    marginTop: 2,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  verseCopy: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  transformConnector: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 70,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7D9A5',
  },
  goldArrowBubble: {
    width: 42,
    height: 42,
    marginHorizontal: 10,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2DA8A',
    backgroundColor: colors.goldSoft,
  },
  prayerCopy: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  panelFooterPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: '#F4F7FD',
  },
  panelFooterText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  pathHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  pathKicker: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pathHeaderTitle: {
    marginTop: 3,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  pathHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  pathStage: {
    width: '100%',
    alignSelf: 'center',
  },
  pathCard: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7EBF2',
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  pathCardActive: {
    borderColor: '#EFD378',
    backgroundColor: '#FFFCF1',
  },
  pathIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  pathIconActive: {
    backgroundColor: colors.goldSoft,
  },
  pathTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pathTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathNumber: {
    marginRight: 7,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pathTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  pathSubtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 10,
  },
  pathConnector: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathConnectorLine: {
    position: 'absolute',
    width: 1,
    height: 18,
    backgroundColor: '#E8D59A',
  },
  communityPanel: {
    justifyContent: 'flex-start',
    paddingTop: spacing.lg,
  },
  worldGlow: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    alignSelf: 'center',
    bottom: -95,
    backgroundColor: '#EDF4FF',
  },
  worldRingOne: {
    position: 'absolute',
    width: 215,
    height: 215,
    borderRadius: 108,
    left: 70,
    bottom: -68,
    borderWidth: 1,
    borderColor: '#D8E6FB',
  },
  worldRingTwo: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    left: 105,
    bottom: -30,
    borderWidth: 1,
    borderColor: '#D8E6FB',
  },
  communityTopRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  communityBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  communityCard: {
    zIndex: 2,
    flexDirection: 'row',
    width: '93%',
    borderWidth: 1,
    borderColor: '#E5EAF2',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.md,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  communityCardOne: {
    alignSelf: 'flex-start',
  },
  communityCardTwo: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCE8FB',
  },
  avatarCircleAlt: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1BE',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  communityTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  communityName: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  communityPrayer: {
    marginTop: 4,
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  communityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.sm,
  },
  communityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityMetaText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  communityFooterCard: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '88%',
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.82)',
    padding: spacing.md,
  },
  communityFooterIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  communityFooterCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  communityFooterTitle: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  communityFooterText: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 9,
  },
  bottomBlock: {
    paddingTop: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    width: 24,
    height: 5,
    borderRadius: radius.round,
    backgroundColor: '#DCE2EC',
  },
  progressTrackActive: {
    width: 42,
    backgroundColor: colors.primary,
  },
  nextButton: {
    minHeight: 58,
    borderRadius: radius.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 3,
  },
  bottomHint: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
