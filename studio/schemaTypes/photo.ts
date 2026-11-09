import { defineField, defineType } from 'sanity';

/**
 * A photo with the alt text the website requires. Used for every image in the Studio, so the alt
 * text is never forgotten: the field is mandatory as soon as a photo is added.
 */
export const photo = defineType({
  name: 'photo',
  title: 'Foto',
  type: 'image',
  options: { hotspot: true }, // lets Bas choose the important part for cropped thumbnails
  fields: [
    defineField({
      name: 'alt',
      title: 'Beschrijving van de foto',
      description: 'Beschrijf kort wat je ziet, voor mensen die de foto niet kunnen zien. Bijvoorbeeld: "Zwart metalen beeld op een betonnen sokkel".',
      type: 'string',
      validation: (rule) => rule.required().min(5).error('Vul een korte beschrijving van de foto in (minstens 5 tekens).'),
    }),
    defineField({
      name: 'caption',
      title: 'Bijschrift (optioneel)',
      description: 'Een korte regel onder de foto.',
      type: 'string',
    }),
  ],
});
