import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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

import AppButton from '@/components/ui/AppButton';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { ApiError } from '@/services/api';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleLogin() {
    if (!canSubmit || loading) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      setUser(user);
      router.replace('/(app)');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Too many sign-in attempts. Please wait a moment and try again.');
        } else if (err.status === 403) {
          setError('This account cannot access the mobile app.');
        } else {
          setError(err.message || 'Unable to sign in with those details.');
        }
      } else {
        setError('Unable to connect. Check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.blueCorner} />
      <View style={styles.goldCorner} />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.brandBlock}>
            <Image
              source={require('../../../assets/images/icon.png')}
              resizeMode="contain"
              style={styles.logo}
            />
            <Text style={styles.brandName}>Pray in Verses</Text>
            <Text style={styles.brandTagline}>Pray the Bible Verse by Verse</Text>
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Continue your journey of prayer through God&apos;s Word.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputShell}>
              <Text style={styles.inputGlyph}>@</Text>
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

            <View style={styles.inputShell}>
              <Text style={styles.inputGlyph}>●</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={() => void handleLogin()}
                style={styles.input}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((visible) => !visible)}
                style={styles.showButton}
              >
                <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <AppButton
              label="Sign In"
              loading={loading}
              disabled={!canSubmit}
              onPress={() => void handleLogin()}
              style={styles.signInButton}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>SCRIPTURE • PRAYER • COMMUNITY</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.createBlock}>
            <Text style={styles.createPrompt}>New to Pray in Verses?</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/signup')}
              style={styles.createButton}
            >
              <Text style={styles.createLink}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  blueCorner: {
    position: 'absolute',
    top: -95,
    right: -110,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primarySoft,
  },
  goldCorner: {
    position: 'absolute',
    bottom: -125,
    left: -115,
    width: 255,
    height: 255,
    borderRadius: 128,
    backgroundColor: colors.goldSoft,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logo: {
    width: 98,
    height: 98,
  },
  brandName: {
    marginTop: 2,
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 25,
    fontWeight: '700',
  },
  brandTagline: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  headingBlock: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  title: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 315,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    marginTop: spacing.xxxl,
  },
  inputShell: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
  },
  inputGlyph: {
    width: 26,
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  showButton: {
    minWidth: 52,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  showText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    minHeight: 38,
    justifyContent: 'center',
    marginTop: -4,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FFF1F0',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
  signInButton: {
    minHeight: 58,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  createBlock: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  createPrompt: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  createButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  createLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
