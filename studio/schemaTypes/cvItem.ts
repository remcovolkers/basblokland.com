import { defineField, defineType } from 'sanity';

/** One line of the CV: year, title and an optional place/remark. Used by the three CV lists in "Over". */
export const cvItem = defineType({
  name: 'cvItem',
  title: 'Regel',
  type: 'object',
  fields: [
    defineField({
      name: 'year',
      title: 'Jaar (optioneel)',
      type: 'string',
      placeholder: 'Bijvoorbeeld: 2025',
    }),
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      placeholder: 'Bijvoorbeeld: De naam van de tentoonstelling',
      validation: (rule) => rule.required().error('Vul een titel in.'),
    }),
    defineField({
      name: 'detail',
      title: 'Plaats of toelichting (optioneel)',
      type: 'string',
      placeholder: 'Bijvoorbeeld: Galerie X, Rotterdam',
    }),
  ],
  options: { columns: 1 },
  preview: {
    select: { year: 'year', title: 'title', detail: 'detail' },
    prepare: ({ year, title, detail }) => ({
      title: [year, title].filter(Boolean).join('  '),
      subtitle: detail,
    }),
  },
});
