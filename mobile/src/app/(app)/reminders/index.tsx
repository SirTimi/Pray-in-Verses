import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlarmClock,
  ArrowLeft,
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock3,
  Plus,
  Send,
  Trash2,
} from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  deletePrayerReminder,
  getReminderPermissionStatus,
  listPrayerReminders,
  requestReminderPermission,
  sendTestPrayerReminder,
  setPrayerReminderActive,
  type PrayerReminder,
} from '@/services/reminders';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(value: string) {
  const [hourText, minute = '00'] = value.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

function formatDays(days: number[]) {
  if (days.length === 7) return 'Daily';
  if (days.length === 5 && days.every((day) => day >= 2 && day <= 6)) return 'Weekdays';
  if (days.length === 2 && days.includes(1) && days.includes(7)) return 'Weekends';

  return days
    .map((day) => DAY_NAMES[day - 1]?.slice(0, 3))
    .filter(Boolean)
    .join(', ');
}

function nextReminderLabel(reminders: PrayerReminder[]) {
  const active = reminders.filter((reminder) => reminder.isActive);
  if (active.length === 0) return 'No active reminders';

  const now = new Date();
  const candidates: { date: Date; reminder: PrayerReminder }[] = [];

  for (const reminder of active) {
    const [hourText, minuteText] = reminder.time.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    for (const weekday of reminder.days) {
      const date = new Date(now);
      const currentWeekday = now.getDay() + 1;
      let addDays = (weekday - currentWeekday + 7) % 7;
      date.setDate(now.getDate() + addDays);
      date.setHours(hour, minute, 0, 0);

      if (addDays === 0 && date.getTime() <= now.getTime()) {
        addDays = 7;
        date.setDate(now.getDate() + addDays);
      }

      candidates.push({ date, reminder });
    }
  }

  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = candidates[0];
  if (!next) return 'No active reminders';

  const day = next.date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${day} · ${formatTime(next.reminder.time)} · ${next.reminder.title}`;
}

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [testing, setTesting] = useState(false);

  const activeCount = useMemo(
    () => reminders.filter((reminder) => reminder.isActive).length,
    [reminders],
  );
  const upcoming = useMemo(() => nextReminderLabel(reminders), [reminders]);

  const load = useCallback(async () => {
    setError('');

    try {
      const [items, permission] = await Promise.all([
        listPrayerReminders(),
        getReminderPermissionStatus(),
      ]);
      setReminders(items);
      setPermissionGranted(permission.granted);
      setCanAskAgain(permission.canAskAgain);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  function openEditor(id: string) {
    router.push({
      pathname: '/(app)/reminders/[id]',
      params: { id },
    });
  }

  async function enableNotifications() {
    setError('');

    try {
      const granted = await requestReminderPermission();
      setPermissionGranted(granted);

      if (!granted) {
        const status = await getReminderPermissionStatus();
        setCanAskAgain(status.canAskAgain);
        setError(
          status.canAskAgain
            ? 'Notifications were not enabled. You can try again when you are ready.'
            : 'Notifications are disabled in your phone settings.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request notification permission.');
    }
  }

  async function toggleReminder(reminder: PrayerReminder, nextValue: boolean) {
    if (busyId) return;

    setBusyId(reminder.id);
    setError('');

    try {
      const updated = await setPrayerReminderActive(reminder.id, nextValue);
      setReminders((current) =>
        current.map((item) => (item.id === reminder.id ? updated : item)),
      );
      setPermissionGranted((await getReminderPermissionStatus()).granted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this reminder.');
    } finally {
      setBusyId('');
    }
  }

  function confirmDelete(reminder: PrayerReminder) {
    Alert.alert(
      'Delete reminder?',
      `“${reminder.title}” will stop appearing on this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void removeReminder(reminder.id),
        },
      ],
    );
  }

  async function removeReminder(id: string) {
    if (busyId) return;

    setBusyId(id);
    setError('');

    try {
      await deletePrayerReminder(id);
      setReminders((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this reminder.');
    } finally {
      setBusyId('');
    }
  }

  async function sendTest() {
    if (testing) return;
    setTesting(true);
    setError('');

    try {
      await sendTestPrayerReminder();
      setPermissionGranted(true);
      Alert.alert('Test scheduled', 'A test prayer reminder should appear in about 3 seconds.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send a test reminder.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityLabel="Go back">
          <ArrowLeft size={21} color={colors.primaryDark} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Prayer Reminders</Text>
          <Text style={styles.subtitle}>Build a rhythm of prayer</Text>
        </View>
        <Pressable onPress={() => openEditor('new')} style={styles.addButton} accessibilityLabel="Add reminder">
          <Plus size={22} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <AlarmClock size={24} color={colors.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryEyebrow}>{activeCount} ACTIVE</Text>
            <Text numberOfLines={2} style={styles.summaryTitle}>{upcoming}</Text>
          </View>
        </View>

        {!permissionGranted && (
          <View style={styles.permissionCard}>
            <View style={styles.permissionTop}>
              <View style={styles.permissionIcon}>
                <BellRing size={22} color="#B7791F" />
              </View>
              <View style={styles.permissionCopy}>
                <Text style={styles.permissionTitle}>Enable notifications</Text>
                <Text style={styles.permissionBody}>
                  Prayer reminders need notification permission to appear when the app is closed.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (canAskAgain) void enableNotifications();
                else void Linking.openSettings();
              }}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>{canAskAgain ? 'Enable Notifications' : 'Open Phone Settings'}</Text>
            </Pressable>
          </View>
        )}

        <Pressable onPress={() => void sendTest()} disabled={testing} style={[styles.testButton, testing && styles.disabled]}>
          <Send size={17} color={colors.primary} />
          <Text style={styles.testText}>{testing ? 'Scheduling test…' : 'Send a test reminder'}</Text>
        </Pressable>

        {!!error && (
          <Pressable style={styles.errorBox} onPress={() => void load()}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to refresh</Text>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR REMINDERS</Text>
          <Text style={styles.sectionCount}>{reminders.length}</Text>
        </View>

        {loading ? (
          <AppStateView
            variant="loading"
            title="Loading reminders…"
            body="We’re checking the prayer reminders saved on this device."
          />
        ) : reminders.length === 0 ? (
          <AppStateView
            variant="empty"
            icon={<AlarmClock size={30} color={colors.primary} />}
            title="Create your first reminder"
            body="Choose the days and time you want Pray in Verses to gently call you back to prayer."
            actionLabel="Add Reminder"
            onAction={() => openEditor('new')}
          />
        ) : (
          <View style={styles.list}>
            {reminders.map((reminder) => {
              const busy = busyId === reminder.id;

              return (
                <View key={reminder.id} style={styles.card}>
                  <Pressable onPress={() => openEditor(reminder.id)} style={styles.cardMain}>
                    <View style={styles.cardIcon}>
                      <Clock3 size={21} color={colors.primary} />
                    </View>

                    <View style={styles.cardCopy}>
                      <Text numberOfLines={1} style={styles.cardTitle}>{reminder.title}</Text>
                      <Text style={styles.cardTime}>{formatTime(reminder.time)}</Text>
                      <View style={styles.daysRow}>
                        <CalendarDays size={13} color={colors.textMuted} />
                        <Text numberOfLines={1} style={styles.daysText}>{formatDays(reminder.days)}</Text>
                      </View>
                    </View>

                    <ChevronRight size={18} color={colors.textMuted} />
                  </Pressable>

                  <View style={styles.cardFooter}>
                    <View style={styles.activeRow}>
                      <Text style={styles.activeLabel}>{reminder.isActive ? 'Active' : 'Paused'}</Text>
                      <Switch
                        value={reminder.isActive}
                        disabled={!!busyId}
                        onValueChange={(value) => void toggleReminder(reminder, value)}
                        trackColor={{ false: '#D0D5DD', true: '#AFC5FF' }}
                        thumbColor={reminder.isActive ? colors.primary : '#F2F4F7'}
                      />
                    </View>

                    <Pressable
                      onPress={() => confirmDelete(reminder)}
                      disabled={!!busyId}
                      style={[styles.deleteButton, busy && styles.disabled]}
                      accessibilityLabel={`Delete ${reminder.title}`}
                    >
                      <Trash2 size={17} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.footnote}>
          Reminder times are scheduled by your phone’s notification system. Battery and system settings can affect exact delivery timing.
        </Text>
      </ScrollView>
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
  addButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  scroll: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: colors.primaryDark },
  summaryIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  summaryCopy: { flex: 1 },
  summaryEyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  summaryTitle: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 5 },
  permissionCard: { marginTop: spacing.md, padding: spacing.base, borderWidth: 1, borderColor: '#F3D7A1', borderRadius: radius.lg, backgroundColor: '#FFF9EA' },
  permissionTop: { flexDirection: 'row', gap: spacing.md },
  permissionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0CC' },
  permissionCopy: { flex: 1 },
  permissionTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  permissionBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  permissionButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary },
  permissionButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  testButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, borderWidth: 1, borderColor: '#C9D9FF', borderRadius: radius.md, backgroundColor: colors.primarySoft },
  testText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  errorBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  sectionCount: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  list: { gap: spacing.md },
  card: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  cardMain: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  cardTime: { color: colors.primary, fontSize: 18, fontWeight: '800', marginTop: 3 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  daysText: { flex: 1, color: colors.textMuted, fontSize: 11 },
  cardFooter: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#FBFCFE' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  deleteButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#FFF1F0' },
  disabled: { opacity: 0.45 },
  footnote: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
});
