/**
 * Which content source the build uses. Read from the environment at BUILD time:
 *
 *   SANITY_PROJECT_ID   set  -> content comes from Sanity (published documents only, no token)
 *                       unset -> local placeholder fixtures (the prototype works without Sanity)
 *   SANITY_DATASET      dataset name, default "production" (must be a PUBLIC dataset)
 *   CONTENT_SOURCE      "fixtures" forces the fixtures even when SANITY_PROJECT_ID is set (local dev)
 *
 * None of these are secrets: the project id is public, and the site never uses a token.
 */
const read = (name: string): string | undefined => {
  // Astro exposes .env values on import.meta.env; CI and shells put them on process.env.
  const fromVite = (import.meta.env as Record<string, string | undefined>)[name];
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  return (fromVite || fromProcess || '').trim() || undefined;
};

const projectId = read('SANITY_PROJECT_ID');

export const contentSource: 'sanity' | 'fixtures' = projectId && read('CONTENT_SOURCE') !== 'fixtures' ? 'sanity' : 'fixtures';

export const sanityConfig = {
  projectId: projectId ?? '',
  dataset: read('SANITY_DATASET') ?? 'production',
  /**
   * TEST HOOK only: point the API client at another host (a local mock) to exercise the whole
   * pipeline without a real project. Never set in CI or production.
   */
  apiHost: read('SANITY_API_HOST'),
};

if (contentSource === 'sanity' && !/^[a-z0-9]{8,}$/.test(sanityConfig.projectId)) {
  throw new Error(`SANITY_PROJECT_ID="${sanityConfig.projectId}" does not look like a Sanity project id (8+ lowercase letters/digits).`);
}
