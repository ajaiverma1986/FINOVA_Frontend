import { describe, expect, it } from 'vitest';
import { csvCell } from './DataTable';
import { formatAuditDate } from '../core/formatAuditDate';
describe('CSV export', () => {
  it('escapes delimiters, quotes and spreadsheet formulas', () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell('safe')).toBe('"safe"');
  });
  describe('audit date formatting', () => {
    it('formats created and updated dates as yyyy-MM-dd and leaves other fields unchanged', () => {
      expect(formatAuditDate('2026-10-11T17:12:42.877', 'CreatedOn')).toBe('2026-10-11');
      expect(formatAuditDate('2026-10-12 08:30:15', 'updatedon')).toBe('2026-10-12');
      expect(formatAuditDate('2026-10-12T08:30:15', 'BankTxnDatetime')).toBe('2026-10-12T08:30:15');
      expect(formatAuditDate(new Date('2026-10-11T17:12:42.877Z'), 'CreatedOn')).toBe('2026-10-11');
    });
  });
});
