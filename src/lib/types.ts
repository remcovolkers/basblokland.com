/**
 * Content types. They mirror the Sanity schema (studio step), so swapping fixtures for GROQ
 * queries changes where data comes from, not what pages receive.
 */

/** Items flagged true are stand-ins. They are shown only on the prototype, never in production. */
export interface Placeholderable {
  isPlaceholder?: boolean;
}

export interface ImageRef {
  src: string;
  width: number;
  height: number;
  /** Required. Describes what is visible, for people who cannot see the image. */
  alt: string;
  caption?: string;
  /** Tiny blurred preview (data URI), filled by the Sanity image pipeline. */
  lqip?: string;
}

/** Uploaded file, or an embed URL (Bandcamp / SoundCloud only). */
export type AudioRef =
  | { source: 'file'; url: string; title?: string }
  | { source: 'embed'; url: string; title?: string };

export interface DetailRow {
  label: string;
  value: string;
}

export type Section = 'art' | 'jewelry';
export type JewelryStatus = 'available' | 'made-to-order' | 'sold' | 'archive';

export interface Work extends Placeholderable {
  id: string;
  section: Section;
  title: string;
  slug: string;
  year?: number;
  medium?: string;
  dimensions?: string;
  cover: ImageRef;
  /** Further images, shown uncropped on the detail page. */
  gallery: ImageRef[];
  shortText?: string;
  /** Optional label/value pairs. Replaces the invented "specimen register" of the Stitch design. */
  details: DetailRow[];
  /** Jewelry only. */
  status?: JewelryStatus;
  audio?: AudioRef;
}

export type LabEntryType = 'test' | 'fragment' | 'note' | 'sound-sketch' | 'failed-structure';

export interface LabEntry extends Placeholderable {
  id: string;
  type: LabEntryType;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  title: string;
  note?: string;
  images: ImageRef[];
  audio?: AudioRef;
}

export interface CvItem {
  year?: string;
  title: string;
  detail?: string;
}

export interface CvGroup {
  /** Free text, e.g. "exhibitions", "residencies", "publications". */
  title: string;
  items: CvItem[];
}

export interface AboutPage extends Placeholderable {
  /** Paragraphs of plain text. */
  bio: string[];
  portrait?: ImageRef;
  cvGroups: CvGroup[];
}

export interface SiteSettings extends Placeholderable {
  /** Statement on the home page. */
  homeStatement?: string;
  /** Shown in the footer and on /contact. Absent until Bas approves an address. */
  email?: string;
  /** Instagram handle without "@" or URL. */
  instagram?: string;
  /** Optional one-line status, e.g. "open for commissions". */
  statusLine?: string;
  /** Longer colophon text. */
  colophon?: string;
}
