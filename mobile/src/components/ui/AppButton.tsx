import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';

type ButtonVariant =
  | 'primary'
  | 'secondary';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const isPrimary =
    variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,

        isPrimary
          ? styles.primary
          : styles.secondary,

        pressed &&
          !disabled &&
          styles.pressed,

        (disabled || loading) &&
          styles.disabled,

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isPrimary
              ? colors.white
              : colors.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.label,

            isPrimary
              ? styles.primaryLabel
              : styles.secondaryLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      minHeight: 54,
      width: '100%',
      borderRadius: radius.md,

      alignItems: 'center',
      justifyContent: 'center',

      paddingHorizontal: 20,
    },

    primary: {
      backgroundColor:
        colors.primary,
    },

    secondary: {
      backgroundColor:
        colors.surface,

      borderWidth: 1.5,
      borderColor:
        colors.primary,
    },

    pressed: {
      opacity: 0.86,
      transform: [
        {
          scale: 0.995,
        },
      ],
    },

    disabled: {
      opacity: 0.5,
    },

    label: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
    },

    primaryLabel: {
      color: colors.white,
    },

    secondaryLabel: {
      color: colors.primary,
    },
  });