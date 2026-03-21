import { useEffect, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthByEmail } from '@/features/auth-by-email';
import { useI18n } from '@/app/providers/i18n';
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
  const { t } = useI18n();

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
          {t('auth.backHome')}
        </Link>
        <h1 className={authTitle}>{isRegister ? t('auth.createAccount') : t('auth.signIn')}</h1>
        <p className={authSubtitle}>
          {isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
        </p>
        <div className="mt-6">
          <AuthByEmail mode={isRegister ? 'register' : 'login'} next={next} />
        </div>
        <div className={authFooter}>
          <p>
            {isRegister ? (
              <>
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to={routes.auth.login} className={authLink}>
                  {t('auth.signIn')}
                </Link>
              </>
            ) : (
              <>
                {t('auth.dontHaveAccount')}{' '}
                <Link to={routes.auth.register} className={authLink}>
                  {t('auth.signUp')}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
