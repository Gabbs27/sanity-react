/**
 * Affiliate-link allowlist.
 *
 * Each entry is a domain (or hostname suffix) we treat as an affiliate
 * partner. A click on any anchor whose hostname EITHER matches one of
 * these entries exactly OR ends with `.${entry}` is reported to GA4 as
 * an `affiliate_click` event.
 *
 * To add a new program: append the canonical hostname (no protocol,
 * no path). Subdomains (`a.b.example.com`) are matched automatically
 * via the suffix rule, so listing `example.com` is enough.
 */
export const AFFILIATE_DOMAINS: readonly string[] = [
  // Amazon Associates
  'amzn.to',
  'amzn.eu',
  'amzn.in',
  'amazon.com',
  'amazon.es',
  'amazon.com.mx',
  // Add more as you sign up: e.g. 'partner.canva.com', 'sovrn.co', etc.
] as const;

export function isAffiliate(hostname: string): boolean {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return AFFILIATE_DOMAINS.some(
    (entry) => h === entry || h.endsWith(`.${entry}`)
  );
}
