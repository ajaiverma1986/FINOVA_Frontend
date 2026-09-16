import { z } from 'zod';
import { sessionStore } from './session';
import type { ApiResponse, Fields, Operation } from './types';

const envelope = z
  .object({
    HasError: z.union([z.boolean(), z.string()]).optional(),
    Errors: z
      .array(z.object({ ErrorMessage: z.string().optional() }).passthrough())
      .nullable()
      .optional(),
    TotalRecords: z.number().optional(),
  })
  .passthrough();
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export function configuration() {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (!base || !/^https?:\/\//.test(base))
    throw new ApiError(
      'The API connection has not been configured. Please contact your administrator.',
    );
  return { base, token: import.meta.env.VITE_API_TOKEN || '' };
}
export async function request<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal; anonymous?: boolean } = {},
): Promise<ApiResponse<T>> {
  const { base, token } = configuration();
  if (!path.startsWith('/') || path.startsWith('//')) throw new ApiError('Invalid API path.');
  const current = sessionStore.get();
  if (!options.anonymous && (!current || current.expiresAt <= Date.now())) {
    sessionStore.set(null);
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  const headers = new Headers({ APIToken: token });
  if (!options.anonymous && current) headers.set('UserToken', current.token);
  const multipart = options.body instanceof FormData;
  if (options.body !== undefined && !multipart) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method || 'GET',
      headers,
      signal: options.signal,
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Unable to connect. Check your connection and try again.');
  }
  if (response.status === 401 && !options.anonymous) sessionStore.set(null);
  if (!response.ok)
    throw new ApiError(
      response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : response.status === 403
          ? 'You do not have permission to perform this action.'
          : `The request failed (${response.status}). Please try again.`,
      response.status,
    );
  if (response.status === 204) return {};
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError('The server returned an invalid response.');
  }
  const parsed = envelope.safeParse(json);
  if (!parsed.success) throw new ApiError('The server returned an unexpected response.');
  const data = parsed.data;
  if (
    data.HasError === true ||
    data.HasError === 'true' ||
    data.HasError === 'True' ||
    data.HasError === '1'
  ) {
    throw new ApiError(
      data.Errors?.map((error) => error.ErrorMessage)
        .filter(Boolean)
        .join(' ') || 'The request could not be completed.',
    );
  }
  if (data.status === false)
    throw new ApiError(
      typeof data.message === 'string'
        ? data.message
        : 'The provider could not complete this request.',
    );
  return data as ApiResponse<T>;
}
export function operationRequest(operation: Operation, values: Fields = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  Object.entries(operation.query).forEach(([key, field]) =>
    query.set(key, String(values[field] ?? '')),
  );
  const path = operation.path + (query.size ? '?' + query.toString() : '');
  let body: unknown;
  if (operation.method === 'POST') {
    const uiOnly = new Set(
      operation.fields.filter((field) => field.uiOnly).map((field) => field.name),
    );
    if (operation.multipart) {
      const form = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && !uiOnly.has(key) && !Object.values(operation.query).includes(key))
          form.append(key, value instanceof File ? value : String(value));
      });
      body = form;
    } else body = Object.fromEntries(Object.entries(values).filter(([key]) => !uiOnly.has(key)));
  }
  return request(path, { method: operation.method, body, signal });
}
