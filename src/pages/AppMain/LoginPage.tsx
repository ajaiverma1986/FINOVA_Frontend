import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../core/auth';
import { ErrorState } from '../../components/Status';
import { AuthLayout } from '../../components/AuthLayout';

export default function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<unknown>();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<{ username: string; password: string }>();
  if (session) return <Navigate to="/Dashboard" replace />;
  return (
    <AuthLayout>
      <div className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in to your account</h1>
        <p>Enter your credentials to continue.</p>
        {location.state?.passwordReset === true && (
          <p role="status">Password has been reset successfully. Sign in with your new password.</p>
        )}
        <form
          onSubmit={handleSubmit(async (values) => {
            setError(undefined);
            try {
              await login(values.username.trim(), values.password);
              navigate('/Dashboard/UserDashboard', { replace: true });
            } catch (e) {
              setError(e);
            }
          })}
        >
          <fieldset disabled={isSubmitting}>
            <label className="field">
              Username
              <input
                autoComplete="username"
                {...register('username', { required: 'Enter your username.' })}
              />
            </label>
            {errors.username && <p className="field-error">{errors.username.message}</p>}
            <label className="field">
              Password
              <input
                type="password"
                autoComplete="current-password"
                {...register('password', { required: 'Enter your password.' })}
              />
            </label>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
            <Link className="forgot" to="/forget">
              Forgot password?
            </Link>
            {!!error && <ErrorState error={error} />}
            <button className="full" type="submit">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </fieldset>
        </form>
      </div>
    </AuthLayout>
  );
}
