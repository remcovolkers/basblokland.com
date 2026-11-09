import { defineCliConfig } from 'sanity/cli';

// Values come from studio/.env (never committed). See docs/studio.md.
export default defineCliConfig({
  api: {
    projectId: process.env['SANITY_STUDIO_PROJECT_ID'],
    dataset: process.env['SANITY_STUDIO_DATASET'] ?? 'production',
  },
  // The hosted Studio will live at https://<studioHost>.sanity.studio
  ...(process.env['SANITY_STUDIO_HOST'] ? { studioHost: process.env['SANITY_STUDIO_HOST'] } : {}),
});
