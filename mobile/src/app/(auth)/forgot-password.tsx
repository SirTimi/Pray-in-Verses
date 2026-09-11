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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react-native';

import AppButton from '@/components/ui/AppButton';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { forgotPassword } from '@/services/auth';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const emailValid = EMAIL_REGEX.test(email.trim());

  async function handleSubmit() {
    if (!emailValid || loading) return;

    setError('');
    setLoading(true);

    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('We could not send a reset email right now. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.blueCorner} />
        <View style={styles.goldCorner} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={38} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            If an account exists for {email.trim()}, we&apos;ve sent a secure password reset link.
          </Text>
          <AppButton
            label="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.successButton}
          />
          <Pressable
            onPress={() => {
              setSent(false);
              setError('');
            }}
            style={styles.secondaryLink}
          >
            <Text style={styles.secondaryLinkText}>Use another email</Text>
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
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Enter the email connected to your account and we&apos;ll send you a secure reset link.
            </Text>

            <View style={styles.form}>
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
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSubmit()}
                  style={styles.input}
                />
              </View>
              {email.length > 0 && !emailValid && <Text style={styles.fieldError}>Enter a valid email address.</Text>}

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <AppButton
                label="Send Reset Link"
                loading={loading}
                disabled={!emailValid}
                onPress={() => void handleSubmit()}
                style={styles.primaryButton}
              />
            </View>
          </View>

          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.bottomLink}>
            <Text style={styles.bottomLinkText}>Back to Sign In</Text>
          </Pressable>
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
  content: { flex: 1, justifyContent: 'center', paddingBottom: 30 },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 32, lineHeight: 38, fontWeight: '700', textAlign: 'center' },
  subtitle: { maxWidth: 330, alignSelf: 'center', marginTop: spacing.md, color: colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  form: { marginTop: spacing.xxxl },
  inputShell: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.base },
  inputShellError: { borderColor: colors.error },
  input: { flex: 1, minHeight: 56, color: colors.text, fontSize: 16, paddingVertical: 0 },
  fieldError: { marginTop: 6, marginLeft: 4, color: colors.error, fontSize: 11, lineHeight: 16 },
  errorBox: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 58, marginTop: spacing.xl, borderRadius: radius.lg },
  bottomLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  bottomLinkText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  successIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: spacing.xl },
  successTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700', textAlign: 'center' },
  successBody: { maxWidth: 335, marginTop: spacing.md, color: colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  successButton: { marginTop: spacing.xxl, borderRadius: radius.lg },
  secondaryLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  secondaryLinkText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
