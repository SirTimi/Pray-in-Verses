import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  CirclePlus,
  House,
  UserRound,
  UsersRound,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';

type NavKey = 'home' | 'browse' | 'pray' | 'community' | 'profile';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    href: '/(app)/(tabs)/home',
    icon: House,
  },
  {
    key: 'browse',
    label: 'Browse',
    href: '/(app)/(tabs)/browse',
    icon: BookOpen,
  },
  {
    key: 'pray',
    label: 'Pray',
    href: '/(app)/(tabs)/pray',
    icon: CirclePlus,
  },
  {
    key: 'community',
    label: 'Community',
    href: '/(app)/(tabs)/community',
    icon: UsersRound,
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/(app)/(tabs)/more',
    icon: UserRound,
  },
] as const;

function activeKeyForPath(pathname: string): NavKey {
  if (pathname.startsWith('/browse')) return 'browse';

  if (pathname.startsWith('/community') || pathname.startsWith('/prayer-wall')) {
    return 'community';
  }

  if (
    pathname === '/pray'
    || pathname.startsWith('/prayer/')
    || pathname.startsWith('/journal')
    || pathname.startsWith('/my-prayers')
    || pathname.startsWith('/saved')
    || pathname.startsWith('/reminders')
  ) {
    return 'pray';
  }

  if (
    pathname.startsWith('/more')
    || pathname.startsWith('/account')
    || pathname.startsWith('/support')
    || pathname.startsWith('/notifications')
  ) {
    return 'profile';
  }

  return 'home';
}

export default function AppBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  const activeKey = activeKeyForPath(pathname);
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <View
      style={[
        styles.navigation,
        {
          height: 62 + bottomInset,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const active = activeKey === item.key;
        const color = active ? colors.primary : '#7C879D';
        const Icon = item.icon;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => router.replace(item.href)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Icon size={23} color={color} strokeWidth={2} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    elevation: 10,
    shadowColor: '#0B1F4D',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  itemPressed: {
    opacity: 0.72,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
});
