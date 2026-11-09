import { defineField, defineType } from 'sanity';

/** Site-wide settings. There is exactly one of these (see structure.ts). Two clear blocks: Homepage, Contact. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Instellingen',
  type: 'document',
  fieldsets: [
    { name: 'home', title: 'Homepage', options: { collapsible: false } },
    { name: 'contact', title: 'Contact', options: { collapsible: false } },
  ],
  fields: [
    defineField({
      name: 'homeStatement',
      title: 'Tekst op de homepage',
      description: 'De korte tekst die bovenaan de homepage staat.',
      type: 'text',
      fieldset: 'home',
      rows: 3,
    }),
    defineField({
      name: 'statusLine',
      title: 'Statusregel (optioneel)',
      description: 'Een korte regel bovenaan de homepage, bijvoorbeeld wat je nu doet. Laat leeg om hem te verbergen.',
      type: 'string',
      fieldset: 'home',
      placeholder: 'Bijvoorbeeld: open voor opdrachten',
    }),
    defineField({
      name: 'colophon',
      title: 'Colofon (optioneel)',
      description: 'Een korte tekst onderaan de homepage.',
      type: 'text',
      fieldset: 'home',
      rows: 3,
    }),
    defineField({
      name: 'email',
      title: 'E-mailadres',
      description: 'Hier kunnen bezoekers je mailen. Het staat onderaan elke pagina en bij "Contact".',
      type: 'string',
      fieldset: 'contact',
      placeholder: 'naam@example.com',
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
      fieldset: 'contact',
      validation: (rule) =>
        rule
          .regex(/^[A-Za-z0-9_.]+$/, { name: 'gebruikersnaam' })
          .error('Alleen letters, cijfers, punten en underscores. Geen @ en geen link.'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Instellingen' }) },
});
