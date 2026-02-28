import { useState, FormEvent, useContext } from 'react';
import { Input, Button, ErrorMessage } from '@/shared/ui';
import { http } from '@/shared/api';
import { api } from '@/shared/config';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { btnPrimary } from '@/shared/ui/auth-styles';
import { AuthContext } from '@/app/providers/auth';

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
    if (!loginData.login.trim()) err.login = 'Email or username is required';
    if (!loginData.password) err.password = 'Password is required';
    setLoginErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateRegister = (): boolean => {
    const err: Partial<RegisterFormData> = {};
    if (!registerData.email.trim()) err.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email))
      err.email = 'Enter a valid email';
    if (!registerData.username.trim()) err.username = 'Username is required';
    if (!registerData.password) err.password = 'Password is required';
    else if (registerData.password.length < 6)
      err.password = 'Password must be at least 6 characters';
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
      setSubmitError(err instanceof Error ? err.message : 'Login failed');
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
      setSubmitError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setPasswordVisible((v) => !v)}
      className="p-1 rounded-lg text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      <svg className="w-5 h-5" aria-hidden>
        <use href={passwordVisible ? '#icon-eye-off' : '#icon-eye'} />
      </svg>
    </button>
  );

  if (mode === 'register') {
    return (
      <form onSubmit={handleRegisterSubmit} className="space-y-5">
        {submitError && <ErrorMessage message={submitError} />}
        <Input
          label="Email"
          type="email"
          value={registerData.email}
          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
          error={registerErrors.email}
          disabled={isLoading}
          autoComplete="email"
          variant="auth"
          placeholder="you@example.com"
        />
        <Input
          label="Username"
          type="text"
          value={registerData.username}
          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
          error={registerErrors.username}
          disabled={isLoading}
          autoComplete="username"
          variant="auth"
          placeholder="username"
        />
        <Input
          label="Password"
          type={passwordVisible ? 'text' : 'password'}
          value={registerData.password}
          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          error={registerErrors.password}
          disabled={isLoading}
          autoComplete="new-password"
          variant="auth"
          placeholder="At least 6 characters"
          trailing={passwordToggle}
        />
        <Button type="submit" className={btnPrimary} disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLoginSubmit} className="space-y-5">
      {submitError && <ErrorMessage message={submitError} />}
      <Input
        label="Email or username"
        type="text"
        value={loginData.login}
        onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
        error={loginErrors.login}
        disabled={isLoading}
        autoComplete="username"
        variant="auth"
        placeholder="Email or username"
      />
      <Input
        label="Password"
        type={passwordVisible ? 'text' : 'password'}
        value={loginData.password}
        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        error={loginErrors.password}
        disabled={isLoading}
        autoComplete="current-password"
        variant="auth"
        placeholder="Password"
        trailing={passwordToggle}
      />
      <Button type="submit" className={btnPrimary} disabled={isLoading} loading={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
};
