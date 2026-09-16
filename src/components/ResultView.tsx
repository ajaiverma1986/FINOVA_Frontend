import { useEffect, useState } from 'react';
import { DataTable, textValue, title } from './DataTable';

export function ResultView({
  value,
  columns,
  name,
  onSelect,
}: {
  value: unknown;
  columns?: string[];
  name: string;
  onSelect?: (row: Record<string, unknown>) => void;
}) {
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentType, setDocumentType] = useState('application/octet-stream');
  useEffect(() => {
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const encoded = record.FileBytes ?? record.Base64String;
    if (typeof encoded !== 'string' && !Array.isArray(encoded)) return;
    try {
      const bytes =
        typeof encoded === 'string'
          ? Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))
          : Uint8Array.from(encoded);
      // Only preview known raster formats; never execute uploaded HTML or SVG.
      const type =
        bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
          ? 'image/png'
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            ? 'image/jpeg'
            : bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70
              ? 'application/pdf'
              : 'application/octet-stream';
      const url = URL.createObjectURL(new Blob([bytes], { type }));
      setDocumentType(type);
      setDocumentUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setDocumentUrl('');
      };
    } catch {
      setDocumentUrl('');
    }
  }, [value]);
  if (value === undefined || value === null) return <div className="state">No records found.</div>;
  if (Array.isArray(value))
    return <DataTable data={value} columns={columns} name={name} onSelect={onSelect} />;
  if (typeof value === 'object')
    return (
      <>
        <dl className="details">
          {Object.entries(value)
            .filter(
              ([key]) => !/password|token|filebytes|base64string|stateresp|ekyc_id/i.test(key),
            )
            .map(([key, entry]) => (
              <div key={key}>
                <dt>{title(key)}</dt>
                <dd>
                  {typeof entry === 'object' && entry !== null ? (
                    <ResultView value={entry} name={title(key)} />
                  ) : (
                    textValue(entry) || '—'
                  )}
                </dd>
              </div>
            ))}
        </dl>
        {documentUrl && (
          <div>
            {documentType.startsWith('image/') && (
              <img
                src={documentUrl}
                alt={name}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: 500,
                  objectFit: 'contain',
                  marginBottom: 16,
                }}
              />
            )}
            <a
              className="button"
              href={documentUrl}
              download={
                'document' +
                ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'application/pdf': '.pdf' }[
                  documentType
                ] || '.bin')
              }
            >
              Download document
            </a>
          </div>
        )}
      </>
    );
  return <p className="notice">{textValue(value)}</p>;
}
