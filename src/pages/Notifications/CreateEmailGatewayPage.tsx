import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/NotificationService';
import EmailGatewayForm from './EmailGatewayForm';
import { gatewayQueryKey, emailGatewayListPath } from './gateways';

export default function CreateEmailGatewayPage() {
  const navigate = useNavigate();
  const cache = useQueryClient();
  return (
    <section className="card">
      <h1>Create email gateway</h1>
      <EmailGatewayForm
        onSave={async (values) => {
          await NotificationService.CreateEmailGateway(values);
          await cache.invalidateQueries({ queryKey: gatewayQueryKey });
          navigate(emailGatewayListPath, { state: { message: 'Email gateway created.' } });
        }}
      />
    </section>
  );
}
