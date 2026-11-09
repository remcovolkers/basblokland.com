import { defineField, defineType } from 'sanity';

const EMBED_HOSTS = ['bandcamp.com', 'soundcloud.com'];

/** Either an uploaded sound file, or a link to a Bandcamp / SoundCloud player. */
export const audio = defineType({
  name: 'audio',
  title: 'Geluid',
  type: 'object',
  fields: [
    defineField({
      name: 'source',
      title: 'Waar staat het geluid?',
      type: 'string',
      options: {
        list: [
          { title: 'Ik upload een bestand', value: 'file' },
          { title: 'Link naar Bandcamp of SoundCloud', value: 'embed' },
        ],
        layout: 'radio',
      },
      // No initialValue and not required: sound is optional. A preset choice would create the sound
      // block on every new work and then demand a file. The site shows no audio while `source` is empty.
    }),
    defineField({
      name: 'file',
      title: 'Geluidsbestand',
      description: 'Een mp3- of wav-bestand. Grote bestanden laden traag: kies dan liever een link naar Bandcamp of SoundCloud.',
      type: 'file',
      options: { accept: 'audio/*' },
      hidden: ({ parent }) => parent?.source !== 'file',
      // A warning, not an error: an empty file never blocks publishing (the site simply shows no audio).
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { source?: string } | undefined;
          return parent?.source === 'file' && !value ? 'Er is nog geen bestand geüpload. Zonder bestand komt er geen geluid op de website.' : true;
        }).warning(),
    }),
    defineField({
      name: 'embedUrl',
      title: 'Link',
      description: 'De link naar het nummer op Bandcamp of SoundCloud. De bezoeker ziet de speler pas als die erom vraagt.',
      type: 'url',
      hidden: ({ parent }) => parent?.source !== 'embed',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { source?: string } | undefined;
          if (parent?.source !== 'embed') return true;
          if (!value) return 'Vul de link in.';
          try {
            const url = new URL(value);
            const ok = url.protocol === 'https:' && EMBED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
            return ok ? true : 'Alleen links van Bandcamp of SoundCloud (beginnend met https://) kunnen worden gebruikt.';
          } catch {
            return 'Dit is geen geldige link.';
          }
        }),
    }),
    defineField({
      name: 'title',
      title: 'Naam van het geluid (optioneel)',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'title', source: 'source' },
    prepare: ({ title, source }) => ({
      title: title || 'Geluid',
      subtitle: source === 'embed' ? 'Link naar Bandcamp of SoundCloud' : 'Geüpload bestand',
    }),
  },
});
