import { notFound } from 'next/navigation';
import Link from 'next/link';
import { standards } from '@/lib/repos';
import { kb } from '@/lib/kb';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function StandardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const std = standards.get(id);
  if (!std) notFound();

  const clauses = standards.clauses(id);
  await audit({ action: 'standard.view', target: id });

  return (
    <article className="space-y-6">
      <div className="space-y-2">
        <Link href="/standards" className="text-sm text-muted no-underline">← Standards</Link>
        <h1 className="text-2xl font-bold text-head">{std.title}</h1>
        <p className="text-body">{std.summary}</p>
        <div className="flex gap-2 items-center text-xs text-muted">
          <span className="tag">{std.year ?? '—'}</span>
          <span>{std.authority}</span>
        </div>
      </div>

      <a href={kb.standard(std.id)} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex">
        Open in knowledge base ↗
      </a>

      {clauses.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-head">Clauses</h2>
          <table>
            <thead><tr><th style={{ width: 90 }}>Clause</th><th>Title</th><th>Paraphrase</th><th></th></tr></thead>
            <tbody>
              {clauses.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-head">{c.number}</td>
                  <td className="text-head">{c.title}</td>
                  <td className="text-body">{c.paraphrase ?? <span className="text-muted">—</span>}</td>
                  <td>
                    <a href={kb.standard(std.id, c.number)} target="_blank" rel="noopener noreferrer" className="text-link text-sm">KB ↗</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="text-muted text-sm">No clauses indexed yet for this standard. Use the knowledge base link above.</p>
      )}
    </article>
  );
}
