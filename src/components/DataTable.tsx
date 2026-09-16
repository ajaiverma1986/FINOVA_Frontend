import { useEffect, useMemo, useState, type ReactNode } from 'react';

const PAGE_SIZE = 20;

export function title(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (v) => v.toUpperCase());
}
export function textValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
export function csvCell(value: unknown) {
  let text = textValue(value);
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function downloadCsv(rows: Record<string, unknown>[], columns: string[], name: string) {
  const content = [
    columns.map(csvCell).join(','),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name.replace(/[^\w-]/g, '_') + '.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataTable({
  data,
  columns: preferred = [],
  name,
  onSelect,
  renderActions,
  emptyMessage = 'No records found.',
}: {
  data: unknown;
  columns?: string[];
  name: string;
  onSelect?: (row: Record<string, unknown>) => void;
  renderActions?: (row: Record<string, unknown>) => ReactNode;
  emptyMessage?: string;
}) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ column: '', direction: 1 });
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const rows: Record<string, unknown>[] = useMemo(
    () =>
      Array.isArray(data)
        ? data.map((row) => (row && typeof row === 'object' ? row : { Value: row }))
        : [],
    [data],
  );
  const columns = useMemo(() => {
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter(
      (key) => !/password|token|filebytes|base64string|stateresp|ekyc_id/i.test(key),
    );
    return preferred.length && preferred.some((key) => keys.includes(key))
      ? preferred.filter((key) => keys.includes(key))
      : keys;
  }, [rows, preferred]);
  const filtered = useMemo(
    () =>
      rows
        .filter((row) =>
          columns.every((column) => {
            const filter = filters[column]?.trim().toLocaleLowerCase();
            return !filter || textValue(row[column]).toLocaleLowerCase().includes(filter);
          }),
        )
        .sort((left, right) => {
          if (!sort.column) return 0;
          const x = left[sort.column],
            y = right[sort.column];
          const comparison =
            typeof x === 'number' && typeof y === 'number'
              ? x - y
              : textValue(x).localeCompare(textValue(y), undefined, {
                  numeric: true,
                  sensitivity: 'base',
                });
          return comparison * sort.direction;
        }),
    [rows, columns, filters, sort],
  );
  useEffect(() => {
    setPage(0);
    setSelectedRow(null);
  }, [data, filters]);
  const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, maxPage);
  const hasActions = Boolean(onSelect || renderActions);
  return (
    <section aria-label={name}>
      <div className="toolbar">
        <button
          type="button"
          className="secondary"
          disabled={!filtered.length}
          onClick={() => downloadCsv(filtered, columns, name)}
        >
          Export to Excel
        </button>
      </div>
      {!rows.length ? (
        <div className="state">{emptyMessage}</div>
      ) : (
        <div className="table-scroll project-grid">
          <table>
            <caption className="sr-only">{name}</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    aria-sort={
                      sort.column === column
                        ? sort.direction === 1
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPage(0);
                        setSort({
                          column,
                          direction: sort.column === column ? -sort.direction : 1,
                        });
                      }}
                    >
                      {title(column)}{' '}
                      {sort.column === column ? (sort.direction === 1 ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                ))}
                {hasActions && <th>Actions</th>}
              </tr>
              <tr className="grid-filter-row">
                {columns.map((column) => (
                  <th key={column}>
                    <input
                      type="search"
                      value={filters[column] ?? ''}
                      placeholder="Filter"
                      aria-label={`Filter by ${title(column)}`}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, [column]: event.target.value }))
                      }
                    />
                  </th>
                ))}
                {hasActions && (
                  <th>
                    <button
                      type="button"
                      className="secondary grid-clear-filters"
                      disabled={!Object.values(filters).some(Boolean)}
                      onClick={() => setFilters({})}
                    >
                      Clear
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr>
                  <td colSpan={columns.length + Number(hasActions)}>No matching records.</td>
                </tr>
              ) : (
                filtered
                  .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
                  .map((row, index) => {
                    const rowIndex = currentPage * PAGE_SIZE + index;
                    const selected = selectedRow === rowIndex;
                    return (
                      <tr key={rowIndex} className={selected ? 'selected-row' : undefined}>
                        {columns.map((column) => (
                          <td key={column}>{textValue(row[column])}</td>
                        ))}
                        {onSelect && (
                          <td>
                            <button
                              className={selected ? 'active' : 'secondary'}
                              aria-pressed={selected}
                              onClick={() => {
                                setSelectedRow(rowIndex);
                                onSelect(row);
                              }}
                            >
                              {selected ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        )}
                        {renderActions && <td>{renderActions(row)}</td>}
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="toolbar pagination">
        <span>
          {filtered.length} records · Page {currentPage + 1} of {maxPage + 1}
        </span>
        <button
          className="secondary"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          Previous
        </button>
        <button
          className="secondary"
          disabled={currentPage >= maxPage}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
