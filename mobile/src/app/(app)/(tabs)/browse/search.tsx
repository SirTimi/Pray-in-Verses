import { useEffect, useMemo, useState } from 'react';
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
import { ArrowLeft, ChevronRight, Search, X } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { searchPrayers, type SearchPrayerResult } from '@/services/browse';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

type Filter = 'all' | 'scripture' | 'themes' | 'prayer-points';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scripture', label: 'Scripture' },
  { key: 'themes', label: 'Themes' },
  { key: 'prayer-points', label: 'Prayer Points' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPrayerResult[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await searchPrayers(term);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(err instanceof Error ? err.message : 'Search failed.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const visibleResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (filter === 'all') return results;

    return results.filter((item) => {
      if (filter === 'scripture') return item.scriptureText.toLowerCase().includes(term);
      if (filter === 'themes') return item.theme.toLowerCase().includes(term);
      return item.prayerPoints.some((point) => point.toLowerCase().includes(term));
    });
  }, [filter, query, results]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>Find published verses, themes and prayer points.</Text>
        </View>

        <View style={styles.searchBox}>
          <Search size={20} color={colors.primary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search peace, faith, John…"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            style={styles.searchInput}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {query.trim().length < 2 ? (
          <View style={styles.stateBox}>
            <Search size={30} color={colors.textMuted} />
            <Text style={styles.stateTitle}>Search the prayer library</Text>
            <Text style={styles.stateText}>Type at least two characters to search published Scripture content.</Text>
          </View>
        ) : loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Searching…</Text>
          </View>
        ) : error ? (
          <View style={[styles.stateBox, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : visibleResults.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>No matches found</Text>
            <Text style={styles.stateText}>Try another word or switch back to All results.</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.resultsCount}>Results ({visibleResults.length})</Text>
            <View style={styles.resultsList}>
              {visibleResults.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(tabs)/browse/[book]/[chapter]',
                      params: {
                        book: item.book,
                        chapter: String(item.chapter),
                        verse: String(item.verse),
                      },
                    })
                  }
                  style={({ pressed }) => [styles.resultCard, pressed && styles.resultPressed]}
                >
                  <View style={styles.resultIcon}>
                    <Text style={styles.resultIconText}>✦</Text>
                  </View>
                  <View style={styles.resultBody}>
                    <Text style={styles.reference}>{item.book} {item.chapter}:{item.verse}</Text>
                    <Text numberOfLines={3} style={styles.scripture}>“{item.scriptureText}”</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.tag}><Text style={styles.tagText}>{item.theme}</Text></View>
                      {item.prayerPointsCount > 0 && (
                        <View style={styles.tag}><Text style={styles.tagText}>{item.prayerPointsCount} prayer points</Text></View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={19} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 30 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  header: { alignItems: 'center', marginTop: spacing.sm },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 5 },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#CAD4E4', borderRadius: radius.md, backgroundColor: '#F2F6FC', paddingHorizontal: spacing.md, marginTop: spacing.xl },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  clearButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: spacing.sm, paddingVertical: spacing.md },
  filterChip: { minHeight: 38, paddingHorizontal: 16, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7' },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  stateBox: { minHeight: 210, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, marginTop: spacing.sm },
  stateTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 19, fontWeight: '700' },
  stateText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 290 },
  errorBox: { backgroundColor: '#FFF8F7', borderColor: '#F6D5D1' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  resultsCount: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm },
  resultsList: { gap: spacing.sm },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.md },
  resultPressed: { backgroundColor: colors.primarySoft },
  resultIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F1FF' },
  resultIconText: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  resultBody: { flex: 1 },
  reference: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  scripture: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EAF1FF' },
  tagText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
});
