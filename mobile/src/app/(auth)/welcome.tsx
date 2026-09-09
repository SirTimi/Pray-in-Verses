import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useRouter,
} from 'expo-router';

import AppButton
  from '@/components/ui/AppButton';

import {
  colors,
} from '@/constants/colors';

import {
  radius,
  spacing,
} from '@/constants/spacing';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        {/* Decorative background */}
        <View
          style={styles.goldGlow}
        />

        <View
          style={styles.blueGlow}
        />

        {/* Brand */}
        <View
          style={styles.brand}
        >
          <View
            style={styles.logoContainer}
          >
            <Image
              source={require(
                '../../../assets/images/icon.png',
              )}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>

          <Text
            style={styles.brandName}
          >
            PRAY IN VERSES
          </Text>
        </View>

        {/* Main message */}
        <View
          style={styles.content}
        >
          <View
            style={styles.eyebrow}
          >
            <View
              style={styles.eyebrowDot}
            />

            <Text
              style={styles.eyebrowText}
            >
              SCRIPTURE-CENTERED PRAYER
            </Text>
          </View>

          <Text
            style={styles.title}
          >
            Turn Scripture
            {'\n'}
            into prayer.
          </Text>

          <Text
            style={styles.description}
          >
            Discover prayers rooted in
            every verse, build your
            personal prayer life and
            keep track of what God is
            doing.
          </Text>
        </View>

        {/* Actions */}
        <View
          style={styles.actions}
        >
          <AppButton
            label="Create an account"
            onPress={() =>
              router.push(
                '/(auth)/signup',
              )
            }
          />

          <AppButton
            label="I already have an account"
            variant="secondary"
            onPress={() =>
              router.push(
                '/(auth)/login',
              )
            }
          />

          <Text
            style={styles.footer}
          >
            Scripture. Prayer.
            A more focused you.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      flex: 1,

      paddingHorizontal:
        spacing.xl,

      paddingTop:
        spacing.lg,

      paddingBottom:
        spacing.xl,

      overflow: 'hidden',
    },

    goldGlow: {
      position: 'absolute',

      width: 230,
      height: 230,

      borderRadius: 115,

      backgroundColor:
        colors.goldSoft,

      top: -90,
      right: -90,

      opacity: 0.75,
    },

    blueGlow: {
      position: 'absolute',

      width: 260,
      height: 260,

      borderRadius: 130,

      backgroundColor:
        colors.primarySoft,

      bottom: 90,
      left: -180,

      opacity: 0.7,
    },

    brand: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: spacing.md,
    },

    logoContainer: {
      width: 48,
      height: 48,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.surface,

      alignItems: 'center',
      justifyContent:
        'center',

      shadowColor:
        colors.primaryDark,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.08,
      shadowRadius: 12,

      elevation: 3,
    },

    logo: {
      width: 38,
      height: 38,
    },

    brandName: {
      color:
        colors.primary,

      fontSize: 15,

      fontWeight: '800',

      letterSpacing: 1.5,
    },

    content: {
      flex: 1,

      justifyContent:
        'center',

      paddingBottom: 20,
    },

    eyebrow: {
      alignSelf:
        'flex-start',

      flexDirection: 'row',
      alignItems: 'center',

      gap: spacing.sm,

      backgroundColor:
        colors.primarySoft,

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.sm,

      borderRadius:
        radius.round,

      marginBottom:
        spacing.xl,
    },

    eyebrowDot: {
      width: 7,
      height: 7,

      borderRadius: 4,

      backgroundColor:
        colors.gold,
    },

    eyebrowText: {
      color:
        colors.primary,

      fontSize: 11,

      lineHeight: 15,

      fontWeight: '800',

      letterSpacing: 0.7,
    },

    title: {
      color:
        colors.primaryDark,

      fontSize: 42,

      lineHeight: 48,

      letterSpacing: -1.3,

      fontWeight: '800',

      maxWidth: 340,
    },

    description: {
      color:
        colors.textSecondary,

      fontSize: 16,

      lineHeight: 25,

      marginTop:
        spacing.lg,

      maxWidth: 350,
    },

    actions: {
      gap: spacing.md,
    },

    footer: {
      color:
        colors.textMuted,

      fontSize: 12,

      lineHeight: 18,

      textAlign: 'center',

      marginTop:
        spacing.sm,
    },
  });