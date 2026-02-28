import { useEffect, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthByEmail } from '@/features/auth-by-email';
import { routes } from '@/shared/config';
import {
  pageWrapper,
  cardClass,
  titleClass,
  subtitleClass,
  linkClass,
  btnSecondary,
} from '@/shared/ui/auth-styles';
import authSprite from '@/shared/ui/icons/auth-sprite.svg?raw';
import { AuthContext } from '@/app/providers/auth';

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const isRegister = location.pathname === routes.auth.register;
  const next = new URLSearchParams(location.search).get('next') || routes.home;
  const hasAuth = auth?.hasAuth ?? false;

  useEffect(() => {
    if (hasAuth) {
      navigate(next, { replace: true });
    }
  }, [hasAuth, navigate, next]);

  return (
    <div className={pageWrapper}>
      <div
        className="absolute w-0 h-0 overflow-hidden"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: authSprite }}
      />
      <div className={cardClass}>
        <Link
          to={routes.home}
          className={`${btnSecondary} mb-6 inline-flex items-center justify-center gap-2 w-auto px-4`}
        >
          <svg className="w-5 h-5 shrink-0" aria-hidden>
            <use href="#icon-back" />
          </svg>
          Back to home
        </Link>
        <h1 className={titleClass}>{isRegister ? 'Create account' : 'Sign in'}</h1>
        <p className={subtitleClass}>
          {isRegister
            ? 'Join OneTake to share and discover content.'
            : 'Enter your credentials to continue.'}
        </p>
        <div className="mt-6">
          <AuthByEmail mode={isRegister ? 'register' : 'login'} next={next} />
        </div>
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link to={routes.auth.login} className={linkClass + ' font-medium'}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link to={routes.auth.register} className={linkClass + ' font-medium'}>
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
