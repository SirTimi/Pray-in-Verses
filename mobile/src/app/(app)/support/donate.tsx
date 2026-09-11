import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
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
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Heart,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  clearPendingDonation,
  getDonationStatus,
  initializeDonation,
  loadPendingDonation,
  savePendingDonation,
  type DonationStatus,
} from '@/services/donations';
import { useAuthStore } from '@/stores/auth.store';

const PRESET_AMOUNTS = [
  1000,
  2000,
  5000,
  10000,
];

const DONATION_POLICY_URL =
  'https://prayinverses.com/donation-policy';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

type Phase =
  | 'form'
  | 'opening'
  | 'pending'
  | 'success'
  | 'failed';

function formatAmount(value: number) {
  return `₦${Math.round(value).toLocaleString()}`;
}

function messageFromError(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error &&
    error.message
    ? error.message
    : fallback;
}

export default function DonateScreen() {
  const router = useRouter();
  const user = useAuthStore(
    (state) => state.user,
  );

  const [email, setEmail] = useState(
    user?.email ?? '',
  );
  const [name, setName] = useState(
    user?.displayName ?? '',
  );
  const [amountText, setAmountText] =
    useState('2000');
  const [message, setMessage] =
    useState('');

  const [phase, setPhase] =
    useState<Phase>('form');
  const [reference, setReference] =
    useState('');
  const [authorizationUrl, setAuthorizationUrl] =
    useState('');
  const [confirmed, setConfirmed] =
    useState<DonationStatus | null>(null);
  const [error, setError] =
    useState('');
  const [statusNote, setStatusNote] =
    useState('');
  const [checking, setChecking] =
    useState(false);

  const checkInFlight = useRef(false);

  const amount = useMemo(() => {
    const normalized =
      amountText.replace(/[^0-9.]/g, '');
    return Number(normalized || 0);
  }, [amountText]);

  const selectedPreset =
    PRESET_AMOUNTS.includes(amount)
      ? amount
      : null;

  const applyStatus = useCallback(
    async (
      donationReference: string,
      quiet = false,
    ) => {
      if (checkInFlight.current) {
        return;
      }

      checkInFlight.current = true;
      setChecking(true);

      try {
        const result =
          await getDonationStatus(
            donationReference,
          );

        setConfirmed(result);

        if (result.status === 'success') {
          await clearPendingDonation();
          setPhase('success');
          setStatusNote('');
          return;
        }

        if (
          result.status === 'failed' ||
          result.status === 'abandoned'
        ) {
          await clearPendingDonation();
          setPhase('failed');
          setStatusNote('');
          return;
        }

        setPhase('pending');
        setStatusNote(
          quiet
            ? 'Waiting for Paystack confirmation…'
            : 'Payment has not been confirmed yet. If you just paid, give Paystack a moment and check again.',
        );
      } catch (statusError) {
        if (!quiet) {
          setStatusNote(
            messageFromError(
              statusError,
              'Unable to check this donation right now.',
            ),
          );
        }
      } finally {
        checkInFlight.current = false;
        setChecking(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      const pending =
        await loadPendingDonation();

      if (!pending || !active) {
        return;
      }

      setReference(pending.reference);
      setAmountText(
        String(pending.amount),
      );
      setPhase('pending');
      setStatusNote(
        'Checking your previous donation…',
      );

      await applyStatus(
        pending.reference,
        true,
      );
    })();

    return () => {
      active = false;
    };
  }, [applyStatus]);

  useEffect(() => {
    if (
      phase !== 'pending' ||
      !reference
    ) {
      return;
    }

    let attempts = 0;

    const timer = setInterval(() => {
      attempts += 1;

      if (attempts > 12) {
        clearInterval(timer);
        setStatusNote(
          'Automatic checking paused. Tap Refresh status whenever you are ready.',
        );
        return;
      }

      void applyStatus(
        reference,
        true,
      );
    }, 5000);

    return () =>
      clearInterval(timer);
  }, [applyStatus, phase, reference]);

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        (state) => {
          if (
            state === 'active' &&
            phase === 'pending' &&
            reference
          ) {
            void applyStatus(
              reference,
              true,
            );
          }
        },
      );

    return () => subscription.remove();
  }, [
    applyStatus,
    phase,
    reference,
  ]);

  const startDonation = async () => {
    setError('');
    setStatusNote('');

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !/^\S+@\S+\.\S+$/.test(
        cleanEmail,
      )
    ) {
      setError(
        'Enter a valid email address.',
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount < 100
    ) {
      setError(
        'Donation amount must be at least ₦100.',
      );
      return;
    }

    setPhase('opening');

    try {
      const initialized =
        await initializeDonation({
          email: cleanEmail,
          amount,
          name:
            name.trim() || undefined,
          message:
            message.trim() || undefined,
        });

      setReference(
        initialized.reference,
      );
      setAuthorizationUrl(
        initialized.authorization_url,
      );
      setPhase('pending');
      setStatusNote(
        'Complete your donation securely with Paystack, then return to Pray in Verses. We will confirm it with the server.',
      );

      await savePendingDonation({
        reference:
          initialized.reference,
        amount,
        createdAt:
          new Date().toISOString(),
      });

      const browserResult =
        await WebBrowser.openBrowserAsync(
          initialized.authorization_url,
        );

      if (
        browserResult.type === 'cancel' ||
        browserResult.type === 'dismiss'
      ) {
        setStatusNote(
          'The payment browser was closed. Checking whether the donation was completed…',
        );
      }

      await applyStatus(
        initialized.reference,
      );
    } catch (startError) {
      setError(
        messageFromError(
          startError,
          'Unable to start the donation. Please try again.',
        ),
      );
      setPhase('form');
    }
  };

  const reopenPaystack = async () => {
    if (!authorizationUrl) {
      return;
    }

    await WebBrowser.openBrowserAsync(
      authorizationUrl,
    );

    if (reference) {
      await applyStatus(reference);
    }
  };

  const startOver = async () => {
    await clearPendingDonation();
    setReference('');
    setAuthorizationUrl('');
    setConfirmed(null);
    setStatusNote('');
    setError('');
    setPhase('form');
  };

  const openPolicy = async () => {
    await WebBrowser.openBrowserAsync(
      DONATION_POLICY_URL,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft
                size={22}
                color={colors.text}
              />
            </Pressable>
            <Text style={styles.headerTitle}>
              Support the Mission
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {phase === 'success' ? (
            <ResultCard
              success
              title="Thank you for your support"
              body={`Your ${formatAmount(
                confirmed?.amount ?? amount,
              )} donation has been confirmed. Your support helps keep Pray in Verses free and growing.`}
              onPrimary={() => router.back()}
              primaryLabel="Done"
              onPolicy={openPolicy}
            />
          ) : phase === 'failed' ? (
            <ResultCard
              title="Payment not completed"
              body="Paystack did not confirm this donation. You can safely try again when you are ready."
              onPrimary={startOver}
              primaryLabel="Try again"
              onPolicy={openPolicy}
            />
          ) : phase === 'pending' ? (
            <View style={styles.pendingWrap}>
              <View style={styles.pendingIcon}>
                <RefreshCw
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.resultTitle}>
                Waiting for confirmation
              </Text>
              <Text style={styles.resultBody}>
                {statusNote ||
                  'Complete the payment in Paystack and return here. Confirmation comes from the server, not from simply opening the browser.'}
              </Text>

              {reference ? (
                <View style={styles.referenceBox}>
                  <Text style={styles.referenceLabel}>
                    REFERENCE
                  </Text>
                  <Text
                    selectable
                    style={styles.referenceValue}
                  >
                    {reference}
                  </Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={checking}
                onPress={() =>
                  void applyStatus(reference)
                }
                style={styles.primaryButton}
              >
                {checking ? (
                  <ActivityIndicator
                    color={colors.white}
                  />
                ) : (
                  <>
                    <RefreshCw
                      size={19}
                      color={colors.white}
                    />
                    <Text style={styles.primaryButtonText}>
                      Refresh status
                    </Text>
                  </>
                )}
              </Pressable>

              {authorizationUrl ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    void reopenPaystack()
                  }
                  style={styles.secondaryButton}
                >
                  <ExternalLink
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Return to Paystack
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  void startOver()
                }
                style={styles.textButton}
              >
                <Text style={styles.textButtonText}>
                  Start a new donation
                </Text>
              </Pressable>
              <Text style={styles.pendingHint}>
                Only start another donation if you did not complete the previous payment.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <Heart
                    size={30}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.heroTitle}>
                  Help Scripture become prayer
                </Text>
                <Text style={styles.heroBody}>
                  Donations are voluntary. They do not unlock features or special access, and Pray in Verses remains free for everyone.
                </Text>
              </View>

              <Text style={styles.label}>
                Choose an amount
              </Text>
              <View style={styles.presetGrid}>
                {PRESET_AMOUNTS.map(
                  (preset) => (
                    <Pressable
                      key={preset}
                      accessibilityRole="button"
                      onPress={() =>
                        setAmountText(
                          String(preset),
                        )
                      }
                      style={[
                        styles.preset,
                        selectedPreset ===
                          preset &&
                          styles.presetSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          selectedPreset ===
                            preset &&
                            styles.presetTextSelected,
                        ]}
                      >
                        {formatAmount(preset)}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>

              <FieldLabel text="Custom amount (NGN)" />
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <FieldLabel text="Email" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <FieldLabel text="Name (optional)" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <FieldLabel text="Message (optional)" />
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                placeholder="A short note of encouragement"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  styles.messageInput,
                ]}
                textAlignVertical="top"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <XCircle
                    size={18}
                    color={colors.error}
                  />
                  <Text style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={styles.secureNote}>
                <ShieldCheck
                  size={21}
                  color={colors.success}
                />
                <Text style={styles.secureText}>
                  Payment is completed securely on Paystack. Pray in Verses does not store your card or bank details.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={phase === 'opening'}
                onPress={() =>
                  void startDonation()
                }
                style={styles.primaryButton}
              >
                {phase === 'opening' ? (
                  <ActivityIndicator
                    color={colors.white}
                  />
                ) : (
                  <>
                    <Heart
                      size={19}
                      color={colors.white}
                    />
                    <Text style={styles.primaryButtonText}>
                      Donate {formatAmount(amount || 0)}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  void openPolicy()
                }
                style={styles.policyButton}
              >
                <Text style={styles.policyText}>
                  Donation Policy
                </Text>
                <ExternalLink
                  size={16}
                  color={colors.primary}
                />
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({
  text,
}: {
  text: string;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {text}
    </Text>
  );
}

type ResultCardProps = {
  success?: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void | Promise<void>;
  onPolicy: () => void | Promise<void>;
};

function ResultCard({
  success = false,
  title,
  body,
  primaryLabel,
  onPrimary,
  onPolicy,
}: ResultCardProps) {
  const Icon = success
    ? CheckCircle2
    : XCircle;

  return (
    <View style={styles.resultWrap}>
      <View
        style={[
          styles.resultIcon,
          success
            ? styles.resultIconSuccess
            : styles.resultIconError,
        ]}
      >
        <Icon
          size={34}
          color={
            success
              ? colors.success
              : colors.error
          }
        />
      </View>
      <Text style={styles.resultTitle}>
        {title}
      </Text>
      <Text style={styles.resultBody}>
        {body}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void onPrimary()}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>
          {primaryLabel}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void onPolicy()}
        style={styles.policyButton}
      >
        <Text style={styles.policyText}>
          Donation Policy
        </Text>
        <ExternalLink
          size={16}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
    marginBottom: spacing.base,
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  heroBody: {
    marginTop: spacing.sm,
    maxWidth: 340,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  label: {
    marginBottom: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  preset: {
    minWidth: '47%',
    flexGrow: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  presetText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  presetTextSelected: {
    color: colors.primary,
  },
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    minHeight: 54,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  messageInput: {
    minHeight: 112,
    paddingTop: spacing.base,
  },
  errorBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    marginTop: spacing.base,
    borderRadius: radius.md,
    backgroundColor: '#FFF1F0',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#EFFAF3',
  },
  secureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  primaryButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  secondaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  policyButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  policyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  pendingWrap: {
    alignItems: 'center',
    paddingTop: spacing.huge,
  },
  pendingIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg,
  },
  resultWrap: {
    alignItems: 'center',
    paddingTop: spacing.huge,
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resultIconSuccess: {
    backgroundColor: '#EFFAF3',
  },
  resultIconError: {
    backgroundColor: '#FFF1F0',
  },
  resultTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  resultBody: {
    maxWidth: 345,
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  referenceBox: {
    width: '100%',
    marginTop: spacing.xl,
    padding: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  referenceValue: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
  },
  textButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pendingHint: {
    maxWidth: 315,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
