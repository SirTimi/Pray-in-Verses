import { useCallback, useEffect, useState } from 'react';
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
import { getChapters } from '@/services/browse';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book?: string }>();
  const book = Array.isArray(params.book) ? params.book[0] : params.book ?? '';

  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!book) return;
    setLoading(true);
    setError('');
    try {
      setChapters(await getChapters(book));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load chapters.');
    } finally {
      setLoading(false);
    }
  }, [book]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{book || 'Book'}</Text>
          <Text style={styles.subtitle}>Select a chapter with published prayer content.</Text>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading chapters…</Text>
          </View>
        ) : error ? (
          <Pressable onPress={() => void load()} style={[styles.stateBox, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to try again</Text>
          </Pressable>
        ) : chapters.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>No published chapters are available for this book yet.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {chapters.map((chapter) => (
              <Pressable
                key={chapter}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/browse/[book]/[chapter]',
                    params: { book, chapter: String(chapter) },
                  })
                }
                style={({ pressed }) => [styles.chapterCard, pressed && styles.chapterPressed]}
              >
                <Text style={styles.chapterNumber}>{chapter}</Text>
                <ChevronRight size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteMark}>“</Text>
          <Text style={styles.noteText}>Move chapter by chapter, verse by verse, and let Scripture shape the words you pray.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 30 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  header: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chapterCard: { width: '23%', minWidth: 70, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  chapterPressed: { backgroundColor: colors.primarySoft, borderColor: '#BFCFFF' },
  chapterNumber: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 17, fontWeight: '700' },
  stateBox: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFF8F7', borderColor: '#F6D5D1' },
  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  noteCard: { marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: '#F7F9FD', borderWidth: 1, borderColor: '#E2E9F7' },
  noteMark: { color: '#C8D6EE', fontFamily: SERIF_FONT, fontSize: 48, lineHeight: 40 },
  noteText: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: -8 },
});
