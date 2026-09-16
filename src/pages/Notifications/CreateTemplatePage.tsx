import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../../services/NotificationService';
import TemplateForm from './TemplateForm';
import { templateListPath } from './templates';

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  return (
    <section className="card gateway-editor">
      <h1>Create notification template</h1>
      <p className="gateway-subtitle">Add reusable message content for notification delivery.</p>
      <TemplateForm
        onSave={async (values) => {
          await NotificationService.CreateTemplate(values);
          navigate(templateListPath, { state: { message: 'Notification template created.' } });
        }}
      />
    </section>
  );
}
