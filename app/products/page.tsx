import { categories } from '@/lib/repos';

export const metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const list = categories.list();
  const byFamily: Record<string, typeof list> = {};
  for (const c of list) (byFamily[c.family] ??= []).push(c);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Product categories</h1>
      <p className="text-muted text-sm">
        Normalised vocabulary the product selector emits. V1 ships category + name + applicable standard.
        V2 wires this into Flaro for live SKU and stock when the commerce backend lands.
      </p>

      {Object.entries(byFamily).map(([family, cats]) => (
        <section key={family} className="space-y-2">
          <h2 className="text-sm uppercase tracking-wide text-muted">{family.replace(/-/g, ' ')}</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cats.map(c => (
              <li key={c.slug} className="card p-3">
                <div className="text-head">{c.label}</div>
                <code className="text-xs text-muted">{c.slug}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
