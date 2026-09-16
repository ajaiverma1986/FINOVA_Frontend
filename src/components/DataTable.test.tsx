import { describe, expect, it } from 'vitest';
import { csvCell } from './DataTable';
describe('CSV export', () => {
  it('escapes delimiters, quotes and spreadsheet formulas', () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell('safe')).toBe('"safe"');
  });
});
