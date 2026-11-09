import type { SiteSettings } from '../types';

/**
 * PLACEHOLDER. The e-mail is a stand-in until Bas's real address is entered in the Sanity
 * `siteSettings` document. In production this fixture is never used (placeholders are hidden).
 * The home statement is also a stand-in: its wording has not been confirmed as Bas's own.
 */
export const siteSettingsFixture: SiteSettings = {
  isPlaceholder: true,
  homeStatement: 'physical work, small objects, sound and material.',
  email: 'remco.volkers1@gmail.com',
  statusLine: 'placeholder status line',
  colophon: 'Placeholder colophon text.',
};
