import { useCallback, useEffect, useState } from 'react';
import {
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
  CheckCircle2,
  Clock3,
  Tags,
  Trash2,
} from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import AppButton from '@/components/ui/AppButton';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  createMyPrayer,
  deleteMyPrayer,
  getMyPrayer,
  toggleMyPrayer,
  updateMyPrayer,
  type PrayerStatus,
} from '@/services/my-prayers';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

function normalizeTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
    ),
  );
}

export default function MyPrayerEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id ?? 'new';
  const isNew = rawId === 'new';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<PrayerStatus>('OPEN');
  const [answeredAt, setAnsweredAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (isNew) return;

    setLoading(true);
    setError('');

    try {
      const prayer = await getMyPrayer(rawId);
      setTitle(prayer.title);
      setBody(prayer.body);
      setTags(prayer.tags.join(', '));
      setStatus(prayer.status);
      setAnsweredAt(prayer.answeredAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this prayer.');
    } finally {
      setLoading(false);
    }
  }, [isNew, rawId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  function goToPrayerList() {
    router.replace('/(app)/(tabs)/pray');
  }

  async function handleSave() {
    if (!canSave || saving) return;

    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      body: body.trim(),
      tags: normalizeTags(tags),
    };

    try {
      if (isNew) {
        await createMyPrayer(payload);
      } else {
        await updateMyPrayer(rawId, payload);
      }

      goToPrayerList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this prayer.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (isNew || statusBusy || saving) return;

    setStatusBusy(true);
    setError('');

    try {
      const updated = await toggleMyPrayer(rawId);
      setStatus(updated.status);
      setAnsweredAt(updated.answeredAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this prayer status.');
    } finally {
      setStatusBusy(false);
    }
  }

  function confirmDelete() {
    if (isNew || saving) return;

    Alert.alert(
      'Delete prayer?',
      'This prayer will be permanently removed from your personal prayer list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void handleDelete(),
        },
      ],
    );
  }

  async function handleDelete() {
    if (isNew || saving) return;

    setSaving(true);
    setError('');

    try {
      await deleteMyPrayer(rawId);
      goToPrayerList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this prayer.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.stateWrap}>
          <AppStateView
            variant="loading"
            title="Opening your prayer…"
            body="We’re loading this prayer from your personal list."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !isNew && !title && !body) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.stateWrap}>
          <AppStateView
            variant="error"
            title="Could not open this prayer"
            body={error}
            actionLabel="Try Again"
            onAction={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const answered = status === 'ANSWERED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to my prayers"
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <ArrowLeft size={22} color={colors.primary} />
            </Pressable>

            <Text style={styles.pageTitle}>{isNew ? 'New Prayer' : 'Prayer Details'}</Text>

            {!isNew ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete prayer"
                onPress={confirmDelete}
                style={styles.iconButton}
              >
                <Trash2 size={20} color={colors.error} />
              </Pressable>
            ) : (
              <View style={styles.iconButton} />
            )}
          </View>

          <View style={styles.introCard}>
            <Text style={styles.eyebrow}>{isNew ? 'ADD TO YOUR PRAYER LIST' : 'PERSONAL PRAYER'}</Text>
            <Text style={styles.introTitle}>
              {isNew ? 'What are you bringing before God?' : 'Keep praying. Keep remembering.'}
            </Text>
            <Text style={styles.introBody}>
              {isNew
                ? 'Write it down clearly so you can return to it, pray consistently and mark the testimony when it is answered.'
                : 'Update the prayer as things change, or mark it answered when you have a testimony.'}
            </Text>
          </View>

          {!isNew && (
            <View style={[styles.statusCard, answered ? styles.statusAnswered : styles.statusOpen]}>
              <View style={styles.statusIcon}>
                {answered ? (
                  <CheckCircle2 size={24} color={colors.success} />
                ) : (
                  <Clock3 size={24} color="#2F6ECF" />
                )}
              </View>

              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>{answered ? 'Answered' : 'Still praying'}</Text>
                <Text style={styles.statusBody}>
                  {answered
                    ? answeredAt
                      ? `Marked answered ${new Date(answeredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.`
                      : 'This prayer is marked as answered.'
                    : 'This prayer is still active in your prayer list.'}
                </Text>
              </View>

              <Pressable
                disabled={statusBusy || saving}
                onPress={() => void handleToggleStatus()}
                style={({ pressed }) => [
                  styles.statusButton,
                  answered && styles.statusButtonOutlined,
                  pressed && styles.pressed,
                  (statusBusy || saving) && styles.disabled,
                ]}
              >
                <Text style={[styles.statusButtonText, answered && styles.statusButtonTextOutlined]}>
                  {statusBusy ? 'Updating…' : answered ? 'Pray Again' : 'Mark Answered'}
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.label}>Prayer title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Wisdom for a new season"
            placeholderTextColor={colors.textMuted}
            maxLength={120}
            style={styles.input}
          />
          <Text style={styles.counter}>{title.length}/120</Text>

          <Text style={styles.label}>Prayer</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write what you are praying for…"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={3000}
            style={styles.bodyInput}
          />
          <Text style={styles.counter}>{body.length}/3,000</Text>

          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsInputShell}>
            <Tags size={19} color={colors.primary} />
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="family, work, healing"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.tagsInput}
            />
          </View>
          <Text style={styles.helper}>Separate tags with commas. Tags make your prayer list easier to search.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <AppButton
            label={isNew ? 'Add Prayer' : 'Save Changes'}
            loading={saving}
            disabled={!canSave || statusBusy}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  stateWrap: { flex: 1, justifyContent: 'center', padding: spacing.base },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 23, fontWeight: '700' },
  introCard: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primaryDark, overflow: 'hidden' },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  introTitle: { color: colors.white, fontFamily: SERIF_FONT, fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: spacing.sm },
  introBody: { color: 'rgba(255,255,255,0.76)', fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  statusOpen: { backgroundColor: '#F4F8FF', borderColor: '#D7E5FB' },
  statusAnswered: { backgroundColor: '#F2FBF5', borderColor: '#D3EEDC' },
  statusIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  statusBody: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 },
  statusButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: 19, backgroundColor: colors.primary },
  statusButtonOutlined: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface },
  statusButtonText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  statusButtonTextOutlined: { color: colors.primary },
  label: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.sm },
  input: { minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.text, fontSize: 15 },
  bodyInput: { minHeight: 210, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.md, color: colors.text, fontSize: 15, lineHeight: 23 },
  counter: { color: colors.textMuted, fontSize: 10, textAlign: 'right', marginTop: 5 },
  tagsInputShell: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  tagsInput: { flex: 1, minHeight: 52, color: colors.text, fontSize: 14, paddingVertical: 0 },
  helper: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: spacing.sm },
  errorBox: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  saveButton: { marginTop: spacing.xl },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.55 },
});
