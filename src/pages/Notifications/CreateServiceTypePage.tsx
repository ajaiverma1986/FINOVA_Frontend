import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CreateServiceTypeRequest } from '../../models/RequestModel/NotificationRequest';
import { ErrorState } from '../../components/Status';
import { NotificationService } from '../../services/NotificationService';

export default function CreateServiceTypePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('1');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !name.trim()) return;
    const values: CreateServiceTypeRequest = {
      ServiceTypeName: name.trim(),
      Description: description.trim(),
      Status: Number(status),
    };
    submitting.current = true;
    setPending(true);
    setError(undefined);
    try {
      await NotificationService.CreateServiceType(values);
      navigate('/Dashboard/Notifications/ServiceTypes');
    } catch (cause) {
      setError(cause);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="card gateway-editor">
      <h1>Create notification service type</h1>
      <p className="gateway-subtitle">Add a reusable service type for notification templates.</p>
      <form className="gateway-form" onSubmit={submit} aria-busy={pending}>
        {error != null && <ErrorState error={error} />}
        <fieldset disabled={pending}>
          <div className="form-grid">
            <label className="field">
              Service type name
              <input
                name="ServiceTypeName"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. EMAIL"
              />
            </label>
            <label className="field">
              Status
              <select
                name="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </label>
          </div>
          <label className="field">
            Description
            <textarea
              name="Description"
              rows={6}
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this notification service type."
            />
            <small>{description.length}/500 characters</small>
          </label>
          <div className="actions">
            <button type="submit" disabled={!name.trim()}>
              {pending ? 'Creating...' : 'Create service type'}
            </button>
            {!pending && (
              <Link className="button secondary" to="/Dashboard/Notifications/ServiceTypes">
                Cancel
              </Link>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
