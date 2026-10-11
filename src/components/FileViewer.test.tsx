import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FileViewer, { resolveFileUrl } from './FileViewer';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it('resolves uploaded paths against the API and rejects unsafe URLs', () => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5257/api');
  expect(resolveFileUrl('/uploads/kyc/document.jpg')).toBe(
    'http://localhost:5257/uploads/kyc/document.jpg',
  );
  expect(resolveFileUrl('https://files.example.com/document.pdf')).toBe(
    'https://files.example.com/document.pdf',
  );
  expect(resolveFileUrl('javascript:alert(1)')).toBeNull();
  expect(resolveFileUrl('')).toBeNull();
});

it('previews images, reports loading failures, and closes', () => {
  const close = vi.fn();
  render(
    <FileViewer
      open
      fileUrl="https://files.example.com/photo.jpg?token=example"
      fileName="Bank document"
      onClose={close}
    />,
  );
  const image = screen.getByRole('img', { name: 'Bank document' });
  fireEvent.error(image);
  expect(screen.getByRole('alert').textContent).toContain('Unable to display');
  fireEvent.click(screen.getByRole('button', { name: 'Close document' }));
  expect(close).toHaveBeenCalledOnce();
});

it('previews PDFs and provides a direct link', () => {
  render(
    <FileViewer
      open
      fileUrl="https://files.example.com/document.pdf"
      fileName="KYC document"
      onClose={() => {}}
    />,
  );
  expect(screen.getByTitle('KYC document').getAttribute('src')).toBe(
    'https://files.example.com/document.pdf',
  );
  expect(screen.getByRole('link', { name: 'Open in new tab' }).getAttribute('href')).toBe(
    'https://files.example.com/document.pdf',
  );
});
