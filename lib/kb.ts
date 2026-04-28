// Single source of truth for outbound knowledge base URLs. Keep the slug
// patterns in sync with the contract in BUILD.md so that knowledge-bage
// can refactor its content tree without breaking deep links from here.

const DEFAULT_KB = 'https://keletonik.github.io/knowledge-bage';

function base() {
  return (process.env.NEXT_PUBLIC_KB_URL || DEFAULT_KB).replace(/\/$/, '');
}

export const kb = {
  home:        () => base(),
  standard:    (id: string, clause?: string) =>
    clause ? `${base()}/standards/${id}/clause-${clause}` : `${base()}/standards/${id}`,
  panel:       (slug: string) => `${base()}/panels/${slug}`,
  symptom:     (slug: string) => `${base()}/troubleshooting/${slug}`,
};
