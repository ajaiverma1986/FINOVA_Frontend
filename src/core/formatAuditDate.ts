export function formatAuditDate(value: unknown, field: string): unknown {
  if (!/^(createdon|updatedon)$/i.test(field)) return value;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return value;
  return /^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/.exec(value)?.[1] ?? value;
}
