import '@fontsource-variable/inter/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import { nlNLLocale } from '@sanity/locale-nl-nl';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { Logo } from './components/Logo';
import { SINGLETON_TYPES, schemaTypes } from './schemaTypes';
import { structure } from './structure';
import { theme } from './theme';

// Set in studio/.env (see studio/.env.example and docs/studio.md). Never hard-code or commit these.
const projectId = process.env['SANITY_STUDIO_PROJECT_ID'];
const dataset = process.env['SANITY_STUDIO_DATASET'] ?? 'production';
if (!projectId) {
  throw new Error('SANITY_STUDIO_PROJECT_ID ontbreekt. Kopieer studio/.env.example naar studio/.env en vul het in (zie docs/studio.md).');
}

const isSingleton = (type: string) => (SINGLETON_TYPES as readonly string[]).includes(type);

export default defineConfig({
  name: 'default',
  title: 'bas den exter blokland',
  projectId,
  dataset,

  plugins: [structureTool({ structure }), nlNLLocale()],

  schema: {
    types: schemaTypes,
    // Ready-made starting points, so "Soort werk" is already filled in for a new work.
    templates: (prev) => [
      ...prev,
      { id: 'art-work', title: 'Kunstwerk', schemaType: 'work', value: { section: 'art' } },
      { id: 'jewelry-work', title: 'Sieraad', schemaType: 'work', value: { section: 'jewelry', status: 'available' } },
    ],
  },

  document: {
    // Only one "Over" and one "Instellingen": no duplicate, no delete, no unpublish.
    actions: (prev, { schemaType }) =>
      isSingleton(schemaType) ? prev.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : prev,
    // In the global "new document" menu: offer Kunstwerk / Sieraad instead of a bare Werk, and hide the singletons.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global' ? prev.filter((option) => option.templateId !== 'work' && !isSingleton(option.templateId)) : prev,
  },

  theme,
  studio: { components: { logo: Logo } },
});
