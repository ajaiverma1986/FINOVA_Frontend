import { useLocation } from 'react-router-dom';
import EmailGatewayList from './EmailGatewayList';

export default function NotificationsPage() {
  const location = useLocation();
  return <EmailGatewayList initialMessage={location.state?.message} />;
}
