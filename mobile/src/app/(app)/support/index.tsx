import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  Mail,
  MessageCircleQuestion,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

const SUPPORT_EMAIL = 'info@prayinverses.com';
const WEBSITE = 'https://prayinverses.com';

export default function SupportScreen() {
  const router = useRouter();

  const emailSupport = async () => {
    const url =
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        'Pray in Verses Support',
      )}`;

    await Linking.openURL(url);
  };

  const openWebsite = async () => {
    await WebBrowser.openBrowserAsync(
      WEBSITE,
    );
  };

  const openDonationPolicy = async () => {
    await WebBrowser.openBrowserAsync(
      `${WEBSITE}/donation-policy`,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
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
            Help & Support
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MessageCircleQuestion
              size={30}
              color={colors.primary}
            />
          </View>
          <Text style={styles.heroTitle}>
            How can we help?
          </Text>
          <Text style={styles.heroBody}>
            Questions, feedback or a problem with Pray in Verses? Reach the team directly.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          GET HELP
        </Text>

        <View style={styles.card}>
          <SupportRow
            icon={Mail}
            title="Email Support"
            subtitle={SUPPORT_EMAIL}
            onPress={emailSupport}
          />
          <Divider />
          <SupportRow
            icon={Globe}
            title="Visit Pray in Verses"
            subtitle="prayinverses.com"
            onPress={openWebsite}
          />
        </View>

        <Text style={styles.sectionLabel}>
          SUPPORT THE MISSION
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push(
              '/(app)/support/donate',
            )
          }
          style={styles.missionCard}
        >
          <View style={styles.missionIcon}>
            <Heart
              size={26}
              color={colors.primary}
            />
          </View>
          <View style={styles.missionCopy}>
            <Text style={styles.missionTitle}>
              Make a voluntary donation
            </Text>
            <Text style={styles.missionBody}>
              Help with hosting, development, maintenance and ministry-focused improvements. Every feature remains free whether you donate or not.
            </Text>
            <Text style={styles.missionAction}>
              Support Pray in Verses
            </Text>
          </View>
          <ExternalLink
            size={19}
            color={colors.primary}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={openDonationPolicy}
          style={styles.policyRow}
        >
          <FileText
            size={19}
            color={colors.textSecondary}
          />
          <Text style={styles.policyText}>
            Read the Donation Policy
          </Text>
          <ExternalLink
            size={17}
            color={colors.textMuted}
          />
        </Pressable>

        <Text style={styles.footerText}>
          Pray in Verses does not currently operate as a registered charity or non-profit. Donations may not be tax-deductible.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type SupportRowProps = {
  icon: typeof Mail;
  title: string;
  subtitle: string;
  onPress: () => void | Promise<void>;
};

function SupportRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: SupportRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void onPress()}
      style={styles.row}
    >
      <View style={styles.rowIcon}>
        <Icon
          size={21}
          color={colors.primary}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>
        <Text style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>
      <ExternalLink
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.lg,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.base,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  heroBody: {
    marginTop: spacing.sm,
    maxWidth: 330,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rowSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    backgroundColor: colors.border,
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: '#F5E39A',
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  missionCopy: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  missionBody: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  missionAction: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  policyRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  policyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerText: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
