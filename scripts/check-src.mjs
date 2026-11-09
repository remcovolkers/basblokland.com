// Source guard: run with `npm run verify:src`.
//  1. No hard-coded root-relative URLs ("/art", src="/x.png", url(/font.woff2)) in src/.
//     All internal URLs must go through url() in src/lib/url.ts so the base path is respected.
//  2. No real personal data in files that git tracks. The repo is public.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);

// ---- 1. hard-coded root-relative URLs in src/ -------------------------------------------
const SRC_EXT = new Set(['.astro', '.ts', '.tsx', '.js', '.mjs', '.css', '.md', '.mdx', '.html']);
const urlAttr = /\b(?:href|src|srcset|action|poster|data-src)\s*=\s*(?:\{\s*)?["'`]\/(?!\/)/;
// CSS url(/...). In .astro/.ts the helper is also called url(), so outside .css files only
// match when it follows a CSS property colon, e.g. "background: url(/x.png)".
const cssUrlInCss = /url\(\s*["']?\/(?!\/)/;
const cssUrlElsewhere = /[\w-]+\s*:\s*[^;{}]*\burl\(\s*["']?\/(?!\/)/;
// `git ls-files` still lists tracked files that were deleted in the working tree: skip those.
const srcFiles = git('ls-files', '-co', '--exclude-standard', 'src').filter((f) => existsSync(join(root, f)));
for (const file of srcFiles) {
  if (!SRC_EXT.has(extname(file))) continue;
  const cssUrl = extname(file) === '.css' ? cssUrlInCss : cssUrlElsewhere;
  const lines = readFileSync(join(root, file), 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (urlAttr.test(line) || cssUrl.test(line)) {
      errors.push(`${file}:${i + 1} hard-coded root-relative URL (use url() from src/lib/url.ts): ${line.trim()}`);
    }
  });
}

// ---- 2. personal data in the public repo ------------------------------------------------
// Placeholder addresses that are allowed to live in the repo.
const EMAIL_ALLOW = [/^remco\.volkers1@gmail\.com$/i, /@example\.(?:invalid|com|org)$/i, /@users\.noreply\.github\.com$/i];
// Deliberately NO list of "forbidden real values": that list would itself be personal data in
// a public repo. Instead everything unknown is rejected: any email not allowlisted above, and
// any hard-coded Instagram profile URL (handles come from Sanity siteSettings, never code).
const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const instagramProfile = /instagram\.com\/(?!\$\{)[A-Za-z0-9_.]+/gi;
// Secrets must never be committed (the repo is public). Shapes of the tokens this project uses:
// GitHub fine-grained (github_pat_...) and classic (ghp_, gho_, ghu_, ghs_, ghr_) tokens, and Sanity
// API tokens ("sk" + a long random string). The patterns are generic: no real token is stored here.
const secretPatterns = [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, /\bgh[pousr]_[A-Za-z0-9]{30,}/g, /\bsk[A-Za-z0-9]{40,}\b/g];
const SKIP = /(^|\/)(package-lock\.json|node_modules|dist|\.git|\.astro)(\/|$)|\.(png|jpe?g|webp|avif|woff2?|ico|svgz)$/i;

// CLAUDE.md documents the real contact details on purpose: Remco confirmed they may be public.
// Code, fixtures and docs still must not contain them (they live in Sanity siteSettings).
// scripts/test-sanity.ts feeds a FAKE profile URL to the Instagram handle normaliser on purpose.
const EXEMPT = new Set(['CLAUDE.md', 'scripts/test-sanity.ts']);
const tracked = new Set(git('ls-files'));
const candidates = git('ls-files', '-co', '--exclude-standard').filter((f) => !SKIP.test(f) && !EXEMPT.has(f));
for (const file of candidates) {
  let text;
  try {
    if (!statSync(join(root, file)).isFile()) continue;
    text = readFileSync(join(root, file), 'utf8');
  } catch {
    continue;
  }
  // Tracked files are an error. Untracked-but-not-ignored files are a warning, because they
  // are one `git add .` away from being published.
  const report = tracked.has(file) ? errors : warnings;
  for (const found of text.match(email) ?? []) {
    if (!EMAIL_ALLOW.some((ok) => ok.test(found))) report.push(`${file}: unexpected email address "${found}". Do not publish it.`);
  }
  for (const pattern of secretPatterns) {
    for (const found of text.match(pattern) ?? []) {
      // Show only the start: never print a real secret into a log.
      report.push(`${file}: looks like a secret token ("${found.slice(0, 8)}…"). Remove it and revoke/rotate the token.`);
    }
  }
  for (const found of text.match(instagramProfile) ?? []) {
    report.push(`${file}: hard-coded Instagram profile "${found}". Handles belong in Sanity siteSettings.`);
  }
}

// ---- report -----------------------------------------------------------------------------
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(
  `check-src: ${srcFiles.length} src files, ${candidates.length} files scanned, ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
