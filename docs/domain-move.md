# Moving the site to basblokland.com

For Remco. Nothing here has been done. I have not touched DNS, Cloudflare or GitHub settings.

## READ FIRST: do not break e-mail

If `basblokland.com` has e-mail (Gmail/Google Workspace, Microsoft 365, a hoster, forwarding), it
depends on DNS records that have nothing to do with the website:

- **MX** records (where mail is delivered)
- **TXT** records for **SPF** (`v=spf1 ...`), **DKIM** (`<selector>._domainkey`) and **DMARC** (`_dmarc`)
- helper records such as `autodiscover`, `autoconfig`, `mail`, `imap`, `smtp`, and verification TXT records

**Leave all of these exactly as they are.** The website only needs the records for the apex
(`basblokland.com`) and `www`. Never use a tool or wizard that says "replace all records",
"import and overwrite" or "reset DNS".

The risky step is **moving nameservers** (needed for Cloudflare with an apex domain, see route A).
A new DNS zone starts with whatever records you create or import. Anything missing stops working:
mail bounces. So before changing nameservers, export or screenshot the full current record list and
compare it line by line with the new zone.

Before any DNS change: lower the TTL on the records you will change to 300 seconds, and wait one
old-TTL period. That makes rollback quick.

## Placeholder note: `public/CNAME`

**Do not create `public/CNAME`.**

- With the GitHub Actions deployment this project uses, GitHub says any `CNAME` file "is ignored and
  is not required". The custom domain is set in Settings → Pages instead.
- On Cloudflare Pages a `CNAME` file means nothing; it would just be served as a stray file at
  `/CNAME`.

If we ever switch to "Deploy from a branch", add `public/CNAME` containing only `basblokland.com`
at that point.

## Route A: Cloudflare Pages (the planned production target)

Cloudflare's docs say an apex domain such as `basblokland.com` needs the domain added as a
**Cloudflare zone with Cloudflare's nameservers**. A subdomain such as `www` can stay on any DNS
provider with a CNAME to `<project>.pages.dev`.

1. **Create the project.** Cloudflare dashboard → Workers & Pages → create → Pages → connect to
   Git → this repo. (Cloudflare's UI changes often: I could not verify the current screens.)
   - Build command: `npm run check && npm run verify:src && npm run build && npm run verify`
   - Build output directory: `dist`
   - Environment variables (Production):
     `NODE_VERSION=24`, `SITE_URL=https://basblokland.com`, `BASE_PATH=/`
   - Do **not** set `PUBLIC_PROTOTYPE`. Unset means production: no noindex, sitemap included, no
     placeholder content. The build's `verify` step fails if any of that leaks.
2. **Test on the `*.pages.dev` URL first.** The site must work at base `/` there. Keep the GitHub
   Pages prototype running meanwhile.
3. **Decide where DNS lives.**
   - *Option 1, easiest and what Cloudflare expects:* add `basblokland.com` to Cloudflare as a zone.
     **Before** switching nameservers at the registrar, make sure Cloudflare's imported/created
     records include every MX, SPF, DKIM, DMARC and helper record from the current DNS. Compare
     them one by one. Records for mail hostnames (`mail`, `imap`, `smtp`, `autodiscover`, ...) must
     be "DNS only" (grey cloud), never proxied (orange cloud), or mail clients break. Then change
     nameservers at the registrar to the two Cloudflare gives you.
   - *Option 2, no nameserver change:* keep DNS where it is, add `www.basblokland.com` as a custom
     domain in Pages and create `www CNAME <project>.pages.dev` at the current provider, and
     redirect the bare domain to `www` at that provider. Mail is untouched.
4. **Add the custom domain in the Pages dashboard first**, then create/confirm the DNS record.
   (Cloudflare warns that creating the CNAME by hand first can cause 522 errors.)
5. **HTTPS.** Cloudflare issues the certificate automatically. Then, in the zone: SSL/TLS mode
   **Full (strict)** and turn on **Always Use HTTPS**. If you have CAA records, make sure they allow
   Cloudflare's certificate authorities.
6. **Sanity webhook.** Create a Deploy Hook in the Pages project and point the Sanity webhook at it
   (written up in the Sanity step docs). The GitHub `repository_dispatch` route then becomes unused.
7. **Retire the prototype.** In the repo: set variable `PUBLIC_PROTOTYPE=false`, or delete the
   workflow, or Settings → Pages → unpublish. Until then it stays `noindex`.

## Route B: stay on GitHub Pages with the custom domain

Only if you decide Cloudflare is not needed.

1. Repo variables: `SITE_URL=https://basblokland.com`, `BASE_PATH=/`, `PUBLIC_PROTOTYPE=false`
   (Settings → Secrets and variables → Actions → Variables). Re-run the workflow.
2. Optional but recommended: verify the domain in your GitHub account (Settings → Pages → Add a
   domain) before adding it to the repo. This adds one TXT record; it does not affect mail.
3. DNS at the current provider, **web records only**:
   - apex `basblokland.com`, `A` ×4: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - apex `AAAA` ×4 (optional): `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www` `CNAME` → `remcovolkers.github.io`
   - Remove only the old *website* `A`/`AAAA`/`CNAME` records for the apex and `www`.
4. Repo → Settings → Pages → **Custom domain** = `basblokland.com` → Save.
5. When the option becomes available (GitHub says up to 24 hours), tick **Enforce HTTPS**.

Do not create a `CNAME` file (see above).

## Checklist after switching (either route)

- [ ] `https://basblokland.com/` loads over HTTPS; `http://` redirects to `https://`
- [ ] View source: **no** `noindex`, **no** `data-placeholder` content anywhere
- [ ] `https://basblokland.com/sitemap-index.xml` exists
- [ ] Open `/art/`, `/about/`, a made-up URL (should show the 404 page), and the favicon
- [ ] Canonical and `og:image` URLs start with `https://basblokland.com/`
- [ ] **Send yourself a test e-mail to and from the domain** (MX/SPF/DKIM/DMARC still fine)
- [ ] Real contact details are entered in Sanity `siteSettings`, not in code
- [ ] No placeholder content published (`isPlaceholder` fixtures are not used in production)

## Rollback

Restore the previous A/CNAME values (you wrote them down, TTL was 300s). If nameservers were
changed, switch them back at the registrar; the old zone still has its records.
