# Sanity Studio

For Remco. The Studio lives in [studio/](../studio) as its own npm package (own `package.json`,
own `node_modules`), separate from the Astro site. It is **hosted by Sanity** (free plan) at
`https://<host>.sanity.studio`; it is not embedded in the website. Its interface and every field label
are Dutch (`@sanity/locale-nl-nl` plus Dutch labels in the schema).

## This project

- Sanity project id: `p9agaeq5` (not secret). Dataset `production`, **public**: checked, it answers
  anonymous queries with HTTP 200.
- As of 2026-11-09 the dataset is empty (0 documents), so the site shows its empty states when built
  against it.

## What is in it

| Menu item (Dutch) | What it is |
| --- | --- |
| **Kunst** | works with `section = art`, a drag-and-drop list: the order here is the order on the site |
| **Sieraden** | works with `section = jewelry`, also drag-and-drop, plus *Beschikbaarheid* |
| **Lab** | lab notes (test, fragment, notitie, geluidsschets, mislukte structuur), newest first |
| **Over** | one document, two tabs: *Tekst en portret* (biography: blank line = new paragraph) and *Cv* (three fixed lists: Tentoonstellingen, Residenties, Publicaties) |
| **Instellingen** | one document: home statement, e-mail, Instagram, status line, colophon |

Every photo needs alt text (a required field), every sound is either an uploaded file or a
Bandcamp/SoundCloud link. The schema mirrors `src/lib/types.ts`, so Step 5 swaps fixtures for GROQ
without changing pages.

Look and feel: [studio/theme.ts](../studio/theme.ts) builds a theme from the site's tokens (warm paper
greys, ink primary, rust `#b02f09` for errors, Inter + JetBrains Mono, no radius or shadows), light and
dark. The navbar shows the small logo mark (the same SVG as the site header) next to the lowercase
wordmark. **Keep `theme.ts` in sync with `src/styles/global.css` by hand.**

## One-time setup (you run these: they need your Sanity account)

I did not log in, create a project or deploy anything. In PowerShell, from the repo root:

```powershell
cd studio

# 1. Log in (opens a browser).
npx sanity login

# 2. Create the project and a PUBLIC dataset called "production" in one go.
#    Public means the website can read published content at build time without any token.
npx sanity projects create "bas den exter blokland" --dataset production --dataset-visibility public
#    -> note the project id it prints (8 characters). `npx sanity projects list` shows it again.

# 3. Tell the Studio about it.
copy .env.example .env
#    edit .env:  SANITY_STUDIO_PROJECT_ID=<the id>   SANITY_STUDIO_HOST=<a name, e.g. basblokland>

# 4. Try it locally.
npm run dev                 # http://localhost:3333

# 5. Put it online (builds and uploads; the URL is https://<SANITY_STUDIO_HOST>.sanity.studio).
npm run deploy
```

Notes:

- `.env` is gitignored. The project id is not secret, but keep it out of code anyway.
- If the local Studio shows a CORS error: `npx sanity cors add http://localhost:3333 --credentials`.
  The hosted Studio's own address is normally allowed automatically; if not, add
  `https://<host>.sanity.studio` the same way.
- Invite Bas: https://www.sanity.io/manage -> the project -> Members -> invite his e-mail as **Editor**
  (he never needs more than that).
- The CLI help (`npx sanity <command> --help`) was my source for these commands, not memory.

## How the forms are laid out (and why)

From a walkthrough of the Studio; Sanity opens every "add item" in a dialog by default
(`options.modal.type` defaults to `dialog`), which made some actions feel heavy:

- **Werk** has four tabs: *Basis*, *Foto's*, *Tekst*, *Geluid*. A tab with a validation problem is flagged.
- **Meer foto's** is a grid of thumbnails. The photo description (alt text) is required, with step-by-step
  help text, because a missing one blocks publishing.
- **Extra gegevens** and the **CV lists** edit in a small popover, not a full dialog, and have
  placeholders showing what to type.
- **Over**: the CV used to be groups inside groups (a dialog on top of a dialog). It is now three fixed
  lists, one level deep. Free-named groups are gone on purpose.
- **Instellingen** is split into *Homepage* and *Contact*.
- New works go to the **top** of the list (newest first, like the design); drag to reorder.
- Sanity's own Dutch interface text uses "u" ("Los de validatiefouten op voordat u publiceert"); our
  help texts use "je". Known mismatch, see the open question in the walkthrough notes.

## Day to day

- Add a work: **Kunst** or **Sieraden** -> the "+" ("Nieuw kunstwerk" / "Nieuw sieraad"). *Soort werk*
  is already filled in. The global "new document" menu offers the same two choices.
- Order: drag the rows. (The site shows works in this order; the numbers `[01.03]` follow it.)
- Nothing goes live until **Publiceren**. Drafts are yellow ("concept"), published is calm grey.

## How the site reads the content (Step 5)

[src/lib/content.ts](../src/lib/content.ts) is still the only thing pages import. At **build time** it
picks a source:

| `SANITY_PROJECT_ID` | Source |
| --- | --- |
| set | Sanity: four GROQ queries (works, lab, about, settings) for **published** documents only, no token |
| unset (or `CONTENT_SOURCE=fixtures`) | the typed placeholder fixtures, as before |

- If Sanity is configured and anything fails (network, query, or content that breaks a rule such as a
  photo without alt text or a work without a cover) the **build fails**. It never silently falls back
  to placeholders: that would publish the wrong site.
- Fresh data: the build queries the live API (`useCdn: false`), not the edge cache, so a rebuild right
  after a publish sees the new version.
- Content is loaded once per build and per dev-server start: after editing in the Studio, restart
  `npm run dev` (or rebuild) to see it.

To switch the prototype to Sanity: GitHub -> Settings -> Secrets and variables -> Actions -> **Variables**
-> add `SANITY_PROJECT_ID` (and `SANITY_DATASET` if it is not `production`), then re-run the workflow.
Locally: put the same two lines in `.env`.

**Images.** Every Sanity photo becomes a `<picture>`: WebP sources and a JPEG fallback, widths 320-2000
(never upscaled), `sizes` per place, the real width/height after Bas's crop (no layout shift), the
`lqip` blur as the placeholder, and Bas's focal point as `object-position` where CSS crops a thumbnail.
Only `cdn.sanity.io` may serve images; the dist guard allows exactly that host for `<img>`/`<source>`
(plus a `preconnect` to it) and nothing else third-party.

**AVIF is not possible with Sanity.** I tested the live CDN: `fm=webp` and `fm=jpg` answer 200,
`fm=avif` answers HTTP 400, and `auto=format` with an AVIF-capable `Accept` header still returns
WebP. Offering AVIF would mean downloading every image at build time, re-encoding it and hosting it
ourselves (large builds, and GitHub/Cloudflare file-size limits); decided against. CLAUDE.md says so.

**Tests.** `npm run test:sanity` (15 unit tests, no network) covers crop maths, srcset widths, lqip,
focal point, alt-text and required-field failures, audio, about/bio splitting and Instagram handle
clean-up. Beyond that, the whole pipeline was run once against a local mock of the Sanity API with
**real images from Sanity's public demo project**; see "Not verified yet".

## The theme preview (no login needed)

`cd studio; npm run theme-preview` serves real Sanity UI components with the theme:
`http://localhost:5199/?scheme=light` and `?scheme=dark`, plus `&theme=default` to compare against
Sanity's own. It is a developer tool and is never deployed.

## Embedding the Studio at `/studio` (not done; what it would take)

Today the Studio is separate, which is free, needs no maintenance and keeps ~9 MB of React/Sanity code
out of the website. If it ever should live at `basblokland.com/studio` on Cloudflare Pages:

1. **React in Astro.** Add `@astrojs/react`, `react`, `react-dom`, `sanity`, `styled-components` and the
   Studio's plugins to the site's `package.json` (or turn the repo into npm workspaces).
2. **A Studio page.** A route such as `src/pages/studio/[...index].astro` that renders
   `<Studio config={config} />` with `client:only="react"`, so none of it runs on public pages.
3. **`basePath`.** The Studio config needs `basePath: '/studio'`. On the GitHub Pages prototype the
   site is under `/basblokland.com/`, so it would have to follow `BASE_PATH`
   (`${BASE_PATH}studio`).
4. **SPA fallback.** The Studio does its own client-side routing (`/studio/structure/...`). A static
   build only has `/studio/index.html`, so Cloudflare needs `public/_redirects` with
   `/studio/*  /studio/index.html  200`. GitHub Pages has no equivalent, so the prototype would not work
   deep-linked.
5. **CORS.** Add the site origin to the project: `npx sanity cors add https://basblokland.com --credentials`.
6. **Keep it out of search and checks.** `noindex` + a `Disallow: /studio/` in robots.txt. The dist guard
   (`npm run verify`) forbids external requests and must be taught about the Studio's API calls
   (`*.api.sanity.io`, `cdn.sanity.io`); the "no CDN" rule is about scripts and fonts, which stay local.
7. **Cost.** Every site build bundles the Studio (more build time, bigger repo dependency tree, and Sanity
   major upgrades become site upgrades). The theme and logo would be reused unchanged.

My recommendation: stay with the hosted Studio.

## Not verified yet

- Logging in, creating the project, `deploy`, and everything that needs a live project: the real Studio
  has never run against Sanity from here. Schema, desk structure and the "+ Nieuw ..." intent menu items
  are type-checked and bundle (`sanity build` succeeds), but not exercised.
- **The site against Bas's real project.** The four GROQ queries have been executed by the real client
  only against a local mock (which returns hand-written results in the shape the queries ask for), not
  by Sanity's query engine against documents created by this Studio. A typo in a field name in a query
  would show up as empty content, not as an error. First thing to do once the project exists: add one
  work of each kind, set `SANITY_PROJECT_ID`, run `npm run dev` and compare.
- Images were exercised with real assets from Sanity's public demo project (cropped, with lqip), not
  with photos uploaded through this Studio (hotspot/crop UI, EXIF rotation of phone photos).
- `npm audit` in `studio/` reports 19 advisories (3 high: `js-yaml`, `smol-toml`, `undici`), all
  parser/DoS issues inside Sanity's own tooling, not in the shipped site (root: 0). npm's suggested fix
  is an *older* `sanity`, so there is nothing to do; revisit when Sanity updates.
- Whether the hosted Studio's CORS origin is added automatically (see notes above).
- Position numbers in list rows: Sanity cannot show a row's drag position in a preview, so rows show
  thumbnail, title, kind and year; the `[01.03]` numbers appear on the site only.
