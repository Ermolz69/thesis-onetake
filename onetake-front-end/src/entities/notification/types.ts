export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PagedNotificationsResponse {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}
