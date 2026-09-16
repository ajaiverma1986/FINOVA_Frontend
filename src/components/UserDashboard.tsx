import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReportmanService } from '../services/ReportmanService';
import type { GetDayBookResponse } from '../models/ResponseModel/ReportResponse';
import { DataTable } from './DataTable';
import { ErrorState, Loading } from './Status';
import './UserDashboard.css';

export interface UserDashboardProps {
  userId: number;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function rows(value: unknown): GetDayBookResponse[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('The server returned an unexpected daybook response.');
  return value;
}

const amount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

/** Reports for the supplied user; rendered within the application's auth/query providers. */
export function UserDashboard({ userId }: UserDashboardProps) {
  const [day, setDay] = useState(() => dateKey(new Date()));
  const inputId = useId();
  const chartId = useId();
  const valid = Number.isInteger(userId) && userId > 0 && /^\d{4}-\d{2}-\d{2}$/.test(day);
  const daily = useQuery({
    queryKey: ['user-dashboard', userId, 'daybook', day],
    queryFn: async ({ signal }) => {
      const response = await ReportmanService.GetDayBookByUserId(
        { UserID: userId, FromDate: day, ToDate: day },
        signal,
      );
      return rows(response.Result);
    },
    enabled: valid,
    retry: false,
  });
  const transactions = useQuery({
    queryKey: ['user-dashboard', userId, 'transactions', day],
    queryFn: async ({ signal }) => {
      const response = await ReportmanService.PayoutTransactionReport(
        {
          PageNo: 1,
          PageSize: 10,
          OrderBy: 'transactionId desc',
          TransactionCode: '',
          TxnType: '',
          PartnerTransactionId: '',
          Status: 0,
          FromDate: day,
          ToDate: day,
        },
        signal,
      );
      if (response.Result == null) return [];
      if (!Array.isArray(response.Result))
        throw new Error('The server returned an unexpected transaction response.');
      return response.Result.slice(0, 10);
    },
    enabled: valid,
    retry: false,
  });
  const trend = useQuery({
    queryKey: ['user-dashboard', userId, 'trend', day],
    queryFn: async ({ signal }) =>
      Promise.all(
        Array.from({ length: 7 }, async (_, index) => {
          const date = new Date(`${day}T12:00:00`);
          date.setDate(date.getDate() - 6 + index);
          const key = dateKey(date);
          const data = rows(
            (
              await ReportmanService.GetDayBookByUserId(
                { UserID: userId, FromDate: key, ToDate: key },
                signal,
              )
            ).Result,
          );
          return {
            date: key,
            label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            count: data.reduce((sum, row) => sum + amount(row.TxnTotalcount), 0),
          };
        }),
      ),
    enabled: valid,
    retry: false,
  });
  const totals = (daily.data ?? []).reduce(
    (sum, row) => ({
      commission: sum.commission + amount(row.Commission),
      count: sum.count + amount(row.TxnTotalcount),
      volume: sum.volume + amount(row.TxntotalAmt),
    }),
    { commission: 0, count: 0, volume: 0 },
  );
  const max = Math.max(1, ...(trend.data ?? []).map((point) => point.count));

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
              ['Total commission earned', money(totals.commission)],
              ['Total transactions', totals.count.toLocaleString('en-IN')],
              ['Transaction amount', money(totals.volume)],
            ].map(([label, value]) => (
              <section className="card dashboard-metric" key={label}>
                <h2>{label}</h2>
                <strong>
                  {daily.isPending ? 'Loading…' : daily.isError ? 'Unavailable' : value}
                </strong>
                <p>Selected day · {day}</p>
              </section>
            ))}
          </div>
          <section className="card">
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
          <section className="card">
            <h2>Top 10 transactions</h2>
            <p>
              Latest payout transactions for the selected day, scoped by your signed-in account.
            </p>
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
              <DataTable
                data={transactions.data}
                name="Top 10 transactions"
                columns={[
                  'transactionId',
                  'transactioncode',
                  'bankTxnDatetime',
                  'partnerName',
                  'amount',
                  'txnFee',
                  'status',
                ]}
              />
            )}
          </section>
          <section className="card">
            <h2>Daybook</h2>
            <p>Service-wise transaction totals and commission for {day}.</p>
            {daily.isPending ? (
              <Loading />
            ) : daily.isError ? (
              <p>Daybook unavailable. Retry using the message above.</p>
            ) : (
              <DataTable
                data={daily.data}
                name="Daybook"
                columns={[
                  'ServiceName',
                  'TxnTotalcount',
                  'TxntotalAmt',
                  'TxnSuccescount',
                  'TxnSuccesAmt',
                  'TxnPendingcount',
                  'TxnPendingAmt',
                  'TxnFailurecount',
                  'Commission',
                  'Surcharge',
                ]}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default UserDashboard;
