import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import CreatePanelDialog from '../AppManager/CreatePanelDialog';
import { ErrorState } from '../../components/Status';
import { UserMgrService } from '../../services/UserMgrservice';

export default function UserAccountActions({ id }: { id: number }) {
  const cache = useQueryClient();
  const [action, setAction] = useState<'lock' | 'unlock' | null>(null);
  const [until, setUntil] = useState('');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const title = action === 'lock' ? 'Lock user' : 'Unlock user';
  function close() {
    setAction(null);

    setUntil('');
    setReason('');
    setError(undefined);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      if (action === 'lock')
        await UserMgrService.lockUserMaster({
          UserMasterID: id,
          LockedTill: until ? new Date(until).toISOString() : null,
          RemarkReason: reason || null,
        });
      else await UserMgrService.unlockUserMaster(id);
      close();
      await cache.invalidateQueries({ queryKey: ['user-master'] });
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="master-action edit"
        disabled={pending || !id}
        onClick={() => setAction('lock')}
      >
        Lock
      </button>
      <button
        type="button"
        className="master-action edit"
        disabled={pending || !id}
        onClick={() => setAction('unlock')}
      >
        Unlock
      </button>
      {action && (
        <CreatePanelDialog
          create
          title={title}
          onClose={() => {
            if (!pending) close();
          }}
        >
          <section className="card gateway-editor">
            <button type="button" className="secondary" disabled={pending} onClick={close}>
              Close
            </button>
            <h2>{title}</h2>
            <p>User master ID: {id}</p>
            {error != null && <ErrorState error={error} />}
            <form className="master-form" onSubmit={submit}>
              {action === 'lock' && (
                <>
                  <label className="master-field">
                    Locked until
                    <input
                      type="datetime-local"
                      value={until}
                      onChange={(e) => setUntil(e.target.value)}
                    />
                  </label>
                  <label className="master-field">
                    Reason
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                  </label>
                </>
              )}
              {action === 'unlock' && <p>Unlock this user account?</p>}
              <button type="submit" disabled={pending}>
                {pending ? 'Saving...' : title}
              </button>
            </form>
          </section>
        </CreatePanelDialog>
      )}
    </>
  );
}
