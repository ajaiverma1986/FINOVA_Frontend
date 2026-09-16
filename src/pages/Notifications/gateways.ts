import type { CreateEmailGatewayRequest } from '../../models/RequestModel/NotificationRequest';

export const notificationPath = '/Dashboard/Notifications';
export const emailGatewayListPath = `${notificationPath}/EmailGatwayList`;
export const gatewayQueryKey = ['notifications', 'email-gateways'];
export type EmailGateway = CreateEmailGatewayRequest & { EmailGatewayID: number };

// The API uses the shared Result envelope, but Swagger omits response schemas.
export function gatewayRecords(result: unknown): EmailGateway[] {
  if (result == null) return [];
  const records = Array.isArray(result) ? result : [result];
  if (
    !records.every((row) => row && typeof row === 'object' && Number.isInteger(row.EmailGatewayID))
  )
    throw new Error('The server returned an unexpected email gateway response.');
  return records as EmailGateway[];
}

export function gatewayId(value: string | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
