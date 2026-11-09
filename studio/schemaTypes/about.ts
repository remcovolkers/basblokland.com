import { defineArrayMember, defineField, defineType } from 'sanity';

/** The "Over" page: biography, portrait and CV groups. There is exactly one of these. */
export const about = defineType({
  name: 'about',
  title: 'Over',
  type: 'document',
  fields: [
    defineField({
      name: 'bio',
      title: 'Biografie',
      description: 'Schrijf zoals je wilt. Laat een lege regel tussen twee alinea’s, dan worden het aparte alinea’s op de website.',
      type: 'text',
      rows: 12,
    }),
    defineField({
      name: 'portrait',
      title: 'Portret',
      type: 'photo',
    }),
    defineField({
      name: 'cvGroups',
      title: 'Cv',
      description: 'Maak groepen, bijvoorbeeld "Tentoonstellingen", "Residenties" of "Publicaties". Je bepaalt zelf de namen.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'cvGroup',
          title: 'Groep',
          fields: [
            defineField({
              name: 'title',
              title: 'Naam van de groep',
              type: 'string',
              validation: (rule) => rule.required().error('Geef de groep een naam.'),
            }),
            defineField({
              name: 'items',
              title: 'Regels',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'cvItem',
                  title: 'Regel',
                  fields: [
                    defineField({ name: 'year', title: 'Jaar (optioneel)', type: 'string' }),
                    defineField({
                      name: 'title',
                      title: 'Titel',
                      type: 'string',
                      validation: (rule) => rule.required().error('Vul een titel in.'),
                    }),
                    defineField({
                      name: 'detail',
                      title: 'Plaats of toelichting (optioneel)',
                      type: 'string',
                    }),
                  ],
                  preview: {
                    select: { year: 'year', title: 'title', detail: 'detail' },
                    prepare: ({ year, title, detail }) => ({
                      title: [year, title].filter(Boolean).join('  '),
                      subtitle: detail,
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: { select: { title: 'title', items: 'items' }, prepare: ({ title, items }) => ({ title, subtitle: `${items?.length ?? 0} regels` }) },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Over' }) },
});
