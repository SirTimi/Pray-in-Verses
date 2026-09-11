import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlarmClock,
  Bell,
  Bookmark,
  ChevronRight,
  CircleHelp,
  FileText,
  Heart,
  LogOut,
  NotebookPen,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { getMe, logout } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setUser(await getMe());
    } catch {
      // Keep the last known user while a transient refresh fails.
    } finally {
      setRefreshing(false);
    }
  }, [setUser]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  function confirmLogout() {
    Alert.alert('Log out?', 'You will need to sign in again to continue praying.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => void performLogout() },
    ]);
  }

  async function performLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Clear local app state even if the network request fails.
    } finally {
      setUser(null);
      setLoggingOut(false);
      router.replace('/(auth)/login');
    }
  }

  async function openWebsite(path: string) {
    try {
      await Linking.openURL(`https://prayinverses.com${path}`);
    } catch {
      Alert.alert('Unable to open page', 'Please try again when you have an internet connection.');
    }
  }

  const initial = user?.displayName?.trim().slice(0, 1).toUpperCase() || 'P';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}
      >
        <Text style={styles.pageTitle}>Profile & Settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <View style={styles.profileText}>
            <Text numberOfLines={1} style={styles.name}>{user?.displayName || 'Pray in Verses User'}</Text>
            <Text numberOfLines={1} style={styles.email}>{user?.email || 'Signed in account'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<UserRound size={20} color={colors.primary} />}
            title="Account"
            subtitle="Profile details and password security"
            onPress={() => router.push('/(app)/account')}
          />
          <SettingsRow icon={<Bookmark size={20} color={colors.primary} />} title="Saved Prayers" subtitle="View and manage your saved prayers" onPress={() => router.push('/(app)/saved')} />
          <SettingsRow icon={<NotebookPen size={20} color={colors.primary} />} title="Journal" subtitle="Your prayer journal entries" onPress={() => router.push('/(app)/journal')} />
          <SettingsRow icon={<Bell size={20} color={colors.primary} />} title="Notifications" subtitle="Announcements and Pray in Verses updates" onPress={() => router.push('/(app)/notifications')} />
          <SettingsRow icon={<AlarmClock size={20} color={colors.primary} />} title="Prayer Reminders" subtitle="Schedule recurring prayer times on this device" onPress={() => router.push('/(app)/reminders')} />
          <SettingsRow icon={<CircleHelp size={20} color={colors.primary} />} title="Help & Support" subtitle="Contact the Pray in Verses team" onPress={() => router.push('/(app)/support')} />
          <SettingsRow icon={<Heart size={20} color={colors.primary} />} title="Support the Mission" subtitle="Make a voluntary donation through Paystack" onPress={() => router.push('/(app)/support/donate')} />
          <SettingsRow icon={<ShieldCheck size={20} color={colors.primary} />} title="Privacy Policy" subtitle="Read our privacy policy" onPress={() => void openWebsite('/privacy-policy')} />
          <SettingsRow icon={<FileText size={20} color={colors.primary} />} title="Terms of Service" subtitle="Read our terms of service" onPress={() => void openWebsite('/terms-of-service')} />
        </View>

        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>DEVELOPMENT</Text>
            <SettingsRow icon={<FileText size={20} color={colors.primary} />} title="App States" subtitle="Review empty, loading and error states" onPress={() => router.push('/(app)/states')} />
          </View>
        )}

        <Pressable onPress={confirmLogout} disabled={loggingOut} style={styles.logoutButton}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>{loggingOut ? 'Logging out…' : 'Log Out'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type SettingsRowProps = { icon: ReactNode; title: string; subtitle: string; onPress: () => void };

function SettingsRow({ icon, title, subtitle, onPress }: SettingsRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={19} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: 34 },
  pageTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  avatar: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE8FF' },
  avatarText: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 25, fontWeight: '700' },
  profileText: { flex: 1 },
  name: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 19, fontWeight: '700' },
  email: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  rowPressed: { backgroundColor: colors.primarySoft },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3FF' },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  rowSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  devSection: { marginTop: spacing.xl },
  devLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: spacing.sm },
  logoutButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, borderWidth: 1, borderColor: '#F3C7C2', borderRadius: radius.md, backgroundColor: '#FFF1F0' },
  logoutText: { color: colors.error, fontSize: 14, fontWeight: '800' },
});
