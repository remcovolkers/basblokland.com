import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const SECTION_TITLES: Record<string, string> = { art: 'Kunst', jewelry: 'Sieraden' };

/** A work of art or a piece of jewelry. The value `section` decides where it appears on the site. */
export const work = defineType({
  name: 'work',
  title: 'Werk',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    // Hidden helper: the order Bas sets by dragging in the list.
    orderRankField({ type: 'work', hidden: true }),
    defineField({
      name: 'section',
      title: 'Soort werk',
      description: 'Waar komt dit werk op de website?',
      type: 'string',
      options: {
        list: [
          { title: 'Kunst', value: 'art' },
          { title: 'Sieraden', value: 'jewelry' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (rule) => rule.required().error('Kies of dit Kunst of Sieraden is.'),
    }),
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required().error('Een werk heeft een titel nodig.'),
    }),
    defineField({
      name: 'slug',
      title: 'Webadres',
      description: 'Het stukje van het webadres voor dit werk. Klik op "Genereren", dan maakt het zichzelf aan op basis van de titel.',
      type: 'slug',
      options: { source: 'title', maxLength: 60 },
      validation: (rule) => rule.required().error('Klik op "Genereren" om het webadres te maken.'),
    }),
    defineField({
      name: 'year',
      title: 'Jaar',
      type: 'number',
      validation: (rule) =>
        rule
          .integer()
          .min(1900)
          .max(new Date().getFullYear() + 1)
          .error('Vul een jaartal in, bijvoorbeeld 2024.'),
    }),
    defineField({
      name: 'medium',
      title: 'Materiaal en techniek',
      description: 'Bijvoorbeeld: "gesmeed staal, zand".',
      type: 'string',
    }),
    defineField({
      name: 'dimensions',
      title: 'Afmetingen of maat',
      description: 'Bijvoorbeeld "140 × 45 × 40 cm" bij kunst, of "maat 58" bij een ring.',
      type: 'string',
    }),
    defineField({
      name: 'cover',
      title: 'Omslagfoto',
      description: 'De foto die in overzichten wordt getoond.',
      type: 'photo',
      validation: (rule) => rule.required().error('Voeg een omslagfoto toe.'),
    }),
    defineField({
      name: 'gallery',
      title: "Meer foto's",
      description: "Extra foto's, in de volgorde waarin ze onder elkaar komen te staan. Je kunt ze slepen.",
      type: 'array',
      of: [defineArrayMember({ type: 'photo' })],
    }),
    defineField({
      name: 'shortText',
      title: 'Korte tekst',
      description: 'Een paar zinnen over dit werk. Mag leeg blijven.',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.max(600).warning('Houd het kort: liefst minder dan 600 tekens.'),
    }),
    defineField({
      name: 'details',
      title: 'Extra gegevens',
      description: 'Vrije gegevens die op de pagina staan, zoals "Oplage: uniek". Mag leeg blijven.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'detail',
          title: 'Gegeven',
          fields: [
            defineField({ name: 'label', title: 'Naam', type: 'string', validation: (rule) => rule.required().error('Vul de naam in, bijvoorbeeld "Oplage".') }),
            defineField({ name: 'value', title: 'Waarde', type: 'string', validation: (rule) => rule.required().error('Vul de waarde in.') }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Beschikbaarheid',
      description: 'Alleen voor sieraden.',
      type: 'string',
      options: {
        list: [
          { title: 'Beschikbaar', value: 'available' },
          { title: 'Op bestelling', value: 'made-to-order' },
          { title: 'Verkocht', value: 'sold' },
          { title: 'Archief', value: 'archive' },
        ],
        layout: 'radio',
      },
      hidden: ({ document }) => document?.section !== 'jewelry',
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.document as { section?: string } | undefined)?.section === 'jewelry' && !value
            ? 'Kies de beschikbaarheid van dit sieraad.'
            : true,
        ),
    }),
    defineField({
      name: 'audio',
      title: 'Geluid (optioneel)',
      description: 'Een geluidsfragment bij dit werk.',
      type: 'audio',
    }),
  ],
  // List preview: thumbnail, title, and "Soort · jaar".
  preview: {
    select: { title: 'title', year: 'year', section: 'section', media: 'cover' },
    prepare: ({ title, year, section, media }) => ({
      title: title || 'Zonder titel',
      subtitle: [SECTION_TITLES[section as string] ?? 'Soort nog niet gekozen', year].filter(Boolean).join(' · '),
      media,
    }),
  },
});
