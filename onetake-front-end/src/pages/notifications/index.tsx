import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi, type Notification } from '@/entities/notification';
import { Button, Card, Loader } from '@/shared/ui';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg-primary">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-fg-secondary">No notifications yet</Card>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Card
                className={`p-4 cursor-pointer hover:bg-bg-secondary/50 ${!n.isRead ? 'border-l-4 border-primary' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-fg-primary">{n.title}</p>
                    <p className="text-sm text-fg-secondary mt-1">{n.body}</p>
                    <p className="text-xs text-fg-secondary mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" className="mt-6" onClick={() => navigate(-1)}>
        ← Back
      </Button>
    </div>
  );
};
