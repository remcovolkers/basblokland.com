/** Mirrors the Sanity `siteSettings` document (added in the Sanity steps). */
export interface SiteSettings {
  /** Shown in the footer and on /contact. */
  email: string;
  /** Instagram handle without "@" or URL. Omit until Bas approves it. */
  instagram?: string;
  /** Optional one-line status, e.g. shown on the home page. */
  statusLine?: string;
  /** Longer colophon text for the footer/contact page. */
  colophon?: string;
  /** True while values are stand-ins. Placeholder data is never published to production. */
  isPlaceholder: boolean;
}
