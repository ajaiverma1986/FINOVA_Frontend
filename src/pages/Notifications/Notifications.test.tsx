import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationsPage from './NotificationsPage';
import EmailGatewayForm from './EmailGatewayForm';
import { NotificationService } from '../../services/NotificationService';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('notification gateway management', () => {
  it('requires confirmation to delete and refreshes the list after deletion', async () => {
    const list = vi.spyOn(NotificationService, 'GetAllEmailGateways').mockResolvedValue({
      Result: [
        { EmailGatewayID: 7, SMTPServer: 'smtp.example.test', SMTPPassword: 'hidden-secret' },
      ],
    });
    const remove = vi.spyOn(NotificationService, 'DeleteEmailGateway').mockResolvedValue({});
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByText('smtp.example.test');
    expect(screen.queryByText('hidden-secret')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    list.mockResolvedValue({ Result: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    await screen.findByText('No email gateways found.');
    expect(remove).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('submits numeric and boolean fields and preserves user input after an API failure', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Gateway could not be saved.'));
    render(
      <MemoryRouter>
        <EmailGatewayForm onSave={save} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('SMTP server'), {
      target: { value: 'smtp.example.test' },
    });
    fireEvent.change(screen.getByLabelText('Sender email'), {
      target: { value: 'sender@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create gateway' }));
    await screen.findByRole('alert');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ SMTPPort: 587, SMTPEnableSSL: true, Status: 0 }),
    );
    expect((screen.getByLabelText('SMTP server') as HTMLInputElement).value).toBe(
      'smtp.example.test',
    );
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Create gateway' }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );
  });
});
