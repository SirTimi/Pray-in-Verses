import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  changePassword,
  getMe,
  updateProfile,
  type AuthUser,
} from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function formatMemberSince(value?: string) {
  if (!value) return 'Account details are synced from the server';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Account details are synced from the server';
  }

  return `Member since ${date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })}`;
}

export default function AccountScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [account, setAccount] = useState<AuthUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const loadAccount = useCallback(async () => {
    setLoadError('');

    try {
      const next = await getMe();
      setAccount(next);
      setDisplayName(next.displayName ?? '');
      setUser(next);
    } catch (error) {
      setLoadError(
        errorMessage(error, 'Unable to load your account right now.'),
      );
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadAccount();
    }, [loadAccount]),
  );

  const normalizedName = displayName.trim();
  const profileChanged =
    normalizedName !== (account?.displayName ?? '').trim();

  const canSaveProfile =
    !savingProfile &&
    normalizedName.length >= 2 &&
    normalizedName.length <= 80 &&
    profileChanged;

  const passwordReady = useMemo(() => {
    return (
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      confirmPassword.length >= 8 &&
      newPassword === confirmPassword &&
      newPassword !== currentPassword
    );
  }, [confirmPassword, currentPassword, newPassword]);

  async function saveProfile() {
    if (savingProfile) return;

    setProfileError('');
    setProfileSuccess('');

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      setProfileError('Display name must be between 2 and 80 characters.');
      return;
    }

    if (!profileChanged) {
      setProfileSuccess('Your profile is already up to date.');
      return;
    }

    setSavingProfile(true);

    try {
      const updated = await updateProfile(normalizedName);
      setAccount(updated);
      setDisplayName(updated.displayName ?? '');
      setUser(updated);
      setProfileSuccess('Your display name has been updated.');
    } catch (error) {
      setProfileError(
        errorMessage(error, 'Unable to update your profile.'),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (changingPassword) return;

    setSecurityError('');
    setSecuritySuccess('');

    if (!currentPassword) {
      setSecurityError('Enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setSecurityError('Your new password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('The new passwords do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setSecurityError('Choose a new password that is different from your current password.');
      return;
    }

    setChangingPassword(true);

    try {
      const updated = await changePassword(currentPassword, newPassword);
      setAccount((current) => ({
        ...(current ?? updated),
        ...updated,
      }));
      setUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecuritySuccess(
        'Password updated. Other signed-in sessions have been revoked.',
      );
    } catch (error) {
      setSecurityError(
        errorMessage(error, 'Unable to change your password.'),
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={21} color={colors.primaryDark} />
            </Pressable>

            <View style={styles.topCopy}>
              <Text style={styles.eyebrow}>PROFILE & SECURITY</Text>
              <Text style={styles.pageTitle}>Account</Text>
            </View>

            <View style={styles.backSpacer} />
          </View>

          <Text style={styles.pageIntro}>
            Keep your account details current and protect your prayer history with a secure password.
          </Text>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.muted}>Loading your account…</Text>
            </View>
          ) : loadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={() => { setLoading(true); void loadAccount(); }}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.identityCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(account?.displayName || account?.email || 'P')
                      .trim()
                      .slice(0, 1)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identityCopy}>
                  <Text style={styles.identityName}>
                    {account?.displayName || 'Pray in Verses User'}
                  </Text>
                  <View style={styles.metaRow}>
                    <CalendarDays size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {formatMemberSince(account?.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <View style={styles.sectionIcon}>
                    <UserRound size={20} color={colors.primary} />
                  </View>
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>Profile details</Text>
                    <Text style={styles.sectionDescription}>
                      This name is shown across your Pray in Verses experience.
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>Display name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={(value) => {
                    setDisplayName(value);
                    setProfileError('');
                    setProfileSuccess('');
                  }}
                  maxLength={80}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.input}
                />
                <Text style={styles.helperText}>2–80 characters</Text>

                <Text style={[styles.label, styles.fieldSpacing]}>Email</Text>
                <View style={[styles.input, styles.readOnlyInput]}>
                  <Mail size={18} color={colors.textMuted} />
                  <Text numberOfLines={1} style={styles.readOnlyText}>
                    {account?.email}
                  </Text>
                  <View style={styles.readOnlyPill}>
                    <Text style={styles.readOnlyPillText}>Read only</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  Email changes will be enabled only with a verified email-change flow.
                </Text>

                {!!profileError && (
                  <Text style={styles.inlineError}>{profileError}</Text>
                )}
                {!!profileSuccess && (
                  <Text style={styles.inlineSuccess}>{profileSuccess}</Text>
                )}

                <Pressable
                  disabled={!canSaveProfile}
                  onPress={() => void saveProfile()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    !canSaveProfile && styles.disabledButton,
                    pressed && canSaveProfile && styles.pressedButton,
                  ]}
                >
                  {savingProfile ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Save size={18} color={colors.white} />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {savingProfile ? 'Saving…' : 'Save Profile'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <View style={[styles.sectionIcon, styles.securityIcon]}>
                    <ShieldCheck size={20} color={colors.success} />
                  </View>
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>Change password</Text>
                    <Text style={styles.sectionDescription}>
                      Confirm your current password before choosing a new one.
                    </Text>
                  </View>
                </View>

                <PasswordField
                  label="Current password"
                  value={currentPassword}
                  onChangeText={(value) => {
                    setCurrentPassword(value);
                    setSecurityError('');
                    setSecuritySuccess('');
                  }}
                  visible={showCurrentPassword}
                  onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
                  autoComplete="current-password"
                />

                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    setSecurityError('');
                    setSecuritySuccess('');
                  }}
                  visible={showNewPassword}
                  onToggleVisibility={() => setShowNewPassword((value) => !value)}
                  autoComplete="new-password"
                />
                <Text style={styles.helperText}>At least 8 characters</Text>

                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setSecurityError('');
                    setSecuritySuccess('');
                  }}
                  visible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
                  autoComplete="new-password"
                />

                {!!securityError && (
                  <Text style={styles.inlineError}>{securityError}</Text>
                )}
                {!!securitySuccess && (
                  <Text style={styles.inlineSuccess}>{securitySuccess}</Text>
                )}

                <Pressable
                  disabled={!passwordReady || changingPassword}
                  onPress={() => void savePassword()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (!passwordReady || changingPassword) && styles.disabledButton,
                    pressed && passwordReady && !changingPassword && styles.pressedButton,
                  ]}
                >
                  {changingPassword ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <LockKeyhole size={18} color={colors.white} />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {changingPassword ? 'Updating…' : 'Update Password'}
                  </Text>
                </Pressable>

                <View style={styles.securityNote}>
                  <ShieldCheck size={17} color={colors.primary} />
                  <Text style={styles.securityNoteText}>
                    A successful password change signs out your other existing sessions while keeping this device signed in.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: 'current-password' | 'new-password';
};

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisibility,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <View style={styles.passwordField}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputWrap}>
        <LockKeyhole size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          style={styles.passwordInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label}` : `Show ${label}`}
          onPress={onToggleVisibility}
          style={styles.eyeButton}
        >
          {visible ? (
            <EyeOff size={19} color={colors.textSecondary} />
          ) : (
            <Eye size={19} color={colors.textSecondary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: 48,
  },
  topRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backSpacer: { width: 44 },
  topCopy: { flex: 1, alignItems: 'center' },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.35,
  },
  pageTitle: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 27,
    fontWeight: '700',
    marginTop: 1,
  },
  pageIntro: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  loadingCard: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  muted: { color: colors.textSecondary, fontSize: 13 },
  errorCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#F3C7C2',
  },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  avatarText: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '800',
  },
  identityCopy: { flex: 1 },
  identityName: {
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  metaText: { color: '#CED7EA', fontSize: 11 },
  sectionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  securityIcon: { backgroundColor: '#ECFDF3' },
  sectionHeadingCopy: { flex: 1 },
  sectionTitle: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  label: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  fieldSpacing: { marginTop: spacing.lg },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#FBFCFE',
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: spacing.md,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readOnlyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  readOnlyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
  },
  readOnlyPillText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  inlineError: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  inlineSuccess: {
    color: colors.success,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.86 },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  passwordField: { marginTop: spacing.md },
  passwordInputWrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#FBFCFE',
    paddingLeft: spacing.md,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  securityNoteText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
