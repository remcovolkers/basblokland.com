import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { ALL_FIELDS_GROUP, defineArrayMember, defineField, defineType } from 'sanity';

export const SECTION_TITLES: Record<string, string> = { art: 'Kunst', jewelry: 'Sieraden' };

/**
 * A work of art or a piece of jewelry. `section` decides where it appears on the site.
 *
 * The form is split in four tabs so it is never one long scroll:
 *   Basis (what, when, how big) · Foto's · Tekst · Geluid
 * A tab with a mistake in it gets a marker, so a missing photo description cannot hide.
 */
export const work = defineType({
  name: 'work',
  title: 'Werk',
  type: 'document',
  orderings: [orderRankOrdering],
  groups: [
    // Sanity adds an "Alle velden" tab by itself. Hidden: Bas works through the four tabs below and the
    // document is published as a whole, whichever tab he is on.
    { ...ALL_FIELDS_GROUP, hidden: true },
    { name: 'basis', title: 'Basis', default: true },
    { name: 'photos', title: "Foto's" },
    { name: 'text', title: 'Tekst' },
    { name: 'sound', title: 'Geluid' },
  ],
  fields: [
    // Hidden helper: the order Bas sets by dragging in the list. New works go to the TOP (newest
    // first, like the design); drag to change.
    orderRankField({ type: 'work', newItemPosition: 'before', hidden: true }),

    // ---- Basis -------------------------------------------------------------------------------
    defineField({
      name: 'section',
      title: 'Soort werk',
      description: 'Waar komt dit werk op de website? Kies je hier Sieraden, dan verschijnt er een vraag over beschikbaarheid.',
      type: 'string',
      group: 'basis',
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
      group: 'basis',
      validation: (rule) => rule.required().error('Een werk heeft een titel nodig.'),
    }),
    defineField({
      name: 'slug',
      title: 'Webadres',
      description: 'Het stukje van het webadres voor dit werk. Klik op "Genereren": het wordt automatisch gemaakt van de titel.',
      type: 'slug',
      group: 'basis',
      options: { source: 'title', maxLength: 60 },
      validation: (rule) => rule.required().error('Klik op "Genereren" om het webadres te maken.'),
    }),
    defineField({
      name: 'year',
      title: 'Jaar',
      type: 'number',
      group: 'basis',
      placeholder: 'Bijvoorbeeld 2025',
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
      description: 'Waar is het van gemaakt?',
      type: 'string',
      group: 'basis',
      placeholder: 'Bijvoorbeeld: gesmeed staal, zand',
    }),
    defineField({
      name: 'dimensions',
      title: 'Afmetingen of maat',
      description: 'Bij kunst de afmetingen, bij een ring de maat.',
      type: 'string',
      group: 'basis',
      placeholder: 'Bijvoorbeeld: 140 × 45 × 40 cm, of: maat 58',
    }),
    defineField({
      name: 'status',
      title: 'Beschikbaarheid',
      description: 'Alleen voor sieraden: kan iemand dit sieraad nog krijgen?',
      type: 'string',
      group: 'basis',
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

    // ---- Foto's ------------------------------------------------------------------------------
    defineField({
      name: 'cover',
      title: 'Omslagfoto',
      description:
        'De foto die in overzichten wordt getoond. Stap 1: kies of sleep een foto. Stap 2: schrijf bij "Beschrijving van de foto" kort wat je ziet. Dat is verplicht, zodat de website ook voor mensen die niet kunnen zien toegankelijk is.',
      type: 'photo',
      group: 'photos',
      validation: (rule) => rule.required().error('Voeg een omslagfoto toe.'),
    }),
    defineField({
      name: 'gallery',
      title: "Meer foto's",
      description:
        'Extra foto\'s die op de pagina van dit werk onder elkaar komen. Stap 1: klik op "Voeg item toe" en kies een foto. Stap 2: klik op de foto en schrijf de beschrijving (verplicht). Mist er nog een beschrijving, dan kun je niet publiceren en wijst Sanity de foto aan. Je kunt foto\'s slepen om de volgorde te wijzigen.',
      type: 'array',
      group: 'photos',
      of: [defineArrayMember({ type: 'photo' })],
      options: { layout: 'grid' },
    }),

    // ---- Tekst -------------------------------------------------------------------------------
    defineField({
      name: 'shortText',
      title: 'Korte tekst',
      description: 'Een paar zinnen over dit werk. Mag leeg blijven.',
      type: 'text',
      group: 'text',
      rows: 5,
      validation: (rule) => rule.max(600).warning('Houd het kort: liefst minder dan 600 tekens.'),
    }),
    defineField({
      name: 'details',
      title: 'Extra gegevens',
      description: 'Losse gegevens onder de titel, bijvoorbeeld "Oplage: uniek". Elk gegeven heeft een naam en een waarde. Mag leeg blijven.',
      type: 'array',
      group: 'text',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'detail',
          title: 'Gegeven',
          fields: [
            defineField({
              name: 'label',
              title: 'Naam',
              type: 'string',
              placeholder: 'Bijvoorbeeld: Oplage',
              validation: (rule) => rule.required().error('Vul de naam in, bijvoorbeeld "Oplage".'),
            }),
            defineField({
              name: 'value',
              title: 'Waarde',
              type: 'string',
              placeholder: 'Bijvoorbeeld: Uniek',
              validation: (rule) => rule.required().error('Vul de waarde in.'),
            }),
          ],
          options: { columns: 2 },
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
      // Two short fields do not need a big dialog: a small panel next to the row is enough.
      options: { modal: { type: 'popover' } },
    }),

    // ---- Geluid ------------------------------------------------------------------------------
    defineField({
      name: 'audio',
      title: 'Geluid (optioneel)',
      description: 'Een geluidsfragment bij dit werk. Mag leeg blijven.',
      type: 'audio',
      group: 'sound',
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
