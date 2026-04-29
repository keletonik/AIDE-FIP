import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card p-6 max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="text-muted text-sm">That page doesn&rsquo;t exist or has moved.</p>
      <Link className="btn btn-primary" href="/">Home</Link>
    </div>
  );
}
