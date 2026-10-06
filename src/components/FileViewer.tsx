import { useId, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

export interface FileViewerProps {
  fileUrl: string;
  open: boolean;
  onClose: () => void;
  fileName?: string;
  contentType?: string;
}

export function resolveFileUrl(fileUrl: string): string | null {
  if (!fileUrl.trim()) return null;
  try {
    const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const url = new URL(fileUrl.trim(), `${base.replace(/\/$/, '')}/`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function FilePreview({
  url,
  name,
  contentType,
}: {
  url: string;
  name: string;
  contentType?: string;
}) {
  const [failed, setFailed] = useState(false);
  const path = new URL(url).pathname;
  const isImage =
    /^image\/(jpeg|png|gif|webp|bmp|avif)$/i.test(contentType ?? '') ||
    /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(path);
  const isPdf = contentType === 'application/pdf' || /\.pdf$/i.test(path);
  if (failed)
    return <p role="alert">Unable to display this document. Try opening it in a new tab.</p>;
  if (isImage)
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          display: 'block',
          width: 'auto',
          height: 'auto',
          maxWidth: 'calc(100vw - 96px)',
          maxHeight: 'min(70dvh, calc(100dvh - 180px))',
          margin: '0 auto',
          objectFit: 'contain',
        }}
      />
    );
  if (isPdf)
    return (
      <iframe
        src={url}
        title={name}
        onError={() => setFailed(true)}
        style={{ display: 'block', width: '100%', height: 'min(720px, 70dvh)', border: 0 }}
      />
    );
  return (
    <p>
      Preview is unavailable for this file type. Open the document in a new tab to view or download
      it.
    </p>
  );
}

/** Displays an image or PDF from an absolute URL or a path relative to the API base URL. */
export default function FileViewer({
  fileUrl,
  open,
  onClose,
  fileName,
  contentType,
}: FileViewerProps) {
  const titleId = useId();
  const url = resolveFileUrl(fileUrl);
  const name = fileName || 'Document';
  const isPdf =
    contentType === 'application/pdf' || (url !== null && /\.pdf$/i.test(new URL(url).pathname));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: isPdf ? '1000px' : 'fit-content',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100dvh - 48px)',
            m: 3,
          },
        },
      }}
      aria-labelledby={titleId}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DialogTitle id={titleId} sx={{ overflowWrap: 'anywhere' }}>
        {name}
      </DialogTitle>
      <DialogContent dividers sx={{ flex: '0 1 auto', overflow: 'auto' }}>
        {url ? (
          <FilePreview
            key={`${url}:${contentType}`}
            url={url}
            name={name}
            contentType={contentType}
          />
        ) : (
          <p role="alert">A valid document URL is not available.</p>
        )}
      </DialogContent>
      <DialogActions>
        {url && (
          <Button component="a" href={url} target="_blank" rel="noopener noreferrer">
            Open in new tab
          </Button>
        )}
        <Button onClick={onClose}>Close document</Button>
      </DialogActions>
    </Dialog>
  );
}
