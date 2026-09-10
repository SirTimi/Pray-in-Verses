import {
  useMemo,
  useState,
} from 'react';

import {
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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useRouter,
} from 'expo-router';

import AppButton
  from '@/components/ui/AppButton';

import {
  colors,
} from '@/constants/colors';

import {
  radius,
  spacing,
} from '@/constants/spacing';

import {
  signup,
} from '@/services/auth';

import {
  ApiError,
} from '@/services/api';

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordError(
  password: string,
) {
  if (!password) {
    return '';
  }

  if (password.length < 8) {
    return 'Use at least 8 characters';
  }

  if (!/[a-z]/.test(password)) {
    return 'Add a lowercase letter';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Add an uppercase letter';
  }

  if (!/\d/.test(password)) {
    return 'Add a number';
  }

  if (!/[@$!%*?&#]/.test(password)) {
    return 'Add a special character (@$!%*?&#)';
  }

  return '';
}

export default function SignupScreen() {
  const router = useRouter();

  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword,
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
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    acceptedPrivacy,
    setAcceptedPrivacy,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const nameValid =
    displayName.trim().length >= 2;

  const emailValid =
    EMAIL_REGEX.test(
      email.trim(),
    );

  const passwordError =
    useMemo(
      () =>
        getPasswordError(
          password,
        ),
      [password],
    );

  const passwordValid =
    password.length > 0 &&
    !passwordError;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password ===
      confirmPassword;

  const canSubmit =
    nameValid &&
    emailValid &&
    passwordValid &&
    passwordsMatch &&
    acceptedPrivacy;

  async function handleSignup() {
    if (
      !canSubmit ||
      loading
    ) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signup(
        displayName.trim(),
        email
          .trim()
          .toLowerCase(),
        password,
      );

      router.replace(
        '/(auth)/login',
      );
    } catch (err) {
      if (
        err instanceof ApiError
      ) {
        if (
          err.status === 429
        ) {
          setError(
            'Too many signup attempts. Please try again shortly.',
          );
        } else {
          setError(
            err.message,
          );
        }
      } else {
        setError(
          'Unable to connect. Check your internet connection and try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function openPrivacyPolicy() {
    await Linking.openURL(
      'https://prayinverses.com/privacy-policy',
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
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={styles.header}
          >
            <Text
              style={styles.eyebrow}
            >
              PRAY IN VERSES
            </Text>

            <Text
              style={styles.title}
            >
              Begin your prayer
              journey.
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Create your account
              and start praying
              through Scripture.
            </Text>
          </View>

          <View
            style={styles.form}
          >
            {/* NAME */}

            <View>
              <Text
                style={styles.label}
              >
                Full name
              </Text>

              <TextInput
                value={displayName}
                onChangeText={
                  setDisplayName
                }
                placeholder="Your name"
                placeholderTextColor={
                  colors.textMuted
                }
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                style={[
                  styles.input,

                  displayName.length >
                    0 &&
                    !nameValid &&
                    styles.inputError,
                ]}
              />

              {displayName.length >
                0 &&
                !nameValid && (
                  <Text
                    style={
                      styles.fieldError
                    }
                  >
                    Name must be at
                    least 2 characters.
                  </Text>
                )}
            </View>

            {/* EMAIL */}

            <View>
              <Text
                style={styles.label}
              >
                Email
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
                    Enter a valid
                    email address.
                  </Text>
                )}
            </View>

            {/* PASSWORD */}

            <View>
              <Text
                style={styles.label}
              >
                Password
              </Text>

              <View
                style={[
                  styles.passwordBox,

                  password.length >
                    0 &&
                    !passwordValid &&
                    styles.inputError,
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  placeholder="Create a password"
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

              {!!passwordError && (
                <Text
                  style={
                    styles.fieldError
                  }
                >
                  {passwordError}
                </Text>
              )}

              {!password && (
                <Text
                  style={
                    styles.passwordHint
                  }
                >
                  8+ characters with
                  uppercase, lowercase,
                  number and special
                  character.
                </Text>
              )}
            </View>

            {/* CONFIRM PASSWORD */}

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
                  placeholder="Repeat your password"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  secureTextEntry={
                    !showConfirmPassword
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
                    setShowConfirmPassword(
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
                    {showConfirmPassword
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

            {/* PRIVACY */}

            <View
              style={
                styles.privacyRow
              }
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked:
                    acceptedPrivacy,
                }}
                onPress={() =>
                  setAcceptedPrivacy(
                    (current) =>
                      !current,
                  )
                }
                style={[
                  styles.checkbox,

                  acceptedPrivacy &&
                    styles.checkboxActive,
                ]}
              >
                {acceptedPrivacy && (
                  <Text
                    style={
                      styles.checkmark
                    }
                  >
                    ✓
                  </Text>
                )}
              </Pressable>

              <View
                style={
                  styles.privacyText
                }
              >
                <Text
                  style={
                    styles.privacyCopy
                  }
                >
                  I have read and
                  agree to the
                </Text>

                <Pressable
                  onPress={
                    openPrivacyPolicy
                  }
                >
                  <Text
                    style={
                      styles.privacyLink
                    }
                  >
                    Privacy Policy
                  </Text>
                </Pressable>
              </View>
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
              label="Create account"
              loading={loading}
              disabled={
                !canSubmit
              }
              onPress={
                handleSignup
              }
            />

            <View
              style={styles.loginRow}
            >
              <Text
                style={
                  styles.loginPrompt
                }
              >
                Already have an
                account?
              </Text>

              <Pressable
                onPress={() =>
                  router.replace(
                    '/(auth)/login',
                  )
                }
              >
                <Text
                  style={
                    styles.loginLink
                  }
                >
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    keyboard: {
      flex: 1,
    },

    content: {
      flexGrow: 1,

      paddingHorizontal:
        spacing.xl,

      paddingBottom:
        spacing.xxxl,
    },

    backButton: {
      width: 44,
      height: 44,

      alignItems: 'center',
      justifyContent:
        'center',

      alignSelf:
        'flex-start',

      marginLeft: -8,
      marginTop: spacing.sm,

      borderRadius:
        radius.round,
    },

    backText: {
      color:
        colors.primary,

      fontSize: 36,
      lineHeight: 40,

      fontWeight: '300',
    },

    header: {
      marginTop:
        spacing.xl,
    },

    eyebrow: {
      color:
        colors.primary,

      fontSize: 12,
      fontWeight: '800',

      letterSpacing: 1.5,

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
      lineHeight: 24,

      marginTop:
        spacing.md,

      maxWidth: 340,
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
      lineHeight: 20,

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

      color:
        colors.text,

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
      lineHeight: 18,

      marginTop:
        spacing.xs,
    },

    passwordHint: {
      color:
        colors.textMuted,

      fontSize: 12,
      lineHeight: 18,

      marginTop:
        spacing.xs,
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

      color:
        colors.text,

      fontSize: 16,

      paddingVertical: 0,
    },

    showButton: {
      minWidth: 60,
      minHeight: 54,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    showText: {
      color:
        colors.primary,

      fontSize: 13,
      fontWeight: '700',
    },

    privacyRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',

      gap: spacing.md,
    },

    checkbox: {
      width: 22,
      height: 22,

      borderWidth: 1.5,
      borderColor:
        colors.border,

      borderRadius: 6,

      backgroundColor:
        colors.surface,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 1,
    },

    checkboxActive: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.primary,
    },

    checkmark: {
      color:
        colors.white,

      fontSize: 14,
      fontWeight: '900',
    },

    privacyText: {
      flex: 1,

      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 4,
    },

    privacyCopy: {
      color:
        colors.textSecondary,

      fontSize: 13,
      lineHeight: 20,
    },

    privacyLink: {
      color:
        colors.primary,

      fontSize: 13,
      lineHeight: 20,

      fontWeight: '800',
    },

    errorBox: {
      backgroundColor:
        '#FFF1F0',

      borderRadius:
        radius.md,

      padding:
        spacing.md,
    },

    errorText: {
      color:
        colors.error,

      fontSize: 14,
      lineHeight: 20,
    },

    loginRow: {
      flexDirection: 'row',
      justifyContent:
        'center',

      alignItems: 'center',

      gap: 5,

      marginTop:
        spacing.sm,
    },

    loginPrompt: {
      color:
        colors.textSecondary,

      fontSize: 14,
    },

    loginLink: {
      color:
        colors.primary,

      fontSize: 14,
      fontWeight: '800',
    },
  });