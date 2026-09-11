import { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotification,
} from '@/services/notifications';

function formatNotificationDate(value: string) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [selected, setSelected] = useState<InboxNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items],
  );

  const load = useCallback(async () => {
    setError('');

    try {
      setItems(await listNotifications(50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  async function openNotification(item: InboxNotification) {
    setSelected(item);

    if (item.readAt) return;

    const readAt = new Date().toISOString();
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, readAt } : entry)),
    );
    setSelected({ ...item, readAt });

    try {
      await markNotificationRead(item.id);
    } catch {
      void load();
    }
  }

  async function markAllRead() {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);
    const now = new Date().toISOString();
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })));

    try {
      await markAllNotificationsRead();
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : 'Unable to mark notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  }

  async function openAttachedLink(link: string) {
    const url = link.startsWith('http://') || link.startsWith('https://')
      ? link
      : `https://prayinverses.com${link.startsWith('/') ? link : `/${link}`}`;

    try {
      await Linking.openURL(url);
    } catch {
      setError('Unable to open the attached link.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityLabel="Go back">
          <ArrowLeft size={21} color={colors.primaryDark} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>{unreadCount} unread</Text>
        </View>

        <Pressable
          onPress={() => void markAllRead()}
          disabled={unreadCount === 0 || markingAll}
          style={[styles.headerButton, (unreadCount === 0 || markingAll) && styles.disabled]}
          accessibilityLabel="Mark all notifications as read"
        >
          <CheckCheck size={21} color={colors.primary} />
        </Pressable>
      </View>

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
        {!!error && !loading && (
          <Pressable style={styles.errorBox} onPress={() => void load()}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to try again</Text>
          </Pressable>
        )}

        {loading ? (
          <AppStateView
            variant="loading"
            title="Checking your inbox…"
            body="We’re loading your latest Pray in Verses updates."
          />
        ) : items.length === 0 ? (
          <AppStateView
            variant="empty"
            icon={<Bell size={30} color={colors.primary} />}
            title="You’re all caught up"
            body="Announcements and important Pray in Verses updates will appear here."
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const isRead = !!item.readAt;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => void openNotification(item)}
                  style={({ pressed }) => [
                    styles.card,
                    !isRead && styles.unreadCard,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={[styles.iconBox, isRead && styles.readIconBox]}>
                    {isRead ? (
                      <CheckCircle2 size={20} color={colors.success} />
                    ) : (
                      <Bell size={20} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.cardCopy}>
                    <View style={styles.cardTitleRow}>
                      <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
                      {!isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text numberOfLines={2} style={styles.cardBody}>{item.body}</Text>
                    <Text style={styles.cardDate}>{formatNotificationDate(item.createdAt)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBell}>
                <Bell size={20} color={colors.primary} />
              </View>
              <Pressable onPress={() => setSelected(null)} style={styles.closeButton} accessibilityLabel="Close notification">
                <X size={19} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>{selected?.title || 'Notification'}</Text>
            <Text style={styles.modalDate}>{selected ? formatNotificationDate(selected.createdAt) : ''}</Text>
            <Text style={styles.modalBody}>{selected?.body || ''}</Text>

            {!!selected?.link && (
              <Pressable onPress={() => void openAttachedLink(selected.link!)} style={styles.linkButton}>
                <ExternalLink size={17} color={colors.white} />
                <Text style={styles.linkText}>Open attached link</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  headerCopy: { flex: 1, alignItems: 'center' },
  title: { color: colors.primaryDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  disabled: { opacity: 0.4 },
  scroll: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  errorBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0', marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 4 },
  list: { gap: spacing.sm },
  card: { minHeight: 92, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  unreadCard: { borderColor: '#C9D9FF', backgroundColor: '#F5F8FF' },
  cardPressed: { opacity: 0.78 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE8FF' },
  readIconBox: { backgroundColor: '#ECFDF3' },
  cardCopy: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  cardBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  cardDate: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 7 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(9, 18, 40, 0.46)' },
  modalCard: { borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl, shadowColor: '#091228', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24, shadowRadius: 24, elevation: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalBell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F7' },
  modalTitle: { color: colors.primaryDark, fontSize: 21, fontWeight: '800', marginTop: spacing.lg },
  modalDate: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  modalBody: { color: colors.text, fontSize: 14, lineHeight: 22, marginTop: spacing.lg },
  linkButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary, marginTop: spacing.xl },
  linkText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
