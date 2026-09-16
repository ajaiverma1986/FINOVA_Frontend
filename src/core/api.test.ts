import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { operationRequest, request } from './api';
import { sessionStore } from './session';
import { operations } from '../services/catalog';

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
  vi.stubEnv('VITE_API_TOKEN', 'application-id');
  sessionStore.set({
    token: 'user-token',
    username: 'tester',
    displayName: 'Tester',
    userTypeId: 1,
    expiresAt: Date.now() + 60000,
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  sessionStore.set(null);
});
describe('API contract', () => {
  it('preserves request casing, URL-encodes query values, and sets the authentication headers', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ HasError: false, Result: [] })));
    vi.stubGlobal('fetch', fetch);
    await operationRequest(operations['LoginServiceService.GetUserDetails'], {
      UserName: 'a+b &c',
    });
    expect(fetch.mock.calls[0][0]).toBe(
      'https://api.example.test/User/GetUserMasterDetailsforConfig?UserName=a%2Bb+%26c',
    );
    const headers = fetch.mock.calls[0][1].headers as Headers;
    expect(headers.get('APIToken')).toBe('application-id');
    expect(headers.get('UserToken')).toBe('user-token');
    expect(headers.has('Access-Control-Allow-Origin')).toBe(false);
  });
  it('does not interpret a string false as an API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ HasError: 'false', Result: 7 }))),
    );
    await expect(request('/example')).resolves.toMatchObject({ Result: 7 });
  });
  it('rejects business errors and provider failures', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ HasError: true, Errors: [{ ErrorMessage: 'Invalid account' }] }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: false, message: 'OTP expired' })),
      );
    vi.stubGlobal('fetch', fetch);
    await expect(request('/example')).rejects.toThrow('Invalid account');
    await expect(request('/example')).rejects.toThrow('OTP expired');
  });
  it('expires authentication on 401 but preserves it on a forbidden request', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('', { status: 403 }))
        .mockResolvedValueOnce(new Response('', { status: 401 })),
    );
    await expect(request('/example')).rejects.toMatchObject({ status: 403 });
    expect(sessionStore.get()).not.toBeNull();
    await expect(request('/example')).rejects.toMatchObject({ status: 401 });
    expect(sessionStore.get()).toBeNull();
  });
  it('rejects expired sessions without making a request', async () => {
    sessionStore.set({ ...sessionStore.get()!, expiresAt: Date.now() - 1 });
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(request('/example')).rejects.toMatchObject({ status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uploads an actual file without setting a multipart Content-Type boundary', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ HasError: false })));
    vi.stubGlobal('fetch', fetch);
    const file = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });
    await operationRequest(operations['uploads.receipt'], { RequestId: 17, file });
    expect(fetch.mock.calls[0][0]).toContain('?RequestId=17');
    const options = fetch.mock.calls[0][1];
    expect(options.body.get('file')).toBe(file);
    expect(options.headers.has('Content-Type')).toBe(false);
  });
  it('rejects malformed response envelopes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]')));
    await expect(request('/example')).rejects.toThrow('unexpected response');
  });
  it('keeps login anonymous even with an existing session', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    await request('/AA/login', {
      anonymous: true,
      method: 'POST',
      body: { Username: 'u', Password: 'p' },
    });
    expect(fetch.mock.calls[0][1].headers.has('UserToken')).toBe(false);
  });
});
