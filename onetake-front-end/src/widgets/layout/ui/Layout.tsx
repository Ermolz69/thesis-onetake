import { ReactNode, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, MoonIcon, SunIcon, BellIcon, Badge } from '@/shared/ui';
import { useTheme } from '@/app/providers/theme';
import { useI18n } from '@/app/providers/i18n';
import { notificationApi } from '@/entities/notification';
import { AuthContext } from '@/app/providers/auth';
import { api } from '@/shared/config';
import { http } from '@/shared/api';
import { contentContainer } from '@/shared/ui/recipes';

export interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasAuth = auth?.hasAuth ?? false;
  const user = auth?.user ?? null;

  useEffect(() => {
    if (!hasAuth) return;
    notificationApi
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
    const interval = setInterval(() => {
      notificationApi
        .getUnreadCount()
        .then(setUnreadCount)
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [hasAuth]);

  const handleSignOut = async () => {
    try {
      await http.post(api.endpoints.auth.logout, undefined, { withCredentials: true });
    } catch {
      /* Expected on logout; do not surface to user */
    }
    auth?.clearSession();
    navigate(routes.home);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border-soft bg-surface-elevated/90 backdrop-blur">
        <div className={`${contentContainer} py-4`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to={routes.home}
              className="text-2xl font-semibold tracking-tight text-text-primary"
            >
              OneTake
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              <Link to={routes.posts}>
                <Button variant="ghost" tone="neutral" size="sm">
                  {t('nav.posts')}
                </Button>
              </Link>
              {hasAuth && (
                <Link to={routes.record}>
                  <Button variant="ghost" tone="neutral" size="sm">
                    {t('nav.createPost')}
                  </Button>
                </Link>
              )}
              <Link to={routes.settings}>
                <Button variant="ghost" tone="neutral" size="sm">
                  {t('nav.settings')}
                </Button>
              </Link>
              {hasAuth && (
                <Link to={routes.notifications} className="relative">
                  <Button
                    variant="ghost"
                    tone="neutral"
                    size="sm"
                    radius="pill"
                    aria-label={t('nav.notifications')}
                    title={t('nav.notifications')}
                  >
                    <BellIcon className="h-5 w-5" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1">
                      <Badge variant="solid" tone="accent" size="sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    </span>
                  )}
                </Link>
              )}
              {hasAuth ? (
                <>
                  {user?.id && (
                    <Link to={routes.profile(user.id)}>
                      <Button variant="ghost" tone="neutral" size="sm">
                        {user.username ?? t('nav.profile')}
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" tone="neutral" size="sm" onClick={handleSignOut}>
                    {t('nav.signOut')}
                  </Button>
                </>
              ) : (
                <Link to={routes.auth.login}>
                  <Button variant="outline" tone="neutral" size="sm">
                    {t('nav.signIn')}
                  </Button>
                </Link>
              )}
              <Button variant="ghost" tone="neutral" size="sm" radius="pill" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" color="currentColor" />
                ) : (
                  <SunIcon className="h-5 w-5" color="currentColor" />
                )}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
};
