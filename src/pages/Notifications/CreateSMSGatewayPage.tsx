import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import SMSGatewayForm from './SMSGatewayForm';
import { gatewayQueryKey, smsGatewayListPath } from './smsGateways';

export default function CreateSMSGatewayPage() {
  const navigate = useNavigate();
  const cache = useQueryClient();
  return (
    <section className="card">
      <h1>Create SMS gateway</h1>
      <SMSGatewayForm
        onSave={async (values) => {
          await NotificationService.CreateSMSGateway(values);
          await cache.invalidateQueries({ queryKey: gatewayQueryKey });
          navigate(smsGatewayListPath, { state: { message: 'SMS gateway created.' } });
        }}
      />
    </section>
  );
}
