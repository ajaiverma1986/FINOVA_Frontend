import { UserMgrService } from './UserMgrservice';

export interface ResetPasswordValues {
  usercode: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export const passwordRecovery = {
  async sendOtp(usercode: string): Promise<void> {
    await UserMgrService.forgotPassword({ UserCode: usercode.trim() });
  },
  async resetPassword(values: ResetPasswordValues): Promise<void> {
    await UserMgrService.resetPassword({
      UserCode: values.usercode.trim(),
      OTP: values.otp,
      NewPassword: values.password,
      ConfirmPassword: values.confirmPassword,
    });
  },
};
