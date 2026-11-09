// Regenerates the committed brand assets from the traced SVG marks. Not part of the normal build:
// run `npm run brand` only when the logo, wordmark or colours change, then commit the results.
//
//   public/favicon.svg          small mark, square canvas, black on light / off-white on dark
//   public/apple-touch-icon.png 180x180, opaque (iOS paints transparency black), full mark
//   public/og.png               1200x630 Open Graph card: full mark + lowercase wordmark
//
// PNGs are rendered by headless Chrome/Edge (found automatically, or set CHROME_PATH).
// Nothing here ships the original 300px PNG; everything derives from src/assets/logo/*.svg.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8').trim();
const full = read('src/assets/logo/logo-mark.svg');
const small = read('src/assets/logo/logo-mark-small.svg');

const INK = '#000000';
const PAPER = '#faf9f5'; // surface
const MUTED = '#63656a'; // outline
const font = (p) => pathToFileURL(join(root, 'node_modules', p)).href;

// ---- favicon.svg: small mark centred on a square canvas, themed with prefers-color-scheme ----
{
  const [x, y, w, h] = /viewBox="([^"]+)"/.exec(small)[1].split(/\s+/).map(Number);
  const side = Math.max(w, h);
  const vb = [x - (side - w) / 2, y - (side - h) / 2, side, side].map((n) => Math.round(n * 10) / 10).join(' ');
  const path = /<path [^>]*\/>/.exec(small)[0].replace(' fill-rule', ' fill-rule');
  writeFileSync(
    join(root, 'public/favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><style>path{fill:${INK}}@media (prefers-color-scheme:dark){path{fill:${PAPER}}}</style>${path}</svg>\n`,
  );
  console.log('wrote public/favicon.svg');
}

// ---- Chrome ----------------------------------------------------------------------------------
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const found = candidates.find((c) => existsSync(c));
  if (!found) throw new Error('No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.');
  return found;
}
const chrome = findChrome();
const work = mkdtempSync(join(tmpdir(), 'brand-'));

function screenshot(html, out, width, height, scale = 1) {
  const page = join(work, `${out.replace(/\W+/g, '_')}.html`);
  writeFileSync(page, html);
  mkdirSync(join(root, 'public'), { recursive: true });
  const res = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      `--user-data-dir=${join(work, 'profile')}`,
      `--force-device-scale-factor=${scale}`,
      `--window-size=${width},${height}`,
      '--virtual-time-budget=4000',
      `--screenshot=${join(root, out)}`,
      pathToFileURL(page).href,
    ],
    { stdio: 'ignore' },
  );
  if (res.status !== 0) throw new Error(`Chrome failed for ${out}`);
  const buf = readFileSync(join(root, out));
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  console.log(`wrote ${out} (${w}x${h}, ${buf.length} bytes)`);
  if (w !== width * scale || h !== height * scale) throw new Error(`${out}: expected ${width * scale}x${height * scale}, got ${w}x${h}`);
}

const sized = (svg, h) => svg.replace('<svg ', `<svg height="${h}" `);
const base = `*{margin:0;box-sizing:border-box}html,body{background:${PAPER};overflow:hidden}`;

// ---- apple-touch-icon.png: 720px canvas rendered at scale 0.25 -> 180x180 ---------------------
screenshot(
  `<!doctype html><meta charset=utf-8><style>${base}
  body{width:720px;height:720px;display:grid;place-items:center;color:${INK}}</style>${sized(full, 520)}`,
  'public/apple-touch-icon.png',
  720,
  720,
  0.25,
);

// ---- og.png ---------------------------------------------------------------------------------
screenshot(
  `<!doctype html><meta charset=utf-8><style>${base}
  @font-face{font-family:Inter;font-weight:100 900;src:url(${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')})}
  @font-face{font-family:JB;font-weight:400;src:url(${font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2')})}
  body{width:1200px;height:630px;display:flex;align-items:center;gap:80px;padding:0 100px;color:${INK}}
  .mark{flex:none}
  h1{font:600 92px/0.98 Inter,sans-serif;letter-spacing:-0.035em;text-transform:lowercase}
  hr{border:0;border-top:2px solid #c5c6c9;margin:36px 0 22px}
  p{font:400 22px/1.5 JB,monospace;letter-spacing:.12em;text-transform:uppercase;color:${MUTED}}
  </style><div class=mark>${sized(full, 470)}</div>
  <div><h1>bas den exter blokland</h1><hr><p>sculpture / installation / sound / material research / jewelry</p></div>`,
  'public/og.png',
  1200,
  630,
);

rmSync(work, { recursive: true, force: true });
