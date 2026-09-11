import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  Heart,
  MessageCircle,
  Send,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  addPrayerRequestComment,
  getPrayerRequest,
  lookupDisplayNames,
  togglePrayerRequestBookmark,
  togglePrayerRequestLike,
  type PrayerWallComment,
  type PrayerWallRequestDetail,
} from '@/services/prayer-wall';

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

export default function PrayerRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';

  const [request, setRequest] = useState<PrayerWallRequestDetail | null>(null);
  const [creatorName, setCreatorName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Prayer request not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getPrayerRequest(id);
      setRequest(data);

      if (data.anonymous) {
        setCreatorName('Anonymous');
      } else if (data.createdById) {
        const names = await lookupDisplayNames([data.createdById]);
        setCreatorName(names[data.createdById] ?? 'User');
      } else {
        setCreatorName('User');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLike() {
    if (!request || actionBusy) return;
    setActionBusy(true);

    try {
      const result = await togglePrayerRequestLike(request.id);
      setLiked(result.liked);
      setRequest((current) => {
        if (!current) return current;
        const count = current._count?.likes ?? 0;
        return {
          ...current,
          _count: {
            likes: Math.max(0, count + (result.liked ? 1 : -1)),
            comments: current._count?.comments ?? 0,
            bookmarks: current._count?.bookmarks ?? 0,
          },
        };
      });
    } catch (err) {
      Alert.alert('Could not update prayer', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleBookmark() {
    if (!request || actionBusy) return;
    setActionBusy(true);

    try {
      const result = await togglePrayerRequestBookmark(request.id);
      setBookmarked(result.bookmarked);
    } catch (err) {
      Alert.alert('Could not update bookmark', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleComment() {
    const body = comment.trim();
    if (!request || body.length === 0 || commentBusy) return;
    setCommentBusy(true);

    try {
      const created = await addPrayerRequestComment(request.id, body);
      setRequest((current) => {
        if (!current) return current;
        const comments: PrayerWallComment[] = [created, ...(current.comments ?? [])];
        return {
          ...current,
          comments,
          _count: {
            likes: current._count?.likes ?? 0,
            comments: comments.length,
            bookmarks: current._count?.bookmarks ?? 0,
          },
        };
      });
      setComment('');
    } catch (err) {
      Alert.alert('Comment failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCommentBusy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Loading prayer request…</Text>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Text style={styles.stateTitle}>Unable to open request</Text>
        <Text style={styles.stateText}>{error || 'Prayer request not found.'}</Text>
        <Pressable onPress={() => void load()} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const comments = request.comments ?? [];
  const initial = request.anonymous ? '🙏' : creatorName.slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={22} color={colors.primaryDark} />
          </Pressable>
          <Pressable onPress={() => void handleBookmark()} style={styles.iconButton}>
            <Bookmark size={20} color={colors.primary} fill={bookmarked ? colors.primary : 'transparent'} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            <View style={styles.authorCopy}>
              <Text style={styles.author}>{creatorName}</Text>
              <Text style={styles.time}>{relativeTime(request.createdAt)}</Text>
            </View>
          </View>

          <Text style={styles.title}>{request.title}</Text>
          <Text style={styles.description}>{request.description}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{request.category}</Text></View>
            {request.urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>Urgent</Text></View>}
          </View>

          <View style={styles.prayerCountCard}>
            <View style={styles.prayerIcon}><Text style={styles.prayerEmoji}>🙏</Text></View>
            <View style={styles.prayerCountCopy}>
              <Text style={styles.prayerCount}>{request._count?.likes ?? 0} people have prayed for this</Text>
              <Text style={styles.prayerSubtext}>Stand with this request in prayer.</Text>
            </View>
          </View>

          <Pressable
            disabled={actionBusy}
            onPress={() => void handleLike()}
            style={[styles.prayButton, liked && styles.prayButtonActive]}
          >
            {actionBusy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Heart size={20} color={colors.white} fill={liked ? colors.white : 'transparent'} />
            )}
            <Text style={styles.prayButtonText}>{liked ? 'You prayed' : 'Pray for this'}</Text>
          </Pressable>

          <View style={styles.commentsHeader}>
            <View style={styles.commentsTitleRow}>
              <MessageCircle size={18} color={colors.primary} />
              <Text style={styles.commentsTitle}>Encouragement ({request._count?.comments ?? comments.length})</Text>
            </View>
            <Text style={styles.commentsSort}>Newest</Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyTitle}>Be the first to encourage them</Text>
              <Text style={styles.emptyText}>A short prayer or word of encouragement can mean a lot.</Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((item) => (
                <View key={item.id} style={styles.commentCard}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{(item.user?.displayName || 'U').slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{item.user?.displayName || 'User'}</Text>
                      <Text style={styles.commentTime}>{relativeTime(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.commentComposer}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add an encouraging comment…"
            placeholderTextColor={colors.textMuted}
            style={styles.commentInput}
            returnKeyType="send"
            onSubmitEditing={() => void handleComment()}
          />
          <Pressable
            disabled={comment.trim().length === 0 || commentBusy}
            onPress={() => void handleComment()}
            style={[styles.sendButton, (comment.trim().length === 0 || commentBusy) && styles.sendButtonDisabled]}
          >
            {commentBusy ? <ActivityIndicator size="small" color={colors.white} /> : <Send size={18} color={colors.white} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE8FF' },
  avatarText: { color: colors.primaryDark, fontSize: 16, fontWeight: '900' },
  authorCopy: { marginLeft: spacing.sm },
  author: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  title: { color: colors.primaryDark, fontSize: 24, lineHeight: 31, fontWeight: '800', marginTop: spacing.lg },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginTop: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11, backgroundColor: '#EEF4FF' },
  categoryText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  urgentBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11, backgroundColor: '#FFF0F1' },
  urgentText: { color: '#C43E4E', fontSize: 10, fontWeight: '800' },
  prayerCountCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, padding: spacing.base, borderRadius: radius.lg, backgroundColor: colors.goldSoft },
  prayerIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF2B8' },
  prayerEmoji: { fontSize: 25 },
  prayerCountCopy: { flex: 1 },
  prayerCount: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  prayerSubtext: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  prayButton: { minHeight: 54, marginTop: spacing.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary },
  prayButtonActive: { backgroundColor: '#173E91' },
  prayButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.md },
  commentsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  commentsTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  commentsSort: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  commentsList: { gap: spacing.sm },
  commentCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EFFB' },
  commentAvatarText: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentAuthor: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  commentTime: { color: colors.textMuted, fontSize: 10 },
  commentText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  emptyComments: { alignItems: 'center', padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  emptyTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  commentInput: { flex: 1, minHeight: 46, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 23, backgroundColor: colors.background, color: colors.text, fontSize: 13 },
  sendButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sendButtonDisabled: { opacity: 0.4 },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  stateTitle: { color: colors.primaryDark, fontSize: 22, fontWeight: '800' },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryAction: { minWidth: 150, minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primaryActionText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  backLink: { padding: spacing.sm },
  backLinkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
