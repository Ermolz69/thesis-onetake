import { http } from '@/shared/api';
import { api } from '@/shared/config';
import type { PagedNotificationsResponse } from './types';

export const notificationApi = {
  getNotifications: async (params?: {
    cursor?: string;
    pageSize?: number;
  }): Promise<PagedNotificationsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.append('cursor', params.cursor);
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const query = searchParams.toString();
    const url = query
      ? `${api.endpoints.notifications.list}?${query}`
      : api.endpoints.notifications.list;
    const data = await http.get<{
      items: PagedNotificationsResponse['items'];
      nextCursor: string | null;
      hasMore: boolean;
    }>(url);
    return { items: data.items, nextCursor: data.nextCursor, hasMore: data.hasMore };
  },

  getUnreadCount: async (): Promise<number> => {
    return http.get<number>(api.endpoints.notifications.unreadCount);
  },

  markAsRead: async (id: string): Promise<void> => {
    return http.put(api.endpoints.notifications.markRead(id));
  },

  markAllAsRead: async (): Promise<void> => {
    return http.put(api.endpoints.notifications.markAllRead);
  },
};
