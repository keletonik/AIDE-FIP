'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card p-6 max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted text-sm">An unexpected error occurred. The error has been logged.</p>
      {error.digest && <p className="text-xs text-muted font-mono">ref: {error.digest}</p>}
      <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
    </div>
  );
}
