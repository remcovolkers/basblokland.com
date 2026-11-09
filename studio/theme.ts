/**
 * Studio theme built from the website's design tokens (src/styles/global.css), so the Studio feels
 * like the site: warm paper greys, ink-black primary, one rust accent, Inter + JetBrains Mono, no
 * rounded corners. Light AND dark come from the same palette: Sanity UI maps tints 50..950 onto both
 * colour schemes. Dialogs, popovers and menus get their separation from Sanity's shadows plus
 * studio/layers.css (hard edge, lighter surface in dark mode, firmer scrim).
 *
 * KEEP IN SYNC with the site tokens by hand: the Studio is a separate package and cannot import CSS.
 */
import { hues } from '@sanity/color';
import { buildTheme } from '@sanity/ui/theme';

type Tint = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
const TINTS: readonly Tint[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** Build a tint ramp (50 lightest .. 950 darkest) from 11 colours. */
const ramp = (colours: readonly string[]): Record<Tint, string> =>
  Object.fromEntries(TINTS.map((tint, i) => [tint, colours[i] ?? '#000000'])) as Record<Tint, string>;

/** Unchanged Sanity hues, as plain hex ramps (used for the hues we do not recolour). */
const stock = (hue: keyof typeof hues): Record<Tint, string> =>
  Object.fromEntries(TINTS.map((tint) => [tint, hues[hue][tint].hex])) as Record<Tint, string>;

// Site tokens: surface #faf9f5, surface-container-* #f5f4ef..#e3e2de, outline-variant #c5c6c9,
// outline #63656a, on-surface-variant #45474a, on-surface #1b1c1a, primary #000, secondary #b02f09.
const gray = ramp([
  '#faf9f5', // 50   surface
  '#f5f4ef', // 100  surface-container-low
  '#efeeea', // 200  surface-container
  '#e3e2de', // 300  surface-container-highest
  '#c5c6c9', // 400  outline-variant
  '#8f9194', // 500
  '#63656a', // 600  outline (AA-contrast darkened, see site)
  '#45474a', // 700  on-surface-variant
  '#30312e', // 800
  '#242523', // 900
  '#1b1c1a', // 950  on-surface (dark-scheme background)
]);

// Studio's "primary" tone (selection, focus, links) = ink, like the site's black.
const ink = ramp([
  '#f5f4ef',
  '#e3e2de',
  '#c5c6c9',
  '#a7a8ac',
  '#8f9194',
  '#45474a',
  '#242523',
  '#0f100f',
  '#000000',
  '#000000',
  '#000000',
]);

// Studio's "positive" tone (Publiceren, published) = ink as well, but with a lighter middle: in the
// dark scheme its mid tints are TEXT (the "gepubliceerd" badge) and must stay readable (>= 4.5:1).
const inkPositive = ramp([
  '#f5f4ef',
  '#e3e2de',
  '#c5c6c9',
  '#a7a8ac',
  '#9a9c9f',
  '#8f9194',
  '#3e4043',
  '#242523',
  '#0f100f',
  '#000000',
  '#000000',
]);

// Studio's "critical" tone (errors, destructive) = the site's single accent, secondary #b02f09.
const rust = ramp([
  '#fff4f1',
  '#ffdbd2', // secondary-fixed
  '#ffb4a1', // secondary-fixed-dim
  '#fc653d', // secondary-container
  '#d64219',
  '#b02f09', // secondary
  '#891e00', // on-secondary-fixed-variant
  '#6b1700',
  '#4f1000',
  '#3c0800', // on-secondary-fixed
  '#240500',
]);

const SANS = '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

// Sanity UI font sizes carry metrics (ascender, line height, ...). Reuse its defaults and swap only
// the family, so layout stays correct.
const defaults = buildTheme().v2;
if (!defaults) throw new Error('@sanity/ui buildTheme() returned no v2 theme: the theme API has changed.');
const base = defaults.font;

export const theme = buildTheme({
  font: {
    text: { ...base.text, family: SANS },
    heading: { ...base.heading, family: SANS },
    // Metadata, labels and code: mono, only 400 and 600 are loaded (no faux weights).
    label: { ...base.label, family: MONO, weights: { regular: 400, medium: 400, semibold: 600, bold: 600 } },
    code: { ...base.code, family: MONO, weights: { regular: 400, medium: 400, semibold: 600, bold: 600 } },
  },
  // No rounded corners (site rule). Shadows are Sanity's own: layers (dialogs, popovers, menus) need
  // them to separate from the page behind them; with a flat theme a dialog dissolved into the page.
  radius: [0, 0, 0, 0, 0, 0, 0],
  shadow: defaults.shadow,
  palette: {
    black: '#000000',
    // `white` is the light scheme's base surface and the text on solid buttons: the site's paper colour.
    white: '#faf9f5',
    gray,
    blue: ink,
    red: rust,
    // "Positive" (Publiceren, published) = ink as well, so the most-pressed button is not neon green and
    // a published document looks calm. The one warm colour left is yellow = concept/draft, so work that
    // is not published yet stands out. Other hues stay Sanity's own.
    green: inkPositive,
    purple: stock('purple'),
    magenta: stock('magenta'),
    orange: stock('orange'),
    yellow: stock('yellow'),
    cyan: stock('cyan'),
  },
});
