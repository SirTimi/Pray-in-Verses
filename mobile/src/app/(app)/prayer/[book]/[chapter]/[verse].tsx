import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Check,
  FileText,
  Leaf,
  ListChecks,
  Share2,
  Sparkles,
  X,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  createJournalEntry,
  getPrayerDetail,
  savePrayer,
  savePrayerPoint,
  type CuratedPrayerDetail,
  unsavePrayer,
  unsavePrayerPoint,
} from '@/services/prayers';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export default function PrayerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ book?: string; chapter?: string; verse?: string }>();
  const book = Array.isArray(params.book) ? params.book[0] : params.book ?? '';
  const chapterValue = Array.isArray(params.chapter) ? params.chapter[0] : params.chapter;
  const verseValue = Array.isArray(params.verse) ? params.verse[0] : params.verse;
  const chapter = Number(chapterValue) || 0;
  const verse = Number(verseValue) || 0;

  const [prayer, setPrayer] = useState<CuratedPrayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pointBusy, setPointBusy] = useState<number | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalBody, setJournalBody] = useState('');
  const [journalSaving, setJournalSaving] = useState(false);

  const load = useCallback(async () => {
    if (!book || !chapter || !verse) {
      setError('This prayer reference is incomplete.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      setPrayer(await getPrayerDetail(book, chapter, verse));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this prayer.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter, verse]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleShare() {
    if (!prayer) return;

    await Share.share({
      message: `${prayer.reference}\n\n“${prayer.scriptureText}”\n\n${prayer.closing}\n\nPray in Verses`,
    });
  }

  async function handleSavePrayer() {
    if (!prayer || saving) return;
    setSaving(true);

    try {
      if (prayer.isSaved) {
        await unsavePrayer(prayer.id);
      } else {
        await savePrayer(prayer.id);
      }

      setPrayer((current) => current ? { ...current, isSaved: !current.isSaved } : current);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePointSave(index: number) {
    if (!prayer || pointBusy !== null) return;
    const isSaved = prayer.savedPointIndexes.includes(index);
    setPointBusy(index);

    try {
      if (isSaved) {
        await unsavePrayerPoint(prayer.id, index);
      } else {
        await savePrayerPoint(prayer.id, index);
      }

      setPrayer((current) => {
        if (!current) return current;
        const next = isSaved
          ? current.savedPointIndexes.filter((item) => item !== index)
          : [...current.savedPointIndexes, index].sort((a, b) => a - b);
        return { ...current, savedPointIndexes: next, savedPointsCount: next.length };
      });
    } catch (err) {
      Alert.alert('Could not update prayer point', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setPointBusy(null);
    }
  }

  async function handleJournalSave() {
    if (!prayer || journalBody.trim().length === 0 || journalSaving) return;
    setJournalSaving(true);

    try {
      await createJournalEntry({
        title: `Reflection on ${prayer.reference}`,
        body: journalBody.trim(),
        mood: 'Reflective',
      });
      setJournalBody('');
      setJournalOpen(false);
      Alert.alert('Saved to journal', 'Your reflection has been added to your prayer journal.');
    } catch (err) {
      Alert.alert('Journal save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setJournalSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Preparing this prayer…</Text>
      </SafeAreaView>
    );
  }

  if (error || !prayer) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Text style={styles.errorTitle}>Unable to open prayer</Text>
        <Text style={styles.stateText}>{error || 'Prayer not found.'}</Text>
        <Pressable onPress={() => void load()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ImageBackground
            source={require('../../../../../../assets/images/prayer/prayer-detail-banner.jpg')}
            resizeMode="cover"
            style={styles.hero}
          >
            <View style={styles.heroOverlay} />

            <View style={styles.heroControls}>
              <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.heroButton}>
                <ArrowLeft size={21} color={colors.white} />
              </Pressable>
              <Pressable accessibilityLabel="Share prayer" onPress={() => void handleShare()} style={styles.heroButton}>
                <Share2 size={20} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.version}>SCRIPTURE PRAYER</Text>
              <Text style={styles.reference}>{prayer.reference}</Text>
              <Text style={styles.scripture}>“{prayer.scriptureText}”</Text>
            </View>
          </ImageBackground>

          <View style={styles.content}>
            <View style={styles.focusStrip}>
              <View style={[styles.smallIcon, styles.leafIcon]}>
                <Leaf size={19} color="#4E9B70" />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.miniLabel}>THEME / FOCUS</Text>
                <Text style={styles.focusText}>{prayer.theme}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.smallIcon, styles.bookIcon]}>
                  <BookOpen size={19} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Short Insight</Text>
              </View>
              <Text style={styles.bodyText}>{prayer.insight}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.smallIcon, styles.listIcon]}>
                    <ListChecks size={19} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Prayer Points</Text>
                </View>
                <Text style={styles.savedCount}>{prayer.savedPointsCount}/{prayer.prayerPoints.length} saved</Text>
              </View>

              <View style={styles.pointsList}>
                {prayer.prayerPoints.map((point, index) => {
                  const saved = prayer.savedPointIndexes.includes(index);
                  return (
                    <View key={`${index}-${point}`} style={[styles.pointRow, index > 0 && styles.pointDivider]}>
                      <View style={styles.pointNumber}>
                        <Text style={styles.pointNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.pointText}>{point}</Text>
                      <Pressable
                        accessibilityLabel={saved ? 'Unsave prayer point' : 'Save prayer point'}
                        disabled={pointBusy !== null}
                        onPress={() => void handlePointSave(index)}
                        style={[styles.pointSave, saved && styles.pointSaveActive]}
                      >
                        {pointBusy === index ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : saved ? (
                          <Check size={17} color={colors.primary} />
                        ) : (
                          <Bookmark size={17} color={colors.textMuted} />
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.closingCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.smallIcon, styles.prayerIcon]}>
                  <Sparkles size={19} color="#B77A00" />
                </View>
                <Text style={styles.sectionTitle}>Closing Prayer</Text>
              </View>
              <Text style={styles.closingText}>{prayer.closing}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footerActions}>
          <Pressable
            disabled={saving}
            onPress={() => void handleSavePrayer()}
            style={[styles.secondaryButton, prayer.isSaved && styles.savedButton]}
          >
            {saving ? (
              <ActivityIndicator color={colors.primary} />
            ) : prayer.isSaved ? (
              <Check size={19} color={colors.primary} />
            ) : (
              <Bookmark size={19} color={colors.primary} />
            )}
            <Text style={styles.secondaryButtonText}>{prayer.isSaved ? 'Saved' : 'Save Prayer'}</Text>
          </Pressable>

          <Pressable onPress={() => setJournalOpen(true)} style={styles.primaryButton}>
            <FileText size={19} color={colors.white} />
            <Text style={styles.primaryButtonText}>Add to Journal</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={journalOpen} transparent animationType="slide" onRequestClose={() => setJournalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.modalKeyboardAvoider}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.modalHeader}>
                <View style={styles.flexOne}>
                  <Text style={styles.modalEyebrow}>PRAYER JOURNAL</Text>
                  <Text style={styles.modalTitle}>Reflect on {prayer.reference}</Text>
                </View>
                <Pressable onPress={() => setJournalOpen(false)} style={styles.modalClose}>
                  <X size={20} color={colors.primaryDark} />
                </Pressable>
              </View>

              <TextInput
                autoFocus
                multiline
                value={journalBody}
                onChangeText={setJournalBody}
                placeholder="Write what stood out to you, what you're praying, or what God is teaching you…"
                placeholderTextColor={colors.textMuted}
                style={styles.journalInput}
                textAlignVertical="top"
              />

              <Pressable
                disabled={journalBody.trim().length === 0 || journalSaving}
                onPress={() => void handleJournalSave()}
                style={[styles.modalSave, (journalBody.trim().length === 0 || journalSaving) && styles.disabledButton]}
              >
                {journalSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.modalSaveText}>Save Reflection</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primaryDark },
  screen: { flex: 1, backgroundColor: '#FFFDF8' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 18 },
  hero: {
    minHeight: 310,
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 28, 80, 0.66)',
  },
  heroControls: { flexDirection: 'row', justifyContent: 'space-between' },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(7,28,80,0.42)',
  },
  heroCopy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 20,
  },
  reference: {
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  version: {
    color: '#F8D86A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  scripture: {
    maxWidth: 360,
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: 18,
    gap: 12,
  },
  flexOne: { flex: 1 },
  focusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE9E2',
    backgroundColor: '#F8FCF9',
  },
  miniLabel: {
    color: '#6E7A73',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.25,
  },
  focusText: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 3,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E8ED',
    backgroundColor: colors.surface,
  },
  closingCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0DEA3',
    backgroundColor: '#FFFBED',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: { backgroundColor: '#EAF7EF' },
  bookIcon: { backgroundColor: '#EAF1FF' },
  listIcon: { backgroundColor: '#EEF3FF' },
  prayerIcon: { backgroundColor: '#FFF3C7' },
  sectionTitle: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
  },
  savedCount: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 13,
    textAlign: 'justify',
  },
  pointsList: { marginTop: 8 },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
  },
  pointDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EEF0F3',
  },
  pointNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  pointNumberText: { color: '#805700', fontSize: 11, fontWeight: '900' },
  pointText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  pointSave: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
  pointSaveActive: { backgroundColor: colors.primarySoft },
  closingText: {
    color: '#5F5A4A',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 13,
    fontStyle: 'italic',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  savedButton: { backgroundColor: colors.primarySoft },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  primaryButton: {
    flex: 1.25,
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 24, fontWeight: '700' },
  retryButton: { minWidth: 150, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary },
  retryText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  backLink: { padding: spacing.md },
  backLinkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  modalKeyboardAvoider: { flex: 1 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,20,45,0.46)' },
  modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, backgroundColor: colors.surface },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  modalEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  modalTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 22, fontWeight: '700', marginTop: 5 },
  modalClose: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F5F8' },
  journalInput: { minHeight: 170, marginTop: spacing.xl, padding: spacing.base, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background, color: colors.text, fontSize: 15, lineHeight: 22 },
  modalSave: { minHeight: 52, marginTop: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  modalSaveText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
});
