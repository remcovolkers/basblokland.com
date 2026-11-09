# Prototype hosting on GitHub Pages

For Remco (developer notes, not for Bas). The prototype lives at
`https://remcovolkers.github.io/basblokland.com/`. Production will be Cloudflare Pages on
`basblokland.com`; see [domain-move.md](domain-move.md).

## One-time setup (you do this, in the browser)

The repository must be **public** (GitHub Pages on private repos needs a paid plan).

1. GitHub → the repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   (Not "Deploy from a branch". Nothing else on that page needs changing.)
3. Push to `main`, or run the workflow by hand: **Actions → Deploy prototype to GitHub Pages → Run workflow**.
4. The first run may ask you to approve the `github-pages` environment; approve it.
5. The deploy job prints the live URL.

I did not change any repository settings and did not push anything.

## What the workflow does

`.github/workflows/deploy.yml` runs on:

| Trigger | Why |
| --- | --- |
| `push` to `main` | normal deploys |
| `workflow_dispatch` | the "Run workflow" button |
| `repository_dispatch` type `sanity-publish` | the Sanity publish webhook rebuilds on publish (setup: [go-live.md](go-live.md)) |
| `schedule` (hourly) | safety net if the webhook or its token fails; only runs once `SANITY_PROJECT_ID` is set; a `keepalive` job keeps GitHub from disabling it after 60 quiet days |

The build runs `npm run check`, `npm run verify:src`, `npm run build`, `npm run verify`. If any of
them fails, nothing is deployed.

## Configuration (all optional)

`SITE_URL` and `BASE_PATH` default to the GitHub Pages values taken from the repo
(`https://<owner>.github.io` and `/<repo>/`). To override, add **Variables** (not Secrets, they are
public) under Settings → Secrets and variables → Actions → Variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `SANITY_PROJECT_ID` | unset | set: the build reads published content from Sanity; unset: local placeholder fixtures (see [studio.md](studio.md)) |
| `SANITY_DATASET` | `production` | the dataset to read (must be public, no token is used) |
| `PUBLIC_PROTOTYPE` | `true` | `noindex, nofollow`, no sitemap; also lets the local placeholder fixtures show (never in production) |
| `SITE_URL` | derived | origin only, e.g. `https://basblokland.com` |
| `BASE_PATH` | derived | `/` for production, `/<repo>/` on a project page |

Locally the same names work in a `.env` file (copy `.env.example`). `.env` is gitignored.

## Local commands

```
npm run dev          # dev server, uses the same base path
npm run build        # PUBLIC_PROTOTYPE=true to mimic the prototype
npm run preview      # serves dist/ under the real base path
npm run test:sanity  # unit tests for the Sanity mapping and image pipeline (no network)
npm run verify:src   # no hard-coded "/" URLs in src/, no stray personal data
npm run verify       # links, assets, noindex/sitemap rules in dist/ (use the same PUBLIC_PROTOTYPE as the build)
```

Windows note: in **Git Bash**, `BASE_PATH=/ npm run build` is rewritten to `C:/Program Files/Git/`.
The config detects this and stops with an explanation. Use PowerShell
(`$env:BASE_PATH='/'; npm run build`) or prefix with `MSYS_NO_PATHCONV=1`.

## Public repo rules

- No `.env`, secrets or real personal data. `npm run verify:src` rejects any e-mail address that is
  not on the allowlist, any hard-coded Instagram profile, and anything shaped like a GitHub or Sanity
  token (`github_pat_...`, `ghp_...`, `sk...`). It runs in CI. The GitHub token for the publish webhook
  lives only in the Sanity webhook's header, never in the repo or on your machine
  (see [go-live.md](go-live.md)).
- The only e-mail in the repo is a placeholder in `src/lib/fixtures/site-settings.ts`. The real
  address is entered in Sanity (`siteSettings`) once Bas approves it.
- Placeholder content lives only in typed fixtures with `isPlaceholder: true`.
- `design/stitch/` is gitignored: it contains invented data, including an address that may be real.
