import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, Shell, PermissionRoute, DashboardHome } from './Shell';
import { routeComponents } from './route-components';
import { Loading } from '../components/Status';
const Login = lazy(() => import('../pages/AppMain/LoginPage'));
const Forgot = lazy(() => import('../pages/AppMain/ForgotPasswordPage'));
const ForgotOtp = lazy(() => import('../pages/AppMain/ForgotPasswordOtpPage'));
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forget" element={<Forgot />} />
          <Route path="/forget/otp" element={<ForgotOtp />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/Dashboard" element={<Shell />}>
              <Route index element={<DashboardHome />} />
              <Route element={<PermissionRoute />}>
                {Object.entries(routeComponents).map(([path, Page]) => (
                  <Route key={path} path={path.replace('/Dashboard/', '')} element={<Page />} />
                ))}
              </Route>
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <main className="state">
                <h1>Page not found</h1>
                <Link to="/Dashboard">Return to dashboard</Link>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
