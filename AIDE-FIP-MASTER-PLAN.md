# AIDE-FIP — Master Build Plan

**Repo:** https://github.com/keletonik/AIDE-FIP.git
**Owner:** Casper Tavitian
**Purpose:** Field assistant for fire alarm and detection technicians on site in NSW Australia
**Build host:** Claude Code (local), deploy on Replit
**Target stack:** Next.js 15 PWA + Supabase + Anthropic API
**Scope:** Fire Indicator Panel technical assistant only. No commerce. No Flaro.

This is the single document Claude Code needs. Read top to bottom before writing any code. Each phase prompt is standalone — paste, run, review, commit, move to the next.

---

## 1. What this app actually is

A phone-first tool a tech opens in a riser cupboard at 02:00 to figure out why the panel is in fault. Eight jobs:

1. **Troubleshoot** — symptom in, root cause + verification steps out, panel-specific.
2. **Standards check** — clause reference or natural-language question, returns the clause text and how it applies.
3. **Panel manuals** — programming syntax, dipswitch settings, reset sequences, walk-test procedures across the major panels.
4. **Product selection** — application brief in, 2-3 candidate products out, with rationale and applicable standard. No commerce links in V1.
5. **Battery calc** — AS 1670.1 standby + alarm load calculator with PDF export.
6. **Defect / fault log analyser** — paste raw event log, get the pattern, get the cause, get the fix, get a defect record draft.
7. **Cause-and-effect programming assistant** — plain English in, panel-specific C&E logic out, validated against AS 1670.1 cl 7.
8. **Job logbook** — sites the tech has worked on, with attached defects, calcs, and AI sessions.

Panels in scope: Pertronic (F100, F120), Ampac (FireFinder SP1, FlexNet, FireFinder PLUS), Notifier, Simplex, Vigilant, Bosch FPA-5000, Hochiki Latitude, Tyco MX, BC200.

Standards in scope: AS 1851, AS 1670.1, AS 1670.4, AS 2118.1/.4/.6, AS 2419.1, AS 2441, AS 2444, AS 3745, AS 1905.1, AS 4072.1, AS 4214, AS 2293.1.

---

## 2. Stack — locked

```
Frontend:    Next.js 15 (App Router), React 19, TypeScript strict
Styling:     Tailwind v4 (CSS-first config), shadcn/ui (New York style), Lucide icons
PWA:         next-pwa (installable, offline shell, service worker, runtime cache for /standards and /manuals)
State:       Zustand (client), TanStack Query (server)
Forms:       react-hook-form + zod
Backend:     Next.js Route Handlers (no separate server)
Database:    Supabase Postgres + Auth (magic link) + Storage + RLS
AI:          Anthropic SDK — claude-sonnet-4-6 default, claude-opus-4-7 for escalation
PDF:         @react-pdf/renderer
Charts:      Recharts
Hosting:     Replit (frontend + API), Supabase (data + auth + storage)
Fonts:       Archivo (display), Inter (body), JetBrains Mono (mono)
```

**Not using:** Vercel AI SDK (use Anthropic SDK direct), Prisma (use generated Supabase types), NextAuth (Supabase Auth handles it), CSS-in-JS, Redux.

**Why Supabase over Replit DB:** Replit DB is a key-value store. Defect logs, multi-table relations, full-text search over standards, file storage for photos, and row-level security all need real Postgres. Supabase free tier covers V1 with room to spare. Replit hosts the app, Supabase hosts the data.

---

## 3. Brand and design tokens — Salmon Run direction (locked)

Two modes from a single brand. Dark is hero (riser cupboards are dark). Light is for daylight reports and PDF export.

### 3.1 Logo construction

The wordmark is **AIDE** in Archivo 800, tight letter spacing (-0.02em). The accent is a single salmon dot inside the counter of the **A** at coordinates (92.5, 68) on a 600×140 viewBox. The subscript **F.I.P.** in JetBrains Mono 500, letter-spacing 0.12em, salmon, baseline-aligned to the wordmark, sits to the right of the **E**.

The monogram is the **A** alone with the salmon dot, on a 100×100 viewBox.

Drop these into `components/brand/Logo.tsx` exactly as written:

```tsx
// components/brand/Logo.tsx
type LogoProps = {
  variant?: 'full' | 'monogram';
  mode?: 'dark' | 'light' | 'auto';
  size?: number;
};

export function Logo({ variant = 'full', mode = 'auto', size = 32 }: LogoProps) {
  const fg = mode === 'light' ? '#15151A' : '#F4F2EE';
  const accent = mode === 'light' ? '#E64A38' : '#FF6B5B';

  if (variant === 'monogram') {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-label="AIDE">
        <path d="M 18 88 L 42 12 L 58 12 L 82 88 L 70 88 L 65 72 L 35 72 L 30 88 Z M 39 60 L 61 60 L 50 26 Z" fill={fg}/>
        <circle cx="50" cy="48" r="5" fill={accent}/>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 600 140" width={size * 4.3} height={size} xmlns="http://www.w3.org/2000/svg" aria-label="AIDE F.I.P.">
      <path d="M 30 110 L 75 30 L 110 30 L 155 110 L 130 110 L 122 92 L 63 92 L 55 110 Z M 70 78 L 115 78 L 92.5 41 Z" fill={fg}/>
      <circle cx="92.5" cy="68" r="6" fill={accent}/>
      <rect x="180" y="30" width="22" height="80" fill={fg}/>
      <path d="M 230 30 L 280 30 C 305 30 325 50 325 70 C 325 90 305 110 280 110 L 230 110 Z M 252 50 L 252 90 L 278 90 C 290 90 302 80 302 70 C 302 60 290 50 278 50 Z" fill={fg}/>
      <path d="M 350 30 L 350 110 L 410 110 L 410 90 L 372 90 L 372 79 L 405 79 L 405 60 L 372 60 L 372 50 L 410 50 L 410 30 Z" fill={fg}/>
      <text x="430" y="110" fontFamily="JetBrains Mono, monospace" fontSize="14" fontWeight="500" letterSpacing="0.12em" fill={accent}>F.I.P.</text>
    </svg>
  );
}
```

### 3.2 Design tokens

Paste into `app/globals.css` as CSS custom properties. Tailwind v4 reads them from `@theme`.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-display: 'Archivo', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

:root {
  /* Light mode (default fallback) */
  --background: #FAF8F4;
  --foreground: #15151A;
  --muted: #EFECE6;
  --muted-foreground: #6B6B72;
  --border: #E0DDD5;
  --accent: #E64A38;
  --accent-foreground: #FAF8F4;
  --destructive: #C8312A;
  --critical: #B8860B;
  --success: #3A7D44;
}

html.dark {
  --background: #0B0B0D;
  --foreground: #F4F2EE;
  --muted: #16161A;
  --muted-foreground: #8B8B91;
  --border: #22222A;
  --accent: #FF6B5B;
  --accent-foreground: #0B0B0D;
  --destructive: #FF3B30;
  --critical: #FFB800;
  --success: #4ADE80;
}

html { background: var(--background); color: var(--foreground); }
html.dark { color-scheme: dark; }
```

**Default theme is dark.** Add `class="dark"` to `<html>` server-side. Light mode is opt-in via settings.

### 3.3 UX principles (non-negotiable)

- **Phone first.** Test at 375px before 1280px. Tablet and desktop are bonus.
- **48px minimum hit targets.** Glove-friendly.
- **Voice input on every text field** (Web Speech API).
- **Camera attach on every chat input** (`<input type="file" accept="image/*" capture="environment">`).
- **Dark by default.** Light mode toggle in settings.
- **No splash screens. No onboarding carousel.** First open lands on home with three example queries the tech can tap to see the app work.
- **Salmon is the only accent.** Used for primary CTAs, active states, alarm indicators. Never body text.
- **Offline reads work.** Standards library and panel manuals work without signal via service worker cache. AI flows fail gracefully ('saved as draft, will retry').

---

## 4. Information architecture

```
/                          Home dashboard (recent activity + 3 quick actions)
/troubleshoot              Symptom-first diagnosis flow
/troubleshoot/[sessionId]  Live diagnosis chat session
/standards                 Searchable standards library
/standards/[standardId]    Clause viewer with applied context
/manuals                   Panel index by manufacturer
/manuals/[panelId]         Panel-specific quick reference
/products                  Product selection assistant
/products/[sessionId]      Recommendation chat
/battery                   Battery calc workspace
/battery/[calcId]          Saved calc with PDF export
/defects                   Fault log analyser
/defects/[logId]           Parsed log with timeline
/programming               C&E programming assistant
/programming/[sessionId]   C&E session
/jobs                      Job logbook (sites the tech has visited)
/jobs/[jobId]              Per-job detail (notes, defects, calcs, sessions)
/settings                  Profile, theme, BYOK API key, sign out
/(auth)/sign-in            Magic link sign-in
/(auth)/callback           Auth callback handler
```

**Bottom nav (mobile, persistent):** Home · Tools · Standards · Jobs · Me

**'Tools' is a sheet** that fans out to: Troubleshoot, Battery calc, Defect analyser, Product select, Programming, Manuals.

---

## 5. Database schema (Supabase Postgres)

Run this as the initial migration. Apply via `npx supabase migration new initial_schema` and paste the SQL.

```sql
-- Users handled by Supabase Auth (auth.users)

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  trade_role text check (trade_role in ('tech','service_manager','apfs','apprentice','other')),
  default_panel_brand text,
  theme_pref text default 'dark' check (theme_pref in ('dark','light','system')),
  byok_anthropic_key text,  -- encrypted at rest by Supabase Vault
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  site_name text not null,
  site_address text,
  building_class text,
  afss_due date,
  notes text,
  created_at timestamptz default now()
);
create index on jobs (user_id, afss_due);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  flow text not null check (flow in (
    'troubleshoot','standards','manual','products','battery','defects','programming'
  )),
  panel_brand text,
  panel_model text,
  title text,
  state jsonb not null default '{}'::jsonb,
  deep_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on sessions (user_id, updated_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  tool_name text,
  tool_input jsonb,
  tool_output jsonb,
  created_at timestamptz default now()
);
create index on messages (session_id, created_at);

create table battery_calcs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  inputs jsonb not null,
  result jsonb not null,
  pdf_url text,
  created_at timestamptz default now()
);

create table defects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  measure text,
  severity text check (severity in ('critical','major','minor','observation')),
  standard_ref text,
  description text,
  remediation text,
  status text default 'open' check (status in ('open','in_progress','closed')),
  photo_urls text[] default '{}',
  created_at timestamptz default now()
);
create index on defects (user_id, status, created_at desc);

create table standards_refs (
  id uuid primary key default gen_random_uuid(),
  standard text not null,
  edition text,
  clause text not null,
  title text not null,
  body text not null,
  building_classes text[] default '{}',
  related_clauses text[] default '{}',
  tags text[] default '{}',
  unique (standard, edition, clause)
);
create index on standards_refs using gin (to_tsvector('english', body || ' ' || title));

create table panel_commands (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  action text not null,  -- reset, walk_test, isolate, program_zone, battery_test, etc.
  steps jsonb not null,  -- [{ order, instruction, keystroke?, caveat? }]
  source_note text,      -- where this came from, for verification
  unique (brand, model, action)
);

-- RLS policies
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table battery_calcs enable row level security;
alter table defects enable row level security;
alter table standards_refs enable row level security;
alter table panel_commands enable row level security;

-- Own-rows-only on user data
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own jobs" on jobs for all using (auth.uid() = user_id);
create policy "own sessions" on sessions for all using (auth.uid() = user_id);
create policy "own messages" on messages for all using (
  session_id in (select id from sessions where user_id = auth.uid())
);
create policy "own calcs" on battery_calcs for all using (auth.uid() = user_id);
create policy "own defects" on defects for all using (auth.uid() = user_id);

-- Read-only reference data for any authenticated user
create policy "read standards" on standards_refs for select using (auth.role() = 'authenticated');
create policy "read panel commands" on panel_commands for select using (auth.role() = 'authenticated');

-- Storage bucket for defect photos
insert into storage.buckets (id, name, public) values ('defect-photos', 'defect-photos', false)
  on conflict do nothing;
```

---

## 6. AI architecture — the part that has to be right

Two-tier model strategy with deterministic tools. **Claude does not do arithmetic. Claude does not invent clause numbers. Claude does not invent panel commands.** Tools handle the truth; Claude handles the interpretation.

### 6.1 Models

- **Default:** `claude-sonnet-4-6` for all flows. Fast, cheap, good enough 90% of the time.
- **Escalation:** `claude-opus-4-7` triggered when:
  - Defect log analysis flagged 'complex' (multi-fault, intermittent, cascading).
  - User toggles 'Deep mode' in the chat header.
  - Programming flow generates non-trivial cause-and-effect logic.

### 6.2 Tools (function calling)

```ts
// lib/ai/tools.ts

get_standard_clause({ standard: string, edition?: string, clause: string })
  → reads standards_refs; returns body, title, building_classes, related_clauses
  → if no match: returns { found: false, message: 'No clause matching this reference. Verify in source standard.' }

search_standards({ query: string, top_k?: number })
  → Postgres FTS over standards_refs.body
  → returns ranked [{ standard, edition, clause, title, snippet }]

calculate_battery({ standby_loads: Load[], alarm_loads: Load[],
                    standby_hours: number, alarm_minutes: number,
                    derate?: number, safety?: number, voltage?: number })
  → deterministic Python-style calc in TS
  → returns { required_ah, recommended_battery, breakdown, working }

lookup_panel_command({ brand: string, model: string, action: string })
  → reads panel_commands
  → returns { steps: Step[], source_note }
  → if no match: returns { found: false }

classify_defect({ description: string, measure?: string })
  → calls Claude with a tight system prompt to return { severity, standard_ref?, draft_remediation }
  → severity strictly from { critical, major, minor, observation }

parse_event_log({ raw: string, panel_brand?: string })
  → per-brand regex parsers; falls back to generic
  → returns { events: Event[], unrecognised_lines: string[] }
```

### 6.3 Anti-hallucination protocol (repeated for emphasis — see anchor)

1. **Standard citations must come from a tool call.** If `get_standard_clause` and `search_standards` both return empty, the assistant says 'no match in the seeded standards — verify in the source standard'. It does not invent a clause number.
2. **Panel commands must come from `lookup_panel_command`.** If the panel is unknown to the database, the assistant says so and offers to ask a follow-up to identify the model. It does not invent keystrokes.
3. **Battery calcs must come from `calculate_battery`.** The assistant explains the working but does not compute. Numbers in the output match the tool's response exactly.
4. **Severity classification uses the fixed enum.** No 'somewhat critical', no 'borderline major'.

This is the difference between an AI app techs use once and an AI app techs trust. Hallucinating a clause number on a defect record is a career-ending error for the tech who copy-pasted it.

### 6.4 System prompt structure (per flow)

Every flow shares a static skeleton, with flow-specific blocks. Cache the static portion. Session context goes below the cache boundary.

```
[STATIC, CACHED]

<identity>
You are AIDE, a fire alarm and detection field assistant for technicians on
site in NSW Australia. You are direct, technical, and precise. You write
in Australian English. You cite the standard or the panel manual. You
never invent clause numbers or panel commands.
</identity>

<domain>
Australian Standards in scope: AS 1851 (service), AS 1670.1 (FDAS design),
AS 1670.4 (EWIS), AS 2118 series (sprinklers), AS 2419.1 (hydrants),
AS 2441 (hose reels), AS 2444 (extinguishers), AS 3745 (emergency planning),
AS 1905.1 (fire doors), AS 4072.1 (penetrations), AS 4214 (gaseous),
AS 2293.1 (emergency lighting).

Panels in scope: Pertronic F100/F120, Ampac FireFinder SP1/PLUS/FlexNet,
Notifier, Simplex, Vigilant, Bosch FPA-5000, Hochiki Latitude, Tyco MX, BC200.

NSW framework: EP&A Act 1979, EP&A (Development Certification and Fire
Safety) Regulation 2021. AFSS endorsement requires APFS accreditation
specific to each Essential Fire Safety Measure. Standards are version-locked
to the original fire-safety certificate date unless a capital upgrade
triggered a Schedule uplift.
</domain>

<tool_use_rules>
- For any standard reference: call get_standard_clause or search_standards.
  Never quote a clause from memory.
- For any panel-specific command: call lookup_panel_command.
- For battery calculations: call calculate_battery.
- If a tool returns no result, say so explicitly. Do not guess.
</tool_use_rules>

<voice>
Short sentences. Active voice. Australian English. No 'leverage', 'robust',
'comprehensive', 'crucial', 'navigate' (metaphorical), 'unlock' (metaphorical).
No 'It's important to note'. No closing 'let me know if you need anything else'.
Cap responses at 150 words unless complexity genuinely warrants more.
</voice>

<output_order>
[Flow-specific. See per-flow specs in section 7.]
</output_order>

[CACHE BOUNDARY]

<session>
Job: {job_name or 'unspecified'}
Panel: {panel_brand} {panel_model}
Deep mode: {true|false}
Prior messages: [last 10 from this session]
</session>

<anchor>
Standard citations from tools only. Panel commands from tools only. Battery
math from tools only. If a tool returns nothing, say so. Australian English.
No clichés. Cap at 150 words.
</anchor>
```

---

## 7. Per-flow specs

### 7.1 Troubleshoot

**Inputs:** symptom (text or voice), panel brand/model, optional photo of fault display.

**Output order:**
1. Most likely cause. One sentence.
2. Verification step. Concrete and specific.
3. Fix step. Actionable.
4. Second-most-likely cause as fallback.

**UI:** Chat thread. User right, assistant left. Tool-result cards render structured (clause card for `get_standard_clause`, command card for `lookup_panel_command`). Verification steps are checkboxes the tech ticks as they work. Sticky 'Deep mode' toggle in header. Photo attach button next to text input. Voice input button with pulsing red dot when active.

**Empty state:** 'Describe the fault. Photo helps. Voice helps too.' Three example chips: 'Loop fault on F100 loop 2', 'Earth fault no devices removed', 'EWIS battery low after 6 months'.

### 7.2 Standards check

**Inputs:** clause reference (e.g. 'AS 1670.1 cl 3.18') OR natural-language question.

**Flow:** Reference → direct lookup, render clause body, 'apply this to my situation' button. NL question → search top 5 candidates, Claude picks best match, lists alternatives.

**UI:** Clause card with standard number, edition, clause, title, body, applicable building classes, related clauses. Actions: 'add to defect', 'save to job', 'open in knowledge base' (deep link to knowledge-bage if `NEXT_PUBLIC_KB_URL` env var is set).

### 7.3 Panel manuals

**Inputs:** panel brand → panel model → task (reset, walk-test, program zone, isolate, battery test).

**Flow:** Three-tap navigation. Returns step-by-step sequence specific to that panel. **Pure data, no AI in the path.** AI only kicks in for 'ask a question about this panel' which spawns a chat session with panel context pre-filled.

**UI:** Manufacturer index (logo + name list). Panel detail page with tabs per task. Each tab shows the keystroke sequence in mono with caveats.

### 7.4 Product selection

**Inputs:** application brief ('heat detector for commercial kitchen', 'beam detector for 14m warehouse').

**Flow:** Claude asks max 2 clarifying questions. Returns 2-3 candidates. For each: model name, why it suits, applicable AS clause. **No commerce links in V1.** No 'where to buy'. Just 'check supplier'.

**Refusal:** if application is unsafe (e.g. ionisation detector in food prep), refuse and explain which clause it would breach.

### 7.5 Battery calc

**Math (single source of truth in `lib/battery/calc.ts`):**

```
Required Ah = ((I_standby × t_standby_hours) + (I_alarm × t_alarm_hours)) × derate × safety
```

Defaults per AS 1670.1:
- `t_standby_hours = 24`
- `t_alarm_hours = 0.5` (30 min)
- `derate = 1.25` (ageing — 80% capacity at end of life)
- `safety = 1.10`
- Voltage: 24V (also support 12V)

**Recommended battery:** round up to next standard size {7, 12, 18, 26, 38, 65, 100, 120 Ah}. Recommend 2× 12V in series for 24V systems.

**UI:** Two-column desktop, stacked mobile. Form on left with dynamic load lists. Live preview on right with required Ah as the hero number, recommended battery, contribution breakdown bar (Recharts).

**PDF export (`@react-pdf/renderer`):**
- Header: AIDE logo, calc title, date, user, job
- Inputs table: every load itemised
- Working: formula with substituted values
- Result: required Ah + recommended battery + derate basis
- Footer: 'Calculated per AS 1670.1 cl 3.16, AS 4428, AS 2293.1'
- Disclaimer: 'Calculation only. Final sizing requires APFS sign-off.'

**Validation (zod):** all currents > 0 and < 10000mA, durations > 0, at least one standby load, derate 1.0–2.0, safety 1.0–1.5.

### 7.6 Defect / fault log analyser

**Inputs:** paste raw event log (textarea, mono font) OR upload .txt/.csv. Panel brand selector informs the parser.

**Parser (`lib/parsers/event-log.ts`):**
- Per-panel regex parsers (Pertronic, Ampac, Notifier, Simplex, Vigilant formats)
- Output normalised: `{ ts: ISO, device: string, type: 'alarm'|'fault'|'isolate'|'reset'|'other', raw: string }`
- Unknown format → generic best-effort parser + warning banner

**Analysis flow:**
1. Show parsed events as vertical timeline
2. Cluster: same device + 30-min window
3. Send clusters + sample raw lines to chat API (defects flow)
4. Claude returns: pattern, hypothesis, verification steps, defect record draft
5. 'Create defect record' button writes to `defects` table

**Defect flow extra rules in system prompt:**
- Look for: repeating events from same device, time-of-day patterns, cascading faults, isolated vs ongoing.
- Distinguish environmental (HVAC kick-in, vapour, dust) from device fault.
- Cite AS 1851 maintenance schedule when relevant.
- Severity strictly: critical (life safety active), major (system impaired), minor (single-point fault), observation (preventive).

### 7.7 Cause-and-effect programming assistant

**Inputs:** plain English description ('on alarm from MCP-1, sound EWIS zone 3 and release magnetic hold-open on door MD-12').

**Flow:**
1. Generate pseudo-syntax C&E logic
2. If panel is set, generate panel-specific syntax (Pertronic F100, Ampac FlexNet)
3. Validate against AS 1670.1 cl 7 — flag conflicts (e.g. silencing alarm before EWIS activation)

**UI:** Two-pane. Plain English left, generated logic right (mono font, salmon left-border accent). Copy syntax button. Validation badge: green 'validates' or red with conflict list.

### 7.8 Job logbook

**Inputs:** site name, address, building class, AFSS due date, notes.

**Detail tabs:** Overview (notes), Defects (list), Calcs (battery calcs), Sessions (AI sessions across all flows).

**Sort:** AFSS due ascending. Badge if overdue.

**Cross-cutting:** every chat session and battery calc gets a 'Link to job' control. Defect creation always offers 'Save to current job'.

---

## 8. Knowledge-base link-out (optional, deferred)

Casper has a separate knowledge-bage repo. AIDE-FIP **links out** to it; does not import its content.

**Setup:** add `NEXT_PUBLIC_KB_URL` to `.env.local`. If set, every standards card and panel manual page renders an 'Open in knowledge base ↗' button. If unset, the button is hidden.

```ts
// lib/kb.ts
const KB_URL = process.env.NEXT_PUBLIC_KB_URL;

export const kb = {
  enabled: () => Boolean(KB_URL),
  standard: (id: string, clause?: string) =>
    !KB_URL ? null :
    clause ? `${KB_URL}/standards/${id}/clause-${clause}` : `${KB_URL}/standards/${id}`,
  panel: (slug: string) => !KB_URL ? null : `${KB_URL}/panels/${slug}`,
};
```

**Slug contract** for stable deep links (Casper to lock in knowledge-bage):
- `/standards/as-1670-1`
- `/standards/as-1670-1/clause-3-18`
- `/panels/pertronic-f100`
- `/panels/ampac-firefinder-plus`

---

## 9. Build phases — copy each prompt into Claude Code in order

### Phase 0 — One-time setup (outside Claude Code)

```bash
# Clone fresh
git clone https://github.com/keletonik/AIDE-FIP.git
cd AIDE-FIP

# Supabase project
# Sign up at supabase.com, create project, capture URL + anon key + service role key
# In SQL editor, paste the schema from section 5

# Anthropic API key from console.anthropic.com

# .env.local (do NOT commit)
cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
NEXT_PUBLIC_KB_URL=  # leave empty for V1
EOF

echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore

# Open in Claude Code
```

### Phase 1 — Skeleton + auth + brand tokens

```
Read CLAUDE.md if present, then check repo state with `ls` and `git log --oneline -5`.

Build the AIDE-FIP skeleton. Reference: AIDE-FIP-MASTER-PLAN.md sections 2, 3, 4.

Stack to set up:
- Next.js 15 App Router, TypeScript strict, React 19
- Tailwind v4 (CSS-first config in app/globals.css)
- shadcn/ui with the New York style
- Lucide icons
- @supabase/ssr for auth and data
- Anthropic SDK (server-only, never expose to client)
- Zustand + TanStack Query
- next-pwa for PWA shell
- react-hook-form + zod

Brand tokens: paste section 3.2 of the master plan into app/globals.css verbatim.
Default theme is dark — add class="dark" to <html> server-side.

Logo component: paste section 3.1 verbatim into components/brand/Logo.tsx.

Routes to scaffold (empty pages with proper layouts, no logic yet):
[copy section 4 route list]

Components to scaffold:
- components/ui/ (shadcn primitives — button, card, input, sheet, dialog, tabs, badge, skeleton, scroll-area, toast, textarea, select, switch)
- components/brand/Logo.tsx (the SVG component above)
- components/nav/BottomNav.tsx (Home/Tools/Standards/Jobs/Me — 48px hit targets)
- components/nav/ToolsSheet.tsx (fans out to the seven AI flows)
- components/layout/AppShell.tsx (wraps routes with bottom nav)

Auth: Supabase magic link only for V1. No password.
- /(auth)/sign-in posts an email, sends magic link
- /(auth)/callback exchanges code for session

PWA: manifest.json with AIDE branding, icons (192px and 512px PNG of monogram on salmon background — generate from the SVG).
Service worker via next-pwa with runtime cache for /standards/* and /manuals/* (offline-first read).

Critical rules:
- TypeScript strict, no `any` without a comment
- Server components by default; only 'use client' where actually needed
- All Supabase queries through typed clients (generate types from schema)
- Australian English in user-facing copy
- Phone-first layouts (test at 375px first)

After scaffolding, run `npm run build`. Fix any errors. Commit:
"phase 1: skeleton + auth + brand tokens"

Do NOT implement any AI flows or DB queries yet. Skeleton only.
```

### Phase 2 — Database schema + standards library

```
Read AIDE-FIP-MASTER-PLAN.md section 5 (database schema).

1. Install Supabase CLI: npm i -D supabase
2. Initialise: npx supabase init (if not done)
3. Create migration: npx supabase migration new initial_schema
4. Paste the SQL from section 5 verbatim into the migration file
5. Apply: npx supabase db push (to remote project)
6. Generate types: npx supabase gen types typescript --project-id YOUR_ID > lib/supabase/types.ts

Then build the standards library:

Routes:
- /standards: search input + recent clauses list
- /standards/[id]: full clause view

Server-side:
- app/api/standards/search/route.ts: POST { query, top_k? }
  Uses Postgres FTS on standards_refs.body
  Returns ranked matches

Client-side:
- Search input with 250ms debounce
- Result list as cards (standard + edition + clause + title preview)
- Tap to open /standards/[id]
- Clause viewer: standard ref banner, full body, edition note, applicable building classes, related clauses, action buttons (add to defect, save to job, open in knowledge base — only if NEXT_PUBLIC_KB_URL is set)

Seed data: write scripts/seed-standards.ts that reads docs/standards-seed.csv and upserts into standards_refs. If CSV doesn't exist, exit 0 with a 'no seed file found' message — don't error.

Offline: cache standards search index and last 50 viewed clauses in IndexedDB via a small wrapper.

Commit: "phase 2: standards library + supabase schema"
```

### Phase 3 — Battery calc

```
Read AIDE-FIP-MASTER-PLAN.md section 7.5.

Build the battery calc feature.

Math: lib/battery/calc.ts implements the formula from section 7.5 exactly. Export as both:
- A function called from the UI form
- An Anthropic tool 'calculate_battery' for use by other AI flows

UI on /battery: two-column desktop, stacked mobile. Form left, live preview right.
Form fields: job selector (optional), system voltage (24V default, 12V option), dynamic standby/alarm load lists ({label, current_mA, quantity}), standby duration (24h default), alarm duration (30min default), derate (1.25 default with help tooltip), safety (1.10 default).

Live preview: required Ah as the hero number (huge, salmon), recommended battery, contribution breakdown bar (Recharts), every load itemised.

Bottom: 'Save calc' (writes to battery_calcs) and 'Export PDF' buttons.

PDF export (@react-pdf/renderer): match the spec in section 7.5 exactly. Header with AIDE logo, inputs table, math working with substituted values, result, footer citing AS 1670.1 cl 3.16, AS 4428, AS 2293.1, and the APFS sign-off disclaimer.

Validation (zod): per section 7.5.

Commit: "phase 3: battery calc + PDF export"
```

### Phase 4 — Chat infrastructure + Troubleshoot

```
Read AIDE-FIP-MASTER-PLAN.md sections 6 and 7.1.

This is the foundation for all AI flows. Build it carefully.

Server: app/api/chat/route.ts
- POST { sessionId, message, photoUrl?, deepMode? }
- Streams responses using Anthropic SDK (stream: true)
- Default model: claude-sonnet-4-6
- Escalation: claude-opus-4-7 when deepMode is true
- Tool definitions per section 6.2:
  - get_standard_clause
  - search_standards
  - calculate_battery
  - lookup_panel_command (stub returns { found: false } for now — populated phase 6)
  - classify_defect (stub for now — populated phase 5)
- Tool execution server-side, results inserted as 'tool' role messages
- Persists user + assistant messages to messages table

System prompt assembly (lib/ai/prompts/troubleshoot.ts): use the structure from section 6.4 with the troubleshoot flow's output_order from section 7.1.

UI on /troubleshoot:
- Empty state with three example chips per section 7.1
- Tap example to populate input

UI on /troubleshoot/[id]:
- Chat thread (user right, assistant left, tool calls as structured cards)
- Tool-result cards: ClauseCard for get_standard_clause, BatteryCard for calculate_battery, CommandCard for lookup_panel_command
- Verification steps as checkboxes the tech ticks
- Bottom: text input, voice button (Web Speech API), photo attach button (camera capture)
- Sticky 'Deep mode' toggle in header

Voice input: webkitSpeechRecognition / SpeechRecognition. Pulsing red dot when active. Live transcript in input.

Photo attach: <input type="file" accept="image/*" capture="environment">. Upload to Supabase Storage 'defect-photos' bucket. URL passed in message content.

Anti-hallucination check: if a tool returns { found: false }, the streaming assistant must produce a response that includes the phrase 'no match' or equivalent — never invent a clause/command. Add this rule explicitly to the system prompt's tool_use_rules.

Commit: "phase 4: chat infra + troubleshoot"
```

### Phase 5 — Defect log analyser

```
Read AIDE-FIP-MASTER-PLAN.md section 7.6.

Build /defects and /defects/[id].

Input modes on /defects:
- Paste raw event log (textarea, mono font)
- Upload .txt or .csv
- Panel brand selector

Parser (lib/parsers/event-log.ts):
- Per-panel regex (Pertronic, Ampac, Notifier, Simplex, Vigilant)
- Output normalised: { ts, device, type, raw }
- Unknown format → generic best-effort + warning

Analysis flow on /defects/[id]:
1. Parsed events as vertical timeline (Recharts or hand-rolled SVG)
2. Cluster: same device + 30-min window
3. Send clusters + sample raw lines to chat API with 'defects' flow
4. Claude returns: pattern, hypothesis, verification steps, defect record draft
5. 'Create defect record' button writes to defects table

Implement the classify_defect tool that was stubbed in phase 4.

System prompt for defect flow: same identity/domain/voice as troubleshoot, plus the defect-specific rules from section 7.6.

Commit: "phase 5: defect log analyser"
```

### Phase 6 — Products + Programming + Manuals

```
Read AIDE-FIP-MASTER-PLAN.md sections 7.3, 7.4, 7.7.

Three flows reusing chat infrastructure from phase 4.

/products:
- Same chat shell as troubleshoot
- Different system prompt (lib/ai/prompts/products.ts) with product selection rules from section 7.4
- NO commerce links in V1 — just product names, application rationale, applicable AS clause

/programming:
- Two-pane layout: plain English left, generated logic right
- System prompt (lib/ai/prompts/programming.ts) with C&E rules from section 7.7
- Validation badge against AS 1670.1 cl 7
- Copy syntax button

/manuals and /manuals/[id]:
- Pure data, NO AI in the index browse path
- Index: list of panels with logo + model name + manufacturer
- Detail: tabs for { Reset, Walk test, Program zone, Isolate, Battery test }
- Each tab: card with keystroke sequence in mono + caveats
- Bottom: 'Ask a question about this panel' opens chat with panel context pre-filled
- Implement lookup_panel_command tool (stubbed in phase 4) to read from panel_commands table

Manual content seeding:
- scripts/seed-panels.ts reads docs/panels-seed.json and upserts into panel_commands
- Stub the structure with 'TODO: verify against manual' on body fields if no seed data exists yet
- Casper will provide actual manual content separately

Commit: "phase 6: products + programming + manuals"
```

### Phase 7 — Jobs, settings, polish, V1 ship

```
Read AIDE-FIP-MASTER-PLAN.md sections 7.8 and 3.3.

Wire everything together.

/jobs:
- List with site name, address, AFSS due, defect count
- Sort by AFSS due ascending (most urgent first)
- 'New job' opens a sheet with form (site_name, site_address, building_class, afss_due, notes)

/jobs/[id]:
- Header: site name + address + AFSS due (badge if overdue)
- Tabs: Overview (notes), Defects (list), Calcs (battery calcs), Sessions (AI sessions)
- Each tab is a list view, tap to open
- Edit job sheet

Cross-cutting:
- Every chat session and battery calc gets a 'Link to job' control in header
- Defect creation always offers 'Save to current job' if job is active

Home dashboard:
- Recent activity (last 5 sessions across all flows)
- Jobs with AFSS due in next 30 days
- Quick actions row: Troubleshoot, Battery calc, Standards search, New defect

/settings:
- Profile: display_name, trade_role, default_panel_brand
- Theme: dark / light / system
- API: 'use Anthropic key from env' (default) OR BYOK (encrypted in profile, used for that user's calls only)
- Sign out

PWA polish:
- Custom install prompt component on first repeat visit
- iOS splash screens (multiple sizes from monogram)
- Service worker pre-caches /standards index and last 20 viewed clauses

Performance pass:
- Lighthouse audit. Target: PWA 100, Performance 90+, Accessibility 95+
- Verify code-splitting per route
- next/image for any raster
- Streaming responses verified for all AI flows

Accessibility pass:
- All interactive elements 48px minimum
- Visible focus states
- aria-labels on icon-only buttons
- Colour contrast verified for both modes

Commit: "phase 7: jobs + settings + polish — V1 complete"
```

---

## 10. Sanity checks between phases

Before committing each phase:

```bash
npm run build        # Must pass
npm run lint         # Must pass
npx tsc --noEmit     # Must pass — no type errors
```

If any fail, fix before committing. **Don't paper over with `// @ts-ignore` or `eslint-disable`.**

---

## 11. Anti-patterns — push back if Claude Code suggests these

- Adding Vercel AI SDK on top of Anthropic SDK. Direct SDK is fine.
- Adding Prisma when Supabase types are right there.
- Adding NextAuth when Supabase Auth is wired.
- Class components, useEffect-as-fetcher, custom hooks for trivial state.
- `tailwind.config.ts` when Tailwind v4 uses CSS-first.
- 'Let me also add tests' as part of phase 1. Tests come after structure stabilises.
- Bumping a package version 'to see if it helps'. Diagnose first.
- Generating placeholder clause text or panel commands instead of leaving fields empty with 'TODO: verify against source'.
- Inventing tool names not listed in section 6.2.

---

## 12. Out of scope for V1

Each is a week+ of work and none block ship:

- Photo OCR of panel displays (defer to V2)
- Voice transcription beyond Web Speech API
- Multi-tech site collaboration (single-user only V1)
- Uptick integration (export CSV in V2 instead)
- Native iOS/Android wrapper
- Offline AI inference (cloud only)
- Push notifications
- Commerce / product purchasing
- Real-time co-editing of jobs

---

## 13. Risks flagged

- **Anthropic API cost.** Sonnet 4.6 default keeps it tractable. Add per-user usage cap in settings (V1.1).
- **Replit cold starts.** Mitigate with keep-alive ping. Worst case: migrate to Vercel.
- **Standards content licensing.** AS standards are copyright Standards Australia. Seed paraphrased summaries with the clause reference, link out to official source (or knowledge-bage if Casper has licensed access). Never reproduce verbatim full clauses.
- **Panel manual licensing.** Same — paraphrased command references derived from licensed manuals only. Source notes per row in `panel_commands.source_note`.
- **PWA on iOS Safari.** Apple hobbles PWAs. Camera works, installable works, push notifications don't. Acceptable for V1.
- **Hallucinated clauses.** Mitigated by the tool-use protocol in section 6.3. Never solved 100% — caveat in PDF disclaimers.

---

## 14. Anchor — the rules that don't drift

- **Phone first.** 375px before 1280px. 48px hit targets.
- **Dark mode default.** Salmon is the only accent.
- **Standard citations from tools only.** No inventing clause numbers.
- **Panel commands from tools only.** No inventing keystrokes.
- **Battery math from tools only.** Claude does not compute.
- **Australian English.** No clichés from the ban list (leverage, robust, comprehensive, crucial, navigate metaphorical, unlock metaphorical, seamless, showcase).
- **No closing 'let me know if you need anything else'.**
- **Read before writing. Diagnose before patching. Verify before declaring done.**
- **APFS sign-off required on anything that becomes part of an AFSS submission.** AIDE assists; it does not endorse.
