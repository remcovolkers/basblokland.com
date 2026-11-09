/**
 * Sanity image pipeline: turns an image from a GROQ result into an ImageRef with a responsive
 * srcset (WebP + JPEG fallback), the real post-crop size, an lqip placeholder and the focal point.
 *
 * Imports are explicit ".ts" so the unit test (scripts/test-sanity.ts) can run this under plain
 * Node; the builder is passed in, so nothing here touches the network or the environment.
 *
 * AVIF: Sanity's image CDN does not serve it (fm=avif answers HTTP 400, checked against the live
 * CDN), so the best available pair is WebP + JPEG.
 */
import type { createImageUrlBuilder } from '@sanity/image-url';
import type { ImageRef } from '../types.ts';

export type UrlBuilder = ReturnType<typeof createImageUrlBuilder>;

/** The image shape our GROQ queries return (see load.ts). GROQ gives `null` for missing fields. */
export interface RawImage {
  alt?: string | null;
  caption?: string | null;
  hotspot?: { x: number; y: number; width?: number; height?: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  asset?: {
    _id: string;
    metadata?: {
      lqip?: string | null;
      dimensions?: { width: number; height: number } | null;
    } | null;
  } | null;
}

/** Candidate widths. Only widths below the image's own width are offered (never upscale). */
export const WIDTHS = [320, 480, 640, 800, 1024, 1280, 1600, 2000] as const;
/** Default `src` width: sharp on most screens without being heavy. */
const DEFAULT_WIDTH = 1280;
const QUALITY = 80;

/**
 * Map one Sanity image. Returns undefined when the field is empty (no asset). Throws when an image
 * is present but has no alt text, so a missing description fails the build instead of shipping.
 */
export function mapImage(raw: RawImage | null | undefined, where: string, builder: UrlBuilder): ImageRef | undefined {
  const asset = raw?.asset;
  if (!raw || !asset) return undefined;

  const alt = raw.alt?.trim();
  if (!alt) throw new Error(`${where}: image has no alt text (Beschrijving van de foto). Add it in the Studio.`);

  const full = asset.metadata?.dimensions;
  if (!full?.width || !full.height) throw new Error(`${where}: image asset ${asset._id} has no dimensions in its metadata.`);

  // The editor may have cropped the photo: width/height must describe what is actually shown.
  const crop = raw.crop ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const width = Math.max(1, Math.round(full.width * (1 - crop.left - crop.right)));
  const height = Math.max(1, Math.round(full.height * (1 - crop.top - crop.bottom)));

  const url = (w: number, format: 'jpg' | 'webp') =>
    builder.image(raw as never).width(w).fit('max').format(format).quality(QUALITY).url();
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), width])];
  const srcset = (format: 'jpg' | 'webp') => widths.map((w) => `${url(w, format)} ${w}w`).join(', ');

  return {
    src: url(Math.min(width, DEFAULT_WIDTH), 'jpg'),
    width,
    height,
    alt,
    ...(raw.caption?.trim() ? { caption: raw.caption.trim() } : {}),
    ...(asset.metadata?.lqip ? { lqip: asset.metadata.lqip } : {}),
    srcset: srcset('jpg'),
    sources: [{ type: 'image/webp', srcset: srcset('webp') }],
    ...(raw.hotspot ? { focal: { x: raw.hotspot.x, y: raw.hotspot.y } } : {}),
  };
}
