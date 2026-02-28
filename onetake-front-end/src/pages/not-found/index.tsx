import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import {
  pageWrapper,
  cardClass,
  titleClass,
  subtitleClass,
  btnPrimary,
} from '@/shared/ui/auth-styles';

export const NotFoundPage = () => {
  return (
    <div className={pageWrapper}>
      <div className={cardClass + ' text-center'}>
        <svg
          className="mx-auto w-32 h-32 text-slate-300 mb-6"
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
        <h1 className={titleClass}>404</h1>
        <p className={subtitleClass + ' mb-6'}>
          This page wandered off. Maybe it’s recording somewhere else.
        </p>
        <Link to={routes.home} className={btnPrimary + ' inline-flex items-center justify-center'}>
          Go home
        </Link>
      </div>
    </div>
  );
};
