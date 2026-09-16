import type { CreateTemplateRequest } from '../../models/RequestModel/NotificationRequest';

export const templateListPath = '/Dashboard/Notifications/Templates';
export const templateQueryKey = ['notification-templates'];
export type NotificationTemplate = CreateTemplateRequest & { TemplateID: number };

export function templateId(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function templateRecords(result: unknown): NotificationTemplate[] {
  if (result == null) return [];
  const rows = Array.isArray(result) ? result : [result];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const value = row as Record<string, unknown>;
    const id = Number(value.TemplateID);
    return Number.isSafeInteger(id) && id > 0
      ? [{ ...value, TemplateID: id } as NotificationTemplate]
      : [];
  });
}
