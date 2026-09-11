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
import { ArrowLeft, CalendarDays, Trash2 } from 'lucide-react-native';

import AppButton from '@/components/ui/AppButton';
import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { createJournal, deleteJournal, getJournal, JOURNAL_MOODS, updateJournal } from '@/services/journals';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export default function JournalEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id ?? 'new';
  const isNew = rawId === 'new';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState('Reflective');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError('');
    try {
      const entry = await getJournal(rawId);
      setTitle(entry.title);
      setBody(entry.body);
      setMood(entry.mood || 'Reflective');
      setCreatedAt(entry.createdAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this journal entry.');
    } finally {
      setLoading(false);
    }
  }, [isNew, rawId]);

  useEffect(() => { void load(); }, [load]);

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = { title: title.trim(), body: body.trim(), mood };
      if (isNew) await createJournal(payload);
      else await updateJournal(rawId, payload);
      router.replace('/(app)/journal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your journal entry.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete journal entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove() },
    ]);
  }

  async function remove() {
    if (isNew || saving) return;
    setSaving(true);
    setError('');
    try {
      await deleteJournal(rawId);
      router.replace('/(app)/journal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this journal entry.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.safeArea} edges={['top']}><View style={styles.stateWrap}><AppStateView variant="loading" title="Opening journal entry…" /></View></SafeAreaView>;
  }

  if (error && !isNew && !title && !body) {
    return <SafeAreaView style={styles.safeArea} edges={['top']}><View style={styles.stateWrap}><AppStateView variant="error" title="Could not open this entry" body={error} actionLabel="Try Again" onAction={() => void load()} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}><ArrowLeft size={22} color={colors.primary} /></Pressable>
            <Text style={styles.pageTitle}>{isNew ? 'New Journal Entry' : 'Journal Entry'}</Text>
            {!isNew ? <Pressable onPress={confirmDelete} style={styles.iconButton}><Trash2 size={20} color={colors.error} /></Pressable> : <View style={styles.iconButton} />}
          </View>

          <Text style={styles.label}>Date</Text>
          <View style={styles.readOnlyBox}>
            <CalendarDays size={19} color={colors.primary} />
            <Text style={styles.readOnlyText}>{new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>

          <Text style={styles.label}>Entry title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="What is on your heart today?" placeholderTextColor={colors.textMuted} style={styles.titleInput} />

          <Text style={styles.label}>Mood</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moods}>
            {JOURNAL_MOODS.map((item) => (
              <Pressable key={item} onPress={() => setMood(item)} style={[styles.moodChip, mood === item && styles.moodChipActive]}>
                <Text style={[styles.moodText, mood === item && styles.moodTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Your Journal Entry</Text>
          <TextInput value={body} onChangeText={setBody} placeholder="Write your thoughts, prayers, reflections…" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" maxLength={4000} style={styles.bodyInput} />
          <Text style={styles.counter}>{body.length}/4,000</Text>
          <Text style={styles.tip}>Tip: include a Scripture reference in your title or reflection whenever it helps you remember the moment.</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <AppButton label={isNew ? 'Save Entry' : 'Update Entry'} loading={saving} disabled={!canSave} onPress={save} style={styles.saveButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  stateWrap: { flex: 1, justifyContent: 'center', padding: spacing.base },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 23, fontWeight: '700' },
  label: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  readOnlyBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  readOnlyText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  titleInput: { minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.text, fontSize: 15 },
  moods: { gap: spacing.sm },
  moodChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7' },
  moodChipActive: { backgroundColor: colors.primary },
  moodText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  moodTextActive: { color: colors.white },
  bodyInput: { minHeight: 230, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.md, color: colors.text, fontSize: 15, lineHeight: 23 },
  counter: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 5 },
  tip: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: spacing.md },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20, marginTop: spacing.md },
  saveButton: { marginTop: spacing.xl },
});
