/**
 * Content layer. Pages import from here only, never from fixtures or Sanity directly.
 *
 * Source (decided at build time, see sanity/config.ts): Sanity when SANITY_PROJECT_ID is set,
 * otherwise the typed local fixtures. Content is loaded ONCE with a top-level await, so everything
 * below stays a plain synchronous API for pages and components.
 *
 * Rules enforced here (the Studio schema enforces the same ones at edit time):
 *  - placeholder items (isPlaceholder) are visible on the prototype only, never in production
 *  - slugs are unique kebab-case per section, cover and gallery images have alt text
 *  - jewelry has a status, art does not; embed audio is Bandcamp or SoundCloud only
 */
import { isPrototype } from './site';
import { contentSource, sanityConfig } from './sanity/config';
import { loadFromSanity, type LoadedContent } from './sanity/load';
import type { AboutPage, AudioRef, LabEntry, Placeholderable, Section, SiteSettings, Work } from './types';

async function load(): Promise<LoadedContent> {
  // A configured Sanity that fails (network, bad query, bad content) must FAIL the build: silently
  // falling back to placeholders would publish the wrong site.
  if (contentSource === 'sanity') return loadFromSanity(sanityConfig);
  // Fixtures are imported only here, so a Sanity-backed build does not bundle the placeholder images.
  const [{ worksFixture }, { labFixture }, { aboutFixture }, { siteSettingsFixture }] = await Promise.all([
    import('./fixtures/works'),
    import('./fixtures/lab'),
    import('./fixtures/about'),
    import('./fixtures/site-settings'),
  ]);
  return { works: worksFixture, lab: labFixture, about: aboutFixture, settings: siteSettingsFixture };
}

const data = await load();

// ---- validation (runs once at build; a bad fixture or CMS shape fails the build) -----------------
const EMBED_HOSTS = ['bandcamp.com', 'soundcloud.com'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkAudio(where: string, audio: AudioRef | undefined): void {
  if (!audio || audio.source === 'file') return;
  const host = new URL(audio.url).hostname;
  if (!EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    throw new Error(`${where}: embed audio must be Bandcamp or SoundCloud, got ${host}`);
  }
}

function validate(works: readonly Work[], lab: readonly LabEntry[]): void {
  const seen = new Set<string>();
  for (const w of works) {
    const where = `work "${w.id}"`;
    if (!SLUG.test(w.slug)) throw new Error(`${where}: slug "${w.slug}" is not kebab-case`);
    const key = `${w.section}/${w.slug}`;
    if (seen.has(key)) throw new Error(`${where}: duplicate slug ${key}`);
    seen.add(key);
    if (!w.title.trim()) throw new Error(`${where}: empty title`);
    if (!w.cover.alt.trim()) throw new Error(`${where}: cover image has no alt text`);
    w.gallery.forEach((g, i) => {
      if (!g.alt.trim()) throw new Error(`${where}: gallery image ${i + 1} has no alt text`);
    });
    if (w.section === 'jewelry' && !w.status) throw new Error(`${where}: jewelry needs a status`);
    if (w.section === 'art' && w.status) throw new Error(`${where}: art must not have a jewelry status`);
    if (w.year !== undefined && !(Number.isInteger(w.year) && w.year >= 1900 && w.year <= new Date().getFullYear() + 1)) {
      throw new Error(`${where}: implausible year ${w.year}`);
    }
    checkAudio(where, w.audio);
  }
  for (const e of lab) {
    const where = `lab entry "${e.id}"`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || Number.isNaN(Date.parse(e.date))) {
      throw new Error(`${where}: date "${e.date}" is not YYYY-MM-DD`);
    }
    e.images.forEach((img, i) => {
      if (!img.alt.trim()) throw new Error(`${where}: image ${i + 1} has no alt text`);
    });
    checkAudio(where, e.audio);
  }
}
validate(data.works, data.lab);

// ---- visibility -----------------------------------------------------------------------------
const visible = <T extends Placeholderable>(items: readonly T[]): T[] =>
  items.filter((item) => isPrototype || !item.isPlaceholder);

// ---- public API -----------------------------------------------------------------------------
export function getSiteSettings(): SiteSettings {
  // Production never shows placeholder contact details or statements.
  return isPrototype || !data.settings.isPlaceholder ? data.settings : {};
}

/** Works of a section, in editor order (the Studio will provide drag-and-drop ordering). */
export function getWorks(section: Section): Work[] {
  return visible(data.works).filter((w) => w.section === section);
}

export function getWork(section: Section, slug: string): Work | undefined {
  return getWorks(section).find((w) => w.slug === slug);
}

export function getWorkNeighbours(work: Work): { prev?: Work; next?: Work } {
  const list = getWorks(work.section);
  const i = list.findIndex((w) => w.id === work.id);
  const prev = i > 0 ? list[i - 1] : undefined;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : undefined;
  return { ...(prev ? { prev } : {}), ...(next ? { next } : {}) };
}

/** Lab entries, newest first. */
export function getLabEntries(): LabEntry[] {
  return visible(data.lab).sort((a, b) => b.date.localeCompare(a.date));
}

export function getAbout(): AboutPage | undefined {
  return data.about ? visible([data.about])[0] : undefined;
}

/** Position of a work within its section, as shown in the designs: "01", "02", ... */
export function workIndex(work: Work): string {
  const i = getWorks(work.section).findIndex((w) => w.id === work.id);
  return String(i + 1).padStart(2, '0');
}
