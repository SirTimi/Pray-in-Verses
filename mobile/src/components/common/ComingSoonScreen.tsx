import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  icon: ReactNode;
};

export default function ComingSoonScreen({ eyebrow, title, body, icon }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 72,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.primaryDark,
    fontFamily: SERIF_FONT,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 25,
    marginTop: spacing.md,
    maxWidth: 340,
  },
});
