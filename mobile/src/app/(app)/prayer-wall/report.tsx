import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flag } from 'lucide-react-native';
import InlineErrorMessage from '@/components/common/InlineErrorMessage';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { reportPrayerContent, type ReportReason, type ReportTarget } from '@/services/prayer-wall';
import { getUserFacingError } from '@/services/user-facing-error';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'HATE', label: 'Hate or discrimination' },
  { value: 'THREATS', label: 'Threats or violence' },
  { value: 'SPAM', label: 'Spam or solicitation' },
  { value: 'PRIVACY', label: 'Sharing private information' },
  { value: 'OTHER', label: 'Something else' },
];

export default function ReportPrayerContentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ targetType?: string; targetId?: string }>();
  const targetType = params.targetType === 'COMMENT' ? 'COMMENT' : 'REQUEST';
  const targetId = typeof params.targetId === 'string' ? params.targetId : '';
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function send() {
    if (!reason || !targetId || busy) return;
    setBusy(true);
    setError('');
    try {
      await reportPrayerContent({ targetType: targetType as ReportTarget, targetId, reason, details });
      setDone(true);
    } catch (err) {
      setError(getUserFacingError(err, {
        fallback: 'We couldn’t submit your report. Please try again.',
        networkMessage: 'Connect to the internet and try again.',
      }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={colors.primaryDark} />
        </Pressable>
        <Flag size={26} color={colors.primary} />
        <Text style={styles.heading}>{done ? 'Report received' : 'Report content'}</Text>
        {done ? (
          <>
            <Text style={styles.info}>Thank you. Our moderation team can now review your report.</Text>
            <Pressable onPress={() => router.back()} style={styles.submit}>
              <Text style={styles.submitText}>Done</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.info}>Tell us what is wrong with this {targetType === 'COMMENT' ? 'comment' : 'prayer request'}. Reports are reviewed by our moderation team.</Text>
            {REASONS.map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                onPress={() => setReason(item.value)}
                style={[styles.reason, reason === item.value && styles.selected]}
              >
                <Text style={styles.reasonText}>{item.label}</Text>
                <Text style={styles.reasonText}>{reason === item.value ? '●' : '○'}</Text>
              </Pressable>
            ))}
            <Text style={styles.label}>More details (optional)</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              maxLength={500}
              placeholder="Give a little more context…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.input}
            />
            <InlineErrorMessage message={error} />
            <Pressable disabled={!reason || !targetId || busy} onPress={() => void send()} style={[styles.submit, (!reason || !targetId || busy) && styles.disabled]}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Submit Report</Text>}
            </Pressable>
            <Pressable onPress={() => void Linking.openURL('mailto:support@prayinverses.com')}>
              <Text style={styles.contact}>Contact support@prayinverses.com</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: spacing.md },
  heading: { fontSize: 27, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.md },
  info: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.lg },
  reason: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: spacing.sm },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  reasonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  label: { color: colors.primaryDark, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { minHeight: 98, padding: spacing.md, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.primaryDark },
  submit: { minHeight: 54, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  disabled: { opacity: 0.45 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  contact: { textAlign: 'center', color: colors.primary, fontSize: 12, marginTop: spacing.lg },
});
