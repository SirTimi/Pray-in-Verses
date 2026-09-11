import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  Clock3,
  Save,
  Trash2,
} from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  deletePrayerReminder,
  getPrayerReminder,
  savePrayerReminder,
} from '@/services/reminders';

const DAYS = [
  { value: 1, label: 'Sun' },
  { value: 2, label: 'Mon' },
  { value: 3, label: 'Tue' },
  { value: 4, label: 'Wed' },
  { value: 5, label: 'Thu' },
  { value: 6, label: 'Fri' },
  { value: 7, label: 'Sat' },
];

function isValidTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return !!match;
}

export default function ReminderEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : 'new';
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [days, setDays] = useState<number[]>([2, 3, 4, 5, 6]);
  const [prayer, setPrayer] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }

    setError('');

    try {
      const reminder = await getPrayerReminder(id);
      if (!reminder) {
        setError('This reminder could not be found on this device.');
        return;
      }

      setTitle(reminder.title);
      setTime(reminder.time);
      setDays(reminder.days);
      setPrayer(reminder.prayer);
      setIsActive(reminder.isActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this reminder.');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  async function save() {
    if (saving) return;

    const cleanTitle = title.trim();
    const cleanTime = time.trim();

    if (!cleanTitle) {
      setError('Give this reminder a title.');
      return;
    }

    if (!isValidTime(cleanTime)) {
      setError('Enter the time in 24-hour HH:MM format, for example 07:00 or 21:30.');
      return;
    }

    if (days.length === 0) {
      setError('Choose at least one day for this reminder.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await savePrayerReminder({
        id: isNew ? undefined : id,
        title: cleanTitle,
        time: cleanTime,
        days,
        prayer: prayer.trim(),
        isActive,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this reminder.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete reminder?',
      'This reminder will be removed from this device and its scheduled notifications will be cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void remove() },
      ],
    );
  }

  async function remove() {
    if (isNew || deleting) return;

    setDeleting(true);
    setError('');

    try {
      await deletePrayerReminder(id);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this reminder.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityLabel="Go back">
          <ArrowLeft size={21} color={colors.primaryDark} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.pageTitle}>{isNew ? 'New Reminder' : 'Edit Reminder'}</Text>
          <Text style={styles.pageSubtitle}>A gentle invitation back to prayer</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <AppStateView
            variant="loading"
            title="Opening reminder…"
            body="We’re loading the reminder saved on this device."
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
              <View style={styles.introIcon}>
                <BellRing size={23} color={colors.primary} />
              </View>
              <View style={styles.introCopy}>
                <Text style={styles.introTitle}>Make prayer part of your rhythm</Text>
                <Text style={styles.introBody}>
                  Choose a time and the days you want this phone to remind you.
                </Text>
              </View>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Reminder title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Morning prayer"
                placeholderTextColor={colors.textMuted}
                maxLength={80}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Time</Text>
                <View style={styles.labelHintRow}>
                  <Clock3 size={13} color={colors.textMuted} />
                  <Text style={styles.hint}>24-hour format</Text>
                </View>
              </View>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="07:00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={[styles.input, styles.timeInput]}
              />
              <Text style={styles.helpText}>Examples: 06:30, 12:00, 21:15</Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Repeat on</Text>
                <View style={styles.labelHintRow}>
                  <CalendarDays size={13} color={colors.textMuted} />
                  <Text style={styles.hint}>{days.length} selected</Text>
                </View>
              </View>

              <View style={styles.daysGrid}>
                {DAYS.map((day) => {
                  const selected = days.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      onPress={() => toggleDay(day.value)}
                      style={[styles.dayButton, selected && styles.dayButtonSelected]}
                    >
                      <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prayer note <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                value={prayer}
                onChangeText={setPrayer}
                placeholder="A short prayer, focus, or Scripture to remember…"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={300}
                style={[styles.input, styles.textArea]}
              />
              <Text style={styles.characterCount}>{prayer.length}/300</Text>
            </View>

            <View style={styles.activeCard}>
              <View style={styles.activeCopy}>
                <Text style={styles.activeTitle}>Reminder active</Text>
                <Text style={styles.activeBody}>
                  When enabled, this reminder will be scheduled with your phone’s notification system.
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#D0D5DD', true: '#AFC5FF' }}
                thumbColor={isActive ? colors.primary : '#F2F4F7'}
              />
            </View>

            <Pressable
              onPress={() => void save()}
              disabled={saving || deleting}
              style={[styles.saveButton, (saving || deleting) && styles.disabled]}
            >
              <Save size={18} color={colors.white} />
              <Text style={styles.saveText}>{saving ? 'Saving…' : isNew ? 'Create Reminder' : 'Save Changes'}</Text>
            </Pressable>

            {!isNew && (
              <Pressable
                onPress={confirmDelete}
                disabled={saving || deleting}
                style={[styles.deleteButton, (saving || deleting) && styles.disabled]}
              >
                <Trash2 size={18} color={colors.error} />
                <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete Reminder'}</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 42, height: 42 },
  pageTitle: { color: colors.primaryDark, fontSize: 20, fontWeight: '800' },
  pageSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  stateWrap: { flex: 1, justifyContent: 'center', padding: spacing.base },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  introCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.base, borderWidth: 1, borderColor: '#C9D9FF', borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  introIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  introCopy: { flex: 1 },
  introTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  introBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  errorBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  fieldGroup: { marginTop: spacing.xl },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginBottom: spacing.sm },
  optional: { color: colors.textMuted, fontWeight: '500' },
  labelHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 10 },
  input: { minHeight: 54, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, fontSize: 14 },
  timeInput: { fontSize: 19, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1 },
  helpText: { color: colors.textMuted, fontSize: 10, marginTop: 6 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayButton: { minWidth: 66, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 21, backgroundColor: colors.surface },
  dayButtonSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  dayText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  dayTextSelected: { color: colors.white },
  textArea: { minHeight: 130, paddingTop: spacing.md, paddingBottom: spacing.md },
  characterCount: { color: colors.textMuted, fontSize: 10, textAlign: 'right', marginTop: 5 },
  activeCard: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, padding: spacing.base, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  activeCopy: { flex: 1 },
  activeTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  activeBody: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 3 },
  saveButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, borderRadius: radius.md, backgroundColor: colors.primary },
  saveText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  deleteButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, borderWidth: 1, borderColor: '#F3C7C2', borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  deleteText: { color: colors.error, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
