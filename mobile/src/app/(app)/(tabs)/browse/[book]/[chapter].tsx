import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { getChapterCounts, getVerses } from '@/services/browse';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export default function VerseSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book?: string; chapter?: string; verse?: string }>();
  const book = Array.isArray(params.book) ? params.book[0] : params.book ?? '';
  const chapterRaw = Array.isArray(params.chapter) ? params.chapter[0] : params.chapter;
  const verseRaw = Array.isArray(params.verse) ? params.verse[0] : params.verse;
  const chapter = Number(chapterRaw) || 0;

  const [verses, setVerses] = useState<number[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [selectedVerse, setSelectedVerse] = useState<number | null>(Number(verseRaw) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!book || !chapter) return;
    setLoading(true);
    setError('');
    try {
      const [verseData, countData] = await Promise.all([
        getVerses(book, chapter),
        getChapterCounts(book, chapter),
      ]);
      setVerses(verseData);
      setCounts(Object.fromEntries(countData.map((item) => [item.verse, item.prayerPointsCount])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load verses.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedExists = useMemo(
    () => selectedVerse !== null && verses.includes(selectedVerse),
    [selectedVerse, verses],
  );

  function openPrayer(verse: number) {
    setSelectedVerse(verse);
    router.push({
      pathname: '/(app)/prayer/[book]/[chapter]/[verse]',
      params: {
        book,
        chapter: String(chapter),
        verse: String(verse),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{book} {chapter}</Text>
          <Text style={styles.subtitle}>Select a verse to turn into prayer.</Text>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading published verses…</Text>
          </View>
        ) : error ? (
          <Pressable onPress={() => void load()} style={[styles.stateBox, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to try again</Text>
          </Pressable>
        ) : verses.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>No published verses are available in this chapter yet.</Text>
          </View>
        ) : (
          <View style={styles.verseList}>
            {verses.map((verse) => {
              const selected = verse === selectedVerse;
              const count = counts[verse] ?? 0;

              return (
                <Pressable
                  key={verse}
                  onPress={() => openPrayer(verse)}
                  style={[styles.verseRow, selected && styles.verseRowSelected]}
                >
                  <View style={[styles.verseNumberBox, selected && styles.verseNumberSelected]}>
                    <Text style={[styles.verseNumber, selected && styles.verseNumberTextSelected]}>{verse}</Text>
                  </View>
                  <View style={styles.verseCopy}>
                    <Text style={[styles.verseTitle, selected && styles.verseTitleSelected]}>Verse {verse}</Text>
                    <Text style={styles.verseMeta}>
                      {count > 0 ? `${count} prayer point${count === 1 ? '' : 's'} ready` : 'Published prayer ready'}
                    </Text>
                  </View>
                  <ChevronRight size={19} color={selected ? colors.primary : colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedExists && (
          <Text style={styles.selectionNote}>Selected: {book} {chapter}:{selectedVerse}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 30 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  header: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 6 },
  verseList: { gap: spacing.sm },
  verseRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  verseRowSelected: { borderColor: '#F3D479', backgroundColor: '#FFF9E8' },
  verseNumberBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6FA' },
  verseNumberSelected: { backgroundColor: colors.goldSoft },
  verseNumber: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 17, fontWeight: '700' },
  verseNumberTextSelected: { color: '#A56E00' },
  verseCopy: { flex: 1 },
  verseTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  verseTitleSelected: { color: '#8C6000' },
  verseMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  stateBox: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFF8F7', borderColor: '#F6D5D1' },
  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  selectionNote: { color: colors.primary, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: spacing.xl },
});
