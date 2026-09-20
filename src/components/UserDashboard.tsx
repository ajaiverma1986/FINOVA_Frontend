import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReportService } from '../services/ReportService';
import { z } from 'zod';
import { DataTable } from './DataTable';
import { ErrorState, Loading } from './Status';
import './UserDashboard.css';
import type { DashboardCardPermissions, DashboardCardId } from '../core/dashboardPermissions';

export interface UserDashboardProps {
  userId: number;
  cardPermissions: DashboardCardPermissions;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const dashboardSchema = z.object({
  Summary: z.object({
    TotalTransactions: z.number(),
    TransactionAmount: z.number(),
    TotalCommissionEarned: z.number(),
  }),
  TransactionTrend: z.array(z.object({ ReportDate: z.string(), TransactionCount: z.number() })),
  TopTransactions: z.array(z.record(z.string(), z.unknown())),
  Daybook: z.array(z.record(z.string(), z.unknown())),
});

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

/** Reports for the supplied user; rendered within the application's auth/query providers. */
export function UserDashboard({ userId, cardPermissions }: UserDashboardProps) {
  const canView = (id: DashboardCardId) => cardPermissions[id] === true;
  const hasCards = Object.values(cardPermissions).some((enabled) => enabled === true);
  const [day, setDay] = useState(() => dateKey(new Date()));
  const inputId = useId();
  const chartId = useId();
  const valid = Number.isInteger(userId) && userId > 0 && /^\d{4}-\d{2}-\d{2}$/.test(day);
  const dashboard = useQuery({
    queryKey: ['user-dashboard', userId, 'admin-dashboard', day],
    queryFn: async ({ signal }) => {
      const response = await ReportService.adminDashboard(
        { UserMasterId: userId, ReportDate: `${day}T00:00:00` },
        signal,
      );
      const parsed = dashboardSchema.safeParse(response.Result);
      if (!parsed.success) throw new Error('The server returned an unexpected dashboard response.');
      return parsed.data;
    },
    enabled: valid && hasCards,
    retry: false,
  });
  const daily = { ...dashboard, data: dashboard.data?.Daybook ?? [] };
  const transactions = { ...dashboard, data: dashboard.data?.TopTransactions.slice(0, 10) ?? [] };
  const trend = {
    ...dashboard,
    data: (dashboard.data?.TransactionTrend ?? [])
      .map((point) => ({
        date: point.ReportDate.slice(0, 10),
        label: new Date(`${point.ReportDate.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        count: point.TransactionCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
  const totals = {
    commission: dashboard.data?.Summary.TotalCommissionEarned ?? 0,
    count: dashboard.data?.Summary.TotalTransactions ?? 0,
    volume: dashboard.data?.Summary.TransactionAmount ?? 0,
  };
  const max = Math.max(1, ...trend.data.map((point) => point.count));

  return (
    <div className="user-dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>User dashboard</h1>
          <p>Your daily transactions and earnings at a glance.</p>
        </div>
        <div className="dashboard-date">
          <label htmlFor={inputId}>Report date</label>
          <input
            id={inputId}
            type="date"
            value={day}
            max={dateKey(new Date())}
            onChange={(event) => {
              if (event.target.value) setDay(event.target.value);
            }}
          />
        </div>
      </div>
      {!valid ? (
        <p role="alert">A valid user ID and report date are required.</p>
      ) : !hasCards ? (
        <p role="status">No dashboard cards are enabled for your account.</p>
      ) : (
        <>
          {daily.isError && (
            <ErrorState
              error={daily.error}
              retry={() => {
                void daily.refetch();
              }}
            />
          )}
          <div className="dashboard-metrics">
            {[
              ['dashboard-total-commission', 'Total commission earned', money(totals.commission)],
              [
                'dashboard-total-transactions',
                'Total transactions',
                totals.count.toLocaleString('en-IN'),
              ],
              ['dashboard-transaction-amount', 'Transaction amount', money(totals.volume)],
            ]
              .filter(([id]) => canView(id as DashboardCardId))
              .map(([id, label, value]) => (
                <section id={id} data-card-id={id} className="card dashboard-metric" key={id}>
                  <h2>{label}</h2>
                  <strong>
                    {daily.isPending ? 'Loading…' : daily.isError ? 'Unavailable' : value}
                  </strong>
                  <p>Selected day · {day}</p>
                </section>
              ))}
          </div>
          {canView('dashboard-transaction-trend') && (
            <section
              id="dashboard-transaction-trend"
              data-card-id="dashboard-transaction-trend"
              className="card"
            >
              <h2>Transaction trend</h2>
              <p>Daily transaction count · 7 days ending {day}</p>
              {trend.isPending ? (
                <Loading />
              ) : trend.isError ? (
                <ErrorState
                  error={trend.error}
                  retry={() => {
                    void trend.refetch();
                  }}
                />
              ) : (
                <>
                  <svg
                    className="dashboard-chart"
                    viewBox="0 0 700 240"
                    role="img"
                    aria-labelledby={chartId}
                  >
                    <title id={chartId}>
                      Daily transaction count:{' '}
                      {trend.data.map((point) => `${point.label}: ${point.count}`).join(', ')}
                    </title>
                    {[0, 0.5, 1].map((fraction) => (
                      <g key={fraction}>
                        <line
                          x1="55"
                          x2="665"
                          y1={195 - fraction * 155}
                          y2={195 - fraction * 155}
                          stroke="#dde5eb"
                        />
                        <text x="45" y={199 - fraction * 155} textAnchor="end">
                          {Math.round(max * fraction)}
                        </text>
                      </g>
                    ))}
                    <polyline
                      fill="none"
                      stroke="#176e72"
                      strokeWidth="3"
                      points={trend.data
                        .map(
                          (point, index) => `${65 + index * 98},${195 - (point.count / max) * 155}`,
                        )
                        .join(' ')}
                    />
                    {trend.data.map((point, index) => (
                      <g key={point.date}>
                        <circle
                          cx={65 + index * 98}
                          cy={195 - (point.count / max) * 155}
                          r="5"
                          fill="#176e72"
                        >
                          <title>
                            {point.label}: {point.count} transactions
                          </title>
                        </circle>
                        <text x={65 + index * 98} y="224" textAnchor="middle">
                          {point.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                  {trend.data.every((point) => point.count === 0) && (
                    <p>No transactions in this period.</p>
                  )}
                </>
              )}
            </section>
          )}
          {canView('dashboard-top-transactions') && (
            <section
              id="dashboard-top-transactions"
              data-card-id="dashboard-top-transactions"
              className="card"
            >
              <h2>Top 10 transactions</h2>
              <p>Latest transactions for the selected day and your signed-in account.</p>
              {transactions.isPending ? (
                <Loading />
              ) : transactions.isError ? (
                <ErrorState
                  error={transactions.error}
                  retry={() => {
                    void transactions.refetch();
                  }}
                />
              ) : (
                <DataTable data={transactions.data} name="Top 10 transactions" />
              )}
            </section>
          )}
          {canView('dashboard-daybook') && (
            <section id="dashboard-daybook" data-card-id="dashboard-daybook" className="card">
              <h2>Daybook</h2>
              <p>Service-wise transaction totals and commission for {day}.</p>
              {daily.isPending ? (
                <Loading />
              ) : daily.isError ? (
                <p>Daybook unavailable. Retry using the message above.</p>
              ) : (
                <DataTable data={daily.data} name="Daybook" />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default UserDashboard;
