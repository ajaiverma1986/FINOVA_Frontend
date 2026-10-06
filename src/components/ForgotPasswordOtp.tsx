import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { passwordRecovery } from '../services/passwordRecovery';
import { ErrorState } from './Status';

export function ForgotPasswordOtp({ usercode }: { usercode: string }) {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>();
  const [resendAt, setResendAt] = useState(() => Date.now() + 60_000);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) clearInterval(timer);
    };
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, [resendAt]);
  const {
    register,
    handleSubmit,
    getValues,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<{
    otp: string;
    password: string;
    confirmPassword: string;
  }>();

  return (
    <section className="auth-card">
      <p className="eyebrow">ACCOUNT RECOVERY</p>
      <h1>Reset password</h1>
      <p>Enter the 6-digit OTP sent for {usercode} and choose your new password.</p>
      <form
        onSubmit={handleSubmit(async ({ otp, password, confirmPassword }) => {
          setError(undefined);
          try {
            await passwordRecovery.resetPassword({ usercode, otp, password, confirmPassword });
            navigate('/login', { replace: true, state: { passwordReset: true } });
          } catch (cause) {
            setError(cause);
          }
        })}
      >
        <fieldset disabled={isSubmitting || isResending}>
          <label className="field">
            6-digit OTP
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-invalid={!!errors.otp}
              {...register('otp', {
                required: 'Enter your OTP.',
                pattern: { value: /^\d{6}$/, message: 'Enter exactly 6 digits.' },
              })}
            />
          </label>
          {errors.otp && (
            <p className="field-error" role="alert">
              {errors.otp.message}
            </p>
          )}
          <label className="field">
            New password
            <input
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password', {
                required: 'Enter your new password.',
                validate: (value) => !!value.trim() || 'Enter your new password.',
              })}
            />
          </label>
          {errors.password && (
            <p className="field-error" role="alert">
              {errors.password.message}
            </p>
          )}
          <label className="field">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword', {
                required: 'Confirm your new password.',
                validate: (value) => value === getValues('password') || 'Passwords do not match.',
              })}
            />
          </label>
          {errors.confirmPassword && (
            <p className="field-error" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
          {!!error && <ErrorState error={error} />}
          <button type="submit" className="full">
            {isSubmitting ? 'Resetting password…' : 'Reset password'}
          </button>
        </fieldset>
      </form>
      <div className="auth-switch">
        {secondsRemaining > 0 && (
          <p role="timer" aria-label="Time until you can resend OTP">
            Resend OTP in {Math.floor(secondsRemaining / 60)}:
            {String(secondsRemaining % 60).padStart(2, '0')}
          </p>
        )}
        {resendSuccess && <p role="status">OTP sent successfully.</p>}
        <button
          type="button"
          disabled={secondsRemaining > 0 || isResending || isSubmitting}
          onClick={async () => {
            if (Date.now() < resendAt || isResending || isSubmitting) return;
            setIsResending(true);
            setError(undefined);
            setResendSuccess(false);
            try {
              await passwordRecovery.sendOtp(usercode);
              resetField('otp');
              setSecondsRemaining(60);
              setResendAt(Date.now() + 60_000);
              setResendSuccess(true);
            } catch (cause) {
              setError(cause);
            } finally {
              setIsResending(false);
            }
          }}
        >
          {isResending ? 'Sending OTP…' : 'Resend OTP'}
        </button>
      </div>
      <p className="auth-switch">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
