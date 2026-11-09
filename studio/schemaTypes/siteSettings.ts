import { defineField, defineType } from 'sanity';

/** Site-wide settings. There is exactly one of these (see structure.ts). */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Instellingen',
  type: 'document',
  fields: [
    defineField({
      name: 'homeStatement',
      title: 'Tekst op de homepage',
      description: 'De korte tekst die bovenaan de homepage staat.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'email',
      title: 'E-mailadres',
      description: 'Hier kunnen bezoekers je mailen. Het staat onderaan elke pagina en bij "Contact".',
      type: 'string',
      validation: (rule) =>
        rule
          .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: 'e-mail', invert: false })
          .error('Dit lijkt geen e-mailadres. Een e-mailadres bevat een @ en een punt, bijvoorbeeld naam@example.com'),
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram-gebruikersnaam',
      description: 'Alleen je gebruikersnaam, zonder @ en zonder link: het laatste stukje van de link naar je Instagram-profiel.',
      type: 'string',
      validation: (rule) =>
        rule
          .regex(/^[A-Za-z0-9_.]+$/, { name: 'gebruikersnaam' })
          .error('Alleen letters, cijfers, punten en underscores. Geen @ en geen link.'),
    }),
    defineField({
      name: 'statusLine',
      title: 'Statusregel (optioneel)',
      description: 'Een korte regel bovenaan de homepage, bijvoorbeeld wat je nu doet. Laat leeg om hem te verbergen.',
      type: 'string',
    }),
    defineField({
      name: 'colophon',
      title: 'Colofon (optioneel)',
      description: 'Een korte tekst onderaan de homepage.',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: { prepare: () => ({ title: 'Instellingen' }) },
});
