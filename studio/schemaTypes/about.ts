import { defineArrayMember, defineField, defineType } from 'sanity';

/** A CV list: lines of year / title / place, edited in a small panel (one level, no window on a window). */
const cvList = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    group: 'cv',
    of: [defineArrayMember({ type: 'cvItem' })],
    options: { modal: { type: 'popover' } },
  });

/**
 * The "Over" page: biography, portrait and a CV. There is exactly one of these.
 * Two tabs: Tekst en portret · Cv. The CV is three fixed lists instead of free-named groups inside
 * groups: that avoided a dialog on top of a dialog, and these are the groups a CV has anyway.
 */
export const about = defineType({
  name: 'about',
  title: 'Over',
  type: 'document',
  groups: [
    { name: 'text', title: 'Tekst en portret', default: true },
    { name: 'cv', title: 'Cv' },
  ],
  fields: [
    defineField({
      name: 'bio',
      title: 'Biografie',
      description: 'Schrijf zoals je wilt. Laat een lege regel tussen twee alinea’s, dan worden het aparte alinea’s op de website.',
      type: 'text',
      group: 'text',
      rows: 12,
    }),
    defineField({
      name: 'portrait',
      title: 'Portret',
      description: 'Kies een foto en schrijf bij "Beschrijving van de foto" kort wat je ziet (verplicht).',
      type: 'photo',
      group: 'text',
    }),
    cvList('exhibitions', 'Tentoonstellingen', 'Klik op "Voeg item toe" voor elke tentoonstelling. Mag leeg blijven: een lege lijst staat niet op de website.'),
    cvList('residencies', 'Residenties', 'Klik op "Voeg item toe" voor elke residentie. Mag leeg blijven.'),
    cvList('publications', 'Publicaties', 'Klik op "Voeg item toe" voor elke publicatie. Mag leeg blijven.'),
  ],
  preview: { prepare: () => ({ title: 'Over' }) },
});
