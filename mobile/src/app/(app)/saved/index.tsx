import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
import { ArrowLeft, Bookmark, ChevronRight, Search, Trash2, X } from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { listSavedPrayers, removeSavedPrayerGroup, type SavedPrayerGroup } from '@/services/saved-prayers';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export default function SavedPrayersScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SavedPrayerGroup[]>([]);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await listSavedPrayers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load saved prayers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
  }, [load]));

  const themes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = item.curatedPrayer.theme?.trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return ['All', ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name)];
  }, [items]);

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const prayer = item.curatedPrayer;
      if (theme !== 'All' && prayer.theme !== theme) return false;
      if (!term) return true;
      const reference = `${prayer.book} ${prayer.chapter}:${prayer.verse}`.toLowerCase();
      return reference.includes(term) || prayer.theme.toLowerCase().includes(term) || prayer.scriptureText.toLowerCase().includes(term) || prayer.insight.toLowerCase().includes(term);
    });
  }, [items, query, theme]);

  function openPrayer(item: SavedPrayerGroup) {
    const prayer = item.curatedPrayer;
    router.push({
      pathname: '/(app)/prayer/[book]/[chapter]/[verse]',
      params: { book: prayer.book, chapter: String(prayer.chapter), verse: String(prayer.verse) },
    });
  }

  function confirmRemove(item: SavedPrayerGroup) {
    Alert.alert('Remove saved prayer?', 'This removes the saved prayer and any individually saved prayer points for this verse.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void removeItem(item) },
    ]);
  }

  async function removeItem(item: SavedPrayerGroup) {
    if (deletingId) return;
    setDeletingId(item.curatedPrayerId);
    setError('');
    try {
      await removeSavedPrayerGroup(item);
      setItems((current) => current.filter((entry) => entry.curatedPrayerId !== item.curatedPrayerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove this saved prayer.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><ArrowLeft size={22} color={colors.primary} /></Pressable>
          <Text style={styles.title}>Saved Prayers</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.searchBox}>
          <Search size={19} color={colors.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search saved prayers…" placeholderTextColor={colors.textMuted} autoCorrect={false} style={styles.searchInput} />
          {!!query && <Pressable onPress={() => setQuery('')} style={styles.clearButton}><X size={17} color={colors.textSecondary} /></Pressable>}
        </View>

        {themes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {themes.map((item) => (
              <Pressable key={item} onPress={() => setTheme(item)} style={[styles.filterChip, theme === item && styles.filterChipActive]}>
                <Text style={[styles.filterText, theme === item && styles.filterTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {!!error && !loading && <AppStateView variant="error" title="Could not load saved prayers" body={error} actionLabel="Try Again" onAction={() => void load()} style={styles.stateSpacing} />}
        {loading ? (
          <AppStateView variant="loading" title="Loading saved prayers…" body="We’re opening your prayer library." style={styles.stateSpacing} />
        ) : !error && visibleItems.length === 0 ? (
          <AppStateView
            variant="empty"
            icon={<Bookmark size={30} color={colors.primary} />}
            title={query || theme !== 'All' ? 'No matching prayers' : 'No saved prayers yet'}
            body={query || theme !== 'All' ? 'Try another search or filter.' : 'Start praying with Scripture and save your favorite prayers here.'}
            actionLabel="Explore Verses"
            onAction={() => router.push('/(app)/(tabs)/browse')}
            style={styles.stateSpacing}
          />
        ) : (
          !error && <View style={styles.list}>
            {visibleItems.map((item) => {
              const prayer = item.curatedPrayer;
              return (
                <View key={item.curatedPrayerId} style={styles.card}>
                  <Pressable onPress={() => openPrayer(item)} style={styles.cardMain}>
                    <View style={styles.cardIcon}><Bookmark size={20} color="#C58A00" fill="#FCCF3A" /></View>
                    <View style={styles.cardBody}>
                      <View style={styles.referenceRow}>
                        <Text style={styles.reference}>{prayer.book} {prayer.chapter}:{prayer.verse}</Text>
                        {!!prayer.theme && <View style={styles.themeTag}><Text style={styles.themeText}>{prayer.theme}</Text></View>}
                      </View>
                      <Text numberOfLines={3} style={styles.scripture}>“{prayer.scriptureText}”</Text>
                      {item.savedPointIndexes.length > 0 && <Text style={styles.meta}>{item.savedPointIndexes.length} saved prayer point{item.savedPointIndexes.length === 1 ? '' : 's'}</Text>}
                    </View>
                    <ChevronRight size={19} color={colors.primary} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Remove saved prayer" disabled={deletingId === item.curatedPrayerId} onPress={() => confirmRemove(item)} style={styles.deleteButton}>
                    <Trash2 size={18} color={deletingId === item.curatedPrayerId ? colors.textMuted : colors.error} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 25, fontWeight: '700' },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#F2F6FC', paddingHorizontal: spacing.md, marginTop: spacing.lg },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  clearButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: spacing.sm, paddingVertical: spacing.md },
  filterChip: { minHeight: 36, paddingHorizontal: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7' },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  stateSpacing: { marginTop: spacing.lg },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  card: { position: 'relative', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
  cardMain: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingRight: 54 },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft },
  cardBody: { flex: 1 },
  referenceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  reference: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 15, fontWeight: '700' },
  themeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EAF1FF' },
  themeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  scripture: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  meta: { color: '#A56E00', fontSize: 10, fontWeight: '700', marginTop: 7 },
  deleteButton: { position: 'absolute', top: 8, right: 8, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7F6' },
});
