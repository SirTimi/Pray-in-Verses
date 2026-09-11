import { apiRequest } from './api';

type NotificationPayload = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
};

type UserNotificationRow = {
  id: string;
  readAt: string | null;
  createdAt: string;
  notification: NotificationPayload;
};

type NotificationListResponse = {
  data: UserNotificationRow[];
};

export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(limit = 50): Promise<InboxNotification[]> {
  const response = await apiRequest<NotificationListResponse>(
    `/notifications?limit=${encodeURIComponent(String(limit))}`,
  );

  return (response.data ?? []).map((row) => ({
    id: row.id,
    title: row.notification?.title || 'Notification',
    body: row.notification?.body || '',
    link: row.notification?.link ?? null,
    readAt: row.readAt ?? null,
    createdAt: row.createdAt || row.notification?.createdAt || new Date().toISOString(),
  }));
}

export async function markNotificationRead(id: string) {
  return apiRequest<{ ok: true }>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ ok: true }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
