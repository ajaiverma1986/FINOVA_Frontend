import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import './DummyServiceTransactions.css';

export type TransactionReceiptData = {
  created: unknown;
  updated: unknown;
  request: unknown;
  status: number;
};

type ReceiptField = {
  label: string;
  keys: string[];
  format?: (value: unknown) => string;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function findValue(sources: Record<string, unknown>[], keys: string[]): unknown {
  for (const source of sources) {
    const key = Object.keys(source).find((name) =>
      keys.some((candidate) => candidate.toLowerCase() === name.toLowerCase()),
    );
    if (key && source[key] !== null && source[key] !== undefined && source[key] !== '')
      return source[key];
  }
  return undefined;
}

function formatDate(value: unknown): string {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

const fields: ReceiptField[] = [
  { label: 'Transaction ID', keys: ['TransactionId'] },
  { label: 'Transaction code', keys: ['TransactionCode', 'TransactionReference'] },
  { label: 'Service', keys: ['ServiceName'] },
  { label: 'Service ID', keys: ['ServiceId'] },
  { label: 'Agency', keys: ['AgencyName'] },
  { label: 'Amount', keys: ['Amount'] },
  { label: 'Transaction fee', keys: ['TxnFee', 'TransactionFee'] },
  { label: 'Total amount', keys: ['TotalAmount'] },
  { label: 'Margin', keys: ['Margin', 'MarginComm'] },
  { label: 'Status', keys: ['StatusName'] },
  { label: 'Related reference', keys: ['RelatedReference'] },
  ...Array.from({ length: 9 }, (_, index) => ({
    label: `Reference ${index + 1}`,
    keys: [`RefNo${index + 1}`],
  })),
  {
    label: 'Transaction date',
    keys: ['BankTxnDatetime', 'TransactionDate', 'CreatedOn', 'CreatedAt'],
    format: formatDate,
  },
  { label: 'Partner transaction ID', keys: ['PartnerTxnId'] },
  { label: 'Partner retailer ID', keys: ['PartnerRetailorId'] },
  { label: 'Type', keys: ['TxnType'] },
  { label: 'Platform', keys: ['TxnPlateform'] },
  { label: 'Description', keys: ['Description'] },
  { label: 'Failure reason', keys: ['FailureReason'] },
];

export default function TransactionReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: TransactionReceiptData | null;
  onClose: () => void;
}) {
  if (!receipt) return null;

  const created = record(receipt.created);
  const updated = record(receipt.updated);
  const createdResult = record(created.Result);
  const updatedResult = record(updated.Result);
  const sources = [updatedResult, updated, createdResult, created, record(receipt.request)];

  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      className="transaction-receipt-dialog"
      aria-labelledby="transaction-receipt-title"
      onClose={onClose}
    >
      <DialogTitle id="transaction-receipt-title">Transaction receipt</DialogTitle>
      <DialogContent>
        <div className="transaction-receipt">
          <header className="transaction-receipt-header">
            <p className="eyebrow">FINOVA</p>
            <h2>Transaction receipt</h2>
            <p>Keep this receipt for your records.</p>
          </header>
          <dl className="transaction-receipt-details">
            {fields.map(({ label, keys, format }) => {
              const value =
                label === 'Status'
                  ? receipt.status === 2
                    ? 'Success'
                    : 'Failure'
                  : findValue(sources, keys);
              if (value === undefined || value === null || value === '') return null;
              return (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{format ? format(value) : String(value)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </DialogContent>
      <DialogActions className="transaction-receipt-actions">
        <Button variant="outlined" onClick={() => window.print()}>
          Print Receipt
        </Button>
        <Button variant="outlined" onClick={() => window.print()}>
          Save as PDF
        </Button>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
