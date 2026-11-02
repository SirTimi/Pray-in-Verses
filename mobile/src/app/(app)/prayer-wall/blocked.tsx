import { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldBan } from 'lucide-react-native';
import AppStateView from '@/components/common/AppStateView';
import InlineErrorMessage from '@/components/common/InlineErrorMessage';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { listBlockedAccounts, unblockAccount, type BlockedAccount } from '@/services/prayer-wall';
import { getUserFacingError } from '@/services/user-facing-error';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const [items, setItems] = useState<BlockedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await listBlockedAccounts();
      setItems(result.data);
    } catch (err) {
      setError(getUserFacingError(err, { fallback: 'Could not load blocked accounts.' }));
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); void load(); }, [load]));

  function confirmUnblock(block: BlockedAccount) {
    Alert.alert('Unblock this account?', 'Their content may appear in your Prayer Wall again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', onPress: () => void (async () => {
        setBusy(block.id); setError('');
        try { await unblockAccount(block.id); await load(); }
        catch (err) { setError(getUserFacingError(err, { fallback: 'Could not unblock this account.' })); }
        finally { setBusy(''); }
      })() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={colors.primaryDark}/>
        </Pressable>
        <ShieldBan size={26} color={colors.primary} />
        <Text style={styles.title}>Blocked Users</Text>
        <Text style={styles.info}>You won't see content from blocked accounts. To protect anonymous prayers, blocked account identities are not shown here.</Text>
        <InlineErrorMessage message={error} />
        {loading ? <ActivityIndicator color={colors.primary} /> : error && !items.length
          ? <AppStateView variant="error" title="Couldn't load blocks" body={error} actionLabel="Try Again" onAction={() => {setLoading(true);void load();}} />
          : items.length === 0
            ? <Text style={styles.info}>You haven't blocked anyone.</Text>
            : items.map((item, index) => (
              <View key={item.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>Blocked account {index + 1}</Text>
                  <Text style={styles.date}>Blocked {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => confirmUnblock(item)}>
                  <Text style={styles.unblock}>{busy === item.id ? 'Unblocking…' : 'Unblock'}</Text>
                </Pressable>
              </View>
            ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { height: 44, width: 44, justifyContent: 'center' },
  title: { marginTop: spacing.md, fontSize: 27, fontWeight: '800', color: colors.primaryDark },
  info: { marginVertical: spacing.md, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  row: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  unblock: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});
