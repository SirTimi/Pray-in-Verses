import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.sunGlow} />
            <View style={styles.hillOne} />
            <View style={styles.hillTwo} />

            <View style={styles.heroControls}>
              <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.heroButton}>
                <ArrowLeft size={21} color={colors.white} />
              </Pressable>
              <Pressable accessibilityLabel="Share prayer" onPress={() => void handleShare()} style={styles.heroButton}>
                <Share2 size={20} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.reference}>{prayer.reference}</Text>
              <Text style={styles.version}>SCRIPTURE PRAYER</Text>
              <Text style={styles.scripture}>“{prayer.scriptureText}”</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.infoCard}>
              <View style={[styles.cardIcon, styles.leafIcon]}>
                <Leaf size={22} color="#4E9B70" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>Theme / Focus</Text>
                <Text style={styles.cardText}>{prayer.theme}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.cardIcon, styles.bookIcon]}>
                <BookOpen size={22} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>Short Insight</Text>
                <Text style={styles.cardText}>{prayer.insight}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.cardIcon, styles.listIcon]}>
                <ListChecks size={22} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>Prayer Points</Text>
                <View style={styles.pointsList}>
                  {prayer.prayerPoints.map((point, index) => {
                    const saved = prayer.savedPointIndexes.includes(index);
                    return (
                      <View key={`${index}-${point}`} style={styles.pointRow}>
                        <View style={styles.pointNumber}>
                          <Text style={styles.pointNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.pointText}>{point}</Text>
                        <Pressable
                          accessibilityLabel={saved ? 'Unsave prayer point' : 'Save prayer point'}
                          disabled={pointBusy !== null}
                          onPress={() => void handlePointSave(index)}
                          style={styles.pointSave}
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
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.cardIcon, styles.prayerIcon]}>
                <Sparkles size={22} color="#C58A00" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>Closing Prayer</Text>
                <Text style={styles.cardText}>{prayer.closing}</Text>
              </View>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primaryDark },
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  hero: { minHeight: 330, overflow: 'hidden', backgroundColor: colors.primaryDark, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  sunGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#F6C453', opacity: 0.25, right: -75, bottom: -70 },
  hillOne: { position: 'absolute', width: 420, height: 150, borderRadius: 210, backgroundColor: '#315B8E', left: -155, bottom: -70, transform: [{ rotate: '-8deg' }] },
  hillTwo: { position: 'absolute', width: 440, height: 165, borderRadius: 220, backgroundColor: '#173D70', right: -180, bottom: -90, transform: [{ rotate: '7deg' }] },
  heroControls: { flexDirection: 'row', justifyContent: 'space-between' },
  heroButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  heroCopy: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  reference: { color: colors.white, fontFamily: SERIF_FONT, fontSize: 27, lineHeight: 34, fontWeight: '700', textAlign: 'center' },
  version: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginTop: 4 },
  scripture: { color: colors.white, fontFamily: SERIF_FONT, fontSize: 20, lineHeight: 29, textAlign: 'center', marginTop: spacing.lg },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.lg, gap: spacing.sm },
  infoCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.base, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  leafIcon: { backgroundColor: '#EAF7EF' },
  bookIcon: { backgroundColor: '#EAF1FF' },
  listIcon: { backgroundColor: '#EEF3FF' },
  prayerIcon: { backgroundColor: colors.goldSoft },
  cardBody: { flex: 1 },
  cardLabel: { color: colors.primary, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  cardText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  pointsList: { gap: 10, marginTop: 3 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pointNumber: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  pointNumberText: { color: '#805700', fontSize: 11, fontWeight: '900' },
  pointText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  pointSave: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  footerActions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  savedButton: { backgroundColor: colors.primarySoft },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  primaryButton: { flex: 1.25, minHeight: 52, borderRadius: radius.md, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 24, fontWeight: '700' },
  retryButton: { minWidth: 150, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary },
  retryText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  backLink: { padding: spacing.md },
  backLinkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,20,45,0.46)' },
  modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: spacing.xl, paddingBottom: 34, backgroundColor: colors.surface },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  modalEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  modalTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 22, fontWeight: '700', marginTop: 5 },
  modalClose: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F5F8' },
  journalInput: { minHeight: 170, marginTop: spacing.xl, padding: spacing.base, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background, color: colors.text, fontSize: 15, lineHeight: 22 },
  modalSave: { minHeight: 52, marginTop: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  modalSaveText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
});
