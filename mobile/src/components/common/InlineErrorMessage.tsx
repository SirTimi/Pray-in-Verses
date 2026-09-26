import {
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { CircleAlert } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

type InlineErrorMessageProps = {
  message: string;
  title?: string;
  style?: ViewStyle;
};

export default function InlineErrorMessage({
  message,
  title,
  style,
}: InlineErrorMessageProps) {
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, style]}
    >
      <CircleAlert size={19} color={colors.error} strokeWidth={2} />
      <View style={styles.copy}>
        {!!title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F4C7C3',
    borderRadius: radius.md,
    backgroundColor: '#FFF5F4',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#8F1D14',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
});
