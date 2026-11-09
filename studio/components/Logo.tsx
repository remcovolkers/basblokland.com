/**
 * Navbar logo: Bas's mark (the simplified small variant, same SVG as the website header) next to the
 * text wordmark. The mark never replaces the wordmark. The SVG uses currentColor, so it follows the
 * light/dark scheme.
 */
import type { LogoProps } from 'sanity';
// One source of truth: the same traced SVG the website header uses (repo root /src/assets/logo).
import mark from '../../src/assets/logo/logo-mark-small.svg?raw';

const sizedMark = mark.replace('<svg ', '<svg aria-hidden="true" focusable="false" style="display:block;height:28px;width:auto" ');

export function Logo(props: LogoProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        // Explicit family: do not depend on where the navbar places the logo.
        fontFamily: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      <span style={{ display: 'inline-flex', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: sizedMark }} />
      <span style={{ textTransform: 'lowercase' }}>{props.title}</span>
    </span>
  );
}
