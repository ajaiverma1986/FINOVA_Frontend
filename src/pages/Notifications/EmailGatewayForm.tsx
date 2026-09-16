import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CreateEmailGatewayRequest } from '../../models/RequestModel/NotificationRequest';
import { ErrorState } from '../../components/Status';
import { emailGatewayListPath } from './gateways';
import './EmailGatewayForm.css';

export default function EmailGatewayForm({
  initial = {},
  onSave,
  editing = false,
}: {
  initial?: CreateEmailGatewayRequest;
  onSave: (values: CreateEmailGatewayRequest) => Promise<void>;
  editing?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<unknown>();
  const saving = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const data = new FormData(event.currentTarget);
    const values: CreateEmailGatewayRequest = {
      SMTPServer: String(data.get('SMTPServer')).trim(),
      SMTPPort: Number(data.get('SMTPPort')),
      SMTPEnableSSL: data.get('SMTPEnableSSL') === 'on',
      SMTPUsername: String(data.get('SMTPUsername')).trim(),
      SMTPPassword: String(data.get('SMTPPassword')),
      SMTPSenderEmail: String(data.get('SMTPSenderEmail')).trim(),
      SMTPSenderName: String(data.get('SMTPSenderName')).trim(),
      Status: Number(data.get('Status')),
    };
    saving.current = true;
    setPending(true);
    setError(undefined);
    try {
      await onSave(values);
    } catch (e) {
      setError(e);
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  return (
    <form className="gateway-form" onSubmit={submit} aria-busy={pending}>
      {error != null && <ErrorState error={error} />}
      <fieldset disabled={pending}>
        <div className="gateway-section-heading">
          <span>01</span>
          <div>
            <h2>Connection & credentials</h2>
            <p>Configure the mail server used to send notifications.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            SMTP server
            <input name="SMTPServer" required defaultValue={initial.SMTPServer ?? ''} />
          </label>
          <label className="field">
            SMTP port
            <input
              name="SMTPPort"
              type="number"
              min="1"
              max="65535"
              required
              defaultValue={initial.SMTPPort ?? 587}
            />
          </label>
          <label className="field">
            SMTP username
            <input
              name="SMTPUsername"
              autoComplete="off"
              defaultValue={initial.SMTPUsername ?? ''}
            />
          </label>
          <div className="field">
            <label htmlFor="gateway-password">SMTP password</label>
            <div className="gateway-password">
              <input
                id="gateway-password"
                name="SMTPPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required={editing}
              />
              <button
                type="button"
                className="secondary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {editing && <small>Enter the SMTP password to save this gateway.</small>}
          </div>
        </div>
        <div className="gateway-section-heading">
          <span>02</span>
          <div>
            <h2>Sender & delivery</h2>
            <p>Choose how outgoing notifications identify your organisation.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            Sender email
            <input
              name="SMTPSenderEmail"
              type="email"
              required
              defaultValue={initial.SMTPSenderEmail ?? ''}
            />
          </label>
          <label className="field">
            Sender name
            <input name="SMTPSenderName" defaultValue={initial.SMTPSenderName ?? ''} />
          </label>
          <label className="field">
            Status
            <input
              name="Status"
              type="number"
              step="1"
              required
              defaultValue={initial.Status ?? 0}
            />
            <small>Use the status code configured by your API.</small>
          </label>
          <label className="gateway-ssl">
            <input
              name="SMTPEnableSSL"
              type="checkbox"
              role="switch"
              defaultChecked={initial.SMTPEnableSSL ?? true}
            />{' '}
            <span>
              Enable SSL<small>Use an encrypted connection to the mail server.</small>
            </span>
          </label>
        </div>
        <div className="actions">
          <button type="submit">
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Create gateway'}
          </button>
          {!pending && (
            <Link className="button secondary" to={emailGatewayListPath}>
              Cancel
            </Link>
          )}
        </div>
      </fieldset>
    </form>
  );
}
