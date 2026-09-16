import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../core/auth';
import { request } from '../../core/api';
import { UserDashboard } from '../../components/UserDashboard';
import { ErrorState, Loading } from '../../components/Status';

export default function UserDashboardPage() {
  const { session } = useAuth();
  const profile = useQuery({
    queryKey: ['profile', session?.username, false],
    queryFn: ({ signal }) =>
      request<{ UserId?: number; UserID?: number; UserMasterID?: number }>(
        '/User/GetUserMasterDetailsforConfig?UserName=' + encodeURIComponent(session!.username),
        { signal },
      ),
    enabled: !!session,
  });

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorState error={profile.error} retry={() => profile.refetch()} />;

  const details = profile.data.Result;
  const userId = Number(details?.UserId ?? details?.UserID ?? details?.UserMasterID);
  if (!Number.isInteger(userId) || userId <= 0)
    return <ErrorState error={new Error('Your profile does not contain a valid user ID.')} />;

  return <UserDashboard userId={userId} />;
}
