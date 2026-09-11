import { useCallback, useMemo, useState } from 'react';
import {
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
import {
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  Clock3,
  Heart,
  Plus,
  Search,
  Target,
  X,
} from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  getPrayerStats,
  listMyPrayers,
  toggleMyPrayer,
  type PrayerListStatus,
  type PrayerPoint,
  type PrayerStats,
} from '@/services/my-prayers';

type FilterKey = 'ALL' | 'OPEN' | 'ANSWERED';

const EMPTY_STATS: PrayerStats = {
  total: 0,
  open: 0,
  answered: 0,
};

function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function PrayTab() {
  const router = useRouter();

  const [stats, setStats] = useState<PrayerStats>(EMPTY_STATS);
  const [prayers, setPrayers] = useState<PrayerPoint[]>([]);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (status: PrayerListStatus = filter) => {
    setError('');

    try {
      const [nextStats, nextPrayers] = await Promise.all([
        getPrayerStats(),
        listMyPrayers(status),
      ]);

      setStats(nextStats);
      setPrayers(nextPrayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your prayers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load(filter);
    }, [filter, load]),
  );

  const visiblePrayers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return prayers;

    return prayers.filter((prayer) => {
      const tagText = prayer.tags.join(' ').toLowerCase();
      return (
        prayer.title.toLowerCase().includes(term) ||
        prayer.body.toLowerCase().includes(term) ||
        tagText.includes(term)
      );
    });
  }, [prayers, query]);

  function chooseFilter(next: FilterKey) {
    if (next === filter) return;
    setFilter(next);
    setLoading(true);
  }

  function openEditor(id: string) {
    router.push({
      pathname: '/(app)/my-prayers/[id]',
      params: { id },
    });
  }

  async function handleToggle(prayer: PrayerPoint) {
    if (busyId) return;

    setBusyId(prayer.id);
    setError('');

    try {
      const updated = await toggleMyPrayer(prayer.id);

      if (filter !== 'ALL' && updated.status !== filter) {
        setPrayers((current) => current.filter((item) => item.id !== prayer.id));
      } else {
        setPrayers((current) =>
          current.map((item) => (item.id === prayer.id ? updated : item)),
        );
      }

      setStats(await getPrayerStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this prayer.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              void load(filter);
            }}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR PRAYER LIFE</Text>
            <Text style={styles.title}>My Prayers</Text>
            <Text style={styles.subtitle}>Track what you are praying for and remember what God has answered.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add prayer"
            onPress={() => openEditor('new')}
            style={styles.addIconButton}
          >
            <Plus size={23} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} icon={<Target size={18} color={colors.primary} />} />
          <StatCard label="Praying" value={stats.open} icon={<Heart size={18} color="#2F6ECF" />} />
          <StatCard label="Answered" value={stats.answered} icon={<CheckCircle2 size={18} color={colors.success} />} />
        </View>

        <View style={styles.searchBox}>
          <Search size={19} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your prayers…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {!!query && (
            <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearButton}>
              <X size={17} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filters}>
          <FilterButton label="All" active={filter === 'ALL'} onPress={() => chooseFilter('ALL')} />
          <FilterButton label="Praying" active={filter === 'OPEN'} onPress={() => chooseFilter('OPEN')} />
          <FilterButton label="Answered" active={filter === 'ANSWERED'} onPress={() => chooseFilter('ANSWERED')} />
        </View>

        {!!error && !loading && (
          <Pressable onPress={() => void load(filter)} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to try again</Text>
          </Pressable>
        )}

        {loading ? (
          <AppStateView
            variant="loading"
            title="Opening your prayer list…"
            body="We’re gathering your personal prayers and testimonies."
            style={styles.stateSpacing}
          />
        ) : visiblePrayers.length === 0 ? (
          <AppStateView
            variant="empty"
            title={query ? 'No matching prayers' : filter === 'ANSWERED' ? 'No answered prayers yet' : 'Start your prayer list'}
            body={query ? 'Try a different search.' : filter === 'ANSWERED' ? 'When a prayer is answered, mark it here as a testimony.' : 'Add something you want to keep bringing before God.'}
            actionLabel={query ? undefined : 'Add Prayer'}
            onAction={query ? undefined : () => openEditor('new')}
            style={styles.stateSpacing}
          />
        ) : (
          <View style={styles.list}>
            {visiblePrayers.map((prayer) => {
              const answered = prayer.status === 'ANSWERED';
              const busy = busyId === prayer.id;

              return (
                <View key={prayer.id} style={styles.card}>
                  <Pressable onPress={() => openEditor(prayer.id)} style={styles.cardMain}>
                    <View style={styles.cardTopRow}>
                      <View style={[styles.statusPill, answered ? styles.answeredPill : styles.openPill]}>
                        {answered ? (
                          <CheckCircle2 size={13} color={colors.success} />
                        ) : (
                          <Clock3 size={13} color="#2F6ECF" />
                        )}
                        <Text style={[styles.statusText, answered ? styles.answeredText : styles.openText]}>
                          {answered ? 'Answered' : 'Praying'}
                        </Text>
                      </View>

                      <Text style={styles.dateText}>{formatRelativeDate(prayer.updatedAt || prayer.createdAt)}</Text>
                    </View>

                    <View style={styles.titleRow}>
                      <Text numberOfLines={2} style={styles.prayerTitle}>{prayer.title}</Text>
                      <ChevronRight size={19} color={colors.primary} />
                    </View>

                    <Text numberOfLines={3} style={styles.prayerBody}>{prayer.body}</Text>

                    {prayer.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {prayer.tags.slice(0, 3).map((tag) => (
                          <View key={`${prayer.id}-${tag}`} style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Pressable>

                  <View style={styles.cardFooter}>
                    <Pressable
                      disabled={!!busyId}
                      onPress={() => void handleToggle(prayer)}
                      style={({ pressed }) => [
                        styles.toggleButton,
                        answered && styles.reopenButton,
                        pressed && !busy && styles.pressed,
                        busy && styles.disabled,
                      ]}
                    >
                      {answered ? (
                        <Clock3 size={17} color={colors.primary} />
                      ) : (
                        <CheckCircle2 size={17} color={colors.white} />
                      )}
                      <Text style={[styles.toggleText, answered && styles.reopenText]}>
                        {busy ? 'Updating…' : answered ? 'Pray Again' : 'Mark Answered'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable onPress={() => openEditor('new')} style={styles.floatingButton} accessibilityLabel="Add prayer point">
        <CirclePlus size={21} color={colors.white} />
        <Text style={styles.floatingText}>Add Prayer</Text>
      </Pressable>
    </SafeAreaView>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type FilterButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterButton({ label, active, onPress }: FilterButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.filterButton, active && styles.filterButtonActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: 104 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.35 },
  title: { color: colors.primaryDark, fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 310 },
  addIconButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  statCard: { flex: 1, minHeight: 112, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.sm },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  statValue: { color: colors.primaryDark, fontSize: 23, fontWeight: '800', marginTop: 6 },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 1 },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  searchInput: { flex: 1, minHeight: 50, color: colors.text, fontSize: 14, paddingVertical: 0 },
  clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  filterButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#EEF2F7', paddingHorizontal: spacing.sm },
  filterButtonActive: { backgroundColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  errorBox: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 4 },
  stateSpacing: { marginTop: spacing.xl },
  list: { gap: spacing.md, marginTop: spacing.xl },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
  cardMain: { padding: spacing.base },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 14 },
  openPill: { backgroundColor: '#EDF4FF' },
  answeredPill: { backgroundColor: '#ECFDF3' },
  statusText: { fontSize: 10, fontWeight: '800' },
  openText: { color: '#2F6ECF' },
  answeredText: { color: colors.success },
  dateText: { color: colors.textMuted, fontSize: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  prayerTitle: { flex: 1, color: colors.primaryDark, fontSize: 17, lineHeight: 23, fontWeight: '800' },
  prayerBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.goldSoft },
  tagText: { color: '#916A00', fontSize: 10, fontWeight: '700' },
  cardFooter: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  toggleButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary, paddingHorizontal: spacing.md },
  reopenButton: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface },
  toggleText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  reopenText: { color: colors.primary },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.55 },
  floatingButton: { position: 'absolute', right: spacing.base, bottom: spacing.base, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, borderRadius: 25, backgroundColor: colors.primary, shadowColor: '#071F62', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 9, elevation: 5 },
  floatingText: { color: colors.white, fontSize: 13, fontWeight: '800' },
});
