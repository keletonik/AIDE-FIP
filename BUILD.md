# AIDE-FIP documentation strategy with three repos that wouldn't load

**The three target repositories could not be retrieved.** Every URL containing `keletonik` — github.com, raw.githubusercontent.com, api.github.com, deepwiki.com, gitingest.com, uithub.com — was rejected by the fetcher's allow-list. Web search returned zero indexed results for the username `keletonik` or the three repo paths across more than a dozen targeted queries. I cannot confirm whether the repositories are private, mis-spelled, brand new with no public footprint, or simply not crawled yet.

This means **per-repo file-path-level analysis is impossible from outside.** I am not going to fabricate file paths, package versions, commit dates, or content claims. What follows is a strategy that holds up regardless of what the repos contain, plus a structured intake template you can complete in five minutes once you grant access (paste contents into a follow-up, or run the same analysis locally with `gh repo view` / `tree`). The platform comparison, integration patterns, and decision matrix at the end are fully delivered.

## What I could verify and what I couldn't

| Item | Status |
|---|---|
| Three repos exist and are public | **Unverified.** Not retrievable, not indexed in search. Confirm by sharing the deployed URLs, a `gh repo list keletonik` paste, or by re-running with the repos public AND indexed |
| Tech stacks | **Unverified.** No `package.json`, `requirements.txt`, `vercel.json`, or framework markers retrievable |
| Activity / commit recency | **Unverified.** No commit history accessible |
| Knowledge-bage URL contract | **Unverified.** Need deployed URL — likely `keletonik.github.io/knowledge-bage/` if GitHub Pages, or a Vercel/Netlify subdomain |
| Flaro commerce stack | **Unverified.** Cannot confirm Shopify Storefront / Saleor / custom |
| Techdocs framework | **Unverified.** Likely Docusaurus, Mintlify, or Next.js+MDX based on the name pattern, but not confirmed |
| Platform comparison for trades use case | **Verified** with current 2025/2026 sources |
| AS-standards context for AIDE-FIP | **Verified** — AS 1670.1, AS 1851 etc. correctly identified for NSW fire detection work |

## Per-repo intake template (paste output here once accessible)

For each of the three repos, run the following and share the output:

```bash
gh repo view keletonik/<repo> --json name,description,homepageUrl,pushedAt,updatedAt,stargazerCount,defaultBranchRef
gh api repos/keletonik/<repo>/contents | jq '.[] | {name, type, size}'
gh api repos/keletonik/<repo>/commits?per_page=15 | jq '.[] | {sha: .sha[0:7], date: .commit.author.date, msg: .commit.message}'
cat README.md package.json vercel.json next.config.js docusaurus.config.js mkdocs.yml mint.json 2>/dev/null
```

Until that output exists, the per-repo sections below are placeholders calling out **the questions that determine the strategy**, not invented answers.

### Techdocs — questions that decide the path

The repo name suggests a documentation site. Three plausible shapes, each with different consequences:

1. **Docusaurus or Mintlify boilerplate that's empty.** Kill it. You're standing up Techdocs from scratch and shouldn't reuse a half-configured shell.
2. **Working doc site with real content.** Inspect overlap with knowledge-bage. If overlap >30%, deprecate one.
3. **Stub experiment from a tutorial.** Archive. Don't link AIDE-FIP to it.

What I need to see to decide: README first paragraph, presence of `docs/` or `pages/` directory, deployed URL, last commit date. **If last commit is >9 months ago and there are <20 markdown files, archive the repo and point AIDE-FIP at knowledge-bage only.**

### Knowledge-bage — the link-out target, treat it as canonical

You've already decided this stays standalone. The question is purely whether it has a stable URL contract AIDE-FIP can deep-link into. Three things to confirm:

1. **Deployed URL.** GitHub Pages default is `https://keletonik.github.io/knowledge-bage/`. If Vercel/Netlify, custom subdomain. **Lock the canonical URL in an environment variable in AIDE-FIP** (`NEXT_PUBLIC_KB_URL`) so a future host change is one commit.
2. **URL structure.** Whatever the framework, the slug pattern needs to be predictable. For AS-standards: `/standards/as-1670-1/clause-3-2` or similar. If the current structure is auto-generated from filenames and unstable, pin it now before AIDE-FIP starts shipping links into it.
3. **JSON / search surface.** Most static-site frameworks (Docusaurus, Mintlify, MkDocs) emit a search index file at a known path — Docusaurus uses Algolia or `lunr` JSON, MkDocs emits `search/search_index.json`. AIDE-FIP can hit that directly without scraping HTML.

### Flaro — V2 deferral is correct, but capture the contract now

The repo name is generic — could be a Tailwind template fork (the public "Flaro Tailwind Template" on tailkits.com), an ecommerce experiment, or something else entirely. For V2, what matters is:

1. Is there a product data layer at all, or just marketing pages?
2. If commerce, is it Shopify Storefront API, Saleor, custom Supabase, or static JSON?
3. Are products tagged with anything mappable to fire-detection categories (smoke detector, MCP, sounder, FIP, VESDA)?

Until those answers exist, the V2 integration plan in section 3 below describes the **shape** AIDE-FIP should expect, with branching for each commerce backend.

## Knowledge-bage link-out integration spec

Regardless of which framework knowledge-bage uses, AIDE-FIP should adopt the following pattern. **Build it once, parameterise the base URL.**

### URL contract to define before AIDE-FIP V1 ships

Lock these slug patterns in knowledge-bage and never change them without a redirect:

```
{KB_URL}/standards/as-1670-1
{KB_URL}/standards/as-1670-1/clause-{number}
{KB_URL}/standards/as-1851
{KB_URL}/panels/pertronic-f100
{KB_URL}/panels/pertronic-f120
{KB_URL}/panels/ampac-firefinder-plus
{KB_URL}/panels/notifier
{KB_URL}/panels/simplex
{KB_URL}/panels/vigilant-mx1
{KB_URL}/panels/bosch-fpa-1200
{KB_URL}/panels/hochiki-firenet
{KB_URL}/panels/tyco-bc200
{KB_URL}/troubleshooting/{symptom-slug}
```

Add a `_redirects` file (Netlify) or `next.config.js` rewrites (Next.js) to handle inevitable slug renames without breaking AIDE-FIP deep links.

### AIDE-FIP code shape

```ts
// lib/kb.ts
const KB_URL = process.env.NEXT_PUBLIC_KB_URL ?? 'https://keletonik.github.io/knowledge-bage';

export const kb = {
  standard: (id: string, clause?: string) =>
    clause ? `${KB_URL}/standards/${id}/clause-${clause}` : `${KB_URL}/standards/${id}`,
  panel:    (slug: string) => `${KB_URL}/panels/${slug}`,
  symptom:  (slug: string) => `${KB_URL}/troubleshooting/${slug}`,
};

// usage in a Standards page
<a href={kb.standard('as-1670-1', '3.2')} target="_blank" rel="noopener">
  Open in knowledge base ↗
</a>
```

### Recommendation: add a `/api/standards/[id].json` endpoint to knowledge-bage

If knowledge-bage is Docusaurus or MkDocs, you already get a static JSON search index for free. Use it. If it's a Next.js+MDX site, **add a small API route that returns structured data**:

```ts
// knowledge-bage/app/api/standards/[id]/route.ts
import { getStandard } from '@/lib/standards';
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getStandard(params.id); // reads MDX frontmatter + body sections
  if (!s) return new Response('Not found', { status: 404 });
  return Response.json({
    id: s.id, title: s.title, version: s.version,
    clauses: s.clauses,           // [{ number, title, summary, url }]
    relatedStandards: s.related,  // [{ id, title }]
    updatedAt: s.updatedAt,
  }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' }});
}
```

This lets AIDE-FIP render a quick standards card inline (clause titles, last updated date) and keep the **deep "open in KB"** click as the path to long-form content. No scraping, no duplicated content store, contract is explicit.

If knowledge-bage is purely static and you don't want a server route, **emit a static `data/standards/{id}.json` file at build time** — same shape, fetched as a static asset. Either approach works; pick whichever matches the current host model.

## Flaro V2 integration plan

Three branches depending on what Flaro actually is:

### Branch A: Flaro is a Shopify-headless storefront

```ts
// aide-fip/lib/flaro.ts (V2)
const FLARO_API = 'https://flaro.myshopify.com/api/2024-10/graphql.json';
const TOKEN = process.env.NEXT_PUBLIC_FLARO_STOREFRONT_TOKEN!;

export async function searchFlaro(productCategory: string, applicationStandard: string) {
  const query = `${productCategory} ${applicationStandard}`;
  const r = await fetch(FLARO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({
      query: `query($q:String!){ products(first:5, query:$q){ edges{ node{ id title handle vendor onlineStoreUrl } } } }`,
      variables: { q: query },
    }),
  });
  const { data } = await r.json();
  return data.products.edges.map((e: any) => ({
    name: e.node.title,
    sku: e.node.handle,
    deepLink: e.node.onlineStoreUrl,
  }));
}
```

Public Storefront API tokens are safe to ship in the client.

### Branch B: Flaro is custom (Saleor, BigCommerce, or hand-rolled)

Same shape, different endpoint and auth. Define a single `FlaroProduct` type in AIDE-FIP and hide the backend behind one function:

```ts
type FlaroProduct = { name: string; sku: string; category: string; deepLink: string };
export async function flaroLookup(intent: ProductIntent): Promise<FlaroProduct[]>;
```

### Branch C: Flaro has no commerce layer (it's a marketing site or template)

Skip it. Don't pretend an integration exists. AIDE-FIP V1 stores `{productName, productCategory, applicationStandard}` against a Supabase products table you control, and V2 either populates that table from a Flaro export or kills the Flaro path.

### Category taxonomy AIDE-FIP must define regardless

To make any Flaro lookup work, AIDE-FIP needs a normalised category vocabulary that the product selector emits:

```
smoke-detector-photoelectric, smoke-detector-ionisation, smoke-detector-aspirating (VESDA),
heat-detector-fixed-temp, heat-detector-rate-of-rise, multi-criteria-detector,
manual-call-point, sounder, sounder-strobe, beacon, fire-indicator-panel,
sub-indicator-panel, mimic-panel, brigade-board, ase, dgp, isolator, loop-isolator,
duct-detector, beam-detector, flame-detector, addressable-module-input,
addressable-module-output, programmable-relay, agent-release, sprinkler-flow-switch
```

Map Flaro's tags to this vocabulary in a single conversion table. If Flaro doesn't tag products at this granularity, that's V2 work — push it to whoever owns Flaro before AIDE-FIP V2 starts.

## Documentation platforms compared for the riser-cupboard use case

The reading environment matters here: a tech standing in front of an FIP in a cold riser cupboard with one bar of 4G, gloves on, screen brightness maxed, looking up a clause in AS 1670.1 or a Pertronic command sequence. Speed-to-answer and offline tolerance dominate every other criterion.

| Platform | Search | Mobile UX | Offline | Deep-link ergonomics | Contributor onboarding | SEO | Cost (small team) |
|---|---|---|---|---|---|---|---|
| **Docusaurus** | Algolia DocSearch (excellent) or local Lunr (ok) | Strong default theme, dense info | **PWA plugin with Workbox precaching — best in class for offline** | Stable slugs, anchor-friendly, MDX components support deep links | Markdown + git, low for devs, medium for non-devs | Static HTML, very good | Free + ~$0–20/mo hosting |
| **Mintlify** | Built-in AI search, fast | Polished, slightly heavier | Limited — no first-class offline mode | Stable, good anchor handling | Web editor + git sync, low barrier | Good, llms.txt support | Pro $300/mo for 5 editors, scales with seats and AI usage |
| **GitBook** | AI search, decent | Good, Notion-like | None native | Stable per-page URLs | Notion-style editor, very low barrier | Good | Free tier or per-site/per-user paid |
| **Notion (public site)** | Notion's own search is mediocre | Acceptable but slow first load, branded | None | URLs are long hashes — bad for deep links | Lowest barrier of any tool | Poor without HelpKit/Super wrapper | Notion + ~$15–63/mo wrapper for usable URLs and speed |
| **Slab** | Good internal search | Good | None | Stable | Web editor, low barrier | Restricted (auth-gated by design) | Per-user, mid-range |
| **Obsidian Publish** | Local-first search, ok | Clean | Partial via vault sync, not browser PWA | Predictable | Markdown + Obsidian app, medium barrier | Limited | $10/user/mo |
| **Custom Next.js + MDX** | Whatever you build (Algolia, Pagefind, FlexSearch) | Whatever you design | **Full control via next-pwa or service worker** | Total control | Highest barrier — needs a dev | Excellent | Free + Vercel hobby/pro |
| **Hugo / Jekyll static** | Pagefind, lunr, or Algolia | Theme-dependent | Manual service worker | Stable | Markdown + git, medium for non-devs | Excellent | Free + GitHub Pages |

### Recommendation

**Knowledge-bage should be on Docusaurus with the official PWA plugin enabled**, or alternatively **Next.js + MDX with `next-pwa`**. Reasons specific to your use case:

1. **Offline precaching is non-negotiable** when a tech is in a basement plant room with no signal. Docusaurus' `@docusaurus/plugin-pwa` (Workbox-based, supports `appInstalled`, `mobile`, and `queryString` activation strategies) is the cheapest path. Mintlify and GitBook both fail this requirement.
2. **The link-out contract from AIDE-FIP needs stable, human-readable URLs.** Notion's hash URLs are disqualifying. Slab is auth-gated. Both rule themselves out.
3. **You're already comfortable with Next.js (AIDE-FIP is Next 15).** If knowledge-bage is already Next.js, keep it there and add `next-pwa` plus `next-mdx-remote` or contentlayer. If it's something else and content is small, migrating to Docusaurus is a weekend.
4. **Cost.** Mintlify Pro at $300/mo doesn't make sense for a single-author trades knowledge base. Docusaurus and a Next.js + MDX rolled solution are both effectively free.

If knowledge-bage is currently on **GitBook or Notion**, the link-out pattern works but offline access doesn't — and the deep-link ergonomics will hurt. **Plan to migrate within six months** if either is the case.

## Cross-repo redundancy and consolidation

Cannot be assessed without seeing repo contents. Apply this decision rule once you can:

- **If Techdocs and knowledge-bage have >30% overlapping content**, merge into knowledge-bage and archive Techdocs. Two trades-tech doc sites with the same author is two sites that won't both stay current.
- **If Techdocs is stale (last commit >6 months) with thin content**, archive it. Don't even merge.
- **If Techdocs is the working site and knowledge-bage is the experiment**, rename and consolidate the other way. The "knowledge-bage" name has a typo (`bage` not `base`) that you'll regret on a business card; resolve naming now.

### Content that should move into AIDE-FIP's Supabase, not stay external

Three categories absolutely must be inside AIDE-FIP regardless of where knowledge-bage lives:

1. **Panel command reference data** (Pertronic F100/F120 menu trees, Ampac FireFinder PLUS keystrokes, Notifier ID3000 codes). Techs need these offline at 2am with no signal. Seed as JSON into Supabase, ship in the PWA cache.
2. **Battery calculation lookup tables** (standby/alarm current draws per panel, derating curves). Already implied by the battery calc feature.
3. **Symptom→cause decision graphs** for troubleshooting. Needs structured data, not prose. Schema this in Supabase.

Everything else — long-form clause text from AS 1670.1, panel installation manual deep-dives, cause-and-effect programming theory — stays in knowledge-bage and AIDE-FIP links out.

## Decision matrix

| Asset | Source repo | Recommendation | Action |
|---|---|---|---|
| AS 1670.1 / 1851 / 1670.4 / 2118 / 2419.1 / 2444 / 3745 long-form content | knowledge-bage (assumed) | Stays in KB, link out from AIDE | Define stable slugs `/standards/{id}/clause-{n}`; add 301 redirects layer |
| Panel manual prose (Pertronic, Ampac, Notifier, Simplex, Vigilant, Bosch, Hochiki, Tyco, BC200) | knowledge-bage (assumed) | Stays in KB, link out | Define `/panels/{slug}` URL pattern; commit to it in writing |
| Panel command/menu reference data (structured) | TBD | **Move into AIDE Supabase** | Extract or author as JSON, seed `panel_commands` table |
| Battery current-draw tables | TBD | **Into AIDE Supabase** | Schema `panel_id, mode (standby/alarm), current_ma, source` |
| Troubleshooting decision data | TBD | **Into AIDE Supabase** | Schema `symptom, panel_filter, root_causes[], remediation[]` |
| Cause-and-effect templates | TBD | Both — templates in AIDE, theory in KB | AIDE generates C&E matrix; KB hosts explanatory pages |
| Flaro product data | flaro | **Defer to V2 as agreed** | V1 ships with `productName/category/standard` only, no link |
| Techdocs site (if redundant with KB) | Techdocs | Archive | If overlap >30% or stale >6mo, archive on GitHub |
| Techdocs site (if it's the actual KB) | Techdocs | Consolidate naming | Pick one — kill `knowledge-bage` typo or rename Techdocs |
| KB search index | knowledge-bage | Expose as JSON | Whatever framework you use, surface `search-index.json` for AIDE consumption |
| KB structured standards endpoint | knowledge-bage | **Add `/api/standards/[id]`** | Build before AIDE-FIP V1 standards page ships |

## Risk flags

- **Repo invisibility is itself a risk flag.** Three repos that don't appear in any public index, have no inbound links, and produce no search hits suggest they may be private or recently created with zero traction. Confirm public status — if they're private, the link-out story breaks immediately because techs in NSW won't be able to authenticate. **Knowledge-bage must be public (or your AIDE-FIP infra must proxy authenticated calls), full stop.**
- **The repo name `knowledge-bage` contains a typo.** This becomes a permanent URL component if you deploy it as `keletonik.github.io/knowledge-bage/`. Rename the repo to `knowledge-base` before any AIDE-FIP code references it. GitHub redirects old URLs but you don't want this on a printout in a tender response.
- **AS standards are copyrighted by Standards Australia.** Reproducing clause text from AS 1670.1 / 1851 / 2118 / 2419.1 / 2444 / 3745 verbatim in knowledge-bage is a licensing problem. Paraphrase, summarise, and link to the official SAI Global / Techstreet purchase pages. Confirm what's currently in knowledge-bage before AIDE-FIP markets a "standards lookup" feature.
- **Panel manuals are copyrighted by manufacturers.** Pertronic, Ampac (Halma), Notifier (Honeywell), Simplex (Johnson Controls), Vigilant (Tyco), Bosch, Hochiki, Tyco. Hosting full PDFs is exposure. Hosting your own normalised command reference, derived from manuals you've licensed or bought, is fine. Same audit needed.
- **Stack mismatch risk for Flaro V2.** If Flaro turns out to be a static template (the public "Flaro Tailwind Template" suggests this is plausible), there is no commerce backend to integrate with and the V2 plan needs replacing with "build a product DB in Supabase." Get this confirmed before the V2 quarter starts.
- **Activity-level unknown.** If any of the three repos hasn't been touched in 12+ months, treat it as cold and don't take a hard dependency on it from AIDE-FIP without owning the maintenance.

## What I need from you to finish this properly

Paste this output and I'll redo every section that's currently caveated, with real file paths and verified claims:

```
gh repo view keletonik/Techdocs --json name,description,homepageUrl,pushedAt,stargazerCount
gh repo view keletonik/knowledge-bage --json name,description,homepageUrl,pushedAt,stargazerCount
gh repo view keletonik/flaro --json name,description,homepageUrl,pushedAt,stargazerCount
gh api repos/keletonik/Techdocs/contents | jq '.[] | {name,type}'
gh api repos/keletonik/knowledge-bage/contents | jq '.[] | {name,type}'
gh api repos/keletonik/flaro/contents | jq '.[] | {name,type}'
# plus the README of each, and package.json if present
```

Or simply make the repos public and indexable for 24 hours and re-run.