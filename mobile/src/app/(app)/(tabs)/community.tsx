import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bookmark,
  ChevronRight,
  Filter,
  Heart,
  MessageCircle,
  Plus,
  UsersRound,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  listPrayerRequests,
  lookupDisplayNames,
  PRAYER_WALL_CATEGORIES,
  togglePrayerRequestBookmark,
  togglePrayerRequestLike,
  type PrayerWallRequest,
} from '@/services/prayer-wall';
import { useAuthStore } from '@/stores/auth.store';

type WallMode = 'all' | 'urgent' | 'mine';

function relativeTime(value: string) {
  const time = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function CommunityTab() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<PrayerWallRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState<WallMode>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [likeState, setLikeState] = useState<Record<string, boolean>>({});
  const [bookmarkState, setBookmarkState] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await listPrayerRequests({
        category: category === 'All' ? undefined : category,
        limit: 40,
      });
      setRequests(response.data);

      const ids = response.data
        .filter((item) => !item.anonymous && item.createdById)
        .map((item) => item.createdById as string);

      if (ids.length > 0) {
        setNames(await lookupDisplayNames(ids));
      } else {
        setNames({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the Prayer Wall.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const visibleRequests = useMemo(() => {
    if (mode === 'urgent') return requests.filter((item) => item.urgent);
    if (mode === 'mine') return requests.filter((item) => !!user?.id && item.createdById === user.id);
    return requests;
  }, [mode, requests, user?.id]);

  async function handleLike(request: PrayerWallRequest) {
    if (busyId) return;
    setBusyId(request.id);
    try {
      const result = await togglePrayerRequestLike(request.id);
      setLikeState((current) => ({ ...current, [request.id]: result.liked }));
      setRequests((current) => current.map((item) => {
        if (item.id !== request.id) return item;
        const currentCount = item._count?.likes ?? 0;
        return {
          ...item,
          _count: {
            likes: Math.max(0, currentCount + (result.liked ? 1 : -1)),
            comments: item._count?.comments ?? 0,
            bookmarks: item._count?.bookmarks ?? 0,
          },
        };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update prayer count.');
    } finally {
      setBusyId('');
    }
  }

  async function handleBookmark(request: PrayerWallRequest) {
    if (busyId) return;
    setBusyId(request.id);
    try {
      const result = await togglePrayerRequestBookmark(request.id);
      setBookmarkState((current) => ({ ...current, [request.id]: result.bookmarked }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update bookmark.');
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Prayer Wall</Text>
            <Text style={styles.subtitle}>A community lifted by prayer</Text>
          </View>
          <View style={styles.filterIcon}>
            <Filter size={20} color={colors.primary} />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/prayer-wall/create')}
          style={styles.createButton}
        >
          <View style={styles.createIcon}><Plus size={20} color={colors.primary} /></View>
          <Text style={styles.createText}>Share a Prayer Request</Text>
        </Pressable>

        <View style={styles.modeRow}>
          {([
            ['all', 'All Requests'],
            ['urgent', 'Urgent'],
            ['mine', 'My Requests'],
          ] as const).map(([key, label]) => (
            <Pressable key={key} onPress={() => setMode(key)} style={styles.modeButton}>
              <Text style={[styles.modeText, mode === key && styles.modeTextActive]}>{label}</Text>
              {mode === key && <View style={styles.modeUnderline} />}
            </Pressable>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {['All', ...PRAYER_WALL_CATEGORIES].map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.categoryChip, category === item && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {!!error && (
          <Pressable onPress={() => void load()} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to try again</Text>
          </Pressable>
        )}

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading prayer requests…</Text>
          </View>
        ) : visibleRequests.length === 0 ? (
          <View style={styles.stateBox}>
            <UsersRound size={30} color={colors.textMuted} />
            <Text style={styles.stateTitle}>No requests here yet</Text>
            <Text style={styles.stateText}>Try another filter or share a prayer request with the community.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleRequests.map((request) => {
              const author = request.anonymous
                ? 'Anonymous'
                : request.createdById
                  ? names[request.createdById] ?? 'User'
                  : 'User';
              const initial = request.anonymous ? '🙏' : author.slice(0, 1).toUpperCase();
              const liked = !!likeState[request.id];
              const bookmarked = !!bookmarkState[request.id];

              return (
                <View key={request.id} style={styles.card}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(app)/prayer-wall/[id]', params: { id: request.id } })}
                    style={styles.cardMain}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
                      <View style={styles.authorBlock}>
                        <Text style={styles.author}>{author}</Text>
                        <Text style={styles.time}>{relativeTime(request.createdAt)}</Text>
                      </View>
                      {request.urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>Urgent</Text></View>}
                    </View>

                    <Text style={styles.requestTitle}>{request.title}</Text>
                    <Text numberOfLines={4} style={styles.description}>{request.description}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{request.category}</Text></View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>

                  <View style={styles.actions}>
                    <Pressable disabled={busyId === request.id} onPress={() => void handleLike(request)} style={styles.actionButton}>
                      <Heart size={18} color={liked ? '#E84A5F' : colors.primary} fill={liked ? '#E84A5F' : 'transparent'} />
                      <Text style={[styles.actionText, liked && styles.prayedText]}>Pray ({request._count?.likes ?? 0})</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => router.push({ pathname: '/(app)/prayer-wall/[id]', params: { id: request.id } })}
                      style={styles.actionButton}
                    >
                      <MessageCircle size={18} color={colors.primary} />
                      <Text style={styles.actionText}>Comment ({request._count?.comments ?? 0})</Text>
                    </Pressable>

                    <Pressable disabled={busyId === request.id} onPress={() => void handleBookmark(request)} style={styles.saveAction}>
                      <Bookmark size={18} color={colors.primary} fill={bookmarked ? colors.primary : 'transparent'} />
                      <Text style={styles.actionText}>{bookmarked ? 'Saved' : 'Save'}</Text>
                    </Pressable>
                  </View>
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.primaryDark, fontSize: 31, lineHeight: 37, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  filterIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  createButton: { minHeight: 56, marginTop: spacing.lg, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary },
  createIcon: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  createText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  modeRow: { flexDirection: 'row', marginTop: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modeButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  modeText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  modeTextActive: { color: colors.primary, fontWeight: '900' },
  modeUnderline: { position: 'absolute', height: 2, left: 10, right: 10, bottom: -1, borderRadius: 1, backgroundColor: colors.primary },
  categoryRow: { gap: spacing.sm, paddingVertical: spacing.md },
  categoryChip: { minHeight: 34, paddingHorizontal: 13, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7' },
  categoryChipActive: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#BFD0F5' },
  categoryText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  categoryTextActive: { color: colors.primary },
  list: { gap: spacing.md },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
  cardMain: { padding: spacing.base },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE8FF' },
  avatarText: { color: colors.primaryDark, fontSize: 14, fontWeight: '900' },
  authorBlock: { flex: 1, marginLeft: spacing.sm },
  author: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  urgentBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#FFF0F1' },
  urgentText: { color: '#C43E4E', fontSize: 10, fontWeight: '800' },
  requestTitle: { color: colors.primaryDark, fontSize: 17, lineHeight: 22, fontWeight: '800', marginTop: spacing.md },
  description: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  categoryBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#EEF4FF' },
  categoryBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  actions: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: spacing.lg },
  saveAction: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  prayedText: { color: '#D93F55' },
  errorBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0', marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 11, fontWeight: '800', marginTop: 4 },
  stateBox: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  stateTitle: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },
  stateText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
