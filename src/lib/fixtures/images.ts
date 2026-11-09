import ph16x9 from '../../assets/placeholders/ph-16x9.svg';
import ph1x1 from '../../assets/placeholders/ph-1x1.svg';
import ph3x4 from '../../assets/placeholders/ph-3x4.svg';
import ph4x5 from '../../assets/placeholders/ph-4x5.svg';
import ph5x4 from '../../assets/placeholders/ph-5x4.svg';
import silence from '../../assets/placeholders/silence.wav';
import type { AudioRef, ImageRef } from '../types';

/**
 * PLACEHOLDER media: flat grey images with crossed lines in the ratios the designs use, plus one
 * second of silence. No real artwork lives in this repo's fixtures.
 */
const ratios = {
  portrait3x4: ph3x4,
  landscape16x9: ph16x9,
  square: ph1x1,
  portrait4x5: ph4x5,
  landscape5x4: ph5x4,
} as const;

export type PlaceholderRatio = keyof typeof ratios;

export function placeholderImage(ratio: PlaceholderRatio, caption?: string): ImageRef {
  const { src, width, height } = ratios[ratio];
  return {
    src,
    width,
    height,
    alt: `Placeholder image (${ratio.replace(/[a-z]+(\d)/, '$1').replace('x', ':')}): flat grey with crossed lines`,
    ...(caption ? { caption } : {}),
  };
}

export const placeholderAudio: AudioRef = {
  source: 'file',
  url: silence,
  title: 'Placeholder audio (one second of silence)',
};
