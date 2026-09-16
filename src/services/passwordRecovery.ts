import { ApiError } from '../core/api';

export interface ResetPasswordValues {
  usercode: string;
  otp: string;
  password: string;
}

// Connect these methods once the backend recovery contract is supplied.
// Do not report success or use the authenticated ChangePassword endpoint here.
export const passwordRecovery = {
  async sendOtp(_usercode: string): Promise<void> {
    throw new ApiError('Password recovery is currently unavailable. Please try again later.');
  },
  async resetPassword(_values: ResetPasswordValues): Promise<void> {
    throw new ApiError('Password recovery is currently unavailable. Please try again later.');
  },
};
