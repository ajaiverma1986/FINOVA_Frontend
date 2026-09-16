import { Navigate, useLocation } from 'react-router-dom';
import { ForgotPasswordOtp } from '../../components/ForgotPasswordOtp';
import { AuthLayout } from '../../components/AuthLayout';

export default function ForgotPasswordOtpPage() {
  const { state } = useLocation();
  const usercode = state?.usercode;
  if (typeof usercode !== 'string' || !usercode.trim()) return <Navigate to="/forget" replace />;
  return (
    <AuthLayout>
      <ForgotPasswordOtp usercode={usercode} />
    </AuthLayout>
  );
}
