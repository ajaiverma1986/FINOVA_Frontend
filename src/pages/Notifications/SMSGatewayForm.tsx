import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/Status';
import type { CreateSMSGatewayRequest } from '../../models/RequestModel/NotificationRequest';
import { smsGatewayListPath } from './smsGateways';
import './EmailGatewayForm.css';

export default function SMSGatewayForm({
  initial = {},
  editing = false,
  onSave,
}: {
  initial?: CreateSMSGatewayRequest;
  editing?: boolean;
  onSave: (values: CreateSMSGatewayRequest) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<unknown>();
  const saving = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    const values: CreateSMSGatewayRequest = {
      SMSGatewayName: String(form.get('SMSGatewayName')).trim(),
      GatewayURL: String(form.get('GatewayURL')).trim(),
      UserName: String(form.get('UserName')).trim(),
      Password: String(form.get('Password')),
      SenderID: String(form.get('SenderID')).trim(),
      ReponseSuccess: String(form.get('ReponseSuccess')),
      ReponseError: String(form.get('ReponseError')),
      Status: Number(form.get('Status')),
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
            <p>Configure your SMS provider connection.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            Gateway name
            <input name="SMSGatewayName" required defaultValue={initial.SMSGatewayName ?? ''} />
          </label>
          <label className="field">
            Gateway URL
            <input
              name="GatewayURL"
              type="url"
              required
              defaultValue={initial.GatewayURL ?? ''}
              placeholder="https://"
            />
          </label>
          <label className="field">
            Username
            <input name="UserName" autoComplete="off" defaultValue={initial.UserName ?? ''} />
          </label>
          <div className="field">
            <label htmlFor="sms-password">Password</label>
            <div className="gateway-password">
              <input
                id="sms-password"
                name="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required={editing}
              />
              <button
                type="button"
                className="secondary"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {editing && <small>Enter the provider password to save this gateway.</small>}
          </div>
        </div>
        <div className="gateway-section-heading">
          <span>02</span>
          <div>
            <h2>Sender & responses</h2>
            <p>Set the sender identity and provider response values.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            Sender ID
            <input name="SenderID" defaultValue={initial.SenderID ?? ''} />
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
            <small>Use the status code configured for your provider.</small>
          </label>
          <label className="field">
            Success response
            <input name="ReponseSuccess" defaultValue={initial.ReponseSuccess ?? ''} />
          </label>
          <label className="field">
            Error response
            <input name="ReponseError" defaultValue={initial.ReponseError ?? ''} />
          </label>
        </div>
        <div className="actions">
          <button type="submit">
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Create gateway'}
          </button>
          {!pending && (
            <Link className="button secondary" to={smsGatewayListPath}>
              Cancel
            </Link>
          )}
        </div>
      </fieldset>
    </form>
  );
}
