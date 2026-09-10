import {
  useState,
} from 'react';

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
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from 'lucide-react-native';

import AppButton
  from '@/components/ui/AppButton';

import { colors } from '@/constants/colors';

import {
  radius,
  spacing,
} from '@/constants/spacing';

import {
  resetPassword,
} from '@/services/auth';

import {
  ApiError,
} from '@/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      token?: string;
    }>();

  const token =
    typeof params.token === 'string'
      ? params.token
      : '';

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState(false);

  const passwordValid =
    newPassword.length >= 8;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword ===
      confirmPassword;

  const canSubmit =
    !!token &&
    passwordValid &&
    passwordsMatch;

  async function handleReset() {
    if (
      !canSubmit ||
      loading
    ) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(
        token,
        newPassword,
      );

      setSuccess(true);
    } catch (err) {
      if (
        err instanceof ApiError
      ) {
        if (
          err.status === 429
        ) {
          setError(
            'Too many attempts. Please try again shortly.',
          );
        } else {
          setError(
            err.message ||
              'This reset link may be invalid or expired.',
          );
        }
      } else {
        setError(
          'Unable to reset your password. Check your connection and try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
              size={38}
              color={colors.primary}
              strokeWidth={1.8}
            />
          </View>

          <Text
            style={styles.successTitle}
          >
            Password changed
          </Text>

          <Text
            style={styles.successBody}
          >
            Your password has been
            reset successfully. You can
            now sign in with your new
            password.
          </Text>

          <AppButton
            label="Continue to sign in"
            onPress={() =>
              router.replace(
                '/(auth)/login',
              )
            }
            style={{
              marginTop:
                spacing.xxl,
            }}
          />
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
            style={
              styles.backButton
            }
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
              <KeyRound
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
              Create a new password.
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Choose a password you
              haven’t used before.
            </Text>

            {!token && (
              <View
                style={
                  styles.warningBox
                }
              >
                <Text
                  style={
                    styles.warningTitle
                  }
                >
                  Reset link missing
                </Text>

                <Text
                  style={
                    styles.warningText
                  }
                >
                  Open the secure reset
                  link from your email,
                  or request a new one.
                </Text>

                <Pressable
                  onPress={() =>
                    router.replace(
                      '/(auth)/forgot-password',
                    )
                  }
                >
                  <Text
                    style={
                      styles.requestLink
                    }
                  >
                    Request new link
                  </Text>
                </Pressable>
              </View>
            )}

            <View
              style={styles.form}
            >
              <View>
                <Text
                  style={styles.label}
                >
                  New password
                </Text>

                <View
                  style={[
                    styles.passwordBox,

                    newPassword.length >
                      0 &&
                      !passwordValid &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    value={
                      newPassword
                    }
                    onChangeText={
                      setNewPassword
                    }
                    placeholder="Enter new password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    style={
                      styles.passwordInput
                    }
                  />

                  <Pressable
                    onPress={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    style={
                      styles.showButton
                    }
                  >
                    <Text
                      style={
                        styles.showText
                      }
                    >
                      {showPassword
                        ? 'Hide'
                        : 'Show'}
                    </Text>
                  </Pressable>
                </View>

                {newPassword.length >
                  0 &&
                  !passwordValid && (
                    <Text
                      style={
                        styles.fieldError
                      }
                    >
                      Password must be at
                      least 8 characters.
                    </Text>
                  )}
              </View>

              <View>
                <Text
                  style={styles.label}
                >
                  Confirm password
                </Text>

                <View
                  style={[
                    styles.passwordBox,

                    confirmPassword.length >
                      0 &&
                      !passwordsMatch &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    value={
                      confirmPassword
                    }
                    onChangeText={
                      setConfirmPassword
                    }
                    placeholder="Repeat new password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    secureTextEntry={
                      !showConfirm
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    style={
                      styles.passwordInput
                    }
                  />

                  <Pressable
                    onPress={() =>
                      setShowConfirm(
                        (current) =>
                          !current,
                      )
                    }
                    style={
                      styles.showButton
                    }
                  >
                    <Text
                      style={
                        styles.showText
                      }
                    >
                      {showConfirm
                        ? 'Hide'
                        : 'Show'}
                    </Text>
                  </Pressable>
                </View>

                {confirmPassword.length >
                  0 &&
                  !passwordsMatch && (
                    <Text
                      style={
                        styles.fieldError
                      }
                    >
                      Passwords do not
                      match.
                    </Text>
                  )}
              </View>

              {!!error && (
                <View
                  style={
                    styles.errorBox
                  }
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>
                </View>
              )}

              <AppButton
                label="Reset password"
                loading={loading}
                disabled={
                  !canSubmit
                }
                onPress={
                  handleReset
                }
              />
            </View>
          </View>
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
  },

  backButton: {
    width: 44,
    height: 44,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius:
      radius.round,

    alignSelf: 'flex-start',

    marginTop: spacing.sm,
    marginLeft: -10,
  },

  content: {
    flex: 1,

    justifyContent:
      'center',

    paddingBottom: 50,
  },

  iconBox: {
    width: 60,
    height: 60,

    borderRadius:
      radius.lg,

    backgroundColor:
      colors.primarySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom:
      spacing.xl,
  },

  eyebrow: {
    color:
      colors.primary,

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
  },

  form: {
    marginTop:
      spacing.xxl,

    gap: spacing.lg,
  },

  label: {
    color:
      colors.text,

    fontSize: 14,
    fontWeight: '700',

    marginBottom:
      spacing.sm,
  },

  passwordBox: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor:
      colors.border,

    borderRadius:
      radius.md,

    backgroundColor:
      colors.surface,

    paddingLeft:
      spacing.base,
  },

  passwordInput: {
    flex: 1,

    fontSize: 16,

    color:
      colors.text,

    paddingVertical: 0,
  },

  showButton: {
    minWidth: 60,
    minHeight: 54,

    alignItems: 'center',
    justifyContent: 'center',
  },

  showText: {
    color:
      colors.primary,

    fontSize: 13,
    fontWeight: '700',
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

  errorBox: {
    padding:
      spacing.md,

    borderRadius:
      radius.md,

    backgroundColor:
      '#FFF1F0',
  },

  errorText: {
    color:
      colors.error,

    fontSize: 14,
    lineHeight: 20,
  },

  warningBox: {
    marginTop:
      spacing.xl,

    padding:
      spacing.base,

    borderRadius:
      radius.md,

    backgroundColor:
      colors.goldSoft,
  },

  warningTitle: {
    color:
      colors.text,

    fontSize: 14,
    fontWeight: '800',
  },

  warningText: {
    color:
      colors.textSecondary,

    fontSize: 13,
    lineHeight: 20,

    marginTop:
      spacing.xs,
  },

  requestLink: {
    color:
      colors.primary,

    fontSize: 13,
    fontWeight: '800',

    marginTop:
      spacing.md,
  },

  successContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal:
      spacing.xl,
  },

  successIcon: {
    width: 74,
    height: 74,

    borderRadius: 37,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.primarySoft,

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

    maxWidth: 340,

    marginTop:
      spacing.md,
  },
});