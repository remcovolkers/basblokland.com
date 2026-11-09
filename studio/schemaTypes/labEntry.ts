import { defineArrayMember, defineField, defineType } from 'sanity';

export const LAB_TYPE_TITLES: Record<string, string> = {
  test: 'Test',
  fragment: 'Fragment',
  note: 'Notitie',
  'sound-sketch': 'Geluidsschets',
  'failed-structure': 'Mislukte structuur',
};

/** A lab entry: test, fragment, note, sound sketch or failed structure. Newest first on the site. */
export const labEntry = defineType({
  name: 'labEntry',
  title: 'Lab-notitie',
  type: 'document',
  fields: [
    defineField({
      name: 'type',
      title: 'Soort',
      type: 'string',
      options: { list: Object.entries(LAB_TYPE_TITLES).map(([value, title]) => ({ title, value })) },
      validation: (rule) => rule.required().error('Kies een soort.'),
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'date',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required().error('Vul een datum in.'),
    }),
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required().error('Een notitie heeft een titel nodig.'),
    }),
    defineField({
      name: 'note',
      title: 'Korte notitie',
      description: 'Wat zie je, wat is er gebeurd? Bezoekers lezen dit nadat ze de notitie openen. Mag leeg blijven.',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'images',
      title: "Foto's (optioneel)",
      type: 'array',
      of: [defineArrayMember({ type: 'photo' })],
    }),
    defineField({
      name: 'audio',
      title: 'Geluid (optioneel)',
      type: 'audio',
    }),
  ],
  orderings: [
    { title: 'Nieuwste eerst', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
    { title: 'Oudste eerst', name: 'dateAsc', by: [{ field: 'date', direction: 'asc' }] },
  ],
  // List preview: thumbnail of the first photo, title, and "Soort · datum".
  preview: {
    select: { title: 'title', type: 'type', date: 'date', media: 'images.0' },
    prepare: ({ title, type, date, media }) => ({
      title: title || 'Zonder titel',
      subtitle: [LAB_TYPE_TITLES[type as string] ?? 'Soort nog niet gekozen', date ? String(date).split('-').reverse().join('-') : null]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
});
