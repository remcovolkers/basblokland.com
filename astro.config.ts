import { execSync } from 'node:child_process';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

// .env files are not loaded into process.env inside the config file; merge them in.
// Real environment variables (CI) win over .env.
const env = {
  ...loadEnv(process.env['NODE_ENV'] ?? 'production', process.cwd(), ''),
  ...process.env,
};

/** owner/repo from CI (GITHUB_REPOSITORY) or, locally, from the git remote. */
function detectRepo(): { owner: string; repo: string } | null {
  const slug = env['GITHUB_REPOSITORY'];
  if (slug?.includes('/')) {
    const [owner = '', repo = ''] = slug.split('/');
    return { owner, repo };
  }
  try {
    const remote = execSync('git remote get-url origin', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    const match = /github\.com[:/]+([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(remote);
    if (match?.[1] && match[2]) return { owner: match[1], repo: match[2] };
  } catch {
    // no git / no remote: fall through to the local defaults
  }
  return null;
}

/** "/foo", "foo/", "/" -> "/foo/" ; "" -> "/" */
function normalizeBase(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

const repo = detectRepo();
const ghUserSite = repo !== null && repo.repo.toLowerCase() === `${repo.owner.toLowerCase()}.github.io`;

// GitHub Pages defaults (prototype). Production sets SITE_URL=https://basblokland.com, BASE_PATH=/.
const defaultSite = repo ? `https://${repo.owner.toLowerCase()}.github.io` : 'http://localhost:4321';
const defaultBase = repo && !ghUserSite ? `/${repo.repo}/` : '/';

const site = (env['SITE_URL'] || defaultSite).replace(/\/+$/, '');
// `||` not `??`: an unset GitHub Actions variable arrives as "", which must mean "use the default".
const rawBase = env['BASE_PATH'] || defaultBase;
// Git Bash on Windows rewrites a bare "/" in `BASE_PATH=/ cmd` into "C:/Program Files/Git/".
if (/^[A-Za-z]:|\\|\s/.test(rawBase.trim())) {
  throw new Error(
    `BASE_PATH="${rawBase}" is not a URL path. If you are in Git Bash, it converted "/" into a ` +
      'Windows path: use PowerShell, or prefix the command with MSYS_NO_PATHCONV=1.',
  );
}
if (!/^https?:\/\/[^/\s]+$/.test(site)) {
  throw new Error(`SITE_URL="${site}" must be an origin like https://basblokland.com (no path).`);
}
const base = normalizeBase(rawBase);
const isPrototype = env['PUBLIC_PROTOTYPE'] === 'true';
// Same rule as src/lib/sanity/config.ts. Exposed to the bundler as a constant so the fixture branch
// in content.ts is dead code in a Sanity-backed build and its placeholder images are not emitted.
const usesFixtures = !env['SANITY_PROJECT_ID'] || env['CONTENT_SOURCE'] === 'fixtures';

if (env['CI'] && !isPrototype && !env['SITE_URL']) {
  console.warn(
    '[config] Production build without SITE_URL: canonical and Open Graph URLs will use ' +
      `${site}. Set SITE_URL (and BASE_PATH) for the real domain.`,
  );
}
console.info(`[config] site=${site} base=${base} prototype=${isPrototype}`);

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // No sitemap on the prototype. Production gets one.
  integrations: isPrototype ? [] : [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    define: { __USE_FIXTURES__: JSON.stringify(usesFixtures) },
  },
});
