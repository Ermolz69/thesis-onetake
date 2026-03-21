import { useState, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, ErrorMessage } from '@/shared/ui';
import { http } from '@/shared/api';
import { api, routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import { useI18n } from '@/app/providers/i18n';

interface LoginFormData {
  login: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: { id: string; username: string; email: string };
}

interface AuthByEmailProps {
  mode: 'login' | 'register';
  next?: string;
}

export const AuthByEmail = ({ mode, next = routes.home }: AuthByEmailProps) => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { t } = useI18n();
  const [loginData, setLoginData] = useState<LoginFormData>({ login: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
  });
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({});
  const [registerErrors, setRegisterErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const validateLogin = (): boolean => {
    const err: Partial<LoginFormData> = {};
    if (!loginData.login.trim()) err.login = t('auth.validation.emailOrUsernameRequired');
    if (!loginData.password) err.password = t('auth.validation.passwordRequired');
    setLoginErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateRegister = (): boolean => {
    const err: Partial<RegisterFormData> = {};
    if (!registerData.email.trim()) err.email = t('auth.validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      err.email = t('auth.validation.emailInvalid');
    }
    if (!registerData.username.trim()) err.username = t('auth.validation.usernameRequired');
    if (!registerData.password) err.password = t('auth.validation.passwordRequired');
    else if (registerData.password.length < 6) {
      err.password = t('auth.validation.passwordShort');
    }
    setRegisterErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateLogin()) return;
    setIsLoading(true);
    try {
      const response = await http.post<AuthResponse>(api.endpoints.auth.login, {
        login: loginData.login,
        password: loginData.password,
      });
      auth?.setSession(response.accessToken, response.user);
      navigate(next);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auth.errors.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateRegister()) return;
    setIsLoading(true);
    try {
      const response = await http.post<AuthResponse>(api.endpoints.auth.register, {
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
      });
      auth?.setSession(response.accessToken, response.user);
      navigate(next);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auth.errors.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setPasswordVisible((v) => !v)}
      className="rounded-lg p-1 text-text-muted transition hover:text-text-primary focus:outline-none focus:ring-0"
      aria-label={passwordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
      tabIndex={-1}
    >
      <svg className="h-5 w-5" aria-hidden>
        <use href={passwordVisible ? '#icon-eye-off' : '#icon-eye'} />
      </svg>
    </button>
  );

  if (mode === 'register') {
    return (
      <form onSubmit={handleRegisterSubmit} className="space-y-5">
        {submitError && <ErrorMessage message={submitError} />}
        <Input
          label={t('auth.email')}
          type="email"
          value={registerData.email}
          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
          error={registerErrors.email}
          disabled={isLoading}
          autoComplete="email"
          variant="filled"
          placeholder={t('auth.emailPlaceholder')}
        />
        <Input
          label={t('auth.username')}
          type="text"
          value={registerData.username}
          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
          error={registerErrors.username}
          disabled={isLoading}
          autoComplete="username"
          variant="filled"
          placeholder={t('auth.usernamePlaceholder')}
        />
        <Input
          label={t('auth.password')}
          type={passwordVisible ? 'text' : 'password'}
          value={registerData.password}
          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          error={registerErrors.password}
          disabled={isLoading}
          autoComplete="new-password"
          variant="filled"
          placeholder={t('auth.passwordPlaceholder')}
          trailing={passwordToggle}
        />
        <Button
          type="submit"
          variant="solid"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? t('auth.creatingAccount') : t('auth.createAccountAction')}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLoginSubmit} className="space-y-5">
      {submitError && <ErrorMessage message={submitError} />}
      <Input
        label={t('auth.emailOrUsername')}
        type="text"
        value={loginData.login}
        onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
        error={loginErrors.login}
        disabled={isLoading}
        autoComplete="username"
        variant="filled"
        placeholder={t('auth.emailOrUsername')}
      />
      <Input
        label={t('auth.password')}
        type={passwordVisible ? 'text' : 'password'}
        value={loginData.password}
        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        error={loginErrors.password}
        disabled={isLoading}
        autoComplete="current-password"
        variant="filled"
        placeholder={t('auth.passwordPlainPlaceholder')}
        trailing={passwordToggle}
      />
      <Button
        type="submit"
        variant="solid"
        className="w-full"
        disabled={isLoading}
        loading={isLoading}
      >
        {isLoading ? t('auth.signingIn') : t('auth.signInAction')}
      </Button>
    </form>
  );
};
