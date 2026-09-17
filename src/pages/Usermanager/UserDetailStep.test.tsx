import { maskIdentifier } from './MaskedIdentifierInput';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserDetailStep from './UserDetailStep';
import { detailSteps } from './userWizardData';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup(index: number) {
  const next = vi.fn();
  const previous = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <UserDetailStep
        index={index}
        userId={7}
        active
        onNext={next}
        onPrevious={previous}
        onSaving={() => {}}
      />
    </QueryClientProvider>,
  );
  return { next, previous };
}
function mockLookup(index: number) {
  const config = detailSteps[index];
  if (config.lookup)
    vi.spyOn(config.lookup, 'get').mockResolvedValue({
      Result: [{ [config.lookup.id]: 2, [config.lookup.name]: 'Master option' }],
    });
}
it.each([0, 1, 2, 3, 4])('prefills step %i and saves the existing record ID', async (index) => {
  const config = detailSteps[index];
  const existing = { ...config.defaults, [config.id]: 19 };
  for (const field of config.fields)
    existing[field.key] = typeof config.defaults[field.key] === 'number' ? 2 : 'Existing value';
  vi.spyOn(config, 'get').mockResolvedValue({ Result: [existing] });
  mockLookup(index);
  const save = vi.spyOn(config, 'save').mockResolvedValue({ Result: {} });
  const { next } = setup(index);
  const field = config.fields.find((item) => item.key !== config.lookup?.field)!;
  const input = (await screen.findByLabelText(field.label)) as HTMLInputElement;
  expect(input.value).toBe(
    index === 4 ? maskIdentifier(String(existing[field.key])) : String(existing[field.key]),
  );
  if (config.lookup) await screen.findByRole('option', { name: 'Master option' });
  fireEvent.submit(screen.getByRole('form', { name: config.title }));
  await waitFor(() => expect(next).toHaveBeenCalledOnce());
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ [config.id]: 19 }), 7, 19);
});
it.each([0, 1, 2, 3, 4])('creates missing step %i and updates it when revisited', async (index) => {
  const config = detailSteps[index];
  vi.spyOn(config, 'get').mockResolvedValue({ Result: [] });
  mockLookup(index);
  const save = vi.spyOn(config, 'save').mockResolvedValue({ Result: { [config.id]: 23 } });
  const { next } = setup(index);
  await screen.findByLabelText(config.fields[0].label);
  if (config.lookup) await screen.findByRole('option', { name: 'Master option' });
  fireEvent.submit(screen.getByRole('form', { name: config.title }));
  await waitFor(() => expect(next).toHaveBeenCalledOnce());
  expect(save.mock.calls[0][2]).toBe(0);
  fireEvent.submit(screen.getByRole('form', { name: config.title }));
  await waitFor(() => expect(next).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1][2]).toBe(23);
});
it('blocks creation when loading existing records fails', async () => {
  const config = detailSteps[4];
  vi.spyOn(config, 'get').mockRejectedValue(new Error('Cannot load details'));
  const save = vi.spyOn(config, 'save');
  setup(4);
  await screen.findByText('Cannot load details');
  fireEvent.submit(screen.getByRole('form', { name: config.title }));
  expect(save).not.toHaveBeenCalled();
});
it('retries ID retrieval without duplicating a successful create', async () => {
  const config = detailSteps[4];
  const get = vi.spyOn(config, 'get').mockResolvedValue({ Result: [] });
  const save = vi.spyOn(config, 'save').mockResolvedValue({ Result: {} });
  const { next } = setup(4);
  await screen.findByLabelText('PAN card');
  fireEvent.submit(screen.getByRole('form', { name: config.title }));
  await screen.findByRole('button', { name: 'Retry' });
  get.mockResolvedValue({ Result: [{ ...config.defaults, OtherDetailId: 42 }] });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(next).toHaveBeenCalledOnce());
  expect(save).toHaveBeenCalledOnce();
});
it('keeps the current step and entered values when saving fails', async () => {
  const config = detailSteps[4];
  vi.spyOn(config, 'get').mockResolvedValue({ Result: [] });
  vi.spyOn(config, 'save').mockRejectedValue(new Error('Save failed'));
  const { next } = setup(4);
  fireEvent.change(await screen.findByLabelText('PAN card'), { target: { value: 'ABCDE1234F' } });
  fireEvent.submit(screen.getByRole('form', { name: config.title }));
  await screen.findByText('Save failed');
  expect((screen.getByLabelText('PAN card') as HTMLInputElement).value).toBe('******234F');
  expect(next).not.toHaveBeenCalled();
});

it.each([0, 1, 2])(
  'saves multiple records in step %i, edits them, and deletes only after success',
  async (index) => {
    const name = index === 0 ? 'address' : index === 1 ? 'KYC' : 'bank account';
    const idKey = index === 0 ? 'UserAddressID' : index === 1 ? 'UserKYCID' : 'OriginatorAccountID';
    const fieldLabel =
      index === 0 ? 'Address line 1' : index === 1 ? 'Document number' : 'Account name';
    const { UserMgrService } = await import('../../services/UserMgrservice');
    const config = detailSteps[index];
    vi.spyOn(config, 'get').mockResolvedValue({ Result: [] });
    mockLookup(index);
    const create = vi
      .spyOn(
        UserMgrService,
        index === 0 ? 'createUserAddress' : index === 1 ? 'createUserKyc' : 'createUserBankAccount',
      )
      .mockResolvedValueOnce({ Result: { [idKey]: 31 } })
      .mockResolvedValueOnce({ Result: { [idKey]: 32 } });
    const update = vi
      .spyOn(
        UserMgrService,
        index === 0 ? 'updateUserAddress' : index === 1 ? 'updateUserKyc' : 'updateUserBankAccount',
      )
      .mockResolvedValue({ Result: {} });
    const remove = vi
      .spyOn(
        UserMgrService,
        index === 0 ? 'deleteUserAddress' : index === 1 ? 'deleteUserKyc' : 'deleteUserBankAccount',
      )
      .mockRejectedValueOnce(new Error('Delete failed'))
      .mockResolvedValue({ Result: {} });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { next } = setup(index);
    await screen.findByLabelText(fieldLabel);
    await screen.findByRole('option', { name: 'Master option' });
    const save = () =>
      fireEvent(
        screen.getByRole('form', { name: detailSteps[index].title }),
        new SubmitEvent('submit', {
          bubbles: true,
          cancelable: true,
          submitter: screen.getByRole('button', { name: `Save ${name}` }),
        }),
      );
    fireEvent.change(screen.getByLabelText(fieldLabel), { target: { value: 'First street' } });
    save();
    await screen.findByRole('button', { name: `Edit ${name} 31` });
    expect(next).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].Status).toBe(index === 0 ? 1 : 8);
    fireEvent.click(screen.getByRole('button', { name: `Add ${name}` }));
    fireEvent.change(screen.getByLabelText(fieldLabel), { target: { value: 'Second street' } });
    save();
    await screen.findByRole('button', { name: `Edit ${name} 32` });
    expect(screen.getByText('First street')).toBeDefined();
    expect(screen.getByText('Second street')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: `Edit ${name} 31` }));
    fireEvent.change(screen.getByLabelText(fieldLabel), {
      target: { value: 'Updated street' },
    });
    save();
    await screen.findByText('Updated street');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ [idKey]: 31, Status: index === 0 ? 1 : 8 }),
    );
    fireEvent.click(screen.getByRole('button', { name: `Delete ${name} 31` }));
    await screen.findByText('Delete failed');
    expect(screen.getByText('Updated street')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: `Delete ${name} 31` }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: `Edit ${name} 31` })).toBeNull(),
    );
    expect(remove).toHaveBeenLastCalledWith(31);
    expect(screen.getByText('Second street')).toBeDefined();
  },
);

it('overrides an inactive address status on update', async () => {
  const { UserMgrService } = await import('../../services/UserMgrservice');
  const update = vi.spyOn(UserMgrService, 'updateUserAddress').mockResolvedValue({ Result: {} });
  await detailSteps[0].save({ ...detailSteps[0].defaults, Status: 8 }, 7, 9);
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ Status: 1, UserAddressID: 9, UserMasterId: 7 }),
  );
});

it('uploads a KYC file and saves its returned metadata internally', async () => {
  const { UserMgrService } = await import('../../services/UserMgrservice');
  vi.spyOn(detailSteps[1], 'get').mockResolvedValue({ Result: [] });
  mockLookup(1);
  const uploaded = {
    FileUrl: '7_unique.pdf',
    MediaExtension: '.pdf',
    MediaContentType: 'application/pdf',
  };
  const upload = vi
    .spyOn(UserMgrService, 'uploadUserKycFile')
    .mockResolvedValue({ Result: uploaded });
  const save = vi.spyOn(detailSteps[1], 'save').mockResolvedValue({ Result: { UserKYCID: 12 } });
  setup(1);
  const input = await screen.findByLabelText(/Upload document/);
  expect(screen.queryByLabelText('Document URL')).toBeNull();
  expect(screen.queryByLabelText('File extension')).toBeNull();
  expect(screen.queryByLabelText('Content type')).toBeNull();
  const file = new File(['%PDF-1.4'], 'pan.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [file] } });
  await screen.findByText('Uploaded document: 7_unique.pdf');
  expect(upload).toHaveBeenCalledWith(7, file);
  fireEvent.submit(screen.getByRole('form', { name: 'KYC' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining(uploaded), 7, 0));
});

it('masks all identifiers and the record label while sending full values', async () => {
  const full = {
    ...detailSteps[4].defaults,
    OtherDetailId: 19,
    Pancard: 'ABCDE1234F',
    AadharCard: '123456789012',
    GSTNo: '27ABCDE1234F1Z5',
  };
  vi.spyOn(detailSteps[4], 'get').mockResolvedValue({ Result: [full] });
  const save = vi.spyOn(detailSteps[4], 'save').mockResolvedValue({ Result: {} });
  setup(4);
  for (const [label, key] of [
    ['PAN card', 'Pancard'],
    ['Aadhaar card', 'AadharCard'],
    ['GST number', 'GSTNo'],
  ] as const) {
    expect(((await screen.findByLabelText(label)) as HTMLInputElement).value).toBe(
      maskIdentifier(full[key]),
    );
    expect(screen.queryByText(full[key], { exact: false })).toBeNull();
  }
  const pan = screen.getByLabelText('PAN card') as HTMLInputElement;
  pan.focus();
  pan.setSelectionRange(0, 2);
  fireEvent.select(pan);
  fireEvent.change(pan, { target: { value: 'XY****234F', selectionStart: 2, selectionEnd: 2 } });
  expect(pan.value).toBe('******234F');
  fireEvent.submit(screen.getByRole('form', { name: 'Other details' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        Pancard: 'XYCDE1234F',
        AadharCard: full.AadharCard,
        GSTNo: full.GSTNo,
      }),
      7,
      19,
    ),
  );
});
