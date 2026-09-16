export function Loading() {
  return (
    <div className="state" role="status">
      <span className="spinner" /> Loading…
    </div>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <p>{error instanceof Error ? error.message : 'Something went wrong. Please try again.'}</p>
      {retry && (
        <button type="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
