import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { adminAccessApi } from '@/shared/api/admin-access-api';
import { HttpError, toUserMessage } from '@/shared/api/http-error';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { TextField } from '@/shared/ui/Fields';
import { pushErrorNotification } from '@/shared/ui/notifications';
import { useState } from 'react';

export function LoginPage() {
  const { isAuthenticated, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => adminAccessApi.login({ email, password }),
    meta: {
      suppressGlobalSuccess: true,
      suppressGlobalError: true,
    },
    onSuccess: (response) => {
      const accessToken = response.token.access_token ?? response.token.accessToken;
      const refreshToken = response.token.refresh_token ?? response.token.refreshToken;

      if (!accessToken || !refreshToken) {
        pushErrorNotification('Не удалось войти', 'Сервер вернул успешный ответ без валидного токена.');
        return;
      }

      setAuth({
        accessToken,
        refreshToken,
        session: response.session,
      });

      const targetPath = typeof location.state === 'object' && location.state !== null && 'from' in location.state
        ? String((location.state as { from?: string }).from ?? '/')
        : '/';

      navigate(targetPath, { replace: true });
    },
    onError: (error) => {
      pushErrorNotification('Не удалось войти', toUserMessage(error));
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const errorMessage = loginMutation.error instanceof HttpError ? toUserMessage(loginMutation.error) : undefined;

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-badge">
          <ShieldCheck size={18} />
          <span>WL Admin Control</span>
        </div>
        <h1>Вход в административную панель</h1>
        <p>
          Вход выполняется только по email и паролю. После успешной авторизации токен будет
          автоматически подставляться во все запросы панели.
        </p>
      </div>

      <Card
        className="auth-card"
        title="Авторизация"
        description="Используйте административную учётную запись с ролью moderator, admin или superAdmin."
      >
        <form
          className="page-stack"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate();
          }}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            label="Пароль"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailing={
              <button
                type="button"
                className="field-icon-button"
                aria-label={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setPasswordVisible((current) => !current)}
              >
                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />
          {errorMessage && <p className="auth-error">{errorMessage}</p>}
          <Button type="submit" disabled={loginMutation.isPending || !email || !password}>
            {loginMutation.isPending ? 'Проверяем доступ...' : 'Войти'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
