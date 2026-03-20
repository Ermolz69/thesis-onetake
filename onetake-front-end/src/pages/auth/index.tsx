import { useEffect, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthByEmail } from '@/features/auth-by-email';
import { routes } from '@/shared/config';
import authSprite from '@/shared/ui/icons/auth-sprite.svg?raw';
import { AuthContext } from '@/app/providers/auth';
import {
  authBackLink,
  authCard,
  authFooter,
  authLink,
  authPageShell,
  authSubtitle,
  authTitle,
} from './styles';

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
    <div className={authPageShell}>
      <div
        className="absolute w-0 h-0 overflow-hidden"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: authSprite }}
      />
      <div className={authCard}>
        <Link to={routes.home} className={authBackLink}>
          <svg className="w-5 h-5 shrink-0" aria-hidden>
            <use href="#icon-back" />
          </svg>
          Back to home
        </Link>
        <h1 className={authTitle}>{isRegister ? 'Create account' : 'Sign in'}</h1>
        <p className={authSubtitle}>
          {isRegister
            ? 'Join OneTake to share and discover content.'
            : 'Enter your credentials to continue.'}
        </p>
        <div className="mt-6">
          <AuthByEmail mode={isRegister ? 'register' : 'login'} next={next} />
        </div>
        <div className={authFooter}>
          <p>
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link to={routes.auth.login} className={authLink}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link to={routes.auth.register} className={authLink}>
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
