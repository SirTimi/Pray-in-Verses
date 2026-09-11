import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole } from 'lucide-react-native';

import AppButton from '@/components/ui/AppButton';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { ApiError } from '@/services/api';
import { resetPassword } from '@/services/auth';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] ?? '' : rawToken ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValid = newPassword.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = !!token && passwordValid && passwordsMatch;

  async function handleReset() {
    if (!canSubmit || loading) return;

    setError('');
    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 429
            ? 'Too many reset attempts. Please wait a few minutes and try again.'
            : err.message || 'This reset link may be invalid or expired.',
        );
      } else {
        setError('Unable to reset your password. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.blueCorner} />
        <View style={styles.goldCorner} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={38} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.successTitle}>Password changed</Text>
          <Text style={styles.successBody}>
            Your password has been reset successfully. You can now sign in with your new password.
          </Text>
          <AppButton
            label="Continue to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.blueCorner} />
        <View style={styles.goldCorner} />
        <View style={styles.missingContainer}>
          <View style={styles.keyIcon}>
            <KeyRound size={34} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.successTitle}>Reset link incomplete</Text>
          <Text style={styles.successBody}>
            Open the secure reset link from your email, or request a new one to continue.
          </Text>
          <AppButton
            label="Request a New Link"
            onPress={() => router.replace('/(auth)/forgot-password')}
            style={styles.successButton}
          />
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.blueCorner} />
      <View style={styles.goldCorner} />

      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.page}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={colors.primary} />
          </Pressable>

          <View style={styles.brandBlock}>
            <Image source={require('../../../assets/images/icon.png')} resizeMode="contain" style={styles.logo} />
            <Text style={styles.brandName}>Pray in Verses</Text>
            <Text style={styles.brandTagline}>Pray the Bible Verse by Verse</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Create a New Password</Text>
            <Text style={styles.subtitle}>Choose a new password for your Pray in Verses account.</Text>

            <View style={styles.form}>
              <View style={[styles.inputShell, newPassword.length > 0 && !passwordValid && styles.inputShellError]}>
                <LockKeyhole size={19} color={colors.textSecondary} />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!loading}
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.showButton}
                >
                  <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              {newPassword.length > 0 && !passwordValid && <Text style={styles.fieldError}>Use at least 8 characters.</Text>}

              <View style={[styles.inputShell, confirmPassword.length > 0 && !passwordsMatch && styles.inputShellError]}>
                <LockKeyhole size={19} color={colors.textSecondary} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleReset()}
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                  onPress={() => setShowConfirm((current) => !current)}
                  style={styles.showButton}
                >
                  <Text style={styles.showText}>{showConfirm ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              {confirmPassword.length > 0 && !passwordsMatch && <Text style={styles.fieldError}>Passwords do not match.</Text>}

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <AppButton
                label="Reset Password"
                loading={loading}
                disabled={!canSubmit}
                onPress={() => void handleReset()}
                style={styles.primaryButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  keyboard: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  blueCorner: { position: 'absolute', top: -95, right: -110, width: 250, height: 250, borderRadius: 125, backgroundColor: colors.primarySoft },
  goldCorner: { position: 'absolute', bottom: -125, left: -115, width: 255, height: 255, borderRadius: 128, backgroundColor: colors.goldSoft },
  backButton: { width: 44, height: 44, marginLeft: -10, marginTop: spacing.sm, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  brandBlock: { alignItems: 'center', marginTop: spacing.xl },
  logo: { width: 82, height: 82 },
  brandName: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 23, fontWeight: '700' },
  brandTagline: { marginTop: 1, color: colors.textMuted, fontSize: 8.5, letterSpacing: 0.3 },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 28 },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700', textAlign: 'center' },
  subtitle: { maxWidth: 320, alignSelf: 'center', marginTop: spacing.md, color: colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  form: { marginTop: spacing.xxxl },
  inputShell: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.base },
  inputShellError: { borderColor: colors.error },
  input: { flex: 1, minHeight: 56, color: colors.text, fontSize: 16, paddingVertical: 0 },
  showButton: { minWidth: 52, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  showText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  fieldError: { marginTop: 6, marginLeft: 4, color: colors.error, fontSize: 11, lineHeight: 16 },
  errorBox: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 58, marginTop: spacing.xl, borderRadius: radius.lg },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  missingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  successIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: spacing.xl },
  keyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft, marginBottom: spacing.xl },
  successTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700', textAlign: 'center' },
  successBody: { maxWidth: 335, marginTop: spacing.md, color: colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  successButton: { marginTop: spacing.xxl, borderRadius: radius.lg },
  secondaryLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  secondaryLinkText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
