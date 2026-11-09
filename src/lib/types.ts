/**
 * Content types. They mirror the Sanity schema (studio step), so swapping fixtures for GROQ
 * queries changes where data comes from, not what pages receive.
 */

/** Items flagged true are stand-ins. They are shown only on the prototype, never in production. */
export interface Placeholderable {
  isPlaceholder?: boolean;
}

/** One format of a responsive image: a MIME type and its srcset. */
export interface ImageSourceSet {
  /** e.g. "image/webp" */
  type: string;
  srcset: string;
}

export interface ImageRef {
  /** Default image URL (also the fallback for browsers that ignore `sources`). */
  src: string;
  /** Natural size AFTER the editor's crop. Used for width/height so the layout never shifts. */
  width: number;
  height: number;
  /** Required. Describes what is visible, for people who cannot see the image. */
  alt: string;
  caption?: string;
  /** Tiny blurred preview (data URI), from Sanity's image metadata. */
  lqip?: string;
  /** srcset of the fallback format (JPEG). Absent for local placeholder images. */
  srcset?: string;
  /** Modern formats, best first (WebP; Sanity's CDN has no AVIF). Absent for placeholders. */
  sources?: ImageSourceSet[];
  /** The editor's focal point (0..1), used for object-position when an image is cropped by CSS. */
  focal?: { x: number; y: number };
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
