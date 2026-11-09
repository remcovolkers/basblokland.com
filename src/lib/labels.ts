import type { JewelryStatus, LabEntryType } from './types';

/** Display text. The CSS uppercases and tracks it; keep the source lowercase and plain. */
export const jewelryStatusLabel: Record<JewelryStatus, string> = {
  available: 'available',
  'made-to-order': 'made to order',
  sold: 'sold',
  archive: 'archive',
};

export const labTypeLabel: Record<LabEntryType, string> = {
  test: 'test',
  fragment: 'fragment',
  note: 'note',
  'sound-sketch': 'sound sketch',
  'failed-structure': 'failed structure',
};

/** "2026-02-14" -> "14.02.2026" (the notation used in the Stitch design). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
