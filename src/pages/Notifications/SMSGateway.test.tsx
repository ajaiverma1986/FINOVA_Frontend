import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SMSGatewayListPage from './SMSGatewayListPage';
import SMSGatewayForm from './SMSGatewayForm';
import { NotificationService } from '../../services/NotificationService';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SMS gateway management', () => {
  it('requires confirmation to delete and refreshes the list after deletion', async () => {
    const list = vi.spyOn(NotificationService, 'GetAllSMSGateways').mockResolvedValue({
      Result: [{ SMSGatewayID: 7, SMSGatewayName: 'smtp.example.test', Password: 'hidden-secret' }],
    });
    const remove = vi.spyOn(NotificationService, 'DeleteSMSGateway').mockResolvedValue({});
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <SMSGatewayListPage />
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
    await screen.findByText('No SMS gateways found.');
    expect(remove).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('submits Swagger fields and preserves user input after an API failure', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Gateway could not be saved.'));
    render(
      <MemoryRouter>
        <SMSGatewayForm onSave={save} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Gateway name'), {
      target: { value: 'smtp.example.test' },
    });
    fireEvent.change(screen.getByLabelText('Gateway URL'), {
      target: { value: 'https://sms.example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create gateway' }));
    await screen.findByRole('alert');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        GatewayURL: 'https://sms.example.test',
        Status: 0,
        ReponseSuccess: '',
        ReponseError: '',
      }),
    );
    expect((screen.getByLabelText('Gateway name') as HTMLInputElement).value).toBe(
      'smtp.example.test',
    );
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Create gateway' }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );
  });
});
