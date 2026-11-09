// Build guard: run after `npm run build` with `npm run verify`.
// Pass the SAME PUBLIC_PROTOTYPE value you built with (true = prototype, otherwise production).
//
// Checks every HTML file and every CSS file in dist/:
//  - every internal URL (href, src, srcset, poster, og:image, CSS url()) starts with the base
//    path and resolves to a real file in dist/
//  - #fragment links point at an id that exists on that page
//  - no external scripts, stylesheets, fonts or images (no CDNs, no Google Fonts)
//  - no zoom lock in the viewport meta
//  - prototype mode: noindex on every page, no sitemap, "prototype" footer line
//    production mode: none of those (404.html stays noindex)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}
const prototypeExpected = process.env.PUBLIC_PROTOTYPE === 'true';

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const cssFiles = files.filter((f) => f.endsWith('.css'));
const toUrlPath = (f) => '/' + relative(dist, f).split(sep).join('/');

const errors = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);

// ---- base + origin come from the built home page itself ----------------------------------
const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
const canonical = /<link rel="canonical" href="([^"]+)"/.exec(indexHtml)?.[1];
if (!canonical) {
  console.error('index.html has no canonical link; cannot determine site/base.');
  process.exit(1);
}
const canonicalUrl = new URL(canonical);
const origin = canonicalUrl.origin;
const base = canonicalUrl.pathname; // "/" or "/basblokland.com/"
console.log(`site=${origin} base=${base} expecting ${prototypeExpected ? 'PROTOTYPE' : 'PRODUCTION'} build`);

/** Does a path (with the base already stripped, starting "/") exist in dist? */
function resolvesToFile(pathAfterBase) {
  const clean = decodeURIComponent(pathAfterBase.split(/[?#]/)[0] ?? '');
  const candidates = clean.endsWith('/')
    ? [join(dist, clean, 'index.html')]
    : [join(dist, clean), join(dist, clean, 'index.html'), join(dist, `${clean}.html`)];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

/** Validate one URL found on `page`. `kind` = "link" (<a>) or "resource" (loaded by the browser). */
function checkUrl(page, raw, kind, pageIds) {
  const value = raw.trim();
  if (value === '' || /^(mailto:|tel:)/i.test(value)) return;
  if (/^javascript:/i.test(value)) return err(page, `javascript: URL "${value}"`);
  if (value.startsWith('#')) {
    const id = decodeURIComponent(value.slice(1));
    if (id && pageIds && !pageIds.has(id)) err(page, `fragment ${value} has no matching id`);
    return;
  }
  if (value.startsWith('//')) return err(page, `protocol-relative URL "${value}"`);
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    const u = new URL(value);
    if (u.origin !== origin) {
      if (kind === 'resource') err(page, `external resource "${value}" (no CDNs / third-party requests)`);
      return; // external <a> links are fine
    }
    return checkUrl(page, u.pathname + u.search + u.hash, kind, pageIds); // absolute URL on our own origin
  }
  if (!value.startsWith('/')) return err(page, `relative URL "${value}" (expected base-prefixed absolute path)`);
  if (!value.startsWith(base)) return err(page, `"${value}" is outside the base "${base}"`);
  const afterBase = '/' + value.slice(base.length).replace(/^\/+/, '');
  if (!resolvesToFile(afterBase)) err(page, `"${value}" does not resolve to a file in dist/`);
}

const EMBED_HOSTS = ['bandcamp.com', 'soundcloud.com'];
function isEmbedHost(value) {
  try {
    const host = new URL(value).hostname;
    return EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function isImageCdn(value) {
  try {
    return new URL(value).hostname === 'cdn.sanity.io';
  } catch {
    return false;
  }
}

let urlCount = 0;
for (const file of htmlFiles) {
  const page = toUrlPath(file);
  const html = readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const found = [];

  for (const tag of html.matchAll(/<(a|area|link|script|img|source|iframe|video|audio|embed|object|form|meta)\b[^>]*>/gi)) {
    const [whole, name] = tag;
    const lower = name.toLowerCase();
    const attr = (n) => new RegExp(`\\s${n}\\s*=\\s*"([^"]*)"`, 'i').exec(whole)?.[1];
    const isLink = lower === 'a' || lower === 'area';
    if (lower === 'meta') {
      const key = attr('property') ?? attr('name') ?? '';
      if (/^(og:image|og:url|twitter:image)$/i.test(key)) found.push([attr('content'), 'link']);
      continue;
    }
    if (lower === 'link' && /\b(canonical|alternate|author)\b/i.test(attr('rel') ?? '')) {
      found.push([attr('href'), 'link']);
      continue;
    }
    // A connection hint (no request for content) to the image CDN is allowed; to anything else it is not.
    if (lower === 'link' && /\b(preconnect|dns-prefetch)\b/i.test(attr('rel') ?? '')) {
      const href = attr('href');
      found.push([href, href !== undefined && isImageCdn(href) ? 'link' : 'resource']);
      continue;
    }
    for (const n of ['href', 'src', 'poster', 'action', 'data-src']) {
      const v = attr(n);
      if (v === undefined) continue;
      // The only allowed third-party resource: Bandcamp / SoundCloud player iframes. They sit inside
      // a closed <details> and load lazily, so nothing is requested until the visitor opens them.
      const embed = lower === 'iframe' && isEmbedHost(v);
      // The other allowed third party: images on Sanity's image CDN (never scripts, styles or fonts).
      const cdnImage = (lower === 'img' || lower === 'source') && isImageCdn(v);
      found.push([v, isLink || embed || cdnImage ? 'link' : 'resource']);
    }
    const srcset = attr('srcset');
    if (srcset) {
      // A srcset candidate is "<url> <descriptor>" and the URL ends at whitespace. URLs may contain
      // commas (Sanity crop parameters: rect=302,3628,...), so do NOT split on commas.
      for (const m of srcset.matchAll(/(\S+)\s+[\d.]+[wx]/g)) {
        const candidate = m[1];
        if (candidate === undefined) continue;
        found.push([candidate, (lower === 'img' || lower === 'source') && isImageCdn(candidate) ? 'link' : 'resource']);
      }
    }
    if (lower === 'a' && /target="_blank"/i.test(whole) && !/rel="[^"]*noopener/i.test(whole)) {
      err(page, `target=_blank link without rel=noopener: ${whole}`);
    }
  }
  for (const [value, kind] of found) {
    if (value === undefined) continue;
    urlCount++;
    checkUrl(page, value, kind, ids);
  }

  // inline style url(...). Attribute values are HTML-escaped (&quot;), and data: URIs (the lqip
  // placeholder) are not requests, so decode first and skip them.
  for (const m of html.replaceAll('&quot;', '"').replaceAll('&#34;', '"').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (m[1].startsWith('data:')) continue;
    urlCount++;
    checkUrl(page, m[1], 'resource', ids);
  }

  // zoom lock
  const viewport = /<meta name="viewport" content="([^"]*)"/.exec(html)?.[1] ?? '';
  if (/maximum-scale|user-scalable/i.test(viewport)) err(page, `viewport locks zoom: "${viewport}"`);
  if (!viewport) err(page, 'missing viewport meta');

  // prototype flag behaviour
  const hasNoindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  const hasProtoLine = /prototype \/ placeholder content/i.test(html);
  if (prototypeExpected) {
    if (!hasNoindex) err(page, 'prototype build is missing <meta name="robots" content="noindex, nofollow">');
    if (!hasProtoLine) err(page, 'prototype build is missing the "prototype / placeholder content" footer line');
  } else {
    if (hasNoindex && page !== '/404.html') err(page, 'production build contains noindex');
    if (hasProtoLine) err(page, 'production build contains the prototype footer line');
    // Placeholder content (isPlaceholder fixtures) is marked data-placeholder and must never ship.
    if (/\sdata-placeholder\b/.test(html)) err(page, 'production build contains placeholder content (data-placeholder)');
  }
}

for (const file of cssFiles) {
  const page = toUrlPath(file);
  const css = readFileSync(file, 'utf8');
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (m[1].startsWith('data:')) continue;
    urlCount++;
    checkUrl(page, m[1], 'resource', undefined);
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(css)) err(page, 'references Google Fonts');
}

// sitemap + robots
const sitemapFiles = files.filter((f) => /sitemap.*\.xml$/i.test(f));
if (prototypeExpected && sitemapFiles.length) err('dist', `prototype build contains a sitemap: ${sitemapFiles.map(toUrlPath)}`);
if (!prototypeExpected && sitemapFiles.length === 0) err('dist', 'production build has no sitemap');

// 404
if (!existsSync(join(dist, '404.html'))) err('dist', '404.html is missing');

for (const e of errors) console.error(`ERROR ${e}`);
console.log(
  `check-dist: ${htmlFiles.length} html + ${cssFiles.length} css files, ${urlCount} URLs checked, ${errors.length} error(s)`,
);
process.exit(errors.length ? 1 : 0);
