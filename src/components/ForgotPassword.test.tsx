import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ForgotPasswordPage from '../pages/AppMain/ForgotPasswordPage';
import ForgotPasswordOtpPage from '../pages/AppMain/ForgotPasswordOtpPage';
import { passwordRecovery } from '../services/passwordRecovery';
import { sessionStore } from '../core/session';
import { ForgotPasswordOtp } from './ForgotPasswordOtp';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function LoginDestination() {
  const { state } = useLocation();
  return <p>{state?.passwordReset ? 'Reset confirmed' : 'Login'}</p>;
}
function setup(path = '/forget') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/forget" element={<ForgotPasswordPage />} />
        <Route path="/forget/otp" element={<ForgotPasswordOtpPage />} />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}
describe('password recovery', () => {
  it('posts reset fields anonymously, shows API errors, and redirects after a successful retry', async () => {
    sessionStore.set(null);
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5257');
    vi.stubEnv('VITE_API_TOKEN', 'test-api-token');
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            HasError: true,
            Errors: [{ ErrorMessage: 'Invalid OTP' }],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ HasError: false })));
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter initialEntries={[{ pathname: '/forget/otp', state: { usercode: 'tester' } }]}>
        <Routes>
          <Route path="/forget/otp" element={<ForgotPasswordOtpPage />} />
          <Route path="/login" element={<LoginDestination />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('6-digit OTP'), { target: { value: '012345' } });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: ' new-password ' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: ' new-password ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByText('Invalid OTP');
    expect(screen.queryByText('Reset confirmed')).toBeNull();
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:5257/UserMgr/ResetPassword');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      UserCode: 'tester',
      OTP: '012345',
      NewPassword: ' new-password ',
      ConfirmPassword: ' new-password ',
    });
    expect(options.headers.get('APIToken')).toBe('test-api-token');
    expect(options.headers.has('UserToken')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByText('Reset confirmed');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('enables resend after one minute and restarts the countdown only on success', async () => {
    vi.useFakeTimers();
    const send = vi
      .spyOn(passwordRecovery, 'sendOtp')
      .mockRejectedValueOnce(new Error('Unable to resend OTP'))
      .mockResolvedValue();
    render(
      <MemoryRouter>
        <ForgotPasswordOtp usercode="tester" />
      </MemoryRouter>,
    );
    const resend = screen.getByRole('button', { name: 'Resend OTP' }) as HTMLButtonElement;
    expect(resend.disabled).toBe(true);
    expect(screen.getByRole('timer').textContent).toContain('1:00');
    act(() => vi.advanceTimersByTime(59_000));
    expect(resend.disabled).toBe(true);
    expect(screen.getByRole('timer').textContent).toContain('0:01');
    fireEvent.click(resend);
    expect(send).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    expect(resend.disabled).toBe(false);
    await act(async () => fireEvent.click(resend));
    expect(screen.getByText('Unable to resend OTP')).toBeTruthy();
    expect(resend.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText('6-digit OTP'), { target: { value: '123456' } });
    await act(async () => fireEvent.click(resend));
    expect(send).toHaveBeenLastCalledWith('tester');
    expect(screen.getByRole('status').textContent).toBe('OTP sent successfully.');
    expect((screen.getByLabelText('6-digit OTP') as HTMLInputElement).value).toBe('');
    expect(resend.disabled).toBe(true);
    expect(screen.getByRole('timer').textContent).toContain('1:00');
    act(() => vi.advanceTimersByTime(60_000));
    expect(resend.disabled).toBe(false);
  });

  it('posts the Swagger payload while signed out and waits for success before navigating', async () => {
    sessionStore.set(null);
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5257');
    vi.stubEnv('VITE_API_TOKEN', 'test-api-token');
    let respond!: (response: Response) => void;
    const fetch = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetch);
    setup();
    fireEvent.change(screen.getByLabelText('Usercode'), { target: { value: ' tester ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText('6-digit OTP')).toBeNull();
    expect(screen.getByLabelText('Usercode').closest('fieldset')?.disabled).toBe(true);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:5257/UserMgr/ForgotPassword');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ UserCode: 'tester' });
    expect(options.headers.get('APIToken')).toBe('test-api-token');
    expect(options.headers.has('UserToken')).toBe(false);
    respond(new Response(JSON.stringify({ HasError: false })));
    await screen.findByLabelText('6-digit OTP');
    expect(screen.getByText(/OTP sent for tester/)).toBeTruthy();
  });

  it('stays on the send form when the API returns a business error', async () => {
    sessionStore.set(null);
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5257');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            HasError: true,
            Errors: [{ ErrorMessage: 'Usercode not found' }],
          }),
        ),
      ),
    );
    setup();
    fireEvent.change(screen.getByLabelText('Usercode'), { target: { value: 'unknown' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await screen.findByText('Usercode not found');
    expect(screen.queryByLabelText('6-digit OTP')).toBeNull();
    expect(screen.getByLabelText('Usercode').closest('fieldset')?.disabled).toBe(false);
  });

  it('validates input, preserves leading OTP zeros, and redirects only after success', async () => {
    const send = vi.spyOn(passwordRecovery, 'sendOtp').mockResolvedValue();
    const reset = vi
      .spyOn(passwordRecovery, 'resetPassword')
      .mockRejectedValueOnce(new Error('OTP expired'))
      .mockResolvedValue();
    setup();
    fireEvent.change(screen.getByLabelText('Usercode'), { target: { value: ' tester ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await screen.findByLabelText('6-digit OTP');
    expect(send).toHaveBeenCalledWith('tester');
    fireEvent.change(screen.getByLabelText('6-digit OTP'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByText('Enter exactly 6 digits.');
    await screen.findByText('Passwords do not match.');
    expect(reset).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('6-digit OTP'), { target: { value: '012345' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByText('OTP expired');
    expect(screen.queryByText('Reset confirmed')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByText('Reset confirmed');
    expect(reset).toHaveBeenLastCalledWith({
      usercode: 'tester',
      otp: '012345',
      password: 'new-password',
      confirmPassword: 'new-password',
    });
  });
  it('keeps the usercode form open when sending fails', async () => {
    vi.spyOn(passwordRecovery, 'sendOtp').mockRejectedValue(new Error('Unable to send OTP'));
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await screen.findByText('Enter your usercode.');
    expect(passwordRecovery.sendOtp).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Usercode'), { target: { value: 'tester' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await screen.findByText('Unable to send OTP');
    expect(screen.queryByLabelText('6-digit OTP')).toBeNull();
  });
  it('redirects direct OTP visits to the usercode step', async () => {
    setup('/forget/otp');
    await waitFor(() => expect(screen.getByLabelText('Usercode')).toBeTruthy());
  });
});
