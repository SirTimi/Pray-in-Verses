import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  colors,
} from '@/constants/colors';

import {
  useAuthStore,
} from '@/stores/auth.store';

export default function HomePlaceholder() {
  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        <Text
          style={styles.small}
        >
          PRAY IN VERSES
        </Text>

        <Text
          style={styles.title}
        >
          Welcome
          {user?.displayName
            ? `, ${user.displayName}`
            : ''}
          .
        </Text>

        <Text
          style={styles.body}
        >
          Authentication is
          connected.
        </Text>
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

      justifyContent:
        'center',

      padding: 24,
    },

    small: {
      color:
        colors.primary,

      fontSize: 12,
      fontWeight: '800',

      letterSpacing: 1.4,

      marginBottom: 12,
    },

    title: {
      color:
        colors.primaryDark,

      fontSize: 36,
      fontWeight: '800',
    },

    body: {
      color:
        colors.textSecondary,

      fontSize: 16,

      marginTop: 12,
    },
  });