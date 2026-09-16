import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppBottomNavigation from '@/components/navigation/AppBottomNavigation';

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
      <AppBottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stack: { flex: 1 },
});
