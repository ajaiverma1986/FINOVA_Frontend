import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CreateTemplateTypeRequest } from '../../models/RequestModel/NotificationRequest';
import { ErrorState } from '../../components/Status';
import { NotificationService } from '../../services/NotificationService';
import { templateListPath } from './templates';
import './CreateTemplateTypePage.css';

export default function CreateTemplateTypePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('0');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const values: CreateTemplateTypeRequest = {
      TemplateTypeName: name.trim(),
      Description: description.trim(),
      Status: Number(status),
    };
    submitting.current = true;
    setPending(true);
    setError(undefined);
    try {
      await NotificationService.CreateTemplateType(values);
      navigate('/Dashboard/Notifications/TemplateTypes', {
        state: { message: 'Template type created.' },
      });
    } catch (cause) {
      setError(cause);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <section className="card gateway-editor">
      <h1>Create template type</h1>
      <p className="gateway-subtitle">Add a reusable notification template type.</p>
      <form
        className="gateway-form template-type-create-form"
        onSubmit={submit}
        aria-busy={pending}
      >
        {error != null && <ErrorState error={error} />}
        <fieldset disabled={pending}>
          <div className="form-grid">
            <label className="field">
              Template type name
              <input
                name="TemplateTypeName"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. DBO"
                aria-describedby="template-type-name-hint"
              />
              <small id="template-type-name-hint">
                Use a short name that is easy to recognise in notification templates.
              </small>
            </label>
            <label className="field">
              Status
              <select
                name="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="0">Inactive</option>
                <option value="1">Active</option>
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
              placeholder="Describe when this template type should be used."
              aria-describedby="template-type-description-count"
            />
            <small id="template-type-description-count">{description.length}/500 characters</small>
          </label>
          <aside className="template-type-preview" aria-live="polite">
            <div>
              <span className="eyebrow">Live preview</span>
              <h2>{name.trim() || 'Untitled template type'}</h2>
              <p>{description.trim() || 'Your description will appear here.'}</p>
            </div>
            <span
              className={status === '1' ? 'template-type-status active' : 'template-type-status'}
            >
              {status === '1' ? 'Active' : 'Inactive'}
            </span>
          </aside>
          <div className="actions">
            <button type="submit" disabled={!name.trim()}>
              {pending ? 'Creating...' : 'Create template type'}
            </button>
            {!pending && (
              <Link
                className="button secondary"
                to={templateListPath.replace('/Templates', '/TemplateTypes')}
              >
                Cancel
              </Link>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
