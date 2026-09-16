import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ForgotPasswordPage from '../pages/AppMain/ForgotPasswordPage';
import ForgotPasswordOtpPage from '../pages/AppMain/ForgotPasswordOtpPage';
import { passwordRecovery } from '../services/passwordRecovery';

afterEach(cleanup);
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
