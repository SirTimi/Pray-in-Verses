import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import AppStateView from '@/components/common/AppStateView';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export default function AppStatesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.title}>App States</Text>
          <View style={styles.backButton} />
        </View>

        <Text style={styles.label}>EMPTY STATE</Text>
        <AppStateView
          variant="empty"
          title="No saved prayers yet"
          body="Start praying with God’s Word and save your favorite prayers here."
          actionLabel="Explore Verses"
          onAction={() => router.push('/(app)/(tabs)/browse')}
        />

        <Text style={styles.label}>LOADING STATE</Text>
        <AppStateView variant="loading" title="Loading…" body="Please wait while we fetch your content." />

        <Text style={styles.label}>ERROR STATE</Text>
        <AppStateView
          variant="error"
          title="Something went wrong"
          body="We couldn’t load your content. Please try again."
          actionLabel="Try Again"
          onAction={() => undefined}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 25, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: spacing.lg, marginBottom: spacing.sm },
});
