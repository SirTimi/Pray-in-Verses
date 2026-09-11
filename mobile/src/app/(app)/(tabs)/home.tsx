import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  BookOpen,
  ChevronRight,
  Heart,
  Search,
  Sparkles,
  UsersRound,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import {
  getPrayerWallPreview,
  getVerseOfTheDay,
  type PrayerWallPreview,
  type VerseOfTheDay,
} from '@/services/browse';
import { useAuthStore } from '@/stores/auth.store';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  const [wall, setWall] = useState<PrayerWallPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [dailyVerse, recentRequests] = await Promise.all([
        getVerseOfTheDay(),
        getPrayerWallPreview(3),
      ]);
      setVerse(dailyVerse);
      setWall(recentRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your home feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'Friend';

  const openVerse = () => {
    if (!verse) return;
    router.push({
      pathname: '/(app)/(tabs)/browse/[book]/[chapter]',
      params: {
        book: verse.book,
        chapter: String(verse.chapter),
        verse: String(verse.verse),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.hillOne} />
          <View style={styles.hillTwo} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={styles.bellButton}
              onPress={() => router.push('/(app)/(tabs)/more')}
            >
              <Bell size={21} color={colors.white} />
            </Pressable>
          </View>

          <Text style={styles.heroLine}>A new day. A new verse.</Text>
          <Text style={styles.heroLine}>A deeper prayer life.</Text>
        </View>

        <View style={styles.main}>
          <View style={styles.dailyCard}>
            <Text style={styles.sectionEyebrow}>VERSE OF THE DAY</Text>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.mutedText}>Loading today’s Scripture…</Text>
              </View>
            ) : verse ? (
              <Pressable onPress={openVerse} style={styles.dailyPressable}>
                <View style={styles.dailyIcon}>
                  <BookOpen size={24} color={colors.primaryDark} />
                </View>
                <View style={styles.dailyTextBlock}>
                  <Text style={styles.dailyReference}>
                    {verse.book} {verse.chapter}:{verse.verse}
                  </Text>
                  <Text numberOfLines={3} style={styles.dailyScripture}>
                    “{verse.scriptureText}”
                  </Text>
                </View>
                <View style={styles.circleArrow}>
                  <ChevronRight size={18} color={colors.primary} />
                </View>
              </Pressable>
            ) : (
              <Text style={styles.mutedText}>No published verse is available yet.</Text>
            )}
          </View>

          {!!error && (
            <Pressable style={styles.errorBox} onPress={() => void load()}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retryText}>Tap to try again</Text>
            </Pressable>
          )}

          <Text style={styles.sectionEyebrow}>BROWSE SCRIPTURE</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              label="Bible Books"
              icon={<BookOpen size={24} color={colors.primary} />}
              onPress={() => router.push('/(app)/(tabs)/browse')}
            />
            <QuickAction
              label="Search"
              icon={<Search size={24} color={colors.primary} />}
              onPress={() => router.push('/(app)/(tabs)/browse/search')}
            />
            <QuickAction
              label="Daily Verse"
              icon={<Sparkles size={24} color="#C58A00" />}
              onPress={openVerse}
            />
            <QuickAction
              label="Prayer Wall"
              icon={<UsersRound size={24} color="#D44755" />}
              onPress={() => router.push('/(app)/(tabs)/community')}
            />
          </View>

          <View style={styles.twoCards}>
            <Pressable style={[styles.featureCard, styles.savedCard]} onPress={() => router.push('/(app)/(tabs)/more')}>
              <Heart size={22} color="#C58A00" />
              <Text style={styles.featureTitle}>Saved Prayers</Text>
              <Text style={styles.featureBody}>Your prayer library</Text>
            </Pressable>
            <Pressable style={[styles.featureCard, styles.journalCard]} onPress={() => router.push('/(app)/(tabs)/more')}>
              <BookOpen size={22} color="#2A7582" />
              <Text style={styles.featureTitle}>Journal</Text>
              <Text style={styles.featureBody}>Record what God is doing</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionEyebrow}>RECENT PRAYER WALL REQUESTS</Text>
            <Pressable onPress={() => router.push('/(app)/(tabs)/community')}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          {wall.length === 0 && !loading ? (
            <View style={styles.emptyWall}>
              <Text style={styles.mutedText}>No prayer requests to show yet.</Text>
            </View>
          ) : (
            wall.map((request) => (
              <Pressable
                key={request.id}
                style={styles.wallCard}
                onPress={() => router.push('/(app)/(tabs)/community')}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{request.anonymous ? '🙏' : request.title.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.wallBody}>
                  <Text style={styles.wallTitle}>{request.title}</Text>
                  <Text numberOfLines={2} style={styles.wallDescription}>{request.description}</Text>
                  <Text style={styles.wallMeta}>♥ {request._count?.likes ?? 0} prayers</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type QuickActionProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

function QuickAction({ label, icon, onPress }: QuickActionProps) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primaryDark },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  hero: {
    height: 225,
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  sun: {
    position: 'absolute', width: 210, height: 210, borderRadius: 105,
    backgroundColor: '#F6C453', opacity: 0.28, right: -50, bottom: -55,
  },
  hillOne: {
    position: 'absolute', width: 350, height: 120, borderRadius: 180,
    backgroundColor: '#315B8E', left: -130, bottom: -58, transform: [{ rotate: '-7deg' }],
  },
  hillTwo: {
    position: 'absolute', width: 390, height: 145, borderRadius: 210,
    backgroundColor: '#183F73', right: -160, bottom: -72, transform: [{ rotate: '8deg' }],
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { color: 'rgba(255,255,255,0.86)', fontSize: 16, lineHeight: 22 },
  name: { color: colors.white, fontFamily: SERIF_FONT, fontSize: 31, lineHeight: 37, fontWeight: '700' },
  bellButton: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  heroLine: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20 },
  main: { paddingHorizontal: spacing.base, marginTop: -42 },
  dailyCard: {
    borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.base,
    shadowColor: '#0B1F4D', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 4,
    marginBottom: spacing.xl,
  },
  sectionEyebrow: { color: '#52627B', fontSize: 10, fontWeight: '800', letterSpacing: 1.35 },
  dailyPressable: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  dailyIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft },
  dailyTextBlock: { flex: 1 },
  dailyReference: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 19, lineHeight: 24, fontWeight: '700' },
  dailyScripture: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
  circleArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  mutedText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  errorBox: { backgroundColor: '#FFF1F0', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 5 },
  actionsGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  actionCard: { flex: 1, alignItems: 'center' },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionLabel: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 7 },
  twoCards: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  featureCard: { flex: 1, minHeight: 112, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1 },
  savedCard: { backgroundColor: '#FFF9E7', borderColor: '#F7E5A5' },
  journalCard: { backgroundColor: '#F2FAFB', borderColor: '#D7ECEF' },
  featureTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  featureBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  viewAll: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  wallCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDE8FF' },
  avatarText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  wallBody: { flex: 1 },
  wallTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  wallDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  wallMeta: { color: '#D44755', fontSize: 11, fontWeight: '700', marginTop: 5 },
  emptyWall: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
