import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <Link className="brand" to="/login">
          <span className="brand-mark">F</span>FINOVA
        </Link>
        <div>
          <p className="eyebrow">YOUR BUSINESS, CONNECTED</p>
          <h1>
            Payments that keep
            <br />
            business moving.
          </h1>
          <p>Manage your accounts, partners and transactions from one place.</p>
        </div>
        <small>FINOVA partner portal</small>
      </section>
      <main className="auth-main">{children}</main>
    </div>
  );
}
