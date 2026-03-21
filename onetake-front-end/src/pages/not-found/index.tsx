import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { useI18n } from '@/app/providers/i18n';
import { authCard, authPageShell, authSubtitle, authTitle } from '@/pages/auth/styles';

export const NotFoundPage = () => {
  const { t } = useI18n();
  return (
    <div className={authPageShell}>
      <div className={`${authCard} text-center`}>
        <svg
          className="mx-auto mb-6 h-32 w-32 text-text-muted"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <path
            d="M35 45 L55 65 L75 45"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="40" r="4" fill="currentColor" className="animate-pulse" />
          <circle
            cx="80"
            cy="40"
            r="4"
            fill="currentColor"
            className="animate-pulse"
            style={{ animationDelay: '0.3s' }}
          />
          <circle
            cx="60"
            cy="85"
            r="4"
            fill="currentColor"
            className="animate-pulse"
            style={{ animationDelay: '0.6s' }}
          />
        </svg>
        <h1 className={authTitle}>404</h1>
        <p className={`${authSubtitle} mb-6`}>{t('notFound.body')}</p>
        <Link
          to={routes.home}
          className="inline-flex h-button-md items-center justify-center rounded-xl bg-accent px-5 font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover"
        >
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
};
