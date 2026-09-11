import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';

import { ApiError } from '@/services/api';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const NAVY = '#071C50';
const BLUE = '#0B3BA7';
const BLUE_DISABLED = '#8CA3D3';
const MUTED = '#728096';
const BORDER = '#DDE4ED';
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

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
    if (!canSubmit || loading) return;

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

  function explainSocialLogin() {
    Alert.alert(
      'Email sign-in for now',
      'Apple, Google and Facebook sign-in are not connected to the Pray in Verses backend yet. Please use your email and password.',
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.blueGlow} />
      <View style={styles.goldGlow} />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Image
            source={require('../../../assets/images/PIV-logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Continue your journey of prayer{`\n`}through God&apos;s Word.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputShell}>
              <Mail size={20} color="#7A8CA8" strokeWidth={1.8} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor="#8390A3"
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
              <LockKeyhole size={20} color="#7A8CA8" strokeWidth={1.8} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#8390A3"
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
                hitSlop={10}
                onPress={() => setShowPassword((value) => !value)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#7A8CA8" strokeWidth={1.8} />
                ) : (
                  <Eye size={20} color="#7A8CA8" strokeWidth={1.8} />
                )}
              </Pressable>
            </View>

            <Pressable
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

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || loading}
              onPress={() => void handleLogin()}
              style={({ pressed }) => [
                styles.signInButton,
                !canSubmit && styles.signInButtonDisabled,
                pressed && canSubmit && styles.signInButtonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable onPress={explainSocialLogin} style={styles.socialButton}>
              <Text style={[styles.socialGlyph, styles.appleGlyph]}>●</Text>
            </Pressable>
            <Pressable onPress={explainSocialLogin} style={styles.socialButton}>
              <Text style={[styles.socialGlyph, styles.googleGlyph]}>G</Text>
            </Pressable>
            <Pressable onPress={explainSocialLogin} style={styles.socialButton}>
              <Text style={[styles.socialGlyph, styles.facebookGlyph]}>f</Text>
            </Pressable>
          </View>

          <View style={styles.createBlock}>
            <Text style={styles.createPrompt}>New to Pray in Verses?</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.createButton}>
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
    overflow: 'hidden',
    backgroundColor: '#FFFDFC',
  },
  keyboard: {
    flex: 1,
  },
  blueGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -114,
    right: -74,
    backgroundColor: '#DDE8FF',
    opacity: 0.9,
  },
  goldGlow: {
    position: 'absolute',
    width: 260,
    height: 180,
    borderRadius: 130,
    left: -155,
    bottom: -93,
    backgroundColor: '#FFF0B6',
    transform: [{ rotate: '18deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 28,
  },
  logo: {
    width: 158,
    height: 128,
  },
  title: {
    marginTop: 14,
    color: NAVY,
    fontFamily: SERIF_FONT,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 7,
    color: MUTED,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginTop: 28,
  },
  inputShell: {
    width: '100%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: '#1B273A',
    fontSize: 16,
  },
  eyeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    minHeight: 34,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  forgotText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#FFF1F0',
    padding: 12,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
  },
  signInButton: {
    minHeight: 56,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  signInButtonDisabled: {
    backgroundColor: BLUE_DISABLED,
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonPressed: {
    opacity: 0.92,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E8EF',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#99A3B2',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  socialRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  socialButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  socialGlyph: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  appleGlyph: {
    color: '#0B0B0D',
    transform: [{ scaleX: 0.78 }, { scaleY: 0.95 }],
  },
  googleGlyph: {
    color: '#4285F4',
    fontSize: 22,
  },
  facebookGlyph: {
    color: '#1877F2',
    fontFamily: Platform.select({ ios: 'Arial', android: 'sans-serif', default: 'sans-serif' }),
    fontSize: 26,
  },
  createBlock: {
    marginTop: 22,
    alignItems: 'center',
  },
  createPrompt: {
    color: '#42506A',
    fontSize: 14,
  },
  createButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  createLink: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '800',
  },
});
