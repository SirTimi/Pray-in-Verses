import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppBottomNavigation from '@/components/navigation/AppBottomNavigation';

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <SafeAreaProvider style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SafeAreaProvider>
      <AppBottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stack: { flex: 1 },
});
