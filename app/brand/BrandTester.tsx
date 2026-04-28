'use client';

import { useState } from 'react';

const FONTS = [
  { id: 'geist',         family: '"Geist", sans-serif',          label: 'Geist',         note: 'Vercel — the modern default' },
  { id: 'geist-mono',    family: '"Geist Mono", ui-monospace',   label: 'Geist Mono',    note: 'Instrument feel, sharp terminals' },
  { id: 'inter-tight',   family: '"Inter Tight", sans-serif',    label: 'Inter Tight',   note: 'Linear / Notion lineage' },
  { id: 'space-grotesk', family: '"Space Grotesk", sans-serif',  label: 'Space Grotesk', note: 'Geometric grotesk, neutral' },
  { id: 'space-mono',    family: '"Space Mono", ui-monospace',   label: 'Space Mono',    note: 'Distinctive ascenders' },
  { id: 'jetbrains',     family: '"JetBrains Mono", ui-monospace', label: 'JetBrains Mono', note: 'Engineer feel, code-heritage' },
  { id: 'plex',          family: '"IBM Plex Sans", sans-serif',  label: 'IBM Plex Sans', note: 'Industrial, multi-script' },
  { id: 'plex-mono',     family: '"IBM Plex Mono", ui-monospace', label: 'IBM Plex Mono', note: 'Industrial monospace' },
  { id: 'manrope',       family: '"Manrope", sans-serif',        label: 'Manrope',       note: 'Geometric, popular' },
  { id: 'outfit',        family: '"Outfit", sans-serif',         label: 'Outfit',        note: 'Crisp, very modern' },
  { id: 'sora',          family: '"Sora", sans-serif',           label: 'Sora',          note: 'Sharp angles' },
  { id: 'dm-sans',       family: '"DM Sans", sans-serif',        label: 'DM Sans',       note: 'Geometric, friendly' },
  { id: 'archivo',       family: '"Archivo", sans-serif',        label: 'Archivo',       note: 'Technical sans-serif' },
];

const NAMES = [
  { name: 'AIDE·FIP', sub: 'fire indicator panel field tool', note: 'current working name' },
  { name: 'Riser',    sub: 'fire indicator panel · field',    note: 'top pick — trade-resonant + modern SaaS' },
  { name: 'Mimic',    sub: 'fire indicator panel · field',    note: 'direct industry term, distinctive' },
  { name: 'Pulse',    sub: 'fire systems · field',            note: 'signal / status / beat' },
  { name: 'Latch',    sub: 'fire systems · field',            note: 'relay click, mechanical' },
  { name: 'Foreman',  sub: 'fire systems · field',            note: 'trades + supervisor metaphor' },
];

const WEIGHTS = [400, 500, 600, 700, 800];

export function BrandTester() {
  const [reverse, setReverse] = useState(false);
  const [showAmber, setShowAmber] = useState(true);
  const [weight, setWeight] = useState(600);
  const [tracking, setTracking] = useState(-25);
  const [activeName, setActiveName] = useState(0);

  const bg   = reverse ? '#f3f5f8' : '#0b0d10';
  const fg   = reverse ? '#0b0d10' : '#f3f5f8';
  const sub  = reverse ? '#5b6470' : '#8c95a3';
  const dot  = '#f5a623';

  const current = NAMES[activeName];
  const [head, tail] = splitOnDot(current.name);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-head">Brand workshop</h1>
        <p className="text-muted text-sm">Type-tester, name candidates and the loading splash. Use this to pick a wordmark before sending the brief out.</p>
      </header>

      <section className="card p-4 space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-muted">Controls</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <ToggleField label={reverse ? 'Reverse' : 'Dark'}>
            <button onClick={() => setReverse(r => !r)} className="btn">Flip</button>
          </ToggleField>
          <ToggleField label={showAmber ? 'Amber dot on' : 'Amber dot off'}>
            <button onClick={() => setShowAmber(a => !a)} className="btn">Toggle</button>
          </ToggleField>
          <Field label={`Weight ${weight}`}>
            <input type="range" min={WEIGHTS[0]} max={WEIGHTS[WEIGHTS.length - 1]} step={100} value={weight} onChange={(e) => setWeight(parseInt(e.target.value, 10))} />
          </Field>
          <Field label={`Tracking ${tracking}`}>
            <input type="range" min={-80} max={40} step={5} value={tracking} onChange={(e) => setTracking(parseInt(e.target.value, 10))} />
          </Field>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted mb-2">Candidate name</h3>
          <div className="flex gap-2 flex-wrap">
            {NAMES.map((n, i) => (
              <button
                key={n.name}
                onClick={() => setActiveName(i)}
                className={`btn ${i === activeName ? 'btn-primary' : ''}`}
              >
                {n.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">{current.note}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-muted">Hero — every typeface, current candidate name</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {FONTS.map(f => (
            <div
              key={f.id}
              className="card p-6 flex flex-col items-start justify-between min-h-[160px]"
              style={{ background: bg, borderColor: reverse ? '#cdd3dc' : '#262a31' }}
            >
              <div
                style={{
                  fontFamily: f.family,
                  fontWeight: weight,
                  letterSpacing: `${tracking / 1000}em`,
                  color: fg,
                  fontSize: 'clamp(28px, 4vw, 48px)',
                  lineHeight: 1,
                }}
              >
                <span>{head}</span>
                {tail && (
                  <>
                    <span style={{ color: showAmber ? dot : fg, padding: '0 0.05em' }}>·</span>
                    <span>{tail}</span>
                  </>
                )}
              </div>
              <div className="flex items-baseline justify-between w-full mt-4">
                <span style={{ color: sub, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: f.family }}>
                  {current.sub}
                </span>
                <span className="text-xs text-muted">{f.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-muted">16 px legibility — favicon-size sanity check</h2>
        <div className="card p-4 flex flex-wrap gap-x-6 gap-y-3" style={{ background: bg }}>
          {FONTS.map(f => (
            <div key={f.id} className="flex items-baseline gap-2">
              <span style={{ fontFamily: f.family, fontWeight: weight, color: fg, fontSize: 16, letterSpacing: `${tracking / 1000}em` }}>
                <span>{head}</span>
                {tail && (
                  <>
                    <span style={{ color: showAmber ? dot : fg }}>·</span>
                    <span>{tail}</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-muted">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-muted">Stacked lockup — all candidate names in Geist</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NAMES.map(n => {
            const [h, t] = splitOnDot(n.name);
            return (
              <div key={n.name} className="card p-6" style={{ background: bg }}>
                <div style={{ fontFamily: '"Geist", sans-serif', fontWeight: 700, color: fg, fontSize: 36, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  <span>{h}</span>
                  {t && <><span style={{ color: dot }}>·</span><span>{t}</span></>}
                </div>
                <div style={{ height: 1, background: reverse ? '#cdd3dc' : '#262a31', margin: '10px 0' }} />
                <div style={{ fontFamily: '"Geist Mono", ui-monospace', color: sub, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {n.sub}
                </div>
                <p className="text-xs text-muted mt-3">{n.note}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function splitOnDot(name: string): [string, string | null] {
  const idx = name.search(/[·•∙]/);
  if (idx === -1) return [name, null];
  return [name.slice(0, idx), name.slice(idx + 1)];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

function ToggleField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      {children}
    </div>
  );
}
