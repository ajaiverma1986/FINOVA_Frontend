import type { CreateSMSGatewayRequest } from '../../models/RequestModel/NotificationRequest';
export { gatewayId } from './gateways';
export const notificationPath = '/Dashboard/Notifications/SMS';
export const smsGatewayListPath = '/Dashboard/Notifications/SMSGatewayList';
export const gatewayQueryKey = ['notifications', 'sms-gateways'];
export type SMSGateway = CreateSMSGatewayRequest & { SMSGatewayID: number };
// Swagger omits response schemas; validate the shared Result envelope's records.
export function gatewayRecords(result: unknown): SMSGateway[] {
  if (result == null) return [];
  const rows = Array.isArray(result) ? result : [result];
  if (!rows.every((row) => row && typeof row === 'object' && Number.isInteger(row.SMSGatewayID)))
    throw new Error('The server returned an unexpected SMS gateway response.');
  return rows as SMSGateway[];
}
