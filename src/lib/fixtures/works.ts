import type { JewelryStatus, Work } from '../types';
import { placeholderAudio, placeholderImage, type PlaceholderRatio } from './images';

/**
 * PLACEHOLDER works. Titles, years, materials and sizes are stand-ins that exist only to
 * exercise layouts (list / grid / gallery, status tags, natural-ratio detail images).
 * Shown on the prototype only; production hides everything with isPlaceholder.
 */
const text = 'Placeholder text. This entry only exists to test the layout. Replace it in the Studio.';

function art(n: number, year: number, cover: PlaceholderRatio, gallery: PlaceholderRatio[], extra: Partial<Work> = {}): Work {
  const nn = String(n).padStart(2, '0');
  return {
    id: `placeholder-art-${nn}`,
    isPlaceholder: true,
    section: 'art',
    title: `placeholder work ${nn}`,
    slug: `placeholder-art-${nn}`,
    year,
    medium: 'placeholder medium',
    dimensions: '00 × 00 × 00 cm',
    cover: placeholderImage(cover),
    gallery: gallery.map((ratio, i) => placeholderImage(ratio, i === 0 ? 'Placeholder caption.' : undefined)),
    shortText: text,
    details: [],
    ...extra,
  };
}

function jewel(n: number, year: number, status: JewelryStatus, gallery: PlaceholderRatio[], extra: Partial<Work> = {}): Work {
  const nn = String(n).padStart(2, '0');
  return {
    id: `placeholder-jewelry-${nn}`,
    isPlaceholder: true,
    section: 'jewelry',
    title: `placeholder piece ${nn}`,
    slug: `placeholder-jewelry-${nn}`,
    year,
    medium: 'placeholder material',
    dimensions: 'size 00',
    cover: placeholderImage('portrait4x5'),
    gallery: gallery.map((ratio) => placeholderImage(ratio)),
    shortText: text,
    details: [],
    status,
    ...extra,
  };
}

export const worksFixture: Work[] = [
  // The first work has every optional field, to test the full detail page.
  art(1, 2026, 'landscape5x4', ['portrait3x4', 'landscape16x9', 'square'], {
    details: [
      { label: 'edition', value: 'placeholder' },
      { label: 'location', value: 'placeholder' },
    ],
    audio: placeholderAudio,
  }),
  art(2, 2025, 'portrait3x4', ['square']),
  art(3, 2025, 'square', []), // no gallery: detail page must cope
  art(4, 2024, 'landscape16x9', ['landscape16x9', 'portrait4x5']),
  art(5, 2024, 'portrait4x5', ['portrait3x4']),
  art(6, 2023, 'landscape5x4', ['landscape5x4']),
  art(7, 2023, 'square', ['square', 'portrait3x4']),

  jewel(1, 2026, 'available', ['portrait4x5', 'square'], { details: [{ label: 'size', value: 'placeholder' }] }),
  jewel(2, 2025, 'made-to-order', ['square']),
  jewel(3, 2025, 'sold', []),
  jewel(4, 2024, 'archive', ['portrait4x5']),
  jewel(5, 2024, 'available', ['landscape5x4']),
];
