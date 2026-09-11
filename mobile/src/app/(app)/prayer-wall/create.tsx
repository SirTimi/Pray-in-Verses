import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LockKeyhole, Send, ShieldCheck } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  createPrayerRequest,
  PRAYER_WALL_CATEGORIES,
} from '@/services/prayer-wall';

export default function CreatePrayerRequestScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [urgent, setUrgent] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(
    () => title.trim().length >= 3 && description.trim().length >= 10 && !!category,
    [category, description, title],
  );

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');

    try {
      const created = await createPrayerRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        urgent,
        anonymous,
      });

      router.replace({
        pathname: '/(app)/prayer-wall/[id]',
        params: { id: created.id },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to post your prayer request.';
      setError(message);
      Alert.alert('Could not share request', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={colors.primaryDark} />
          </Pressable>

          <Text style={styles.title}>Share a Prayer Request</Text>
          <Text style={styles.subtitle}>Let our community pray with you.</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholder="e.g. Praying for wisdom"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.counter}>{title.length}/120</Text>

            <Text style={styles.label}>Your Request <Text style={styles.required}>*</Text></Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              textAlignVertical="top"
              placeholder="Share what's on your heart. Be as open as you feel comfortable…"
              placeholderTextColor={colors.textMuted}
              style={styles.textArea}
            />
            <Text style={styles.counter}>{description.length}/500</Text>

            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {PRAYER_WALL_CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.optionCard}>
              <View style={styles.optionIcon}><ShieldCheck size={20} color={colors.primary} /></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Urgent request</Text>
                <Text style={styles.optionText}>Mark this request as needing immediate prayer.</Text>
              </View>
              <Switch
                value={urgent}
                onValueChange={setUrgent}
                trackColor={{ false: '#D9DEE7', true: '#AFC4F4' }}
                thumbColor={urgent ? colors.primary : '#F7F8FA'}
              />
            </View>

            <View style={styles.optionCard}>
              <View style={styles.optionIcon}><LockKeyhole size={20} color={colors.primary} /></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Post anonymously</Text>
                <Text style={styles.optionText}>
                  {anonymous ? 'Your name will be hidden from the community.' : 'Your display name will be shown with this request.'}
                </Text>
              </View>
              <Switch
                value={anonymous}
                onValueChange={setAnonymous}
                trackColor={{ false: '#D9DEE7', true: '#AFC4F4' }}
                thumbColor={anonymous ? colors.primary : '#F7F8FA'}
              />
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={!canSubmit || loading}
            onPress={() => void handleSubmit()}
            style={[styles.submitButton, (!canSubmit || loading) && styles.submitDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Send size={20} color={colors.white} />
            )}
            <Text style={styles.submitText}>Post Prayer Request</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { color: colors.primaryDark, fontSize: 29, lineHeight: 36, fontWeight: '800', marginTop: spacing.lg },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },
  formCard: { marginTop: spacing.xl, gap: spacing.sm },
  label: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginTop: spacing.md },
  required: { color: colors.error },
  input: { minHeight: 54, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, fontSize: 14 },
  textArea: { minHeight: 145, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, fontSize: 14, lineHeight: 21 },
  counter: { alignSelf: 'flex-end', color: colors.textMuted, fontSize: 10 },
  categories: { gap: spacing.sm, paddingVertical: spacing.sm },
  categoryChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7' },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  categoryTextActive: { color: colors.white },
  optionCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  optionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  optionCopy: { flex: 1 },
  optionTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  optionText: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 3 },
  errorBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18 },
  footer: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  submitButton: { minHeight: 54, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});
