import { api } from '@/api';

export type AppNotification = {
  id: string; type: string; title: string; message: string; link: string | null; entityId: string | null; read: boolean; createdAt: string;
};

export const listNotifications = () => api<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications');
export const markNotificationRead = (id: string) => api(`/api/notifications/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = () => api('/api/notifications/read-all', { method: 'PATCH' });