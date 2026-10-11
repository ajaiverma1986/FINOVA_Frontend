import { useQuery } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/Status';
import { UserMgrService } from '../../services/UserMgrservice';
import { fieldValue, rows } from './userWizardData';

export default function UserWalletDetailStep({
  userId,
  active,
  onPrevious,
  onFinish,
}: {
  userId: number;
  active: boolean;
  onPrevious: () => void;
  onFinish: () => void;
}) {
  const wallets = useQuery({
    queryKey: ['user-wallets', userId],
    enabled: active,
    queryFn: async ({ signal }) =>
      rows(
        (await UserMgrService.getUserWallets({ UserMasterId: userId, Status: 0 }, signal)).Result,
      ),
    retry: false,
  });

  if (!active) return null;

  return (
    <section aria-label="Wallet Detail">
      {wallets.isPending ? (
        <Loading />
      ) : wallets.isError ? (
        <ErrorState error={wallets.error} retry={() => void wallets.refetch()} />
      ) : (
        <div className="master-table-wrap">
          <table aria-label="Wallet Detail">
            <thead>
              <tr>
                <th>Available Limit</th>
                <th>Threshold Limit</th>
              </tr>
            </thead>
            <tbody>
              {!wallets.data.length ? (
                <tr>
                  <td colSpan={2}>No wallet details found.</td>
                </tr>
              ) : (
                wallets.data.map((wallet, index) => (
                  <tr key={String(fieldValue(wallet, 'UserDetailId') ?? index)}>
                    <td>{String(fieldValue(wallet, 'AvailableLimit') ?? '')}</td>
                    <td>{String(fieldValue(wallet, 'ThresoldLimit') ?? '')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="master-form-actions">
        <button type="button" className="secondary" onClick={onPrevious}>
          Previous
        </button>
        <button type="button" onClick={onFinish}>
          Finish
        </button>
      </div>
    </section>
  );
}
