import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react-native';

import AppButton from '@/components/ui/AppButton';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { ApiError } from '@/services/api';
import { signup } from '@/services/auth';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  const nameValid = displayName.trim().length >= 2;
  const emailValid = EMAIL_REGEX.test(email.trim());

  const checks = useMemo(
    () => ({
      length: password.length >= 8,
      case: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&#]/.test(password),
    }),
    [password],
  );

  const passwordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = nameValid && emailValid && passwordValid && passwordsMatch && acceptedPrivacy;

  async function handleSignup() {
    if (!canSubmit || loading) return;

    setError('');
    setLoading(true);

    try {
      await signup(displayName.trim(), email.trim().toLowerCase(), password);
      setCreated(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 429
            ? 'Too many account creation attempts. Please wait a few minutes and try again.'
            : err.message || 'We could not create your account.',
        );
      } else {
        setError('Unable to connect. Check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function openPrivacyPolicy() {
    try {
      await Linking.openURL('https://prayinverses.com/privacy-policy');
    } catch {
      setError('Unable to open the Privacy Policy right now.');
    }
  }

  if (created) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.blueCorner} />
        <View style={styles.goldCorner} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={38} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.successTitle}>Your account is ready</Text>
          <Text style={styles.successBody}>
            Welcome to Pray in Verses. Sign in to begin praying through Scripture, one verse at a time.
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.blueCorner} />
      <View style={styles.goldCorner} />

      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.brandBlock}>
            <Image source={require('../../../assets/images/icon.png')} resizeMode="contain" style={styles.logo} />
            <Text style={styles.brandName}>Pray in Verses</Text>
            <Text style={styles.brandTagline}>Pray the Bible Verse by Verse</Text>
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Begin a prayer life rooted in God&apos;s Word.</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputShell, displayName.length > 0 && !nameValid && styles.inputShellError]}>
              <UserRound size={19} color={colors.textSecondary} />
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Full name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                editable={!loading}
                style={styles.input}
              />
            </View>
            {displayName.length > 0 && !nameValid && <Text style={styles.fieldError}>Enter at least 2 characters.</Text>}

            <View style={[styles.inputShell, email.length > 0 && !emailValid && styles.inputShellError]}>
              <Mail size={19} color={colors.textSecondary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
                style={styles.input}
              />
            </View>
            {email.length > 0 && !emailValid && <Text style={styles.fieldError}>Enter a valid email address.</Text>}

            <View style={[styles.inputShell, password.length > 0 && !passwordValid && styles.inputShellError]}>
              <LockKeyhole size={19} color={colors.textSecondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
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

            <View style={styles.requirements}>
              <Requirement done={checks.length} label="8+ characters" />
              <Requirement done={checks.case} label="Upper & lower case" />
              <Requirement done={checks.number} label="A number" />
              <Requirement done={checks.special} label="A special character" />
            </View>

            <View style={[styles.inputShell, confirmPassword.length > 0 && !passwordsMatch && styles.inputShellError]}>
              <LockKeyhole size={19} color={colors.textSecondary} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={() => void handleSignup()}
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                onPress={() => setShowConfirmPassword((current) => !current)}
                style={styles.showButton}
              >
                <Text style={styles.showText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && <Text style={styles.fieldError}>Passwords do not match.</Text>}

            <View style={styles.privacyRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedPrivacy }}
                onPress={() => setAcceptedPrivacy((current) => !current)}
                style={[styles.checkbox, acceptedPrivacy && styles.checkboxActive]}
              >
                {acceptedPrivacy && <Check size={14} color={colors.white} strokeWidth={3} />}
              </Pressable>
              <Text style={styles.privacyCopy}>I agree to the </Text>
              <Pressable onPress={() => void openPrivacyPolicy()}>
                <Text style={styles.privacyLink}>Privacy Policy</Text>
              </Pressable>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <AppButton
              label="Create Account"
              loading={loading}
              disabled={!canSubmit}
              onPress={() => void handleSignup()}
              style={styles.primaryButton}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>SCRIPTURE • PRAYER • COMMUNITY</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account?</Text>
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.signInButton}>
              <Text style={styles.signInLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type RequirementProps = { done: boolean; label: string };

function Requirement({ done, label }: RequirementProps) {
  return (
    <View style={styles.requirementItem}>
      <View style={[styles.requirementDot, done && styles.requirementDotDone]}>
        {done && <Check size={10} color={colors.white} strokeWidth={3} />}
      </View>
      <Text style={[styles.requirementText, done && styles.requirementTextDone]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  blueCorner: { position: 'absolute', top: -95, right: -110, width: 250, height: 250, borderRadius: 125, backgroundColor: colors.primarySoft },
  goldCorner: { position: 'absolute', bottom: -125, left: -115, width: 255, height: 255, borderRadius: 128, backgroundColor: colors.goldSoft },
  topRow: { minHeight: 46, justifyContent: 'center' },
  backButton: { width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  brandBlock: { alignItems: 'center', marginTop: spacing.xs },
  logo: { width: 72, height: 72 },
  brandName: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 22, fontWeight: '700' },
  brandTagline: { marginTop: 1, color: colors.textMuted, fontSize: 8, letterSpacing: 0.3 },
  headingBlock: { alignItems: 'center', marginTop: spacing.xl },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 30, lineHeight: 36, fontWeight: '700', textAlign: 'center' },
  subtitle: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  form: { marginTop: spacing.xxl },
  inputShell: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.base },
  inputShellError: { borderColor: colors.error },
  input: { flex: 1, minHeight: 54, color: colors.text, fontSize: 15, paddingVertical: 0 },
  showButton: { minWidth: 52, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  showText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  fieldError: { marginTop: 5, marginLeft: 4, color: colors.error, fontSize: 11, lineHeight: 16 },
  requirements: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm, paddingHorizontal: 2 },
  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: '45%' },
  requirementDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  requirementDotDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  requirementText: { color: colors.textMuted, fontSize: 10.5 },
  requirementTextDone: { color: colors.primary, fontWeight: '700' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.lg },
  checkbox: { width: 22, height: 22, marginRight: spacing.sm, borderWidth: 1.5, borderColor: colors.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  checkboxActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  privacyCopy: { color: colors.textSecondary, fontSize: 13 },
  privacyLink: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  errorBox: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 58, marginTop: spacing.xl, borderRadius: radius.lg },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 10, color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  signInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  signInPrompt: { color: colors.textSecondary, fontSize: 14 },
  signInButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 6 },
  signInLink: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  successIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: spacing.xl },
  successTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 30, lineHeight: 36, fontWeight: '700', textAlign: 'center' },
  successBody: { maxWidth: 330, marginTop: spacing.md, color: colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  successButton: { marginTop: spacing.xxl, borderRadius: radius.lg },
});
