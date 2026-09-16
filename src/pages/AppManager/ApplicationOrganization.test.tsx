import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppManagerComponent from './AppManagerComponent';
import { AppMgrService } from '../../services/AppMgrService';
import { OrgMgrService } from '../../services/OrgMgrService';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('shows active organization names and submits the selected numeric ID', async () => {
  vi.spyOn(AppMgrService, 'getAllApplications').mockResolvedValue({ Result: [] });
  vi.spyOn(OrgMgrService, 'getActiveOrganizations').mockResolvedValue({
    Result: [{ OrganizationID: 42, OrganizationName: 'Finova' }],
  });
  const save = vi.spyOn(AppMgrService, 'createApplication').mockResolvedValue({});
  render(<QueryClientProvider client={new QueryClient()}><AppManagerComponent /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Create application' }));
  const dialog = within(await screen.findByRole('dialog'));
  await dialog.findByRole('option', { name: 'Finova' });
  fireEvent.change(dialog.getByRole('combobox', { name: 'Organization' }), { target: { value: '42' } });
  fireEvent.change(dialog.getByLabelText('Application name'), { target: { value: 'Portal' } });
  fireEvent.change(dialog.getByLabelText('Description'), { target: { value: 'Organization portal' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Create application' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith({
    OrganizationID: 42, ApplicationName: 'Portal', ApplicationDescription: 'Organization portal',
  }));
});
