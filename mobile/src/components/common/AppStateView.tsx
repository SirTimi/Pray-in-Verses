import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { CircleAlert, FileText } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

type AppStateVariant = 'empty' | 'loading' | 'error';

type AppStateViewProps = {
  variant: AppStateVariant;
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  style?: ViewStyle;
};

export default function AppStateView({
  variant,
  title,
  body,
  actionLabel,
  onAction,
  icon,
  style,
}: AppStateViewProps) {
  const resolvedTitle = title ?? (variant === 'empty' ? 'Nothing here yet' : variant === 'loading' ? 'Loading…' : 'Something went wrong');
  const resolvedBody = body ?? (variant === 'empty' ? 'There is no content to show yet.' : variant === 'loading' ? 'Please wait while we fetch your content.' : 'We could not load your content. Please try again.');

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconBox, variant === 'error' && styles.errorIconBox]}>
        {variant === 'loading' ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : icon ? (
          icon
        ) : variant === 'error' ? (
          <CircleAlert size={30} color={colors.error} />
        ) : (
          <FileText size={30} color={colors.primary} />
        )}
      </View>
      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.body}>{resolvedBody}</Text>
      {!!actionLabel && !!onAction && variant !== 'loading' && (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  iconBox: { width: 66, height: 66, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: spacing.lg },
  errorIconBox: { backgroundColor: '#FFF1F0' },
  title: { color: colors.primaryDark, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 290, marginTop: spacing.sm },
  actionButton: { minHeight: 44, minWidth: 160, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary, marginTop: spacing.lg },
  actionText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
