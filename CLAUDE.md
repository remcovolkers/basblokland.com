# bas den exter blokland: website

Archive/portfolio site for artist Bas den Exter Blokland (sculpture, installation, sound, material research, handmade jewelry). Replaces basblokland.com. Must run on free tiers only, no self-hosting. Bas is non-technical and edits content in Sanity Studio.

## Stack
- Astro (static output), TypeScript strict, Tailwind CSS v4 (tokens via @theme in CSS)
- Sanity Studio in /studio (hosted by Sanity, free plan); content and images via Sanity CDN
- GitHub Pages for the prototype, Cloudflare Pages for production on basblokland.com; Sanity webhook rebuilds on publish (prototype: repository_dispatch -> GitHub Actions; production: Cloudflare deploy hook)
- npm, Node LTS. No other backend, no database, no paid services.

## Layout
- design/stitch/  Reference designs from Google Stitch (HTML + PNG). Read-only. Never import, ship or edit.
- src/            Astro site
- studio/         Sanity Studio
- docs/           Notes for Bas (how to add a work, how publishing works)

## Design rules
- Wordmark "bas den exter blokland" always lowercase. Titles: Inter, lowercase. Metadata, nav, counters, captions: JetBrains Mono, uppercase, wide tracking.
- No gradients, shadows, rounded corners, filled buttons, icons or icon fonts. Use "* * *" dividers, hairlines and bracketed mono links like [ VIEW ALL ART -> ].
- One accent (secondary, #b02f09) only for hover, active and status.
- Images grayscale by default, colour on hover/focus for pointer devices. Index cards may crop to a fixed ratio; detail pages show images uncropped at natural ratio.
- Keep Stitch token names (text-meta-mono, px-gutter, bg-surface-container...) so its markup ports 1:1.

## Content rules
- Site copy is English. Studio (Sanity) field labels and descriptions are in Dutch, plain language.
- NEVER invent facts. Stitch placeholder content (location, coordinates, temperature, specimen registers, masses, exhibitions, email, Instagram) is fake. Placeholder works live only in typed fixtures marked isPlaceholder and are never published.
- Real contact (confirm with Bas): basblokland8@gmail.com, instagram.com/basblokland_. Store in siteSettings, not hard-coded.

## Quality rules
- Accessibility: zoom must stay enabled (no maximum-scale / user-scalable=no), skip link, visible focus, semantic HTML (details/summary instead of inline onclick), prefers-reduced-motion, no horizontal scroll at 200% text size, 44px touch targets, alt text from CMS.
- Base path: SITE_URL / BASE_PATH come from env (prototype: derived from the git remote; production: base "/"). Every internal link, asset, favicon and OG image goes through url() in src/lib/url.ts, never a literal leading "/". PUBLIC_PROTOTYPE=true adds noindex, drops the sitemap and shows a footer line. `npm run verify:src` and `npm run verify` enforce all of this; the repo is public, so no secrets or real personal data.
- Self-host fonts (@fontsource). No CDN scripts, no Google Fonts requests.
- Performance: Lighthouse mobile >= 95. Images via Sanity CDN with srcset, avif/webp, lqip placeholder, lazy loading.
- Verify after each step: `npm run build` and `astro check`; compare against design/stitch/*.png at 390px and 1440px.

## Working agreement
- Small commits, one logical step each. Never commit secrets: use .env and .env.example.
- Ask before anything needing my accounts (sanity login, Cloudflare, DNS, GitHub repo settings). Write the steps for me instead of running them.
- If the design is ambiguous, ask. If only mobile exists, propose a desktop adaptation and flag it as a proposal.

## Logo
- Bas's logo is design/brand/logo-original.png (300x300 raster, black on white, high contrast). It is the only illustrative element allowed on the site.
- Never ship the PNG as-is. Produce an SVG (fill: currentColor, transparent background) so it works on both light and dark themes. Ask me if a higher-resolution or vector original exists before tracing.
- Detail is lost below ~48px: propose a simplified small variant for header/favicon and show me both before using them.
- Keep the text wordmark "bas den exter blokland" next to the mark; the logo does not replace it.