/**
 * Maps raw GROQ results (see load.ts) to the site's content types (src/lib/types.ts). Pure functions:
 * no network, no environment, so they are unit-tested in scripts/test-sanity.ts.
 *
 * Content errors (a work without a cover, a jewelry piece without a status, an image without alt
 * text) throw with the document id, so they fail the build loudly instead of publishing a broken page.
 */
import type { AboutPage, AudioRef, CvGroup, DetailRow, ImageRef, JewelryStatus, LabEntry, LabEntryType, Section, SiteSettings, Work } from '../types.ts';
import { mapImage, type RawImage, type UrlBuilder } from './images.ts';

type Maybe<T> = T | null | undefined;

export interface RawAudio {
  source?: Maybe<string>;
  title?: Maybe<string>;
  embedUrl?: Maybe<string>;
  /** `file.asset->url`, resolved by the query. */
  fileUrl?: Maybe<string>;
}

export interface RawWork {
  _id: string;
  section?: Maybe<string>;
  title?: Maybe<string>;
  slug?: Maybe<string>;
  year?: Maybe<number>;
  medium?: Maybe<string>;
  dimensions?: Maybe<string>;
  shortText?: Maybe<string>;
  status?: Maybe<string>;
  details?: Maybe<Array<{ label?: Maybe<string>; value?: Maybe<string> }>>;
  cover?: Maybe<RawImage>;
  gallery?: Maybe<Array<Maybe<RawImage>>>;
  audio?: Maybe<RawAudio>;
}

export interface RawLabEntry {
  _id: string;
  type?: Maybe<string>;
  date?: Maybe<string>;
  title?: Maybe<string>;
  note?: Maybe<string>;
  images?: Maybe<Array<Maybe<RawImage>>>;
  audio?: Maybe<RawAudio>;
}

export interface RawCvItem {
  year?: Maybe<string>;
  title?: Maybe<string>;
  detail?: Maybe<string>;
}

/** The Studio has three fixed CV lists (Tentoonstellingen, Residenties, Publicaties). */
export interface RawAbout {
  bio?: Maybe<string>;
  portrait?: Maybe<RawImage>;
  exhibitions?: Maybe<RawCvItem[]>;
  residencies?: Maybe<RawCvItem[]>;
  publications?: Maybe<RawCvItem[]>;
}

export interface RawSiteSettings {
  homeStatement?: Maybe<string>;
  email?: Maybe<string>;
  instagram?: Maybe<string>;
  statusLine?: Maybe<string>;
  colophon?: Maybe<string>;
}

const SECTIONS: readonly string[] = ['art', 'jewelry'];
const STATUSES: readonly string[] = ['available', 'made-to-order', 'sold', 'archive'];
const LAB_TYPES: readonly string[] = ['test', 'fragment', 'note', 'sound-sketch', 'failed-structure'];

/** Trimmed string, or undefined for null/empty. */
const text = (value: Maybe<string>): string | undefined => value?.trim() || undefined;
/** `{ key: value }` when value is present, else `{}`: keeps exactOptionalPropertyTypes happy. */
const opt = <K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } =>
  (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
const need = (value: Maybe<string>, what: string, where: string): string => {
  const v = text(value);
  if (!v) throw new Error(`${where}: ${what} is required but empty.`);
  return v;
};

function mapAudio(raw: Maybe<RawAudio>, where: string): AudioRef | undefined {
  if (!raw?.source) return undefined;
  const title = text(raw.title);
  if (raw.source === 'file') {
    const url = text(raw.fileUrl);
    // An editor may have picked "file" without uploading one yet: just show no audio.
    return url ? { source: 'file', url, ...opt('title', title) } : undefined;
  }
  if (raw.source === 'embed') {
    const url = need(raw.embedUrl, 'the Bandcamp/SoundCloud link', `${where} audio`);
    return { source: 'embed', url, ...opt('title', title) };
  }
  throw new Error(`${where}: unknown audio source "${raw.source}".`);
}

function mapImages(list: Maybe<Array<Maybe<RawImage>>>, where: string, builder: UrlBuilder): ImageRef[] {
  return (list ?? []).flatMap((raw, i) => mapImage(raw, `${where} image ${i + 1}`, builder) ?? []);
}

export function mapWork(raw: RawWork, builder: UrlBuilder): Work {
  const where = `work ${raw._id}`;
  const section = need(raw.section, 'Soort werk', where);
  if (!SECTIONS.includes(section)) throw new Error(`${where}: unknown section "${section}".`);
  const title = need(raw.title, 'Titel', where);
  const cover = mapImage(raw.cover, `${where} cover`, builder);
  if (!cover) throw new Error(`${where} ("${title}"): a cover photo (Omslagfoto) is required.`);

  const status = text(raw.status);
  if (section === 'jewelry' && !status) throw new Error(`${where} ("${title}"): jewelry needs a Beschikbaarheid.`);
  if (status && !STATUSES.includes(status)) throw new Error(`${where}: unknown status "${status}".`);

  const details: DetailRow[] = (raw.details ?? []).flatMap((d) => {
    const label = text(d.label);
    const value = text(d.value);
    return label && value ? [{ label, value }] : [];
  });
  const audio = mapAudio(raw.audio, where);

  return {
    id: raw._id,
    section: section as Section,
    title,
    slug: need(raw.slug, 'Webadres', where),
    ...(raw.year != null ? { year: raw.year } : {}),
    ...opt('medium', text(raw.medium)),
    ...opt('dimensions', text(raw.dimensions)),
    cover,
    gallery: mapImages(raw.gallery, `${where} gallery`, builder),
    ...opt('shortText', text(raw.shortText)),
    details,
    // Art has no availability: ignore a stale value left over from when it was jewelry.
    ...(section === 'jewelry' && status ? { status: status as JewelryStatus } : {}),
    ...(audio ? { audio } : {}),
  };
}

export function mapLabEntry(raw: RawLabEntry, builder: UrlBuilder): LabEntry {
  const where = `lab entry ${raw._id}`;
  const type = need(raw.type, 'Soort', where);
  if (!LAB_TYPES.includes(type)) throw new Error(`${where}: unknown type "${type}".`);
  const audio = mapAudio(raw.audio, where);
  return {
    id: raw._id,
    type: type as LabEntryType,
    date: need(raw.date, 'Datum', where),
    title: need(raw.title, 'Titel', where),
    ...opt('note', text(raw.note)),
    images: mapImages(raw.images, where, builder),
    ...(audio ? { audio } : {}),
  };
}

export function mapAbout(raw: Maybe<RawAbout>, builder: UrlBuilder): AboutPage | undefined {
  if (!raw) return undefined;
  // One multi-line text field: a blank line separates paragraphs.
  const bio = (raw.bio ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
  const portrait = mapImage(raw.portrait, 'about portrait', builder);
  // Site copy is English: the groups are shown as "exhibitions", "residencies", "publications".
  // A list with no usable lines is left out entirely.
  const lists = [
    ['exhibitions', raw.exhibitions],
    ['residencies', raw.residencies],
    ['publications', raw.publications],
  ] as const;
  const cvGroups: CvGroup[] = lists.flatMap(([title, rawItems]) => {
    const items = (rawItems ?? []).flatMap((item) => {
      const itemTitle = text(item.title);
      return itemTitle ? [{ ...opt('year', text(item.year)), title: itemTitle, ...opt('detail', text(item.detail)) }] : [];
    });
    return items.length > 0 ? [{ title, items }] : [];
  });
  return { bio, ...(portrait ? { portrait } : {}), cvGroups };
}

export function mapSiteSettings(raw: Maybe<RawSiteSettings>): SiteSettings {
  if (!raw) return {};
  // Be forgiving: "@name" and a pasted profile link both become the plain handle.
  const handle = text(raw.instagram)
    ?.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
  return {
    ...opt('homeStatement', text(raw.homeStatement)),
    ...opt('email', text(raw.email)),
    ...opt('instagram', handle || undefined),
    ...opt('statusLine', text(raw.statusLine)),
    ...opt('colophon', text(raw.colophon)),
  };
}
