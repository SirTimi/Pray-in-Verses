import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
    title: 'Turn Scripture\nInto Prayer',
    description:
      'Take a Bible verse, and turn it into a meaningful prayer in seconds.',
  },
  {
    title: 'Pray Through\nEvery Verse',
    description:
      'Go step by step — from book to chapter to verse — and turn every verse into prayer.',
  },
  {
    title: 'Pray Together',
    description:
      'Join the Prayer Wall — share your prayers, be encouraged, and pray for others around the world.',
  },
] as const;

function VerseToPrayerIllustration() {
  return (
    <View style={styles.illustrationStage}>
      <View style={[styles.paperCard, styles.verseCard]}>
        <Text style={styles.cardReference}>Philippians 4:6</Text>
        <Text style={styles.verseCopy}>
          “Do not be anxious about anything, but in everything by prayer and petition...”
        </Text>
      </View>

      <View style={styles.goldArrowBubble}>
        <Text style={styles.goldArrow}>↘</Text>
      </View>

      <View style={[styles.paperCard, styles.prayerCard]}>
        <View style={styles.prayerLabel}>
          <Text style={styles.prayerLabelText}>YOUR PRAYER</Text>
        </View>
        <Text style={styles.prayerCopy}>
          Lord, help me to bring every concern to You. Teach me to trust You in all things...
        </Text>
      </View>
    </View>
  );
}

function ScripturePathIllustration() {
  const steps = [
    ['▣', 'Book', 'Choose a book of the Bible'],
    ['▤', 'Chapter', 'Select a chapter'],
    ['≡', 'Verse', 'Pick a verse'],
    ['✦', 'Prayer', 'Get a guided prayer'],
  ];

  return (
    <View style={styles.pathStage}>
      {steps.map((step, index) => (
        <View key={step[1]}>
          <View
            style={[
              styles.pathCard,
              index === steps.length - 1 && styles.pathCardActive,
            ]}
          >
            <View
              style={[
                styles.pathIcon,
                index === steps.length - 1 && styles.pathIconActive,
              ]}
            >
              <Text
                style={[
                  styles.pathIconText,
                  index === steps.length - 1 && styles.pathIconTextActive,
                ]}
              >
                {step[0]}
              </Text>
            </View>

            <View style={styles.pathTextBlock}>
              <Text style={styles.pathTitle}>{step[1]}</Text>
              <Text style={styles.pathSubtitle}>{step[2]}</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </View>

          {index < steps.length - 1 && (
            <Text style={styles.downArrow}>↓</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function CommunityIllustration() {
  return (
    <View style={styles.communityStage}>
      <View style={styles.worldGlow} />

      <View style={[styles.communityCard, styles.communityCardOne]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>SM</Text>
        </View>
        <View style={styles.communityTextBlock}>
          <Text style={styles.communityName}>Sarah M.</Text>
          <Text style={styles.communityPrayer}>
            Praying for peace and healing for my family. 🙏
          </Text>
          <Text style={styles.communityMeta}>♥ 24        Pray</Text>
        </View>
      </View>

      <View style={[styles.communityCard, styles.communityCardTwo]}>
        <View style={styles.avatarCircleAlt}>
          <Text style={styles.avatarText}>DK</Text>
        </View>
        <View style={styles.communityTextBlock}>
          <Text style={styles.communityName}>David K.</Text>
          <Text style={styles.communityPrayer}>Lord, give me strength today. 💙</Text>
          <Text style={styles.communityMeta}>♥ 18        Pray</Text>
        </View>
      </View>

      <View style={styles.personDotLeft} />
      <View style={styles.personDotRight} />
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const current = useMemo(() => PAGES[page], [page]);
  const isLast = page === PAGES.length - 1;

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

      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={finishOnboarding}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.headerBlock}>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </View>

        <View style={styles.illustrationContainer}>
          {page === 0 && <VerseToPrayerIllustration />}
          {page === 1 && <ScripturePathIllustration />}
          {page === 2 && <CommunityIllustration />}
        </View>

        <View style={styles.bottomBlock}>
          <View style={styles.dotsRow}>
            {PAGES.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === page && styles.dotActive]}
              />
            ))}
          </View>

          <AppButton
            label={isLast ? 'Get Started' : 'Next'}
            onPress={nextPage}
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  skipButton: {
    alignSelf: 'flex-end',
    minWidth: 48,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.md,
    maxWidth: 330,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 330,
  },
  illustrationStage: {
    height: 330,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperCard: {
    width: 245,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  verseCard: {
    marginLeft: -32,
    transform: [{ rotate: '-5deg' }],
  },
  prayerCard: {
    marginTop: -4,
    marginLeft: 44,
    transform: [{ rotate: '4deg' }],
  },
  cardReference: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  verseCopy: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  goldArrowBubble: {
    zIndex: 2,
    width: 54,
    height: 54,
    marginVertical: -8,
    marginLeft: 145,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  goldArrow: {
    color: '#E7A900',
    fontSize: 33,
    lineHeight: 36,
    fontWeight: '700',
  },
  prayerLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.round,
    backgroundColor: colors.goldSoft,
  },
  prayerLabelText: {
    color: '#936B00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  prayerCopy: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  pathStage: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  pathCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF3',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  pathCardActive: {
    borderColor: '#F3D78A',
    backgroundColor: '#FFFCF2',
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
  pathIconText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  pathIconTextActive: {
    color: '#B88000',
  },
  pathTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pathTitle: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  pathSubtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 11,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 28,
    fontWeight: '300',
  },
  downArrow: {
    height: 25,
    color: '#E8AC00',
    fontSize: 21,
    lineHeight: 25,
    textAlign: 'center',
  },
  communityStage: {
    height: 330,
    justifyContent: 'center',
  },
  worldGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    alignSelf: 'center',
    bottom: -40,
    backgroundColor: '#E9F1FF',
  },
  communityCard: {
    zIndex: 2,
    flexDirection: 'row',
    width: '87%',
    maxWidth: 330,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    shadowColor: '#0B1F46',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  communityCardOne: {
    alignSelf: 'flex-start',
    marginLeft: 18,
  },
  communityCardTwo: {
    alignSelf: 'flex-end',
    marginTop: spacing.lg,
    marginRight: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9E5F8',
  },
  avatarCircleAlt: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C5DCF8',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  communityTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  communityName: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  communityPrayer: {
    marginTop: 5,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  communityMeta: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  personDotLeft: {
    position: 'absolute',
    left: 20,
    bottom: 28,
    width: 45,
    height: 45,
    borderRadius: 23,
    borderWidth: 5,
    borderColor: colors.surface,
    backgroundColor: '#ABC6EC',
  },
  personDotRight: {
    position: 'absolute',
    right: 24,
    bottom: 16,
    width: 45,
    height: 45,
    borderRadius: 23,
    borderWidth: 5,
    borderColor: colors.surface,
    backgroundColor: '#98B6E2',
  },
  bottomBlock: {
    paddingTop: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#D8DEE9',
  },
  dotActive: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  nextButton: {
    minHeight: 56,
    borderRadius: radius.lg,
  },
});
