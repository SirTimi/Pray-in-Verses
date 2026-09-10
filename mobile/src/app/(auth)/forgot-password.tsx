import { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useRouter,
} from 'expo-router';

import {
  Mail,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react-native';

import AppButton from '@/components/ui/AppButton';

import { colors } from '@/constants/colors';
import {
  radius,
  spacing,
} from '@/constants/spacing';

import {
  forgotPassword,
} from '@/services/auth';

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const emailValid =
    EMAIL_REGEX.test(
      email.trim(),
    );

  async function handleSubmit() {
    if (!emailValid || loading) {
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(
        email
          .trim()
          .toLowerCase(),
      );
    } catch {
      // Intentionally do not reveal
      // whether an account exists.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.successContainer
          }
        >
          <View
            style={styles.successIcon}
          >
            <CheckCircle2
              size={36}
              color={colors.primary}
              strokeWidth={1.8}
            />
          </View>

          <Text
            style={styles.successTitle}
          >
            Check your email
          </Text>

          <Text
            style={styles.successBody}
          >
            If an account exists for
            {` ${email.trim()}, `}
            we’ve sent a secure link
            to reset your password.
          </Text>

          <AppButton
            label="Back to sign in"
            onPress={() =>
              router.replace(
                '/(auth)/login',
              )
            }
            style={{
              marginTop: spacing.xxl,
            }}
          />

          <Pressable
            onPress={() =>
              setSent(false)
            }
            style={styles.resend}
          >
            <Text
              style={styles.resendText}
            >
              Try another email
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View
          style={styles.container}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <ArrowLeft
              size={22}
              color={colors.primary}
            />
          </Pressable>

          <View
            style={styles.content}
          >
            <View
              style={styles.iconBox}
            >
              <Mail
                size={28}
                color={colors.primary}
                strokeWidth={1.8}
              />
            </View>

            <Text
              style={styles.eyebrow}
            >
              ACCOUNT RECOVERY
            </Text>

            <Text
              style={styles.title}
            >
              Forgot your password?
            </Text>

            <Text
              style={styles.description}
            >
              Enter the email linked to
              your account and we’ll send
              you a secure reset link.
            </Text>

            <View
              style={styles.form}
            >
              <Text
                style={styles.label}
              >
                Email address
              </Text>

              <TextInput
                value={email}
                onChangeText={
                  setEmail
                }
                placeholder="you@example.com"
                placeholderTextColor={
                  colors.textMuted
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={
                  handleSubmit
                }
                style={[
                  styles.input,

                  email.length > 0 &&
                    !emailValid &&
                    styles.inputError,
                ]}
              />

              {email.length > 0 &&
                !emailValid && (
                  <Text
                    style={
                      styles.fieldError
                    }
                  >
                    Enter a valid email
                    address.
                  </Text>
                )}

              <AppButton
                label="Send reset link"
                loading={loading}
                disabled={
                  !emailValid
                }
                onPress={
                  handleSubmit
                }
                style={
                  styles.submitButton
                }
              />
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.replace(
                '/(auth)/login',
              )
            }
            style={styles.loginLink}
          >
            <Text
              style={
                styles.loginLinkText
              }
            >
              Back to sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal:
      spacing.xl,
    paddingBottom:
      spacing.xl,
  },

  backButton: {
    width: 44,
    height: 44,

    marginTop: spacing.sm,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius:
      radius.round,

    alignSelf: 'flex-start',

    marginLeft: -10,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },

  iconBox: {
    width: 60,
    height: 60,

    borderRadius:
      radius.lg,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.primarySoft,

    marginBottom:
      spacing.xl,
  },

  eyebrow: {
    color: colors.primary,

    fontSize: 11,
    fontWeight: '800',

    letterSpacing: 1.4,

    marginBottom:
      spacing.md,
  },

  title: {
    color:
      colors.primaryDark,

    fontSize: 34,
    lineHeight: 40,

    fontWeight: '800',

    letterSpacing: -0.8,

    maxWidth: 340,
  },

  description: {
    color:
      colors.textSecondary,

    fontSize: 16,
    lineHeight: 25,

    marginTop:
      spacing.md,

    maxWidth: 340,
  },

  form: {
    marginTop:
      spacing.xxxl,
  },

  label: {
    color: colors.text,

    fontSize: 14,
    fontWeight: '700',

    marginBottom:
      spacing.sm,
  },

  input: {
    minHeight: 56,

    borderWidth: 1,
    borderColor:
      colors.border,

    borderRadius:
      radius.md,

    backgroundColor:
      colors.surface,

    paddingHorizontal:
      spacing.base,

    color: colors.text,

    fontSize: 16,
  },

  inputError: {
    borderColor:
      colors.error,
  },

  fieldError: {
    color:
      colors.error,

    fontSize: 12,

    marginTop:
      spacing.xs,
  },

  submitButton: {
    marginTop:
      spacing.xl,
  },

  loginLink: {
    alignItems: 'center',

    paddingVertical:
      spacing.md,
  },

  loginLinkText: {
    color: colors.primary,

    fontSize: 14,
    fontWeight: '700',
  },

  successContainer: {
    flex: 1,

    paddingHorizontal:
      spacing.xl,

    alignItems: 'center',
    justifyContent: 'center',
  },

  successIcon: {
    width: 72,
    height: 72,

    borderRadius: 36,

    backgroundColor:
      colors.primarySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom:
      spacing.xl,
  },

  successTitle: {
    color:
      colors.primaryDark,

    fontSize: 30,
    lineHeight: 36,

    fontWeight: '800',

    textAlign: 'center',
  },

  successBody: {
    color:
      colors.textSecondary,

    fontSize: 16,
    lineHeight: 25,

    textAlign: 'center',

    marginTop:
      spacing.md,

    maxWidth: 340,
  },

  resend: {
    minHeight: 48,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 20,
  },

  resendText: {
    color: colors.primary,

    fontSize: 14,
    fontWeight: '700',
  },
});