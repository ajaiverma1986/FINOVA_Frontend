import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { passwordRecovery } from '../services/passwordRecovery';
import { ErrorState } from './Status';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ usercode: string }>();

  return (
    <section className="auth-card">
      <p className="eyebrow">ACCOUNT RECOVERY</p>
      <h1>Forgot password</h1>
      <p>Enter your usercode to request a password reset OTP.</p>
      <form
        onSubmit={handleSubmit(async ({ usercode }) => {
          setError(undefined);
          try {
            await passwordRecovery.sendOtp(usercode.trim());
            navigate('/forget/otp', { state: { usercode: usercode.trim() } });
          } catch (cause) {
            setError(cause);
          }
        })}
      >
        <fieldset disabled={isSubmitting}>
          <label className="field">
            Usercode
            <input
              autoComplete="username"
              aria-invalid={!!errors.usercode}
              {...register('usercode', {
                validate: (value) => !!value.trim() || 'Enter your usercode.',
              })}
            />
          </label>
          {errors.usercode && (
            <p className="field-error" role="alert">
              {errors.usercode.message}
            </p>
          )}
          {!!error && <ErrorState error={error} />}
          <button type="submit" className="full">
            {isSubmitting ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </fieldset>
      </form>
      <p className="auth-switch">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
