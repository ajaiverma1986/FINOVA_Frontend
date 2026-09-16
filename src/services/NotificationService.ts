import { request } from '../core/api';
import type {
  CreateEmailGatewayRequest,
  UpdateEmailGatewayRequest,
  CreateSMSGatewayRequest,
  UpdateSMSGatewayRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  GetTemplateRequest,
  GetActiveTemplateRequest,
  CreateTemplateTypeRequest,
  CreateServiceTypeRequest,
} from '../models/RequestModel/NotificationRequest';

// Swagger does not define response schemas; retain the shared API response envelope.
export const NotificationService = {
  CreateSMSGateway: (values: CreateSMSGatewayRequest, signal?: AbortSignal) =>
    request('/Notification/CreateSMSGateway', { method: 'POST', body: values, signal }),
  UpdateSMSGateway: (values: UpdateSMSGatewayRequest, signal?: AbortSignal) =>
    request('/Notification/UpdateSMSGateway', { method: 'POST', body: values, signal }),
  DeleteSMSGateway: (smsGatewayID: number, signal?: AbortSignal) =>
    request(`/Notification/DeleteSMSGateway/${encodeURIComponent(smsGatewayID)}`, {
      method: 'DELETE',
      signal,
    }),
  GetSMSGatewayByID: (smsGatewayID: number, signal?: AbortSignal) =>
    request(`/Notification/GetSMSGatewayByID?smsGatewayID=${encodeURIComponent(smsGatewayID)}`, {
      signal,
    }),
  GetAllSMSGateways: (signal?: AbortSignal) =>
    request('/Notification/GetAllSMSGateways', { signal }),
  GetActiveSMSGateway: (signal?: AbortSignal) =>
    request('/Notification/GetActiveSMSGateway', { signal }),
  CreateEmailGateway: (values: CreateEmailGatewayRequest, signal?: AbortSignal) =>
    request('/Notification/CreateEmailGateway', { method: 'POST', body: values, signal }),

  UpdateEmailGateway: (values: UpdateEmailGatewayRequest, signal?: AbortSignal) =>
    request('/Notification/UpdateEmailGateway', { method: 'POST', body: values, signal }),

  DeleteEmailGateway: (emailGatewayID: number, signal?: AbortSignal) =>
    request(`/Notification/DeleteEmailGateway/${encodeURIComponent(emailGatewayID)}`, {
      method: 'DELETE',
      signal,
    }),

  GetEmailGatewayByID: (emailGatewayID: number, signal?: AbortSignal) =>
    request(
      `/Notification/GetEmailGatewayByID?emailGatewayID=${encodeURIComponent(emailGatewayID)}`,
      {
        signal,
      },
    ),

  GetAllEmailGateways: (signal?: AbortSignal) =>
    request('/Notification/GetAllEmailGateways', { signal }),

  GetActiveEmailGateway: (signal?: AbortSignal) =>
    request('/Notification/GetActiveEmailGateway', { signal }),
  CreateTemplate: (values: CreateTemplateRequest, signal?: AbortSignal) =>
    request('/Notification/CreateTemplate', { method: 'POST', body: values, signal }),
  UpdateTemplate: (values: UpdateTemplateRequest, signal?: AbortSignal) =>
    request('/Notification/UpdateTemplate', { method: 'POST', body: values, signal }),
  DeleteTemplate: (templateID: number, signal?: AbortSignal) =>
    request(`/Notification/DeleteTemplate/${encodeURIComponent(templateID)}`, {
      method: 'DELETE',
      signal,
    }),
  GetTemplateByID: (templateID: number, signal?: AbortSignal) =>
    request(`/Notification/GetTemplateByID?templateID=${encodeURIComponent(templateID)}`, {
      signal,
    }),
  GetAllTemplates: (values: GetTemplateRequest = {}, signal?: AbortSignal) =>
    request('/Notification/GetAllTemplates', { method: 'POST', body: values, signal }),
  GetActiveTemplates: (values: GetActiveTemplateRequest = {}, signal?: AbortSignal) =>
    request('/Notification/GetActiveTemplates', { method: 'POST', body: values, signal }),
  GetAllTemplateTypes: (signal?: AbortSignal) =>
    request('/Notification/GetAllTemplateTypes', { signal }),
  GetAllServiceTypes: (signal?: AbortSignal) =>
    request('/Notification/GetAllServiceTypes', { signal }),
  DeleteTemplateType: (templateTypeId: number, signal?: AbortSignal) =>
    request(`/Notification/DeleteTemplateType/${encodeURIComponent(templateTypeId)}`, {
      method: 'DELETE',
      signal,
    }),
  CreateTemplateType: (values: CreateTemplateTypeRequest, signal?: AbortSignal) =>
    request('/Notification/CreateTemplateType', { method: 'POST', body: values, signal }),
  CreateServiceType: (values: CreateServiceTypeRequest, signal?: AbortSignal) =>
    request('/Notification/CreateServiceType', { method: 'POST', body: values, signal }),
};
