function escapeXml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function exportToExcel(name: string, columns: string[], rows: Record<string, unknown>[]) {
  const cells = (values: unknown[], header = false) =>
    `<Row>${values
      .map((value) => {
        const numeric = !header && typeof value === 'number' && Number.isFinite(value);
        return `<Cell><Data ss:Type="${numeric ? 'Number' : 'String'}">${escapeXml(value)}</Data></Cell>`;
      })
      .join('')}</Row>`;
  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${escapeXml(name).slice(0, 31)}"><Table>
${cells(columns, true)}
${rows.map((row) => cells(columns.map((column) => row[column]))).join('\n')}
</Table></Worksheet></Workbook>`;
  const url = URL.createObjectURL(
    new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

