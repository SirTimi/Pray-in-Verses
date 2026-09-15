import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
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
      pathname: '/(app)/prayer/[book]/[chapter]/[verse]',
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
        <ImageBackground
          source={require('../../../../assets/images/home/hero-prayer-group.jpg')}
          resizeMode="cover"
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroBottomShade} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text numberOfLines={1} style={styles.name}>{firstName}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/notifications')}
              >
                <Bell size={21} color={colors.white} strokeWidth={1.9} />
              </Pressable>
            </View>

            <Text style={styles.heroLine}>A new day. A new verse. A deeper prayer life.</Text>
          </View>
        </ImageBackground>

        <View style={styles.main}>
          <View style={styles.dailyCard}>
            <View style={styles.dailyHeaderRow}>
              <View style={styles.dailyEyebrowWrap}>
                <View style={styles.goldDot} />
                <Text style={styles.sectionEyebrow}>VERSE OF THE DAY</Text>
              </View>
              <Text style={styles.todayLabel}>TODAY</Text>
            </View>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.mutedText}>Loading today’s Scripture…</Text>
              </View>
            ) : verse ? (
              <Pressable
                onPress={openVerse}
                style={({ pressed }) => [styles.dailyPressable, pressed && styles.pressed]}
              >
                <View style={styles.dailyIcon}>
                  <BookOpen size={25} color={colors.primaryDark} strokeWidth={1.9} />
                </View>
                <View style={styles.dailyTextBlock}>
                  <Text style={styles.dailyReference}>
                    {verse.book} {verse.chapter}:{verse.verse}
                  </Text>
                  <Text numberOfLines={3} style={styles.dailyScripture}>
                    “{verse.scriptureText}”
                  </Text>
                  <View style={styles.readRow}>
                    <Text style={styles.readText}>Read & pray</Text>
                    <ChevronRight size={14} color={colors.primary} strokeWidth={2.2} />
                  </View>
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

          <SectionHeading title="Browse Scripture" />
          <View style={styles.actionsGrid}>
            <QuickAction
              label="Bible Books"
              tint="#EEF3FF"
              icon={<BookOpen size={24} color={colors.primary} strokeWidth={1.9} />}
              onPress={() => router.push('/(app)/(tabs)/browse')}
            />
            <QuickAction
              label="Search"
              tint="#F1F5FF"
              icon={<Search size={24} color={colors.primary} strokeWidth={1.9} />}
              onPress={() => router.push('/(app)/(tabs)/browse/search')}
            />
            <QuickAction
              label="Daily Verse"
              tint="#FFF8DF"
              icon={<Sparkles size={24} color="#B77A00" strokeWidth={1.9} />}
              onPress={openVerse}
            />
            <QuickAction
              label="Prayer Wall"
              tint="#FFF0F1"
              icon={<UsersRound size={24} color="#C94150" strokeWidth={1.9} />}
              onPress={() => router.push('/(app)/(tabs)/community')}
            />
          </View>

          <View style={styles.twoCards}>
            <Pressable
              style={({ pressed }) => [styles.featureCard, styles.savedCard, pressed && styles.pressed]}
              onPress={() => router.push('/(app)/saved')}
            >
              <View style={styles.featureTopRow}>
                <View style={[styles.featureIcon, styles.savedIcon]}>
                  <Heart size={21} color="#B77A00" strokeWidth={1.9} />
                </View>
                <ChevronRight size={17} color="#A18A4C" />
              </View>
              <Text style={styles.featureTitle}>Saved Prayers</Text>
              <Text style={styles.featureBody}>Return to the prayers that spoke to you.</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.featureCard, styles.journalCard, pressed && styles.pressed]}
              onPress={() => router.push('/(app)/journal')}
            >
              <View style={styles.featureTopRow}>
                <View style={[styles.featureIcon, styles.journalIcon]}>
                  <BookOpen size={21} color="#2A7582" strokeWidth={1.9} />
                </View>
                <ChevronRight size={17} color="#6F979D" />
              </View>
              <Text style={styles.featureTitle}>Journal</Text>
              <Text style={styles.featureBody}>Record what God is doing in your prayer life.</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Support the Mission"
            style={({ pressed }) => [styles.supportCard, pressed && styles.pressed]}
            onPress={() => router.push('/(app)/support/donate')}
          >
            <View style={styles.supportGlow} />
            <View style={styles.supportLogoWrap}>
              <Image
                source={require('../../../../assets/images/PIV-logo.png')}
                resizeMode="contain"
                style={styles.supportLogo}
              />
            </View>
            <View style={styles.supportCopy}>
              <Text style={styles.supportEyebrow}>SUPPORT PRAY IN VERSES</Text>
              <Text style={styles.supportTitle}>Support the Mission</Text>
              <Text style={styles.supportBody}>Help keep Scripture-led prayer resources free and growing.</Text>
            </View>
            <View style={styles.supportArrow}>
              <ChevronRight size={18} color={colors.white} />
            </View>
          </Pressable>

          <View style={styles.sectionHeaderRow}>
            <SectionHeading title="Recent Prayer Wall Requests" compact />
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
                style={({ pressed }) => [styles.wallCard, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/(tabs)/community')}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {request.anonymous ? 'A' : request.title.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.wallBody}>
                  <Text numberOfLines={1} style={styles.wallTitle}>{request.title}</Text>
                  <Text numberOfLines={2} style={styles.wallDescription}>{request.description}</Text>
                  <View style={styles.wallMetaRow}>
                    <Heart size={13} color="#D44755" fill="#D44755" />
                    <Text style={styles.wallMeta}>{request._count?.likes ?? 0} prayers</Text>
                  </View>
                </View>
                <View style={styles.wallChevron}>
                  <ChevronRight size={17} color={colors.textMuted} />
                </View>
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
  tint: string;
  onPress: () => void;
};

function QuickAction({ label, icon, tint, onPress }: QuickActionProps) {
  return (
    <Pressable style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function SectionHeading({ title, compact = false }: { title: string; compact?: boolean }) {
  return <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>{title}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primaryDark },
  scroll: { flex: 1, backgroundColor: '#FFFDF8' },
  content: { paddingBottom: 132 },
  pressed: { opacity: 0.82 },

  hero: {
    height: 250,
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
  },
  heroImage: {
    transform: [{ scale: 1.03 }],
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 28, 80, 0.64)',
  },
  heroBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    backgroundColor: 'rgba(5, 22, 60, 0.22)',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    paddingRight: spacing.lg,
    marginTop: 34,
  },
  greeting: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  name: {
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 35,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(7,28,80,0.48)',
  },
  heroLine: {
    maxWidth: 285,
    marginTop: 8,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  main: { paddingHorizontal: spacing.base, marginTop: -46 },
  dailyCard: {
    borderWidth: 1,
    borderColor: '#ECE7DD',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0B1F4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 5,
    marginBottom: 28,
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyEyebrowWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goldDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E1AC17' },
  sectionEyebrow: { color: '#56657A', fontSize: 10, fontWeight: '900', letterSpacing: 1.45 },
  todayLabel: { color: '#A3ABBA', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  dailyPressable: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 15 },
  dailyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8D9',
  },
  dailyTextBlock: { flex: 1 },
  dailyReference: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
  },
  dailyScripture: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 4 },
  readRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  readText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  mutedText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  errorBox: { backgroundColor: '#FFF1F0', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 5 },

  sectionTitle: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    marginBottom: 14,
  },
  sectionTitleCompact: { fontSize: 16, marginBottom: 0 },
  actionsGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  actionCard: { flex: 1, alignItems: 'center' },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E7E4',
  },
  actionLabel: {
    color: colors.primaryDark,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },

  twoCards: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  featureCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  savedCard: { backgroundColor: '#FFF9E8', borderColor: '#F3E2A3' },
  journalCard: { backgroundColor: '#F1FAFB', borderColor: '#D4EBEE' },
  featureTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  savedIcon: { backgroundColor: '#FFF2BC' },
  journalIcon: { backgroundColor: '#DFF2F4' },
  featureTitle: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 14,
  },
  featureBody: { color: colors.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 4 },

  supportCard: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: colors.primaryDark,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#0B1F4D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 4,
  },
  supportGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -44,
    top: -72,
    backgroundColor: '#FCCF3A',
    opacity: 0.10,
  },
  supportLogoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFEF8',
  },
  supportLogo: { width: 49, height: 49 },
  supportCopy: { flex: 1 },
  supportEyebrow: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.15 },
  supportTitle: {
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  supportBody: { color: 'rgba(255,255,255,0.74)', fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  supportArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  sectionHeaderRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewAll: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  emptyWall: {
    borderWidth: 1,
    borderColor: '#ECE7DD',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
  },
  wallCard: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECE7DD',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FF',
  },
  avatarText: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 17, fontWeight: '700' },
  wallBody: { flex: 1 },
  wallTitle: { color: colors.primaryDark, fontFamily: SERIF_FONT, fontSize: 15, fontWeight: '700' },
  wallDescription: { color: colors.textSecondary, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  wallMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  wallMeta: { color: '#B33E4B', fontSize: 10.5, fontWeight: '700' },
  wallChevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
});