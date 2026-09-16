import { operationRequest, request } from '../core/api';
import { operations } from './operations';
import type { Fields } from '../core/types';

export const LoginServiceService = {
  login: (values: { Username: string; Password: string }, signal?: AbortSignal) =>
    request('/AA/login', { method: 'POST', body: values, signal, anonymous: true }),
  RegisterUser: (values: Fields, signal?: AbortSignal) =>
    request('/User/CreateOrgAPIPartner', { method: 'POST', body: values, signal, anonymous: true }),
  GetUserDetails: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['LoginServiceService.GetUserDetails'], values, signal),
};
