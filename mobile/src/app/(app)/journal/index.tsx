import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Plus, Search, X } from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { listJournals, type JournalEntry } from '@/services/journals';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
type JournalFilter = 'all' | 'month' | 'reflective';

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function JournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<JournalFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setEntries(await listJournals());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your journal.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
  }, [load]));

  const visibleEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    const thisMonth = monthKey(new Date().toISOString());
    return entries.filter((entry) => {
      if (filter === 'month' && monthKey(entry.createdAt) !== thisMonth) return false;
      if (filter === 'reflective' && entry.mood !== 'Reflective') return false;
      if (!term) return true;
      return entry.title.toLowerCase().includes(term) || entry.body.toLowerCase().includes(term) || (entry.mood ?? '').toLowerCase().includes(term);
    });
  }, [entries, filter, query]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}><ArrowLeft size={22} color={colors.primary} /></Pressable>
            <Text style={styles.title}>Journal</Text>
            <Pressable onPress={() => router.push('/(app)/journal/new')} style={styles.iconButton}><Plus size={22} color={colors.primary} /></Pressable>
          </View>

          <View style={styles.searchBox}>
            <Search size={19} color={colors.textMuted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search journal entries…" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
            {!!query && <Pressable onPress={() => setQuery('')} style={styles.clearButton}><X size={17} color={colors.textSecondary} /></Pressable>}
          </View>

          <View style={styles.filters}>
            {([['all', 'All Entries'], ['month', 'This Month'], ['reflective', 'Reflective']] as const).map(([key, label]) => (
              <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter === key && styles.filterChipActive]}>
                <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <AppStateView variant="loading" title="Opening your journal…" body="We’re loading your reflections and prayers." style={styles.stateSpacing} />
          ) : error ? (
            <AppStateView variant="error" title="Could not load your journal" body={error} actionLabel="Try Again" onAction={() => void load()} style={styles.stateSpacing} />
          ) : visibleEntries.length === 0 ? (
            <AppStateView
              variant="empty"
              title={query || filter !== 'all' ? 'No matching entries' : 'Your journal is waiting'}
              body={query || filter !== 'all' ? 'Try another search or filter.' : 'Write your first reflection, prayer, or testimony.'}
              actionLabel="New Entry"
              onAction={() => router.push('/(app)/journal/new')}
              style={styles.stateSpacing}
            />
          ) : (
            <View style={styles.list}>
              {visibleEntries.map((entry) => {
                const date = new Date(entry.createdAt);
                return (
                  <Pressable key={entry.id} onPress={() => router.push({ pathname: '/(app)/journal/[id]', params: { id: entry.id } })} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateMonth}>{date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
                      <Text style={styles.dateDay}>{date.getDate()}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Text numberOfLines={1} style={styles.entryTitle}>{entry.title}</Text>
                      {!!entry.mood && <Text style={styles.mood}>{entry.mood}</Text>}
                      <Text numberOfLines={2} style={styles.preview}>{entry.body}</Text>
                    </View>
                    <ChevronRight size={19} color={colors.primary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/(app)/journal/new')} style={styles.newButton}>
            <Plus size={20} color={colors.white} />
            <Text style={styles.newButtonText}>New Entry</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 110 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 25, fontWeight: '700' },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#F2F6FC', paddingHorizontal: spacing.md, marginTop: spacing.lg },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  clearButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  filterChip: { flex: 1, minHeight: 36, paddingHorizontal: 10, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7' },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  stateSpacing: { marginTop: spacing.xl },
  list: { gap: spacing.sm, marginTop: spacing.lg },
  card: { minHeight: 102, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md },
  cardPressed: { backgroundColor: colors.primarySoft },
  dateBox: { width: 52, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3FF' },
  dateMonth: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  dateDay: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 21, fontWeight: '700', marginTop: 1 },
  cardBody: { flex: 1 },
  entryTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 16, fontWeight: '700' },
  mood: { color: '#A56E00', fontSize: 10, fontWeight: '800', marginTop: 3 },
  preview: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  newButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary },
  newButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});
