import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from 'lucide-react-native';

import InlineErrorMessage from '@/components/common/InlineErrorMessage';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { deleteAccount } from '@/services/auth';
import { setGuestModeEnabled } from '@/services/guest';
import { clearAllPrayerReminders } from '@/services/reminders';
import { getUserFacingError } from '@/services/user-facing-error';
import { useAuthStore } from '@/stores/auth.store';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete =
    password.length > 0 && confirmation === 'DELETE' && !deleting;

  async function performDelete() {
    if (!canDelete) return;

    setError('');
    setDeleting(true);
    try {
      await deleteAccount(password);

      // The server has already deleted the account and invalidated sessions.
      // Local cleanup is best effort; it must not leave the deleted user
      // presented as signed in if device storage fails.
      try {
        await clearAllPrayerReminders();
        await setGuestModeEnabled(false);
      } catch {
        // The account is still deleted; do not retry the destructive request.
      }

      setUser(null);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(
        getUserFacingError(err, {
          fallback: 'We couldn’t delete your account. Please try again.',
          networkMessage: 'Connect to the internet and try again.',
          statusMessages: {
            400: 'Your current password is incorrect. Please try again.',
            429: 'Too many attempts. Wait a few minutes and try again.',
          },
        }),
      );
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete() {
    if (!canDelete) return;

    Alert.alert(
      'Permanently delete your account?',
      'This permanently removes your account, personal prayers, journal entries, and Prayer Wall activity. It cannot be undone.',
      [
        { text: 'Keep Account', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => void performDelete() },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Account"
            disabled={deleting}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.primaryDark} />
          </Pressable>

          <View style={styles.iconContainer}>
            <Trash2 size={28} color={colors.error} />
          </View>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.description}>
            Your account, saved prayers, journal entries, personal prayer
            requests and Prayer Wall posts and comments will be permanently
            deleted. This cannot be undone.
          </Text>
          <Text style={styles.note}>
            Published Scripture remains available to everyone. Separate
            donation transaction records may be retained where legally required.
          </Text>

          <Text style={styles.label}>Current password</Text>
          <TextInput
            value={password}
            onChangeText={(value) => { setPassword(value); setError(''); }}
            placeholder="Enter current password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!deleting}
            autoComplete="current-password"
            style={styles.input}
          />
          <Text style={styles.label}>Type DELETE to confirm</Text>
          <TextInput
            value={confirmation}
            onChangeText={(value) => { setConfirmation(value); setError(''); }}
            placeholder="DELETE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!deleting}
            style={styles.input}
          />

          <InlineErrorMessage message={error} style={styles.error} />

          <Pressable
            accessibilityRole="button"
            disabled={!canDelete}
            onPress={confirmDelete}
            style={[styles.deleteButton, !canDelete && styles.disabled]}
          >
            {deleting
              ? <ActivityIndicator color={colors.white} />
              : <Trash2 size={18} color={colors.white} />}
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting…' : 'Delete Account Permanently'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  backButton: { width: 44, height: 44, marginTop: spacing.sm, justifyContent: 'center' },
  iconContainer: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF1F0',
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: spacing.lg,
  },
  title: { fontSize: 27, color: colors.primaryDark, fontWeight: '800', textAlign: 'center', marginTop: spacing.md },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginTop: spacing.md },
  note: {
    fontSize: 12, lineHeight: 18, color: colors.textSecondary,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  label: { fontSize: 13, color: colors.primaryDark, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    minHeight: 54, borderWidth: 1, borderRadius: radius.md,
    borderColor: colors.border, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, fontSize: 16, color: colors.text,
  },
  error: { marginTop: spacing.md },
  deleteButton: {
    minHeight: 56, borderRadius: radius.md, marginTop: spacing.xxl,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm,
  },
  disabled: { opacity: 0.45 },
  deleteButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  cancelButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  cancelText: { fontSize: 14, color: colors.primaryDark, fontWeight: '700' },
});
