import type { AboutPage } from '../types';
import { placeholderImage } from './images';

/** PLACEHOLDER about page. No biography, exhibitions or publications are invented here. */
export const aboutFixture: AboutPage = {
  isPlaceholder: true,
  bio: [
    'Placeholder biography, first paragraph. The real text is written by Bas in the Studio.',
    'Placeholder biography, second paragraph.',
  ],
  portrait: placeholderImage('portrait4x5'),
  cvGroups: [
    {
      title: 'placeholder group one',
      items: [
        { year: '0000', title: 'placeholder entry', detail: 'placeholder detail' },
        { year: '0000', title: 'placeholder entry without detail' },
      ],
    },
    {
      title: 'placeholder group two',
      items: [{ title: 'placeholder entry without a year' }],
    },
  ],
};
