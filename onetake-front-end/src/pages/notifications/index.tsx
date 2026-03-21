import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/app/providers/i18n';
import { notificationApi, type Notification } from '@/entities/notification';
import { Button, Card, Loader, Badge } from '@/shared/ui';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import {
  contentContainer,
  contentShell,
  emptyStateText,
  emptyStateTitle,
  emptyStateWrapper,
} from '@/shared/ui/recipes';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    if (!currentUser?.id) {
      navigate(routes.auth.login);
      return;
    }
    Promise.all([
      notificationApi.getNotifications({ pageSize: 50 }),
      notificationApi.getUnreadCount(),
    ])
      .then(([res, count]) => {
        setItems(res.items);
        setUnreadCount(count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.id, navigate]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* Best-effort: ignore mark-as-read failure */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* Best-effort: ignore mark-all-read failure */
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    if (n.entityType === 'post' && n.entityId) navigate(routes.postDetails(n.entityId));
    if (n.entityType === 'user' && n.entityId) navigate(routes.profile(n.entityId));
  };

  if (!currentUser) return null;

  return (
    <div className={contentShell}>
      <div className={`${contentContainer} max-w-3xl space-y-6 py-8`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-text-primary">{t('notifications.title')}</h1>
            <p className="text-text-secondary">{t('notifications.subtitle')}</p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="soft" tone="accent">
                {unreadCount} {t('notifications.unread')}
              </Badge>
              <Button variant="outline" tone="neutral" size="sm" onClick={handleMarkAllRead}>
                {t('notifications.markAllRead')}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <Loader size="lg" />
        ) : items.length === 0 ? (
          <div className={emptyStateWrapper}>
            <p className={emptyStateTitle}>{t('notifications.emptyTitle')}</p>
            <p className={emptyStateText}>{t('notifications.emptyBody')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id}>
                <Card
                  variant="interactive"
                  radius="xl"
                  className={!n.isRead ? 'border-l-4 border-l-accent' : ''}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text-primary">{n.title}</p>
                        {!n.isRead && (
                          <Badge variant="soft" tone="accent" size="sm">
                            {t('notifications.new')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">{n.body}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        tone="neutral"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        {t('notifications.markRead')}
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Button variant="ghost" tone="neutral" className="mt-2" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
};
