import { FeaturePage } from '../../components/FeaturePage';
import { pages } from '../../app/pages';

export default function AddTransactionslabPage() {
  return <FeaturePage page={pages.find((page) => page.path === '/Dashboard/addtxnslab')!} />;
}
