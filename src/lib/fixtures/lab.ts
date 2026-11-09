import type { LabEntry, LabEntryType } from '../types';
import { placeholderAudio, placeholderImage } from './images';

/** PLACEHOLDER lab entries: one per type, newest first order is applied by the content layer. */
function entry(
  n: number,
  type: LabEntryType,
  date: string,
  extra: Partial<LabEntry> = {},
  withNote = true,
): LabEntry {
  const nn = String(n).padStart(2, '0');
  return {
    id: `placeholder-lab-${nn}`,
    isPlaceholder: true,
    type,
    date,
    title: `placeholder ${type.replace('-', ' ')} ${nn}`,
    ...(withNote
      ? { note: 'Placeholder note. It is revealed when the entry is opened, and only exists to test the layout.' }
      : {}),
    images: [],
    ...extra,
  };
}

export const labFixture: LabEntry[] = [
  entry(1, 'failed-structure', '2026-02-14', { images: [placeholderImage('landscape16x9')] }),
  entry(2, 'sound-sketch', '2026-01-29', { audio: placeholderAudio }),
  entry(3, 'fragment', '2026-01-11', { images: [placeholderImage('square'), placeholderImage('portrait3x4')] }),
  entry(4, 'test', '2025-12-03'),
  entry(5, 'note', '2025-11-20', {}, false), // an entry without a note must still render
  entry(6, 'fragment', '2025-10-08'),
];
