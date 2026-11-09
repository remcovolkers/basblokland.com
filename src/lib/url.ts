/**
 * Base-path aware URL helpers. EVERY internal link, asset, favicon and OG image
 * goes through here. Never write a literal leading "/" in markup
 * (scripts/check-src.mjs enforces this).
 *
 * The site is served from "/<repo>/" on the GitHub Pages prototype and from "/"
 * in production. Astro exposes the configured base as import.meta.env.BASE_URL,
 * with or without a trailing slash depending on config, so we normalise it.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, ''); // "" or "/basblokland.com"

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * "/art" | "art" | "/art/" -> "<base>/art/"   (pages get a trailing slash)
 * "/favicon.svg"            -> "<base>/favicon.svg" (files do not)
 * Query strings and #fragments are kept. External URLs and mailto: pass through.
 */
export function url(path = '/'): string {
  if (EXTERNAL.test(path)) return path;
  const match = /^([^?#]*)(.*)$/.exec(path);
  const pathname = (match?.[1] ?? '').replace(/^\/+/, '');
  const suffix = match?.[2] ?? '';
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  const normalised = pathname === '' || isFile || pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${base}/${normalised}${suffix}`;
}

/** Absolute URL (for canonical and Open Graph). `site` is Astro.site. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  const relative = url(path);
  return site ? new URL(relative, site).href : relative;
}

/** Current pathname without the base: "/basblokland.com/art/x/" -> "/art/x/" */
export function stripBase(pathname: string): string {
  if (base !== '' && pathname.startsWith(base)) {
    const rest = pathname.slice(base.length);
    return rest === '' ? '/' : rest;
  }
  return pathname;
}
