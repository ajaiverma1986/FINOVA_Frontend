import { FeaturePage } from '../../components/FeaturePage';
import { pages } from '../../app/pages';
export default function GenderPage() {
  return <FeaturePage page={pages.find((page) => page.path === '/Dashboard/Gender')!} />;
}
