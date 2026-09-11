import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Search } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { getBooks } from '@/services/browse';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const CANONICAL_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
] as const;

const BOOK_INDEX = new Map(CANONICAL_BOOKS.map((book, index) => [book.toLowerCase(), index]));
const MATTHEW_INDEX = CANONICAL_BOOKS.indexOf('Matthew');

type Testament = 'old' | 'new';

function testamentFor(book: string): Testament {
  const index = BOOK_INDEX.get(book.toLowerCase());
  if (typeof index === 'number' && index >= MATTHEW_INDEX) return 'new';
  return 'old';
}

export default function BrowseBooksScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<string[]>([]);
  const [testament, setTestament] = useState<Testament>('new');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBooks();
      setBooks(
        [...data].sort((a, b) => {
          const ai = BOOK_INDEX.get(a.toLowerCase()) ?? 999;
          const bi = BOOK_INDEX.get(b.toLowerCase()) ?? 999;
          return ai - bi || a.localeCompare(b);
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Bible books.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredBooks = useMemo(() => {
    const term = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchesTestament = testamentFor(book) === testament;
      const matchesQuery = !term || book.toLowerCase().includes(term);
      return matchesTestament && matchesQuery;
    });
  }, [books, query, testament]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Browse Scripture</Text>
            <Text style={styles.subtitle}>Explore God’s Word and turn every published verse into prayer.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search prayers" onPress={() => router.push('/(app)/(tabs)/browse/search')} style={styles.searchButton}>
            <Search size={21} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Search size={19} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search books (e.g. John, Psalm)"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.segmented}>
          <Pressable onPress={() => setTestament('old')} style={[styles.segment, testament === 'old' && styles.segmentActive]}>
            <Text style={[styles.segmentText, testament === 'old' && styles.segmentTextActive]}>Old Testament</Text>
          </Pressable>
          <Pressable onPress={() => setTestament('new')} style={[styles.segment, testament === 'new' && styles.segmentActive]}>
            <Text style={[styles.segmentText, testament === 'new' && styles.segmentTextActive]}>New Testament</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading published books…</Text>
          </View>
        ) : error ? (
          <Pressable onPress={() => void load()} style={[styles.stateBox, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to try again</Text>
          </Pressable>
        ) : filteredBooks.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>No published books match this filter yet.</Text>
          </View>
        ) : (
          <View style={styles.bookList}>
            {filteredBooks.map((book) => (
              <Pressable
                key={book}
                onPress={() => router.push({ pathname: '/(app)/(tabs)/browse/[book]', params: { book } })}
                style={({ pressed }) => [styles.bookRow, pressed && styles.rowPressed]}
              >
                <View style={styles.bookTextBlock}>
                  <Text style={styles.bookName}>{book}</Text>
                  <Text style={styles.bookMeta}>Published prayer collection</Text>
                </View>
                <ChevronRight size={19} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 5, maxWidth: 310 },
  searchButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, marginTop: spacing.xl },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radius.md, backgroundColor: '#EDF1F7', marginTop: spacing.md, marginBottom: spacing.md },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  segmentTextActive: { color: colors.white },
  bookList: { borderTopWidth: 1, borderTopColor: colors.border },
  bookRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  rowPressed: { backgroundColor: colors.primarySoft },
  bookTextBlock: { flex: 1, paddingRight: spacing.md },
  bookName: { color: colors.primaryDark, fontSize: 15, fontWeight: '800' },
  bookMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  stateBox: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, marginTop: spacing.sm },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFF8F7', borderColor: '#F6D5D1' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
});
