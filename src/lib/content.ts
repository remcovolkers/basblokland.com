/**
 * Content layer. Pages import from here only, never from fixtures or Sanity directly.
 * Today it returns typed local fixtures; the Sanity (GROQ) swap happens in a later
 * step without touching pages.
 */
import { siteSettingsFixture } from './fixtures/site-settings';
import type { SiteSettings } from './types';

export function getSiteSettings(): SiteSettings {
  return siteSettingsFixture;
}
