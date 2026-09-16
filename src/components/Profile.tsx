import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '../core/auth';
import { request } from '../core/api';
import { ResultView } from './ResultView';
import { ErrorState, Loading } from './Status';
import { FieldsForm } from './FieldsForm';
export function Profile({ organisation = false }: { organisation?: boolean }) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const initial = useMemo(() => ({ file: '' }), []);
  const logo = useQuery({
    queryKey: ['organisation-logo', session?.username],
    queryFn: ({ signal }) => request('/User/GetUserLogo?UserId=0', { signal }),
    enabled: organisation,
  });
  const profile = useQuery({
    queryKey: ['profile', session?.username, organisation],
    queryFn: ({ signal }) =>
      request(
        organisation
          ? '/User/GetAllUserDetails'
          : '/User/GetUserMasterDetailsforConfig?UserName=' + encodeURIComponent(session!.username),
        { signal },
      ),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MY ACCOUNT</p>
          <h1>{organisation ? 'Organisation profile' : 'My profile'}</h1>
        </div>
      </div>
      <section className="profile-banner">
        <span className="avatar large">{session?.displayName.slice(0, 1)}</span>
        <div>
          <h2>{session?.displayName}</h2>
          <p>{session?.username}</p>
        </div>
      </section>
      <section className="card">
        <h2>{organisation ? 'Business details' : 'Account details'}</h2>
        {profile.isPending ? (
          <Loading />
        ) : profile.isError ? (
          <ErrorState
            error={profile.error}
            retry={() => {
              void profile.refetch();
            }}
          />
        ) : (
          <ResultView value={profile.data.Result} name="Profile" />
        )}
      </section>
      {organisation && (
        <section className="card">
          <div className="toolbar">
            <h2>Organisation logo</h2>
            <button className="secondary" onClick={() => setUploading(!uploading)}>
              {uploading ? 'Cancel' : 'Change logo'}
            </button>
          </div>
          {logo.isPending ? (
            <Loading />
          ) : logo.isError ? (
            <ErrorState error={logo.error} />
          ) : (
            <ResultView value={logo.data.Result} name="Organisation logo" />
          )}
          {uploading && (
            <FieldsForm
              fields={[{ name: 'file', label: 'Logo image', type: 'file', required: true }]}
              initial={initial}
              submitLabel="Upload logo"
              onSubmit={async (values) => {
                if (!(values.file instanceof File)) throw new Error('Choose a logo image.');
                if (!['image/png', 'image/jpeg'].includes(values.file.type))
                  throw new Error('Choose a PNG or JPEG image.');
                const form = new FormData();
                form.append('file', values.file);
                await request('/User/UploadUserLogo', { method: 'POST', body: form });
                await logo.refetch();
                setUploading(false);
              }}
            />
          )}
        </section>
      )}
    </>
  );
}
