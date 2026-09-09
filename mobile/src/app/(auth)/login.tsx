import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
} from '@/constants/colors';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Login coming next
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        colors.background,
    },

    text: {
      color:
        colors.primary,

      fontSize: 20,
      fontWeight: '700',
    },
  });