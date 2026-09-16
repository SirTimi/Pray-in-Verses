import { Tabs } from 'expo-router';

export default function AppTabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="pray" options={{ title: 'Pray' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="more" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
