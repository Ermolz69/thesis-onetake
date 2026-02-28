import { ReactNode, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, MoonIcon, SunIcon, BellIcon } from '@/shared/ui';
import { useTheme } from '@/app/providers/theme';
import { notificationApi } from '@/entities/notification';
import { AuthContext } from '@/app/providers/auth';
import { api } from '@/shared/config';
import { http } from '@/shared/api';

export interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-bg-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={routes.home} className="text-2xl font-bold text-fg-primary">
              OneTake
            </Link>
            <nav className="flex items-center gap-3">
              <Link to={routes.posts}>
                <Button variant="ghost" className="relative overflow-hidden group">
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                    Posts
                  </span>
                  <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Button>
              </Link>
              {hasAuth && (
                <Link to={routes.record}>
                  <Button variant="ghost" className="relative overflow-hidden group">
                    <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                      Create post
                    </span>
                    <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Button>
                </Link>
              )}
              {hasAuth && (
                <Link to={routes.notifications} className="relative p-2">
                  <BellIcon className="w-5 h-5 text-fg-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              {hasAuth ? (
                <>
                  {user?.id && (
                    <Link to={routes.profile(user.id)}>
                      <Button variant="ghost" className="relative overflow-hidden group">
                        <span className="relative z-10">{user.username ?? 'Profile'}</span>
                        <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="relative overflow-hidden group border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <span className="relative z-10 font-semibold transition-all duration-300 group-hover:scale-105">
                      Sign out
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </Button>
                </>
              ) : (
                <Link to={routes.auth.login}>
                  <Button
                    variant="outline"
                    className="relative overflow-hidden group border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <span className="relative z-10 font-semibold transition-all duration-300 group-hover:scale-105">
                      Sign In
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 relative overflow-hidden group rounded-full hover:bg-bg-secondary transition-all duration-300"
              >
                <span className="relative z-10 transform transition-transform duration-500 group-hover:rotate-180">
                  {theme === 'light' ? (
                    <MoonIcon className="w-5 h-5" color="currentColor" />
                  ) : (
                    <SunIcon className="w-5 h-5" color="currentColor" />
                  )}
                </span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
};
