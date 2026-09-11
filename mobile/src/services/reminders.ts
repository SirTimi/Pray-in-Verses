import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const INDEX_KEY = 'piv.reminders.index';
const REMINDER_KEY_PREFIX = 'piv.reminder.';
const REMINDER_CHANNEL_ID = 'prayer-reminders';

export type PrayerReminder = {
  id: string;
  title: string;
  time: string;
  days: number[];
  prayer: string;
  isActive: boolean;
  notificationIds: string[];
  createdAt: string;
  updatedAt: string;
};

function reminderKey(id: string) {
  return `${REMINDER_KEY_PREFIX}${id}`;
}

function hasNotificationPermission(status: Notifications.NotificationPermissionsStatus) {
  if (status.granted) return true;

  if (Platform.OS === 'ios') {
    return (
      status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }

  return false;
}

async function readIndex(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(INDEX_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]) {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(ids));
}

async function persistReminder(reminder: PrayerReminder) {
  await SecureStore.setItemAsync(reminderKey(reminder.id), JSON.stringify(reminder));

  const ids = await readIndex();
  if (!ids.includes(reminder.id)) {
    await writeIndex([reminder.id, ...ids]);
  }
}

async function cancelNotificationIds(ids: string[]) {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

export async function configureReminderNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Prayer reminders',
      description: 'Recurring reminders for your personal prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 180, 250],
      showBadge: false,
    });
  }
}

export async function getReminderPermissionStatus() {
  await configureReminderNotifications();
  const status = await Notifications.getPermissionsAsync();

  return {
    granted: hasNotificationPermission(status),
    canAskAgain: status.canAskAgain,
    status: status.status,
  };
}

export async function requestReminderPermission() {
  await configureReminderNotifications();

  const existing = await Notifications.getPermissionsAsync();
  if (hasNotificationPermission(existing)) return true;
  if (!existing.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return hasNotificationPermission(requested);
}

export async function listPrayerReminders(): Promise<PrayerReminder[]> {
  const ids = await readIndex();
  const records = await Promise.all(
    ids.map(async (id) => {
      const raw = await SecureStore.getItemAsync(reminderKey(id));
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw) as Partial<PrayerReminder>;
        if (!parsed.id || !parsed.title || !parsed.time || !Array.isArray(parsed.days)) return null;

        return {
          id: parsed.id,
          title: parsed.title,
          time: parsed.time,
          days: parsed.days.filter((day): day is number => typeof day === 'number'),
          prayer: typeof parsed.prayer === 'string' ? parsed.prayer : '',
          isActive: parsed.isActive !== false,
          notificationIds: Array.isArray(parsed.notificationIds)
            ? parsed.notificationIds.filter((value): value is string => typeof value === 'string')
            : [],
          createdAt: parsed.createdAt || new Date().toISOString(),
          updatedAt: parsed.updatedAt || parsed.createdAt || new Date().toISOString(),
        } satisfies PrayerReminder;
      } catch {
        return null;
      }
    }),
  );

  const valid = records.filter((item): item is PrayerReminder => item !== null);

  if (valid.length !== ids.length) {
    await writeIndex(valid.map((item) => item.id));
  }

  return valid.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getPrayerReminder(id: string): Promise<PrayerReminder | null> {
  const raw = await SecureStore.getItemAsync(reminderKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PrayerReminder;
  } catch {
    return null;
  }
}

async function scheduleReminder(reminder: PrayerReminder) {
  const [hourText, minuteText] = reminder.time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('Choose a valid reminder time.');
  }

  const notificationIds: string[] = [];

  try {
    for (const weekday of reminder.days) {
      const trigger = Platform.OS === 'ios'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday,
            hour,
            minute,
            repeats: true,
          } as const
        : {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
            channelId: REMINDER_CHANNEL_ID,
          } as const;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.prayer || 'It’s time to pause and pray.',
          sound: 'default',
          data: {
            kind: 'prayer-reminder',
            reminderId: reminder.id,
          },
        },
        trigger,
      });

      notificationIds.push(id);
    }

    return notificationIds;
  } catch (error) {
    await cancelNotificationIds(notificationIds);
    throw error;
  }
}

export async function savePrayerReminder(input: {
  id?: string;
  title: string;
  time: string;
  days: number[];
  prayer?: string;
  isActive: boolean;
}) {
  const now = new Date().toISOString();
  const existing = input.id ? await getPrayerReminder(input.id) : null;
  const id = existing?.id || input.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (existing?.notificationIds?.length) {
    await cancelNotificationIds(existing.notificationIds);
  }

  let notificationIds: string[] = [];

  if (input.isActive) {
    const allowed = await requestReminderPermission();
    if (!allowed) {
      throw new Error('Notification permission is required to enable this reminder.');
    }

    notificationIds = await scheduleReminder({
      id,
      title: input.title.trim(),
      time: input.time,
      days: input.days,
      prayer: input.prayer?.trim() || '',
      isActive: true,
      notificationIds: [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });
  }

  const reminder: PrayerReminder = {
    id,
    title: input.title.trim(),
    time: input.time,
    days: [...input.days].sort((a, b) => a - b),
    prayer: input.prayer?.trim() || '',
    isActive: input.isActive,
    notificationIds,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await persistReminder(reminder);
  return reminder;
}

export async function setPrayerReminderActive(id: string, isActive: boolean) {
  const reminder = await getPrayerReminder(id);
  if (!reminder) throw new Error('Reminder not found.');

  return savePrayerReminder({
    ...reminder,
    id: reminder.id,
    isActive,
  });
}

export async function deletePrayerReminder(id: string) {
  const reminder = await getPrayerReminder(id);
  if (reminder?.notificationIds?.length) {
    await cancelNotificationIds(reminder.notificationIds);
  }

  await SecureStore.deleteItemAsync(reminderKey(id));
  const ids = await readIndex();
  await writeIndex(ids.filter((value) => value !== id));
}

export async function sendTestPrayerReminder() {
  const allowed = await requestReminderPermission();
  if (!allowed) {
    throw new Error('Notification permission is required to send a test reminder.');
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Prayer reminder',
      body: 'This is how your Pray in Verses reminders will appear.',
      sound: 'default',
      data: { kind: 'prayer-reminder-test' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined,
    },
  });
}
