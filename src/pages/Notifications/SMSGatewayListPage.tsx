import { useLocation } from 'react-router-dom';
import SMSGatewayList from './SMSGatewayList';
export default function SMSGatewayListPage() {
  const location = useLocation();
  return <SMSGatewayList initialMessage={location.state?.message} />;
}
