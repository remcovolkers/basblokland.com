# From placeholders to Bas's real content

For Remco. Domain and Cloudflare are deliberately **not** part of this: they wait until Bas has time
(see [domain-move.md](domain-move.md)). This is about the GitHub Pages prototype showing only real
content, and Bas being able to publish without you.

## Where things stand

- The Studio is live at `https://basblokland.sanity.studio`; project `p9agaeq5`, public dataset `production`.
- The live prototype still builds from the **local placeholder fixtures**, because the repository variable
  `SANITY_PROJECT_ID` is not set.
- The dataset holds two **test works** ("Forever logo", "Dikke bling broer"). There is no `Instellingen` or
  `Over` document yet.
- Publishing in the Studio does **not** yet update the site: the site only rebuilds when you push to GitHub.
  Step 3 fixes that.

`npm run content:status` prints this picture from the real project (what is missing, which works have
problems) and exits non-zero while something important is missing.

## How placeholders disappear

Placeholders are not scattered around the code: they live in `src/lib/fixtures/` and are used **only**
when no `SANITY_PROJECT_ID` is set. Once the variable is set, a build contains no fixture content and not
even the placeholder image files (checked against the real project). So the work is:

1. **Fill in the real content** (Bas, or you with him): Instellingen, Over, real works. Run
   `npm run content:status` until it says READY.
2. **Delete the two test works** in the Studio (menu **Kunst** / **Sieraden**, open the work, **Verwijderen**).
   Uploaded test images stay in Sanity's media library; harmless.
3. **Set the variable** (below). Then the site shows only what is published.

The fixtures stay in the repo on purpose (local design work without a project, and the unit tests); they
can never reach a deploy that has the variable.

Still English copy that needs Bas's OK (it is not placeholder data, but nobody has confirmed it):
- jewelry index intro: "Jewelry is not sold through a shop. To buy or commission a piece, get in touch."
- the fallback home heading is just his name; his own statement goes in **Instellingen**.

## The order to do things in

### 1. Ship what is already built
- `git push` (nothing changes on the live site: still fixtures, no variable yet).
- Studio: `cd studio` then `npm run deploy`, so the hosted Studio gets the new tabs and dialog styling.

### 2. Invite Bas
https://www.sanity.io/manage -> project -> **Members** -> invite his e-mail as **Editor**. Send him
[handleiding-bas.md](handleiding-bas.md) (Dutch) and `https://basblokland.sanity.studio`.

### 3. Make "Publiceren" update the site (the webhook)

> **The token is not what removes the placeholders.** Placeholders go away when the repository
> *variable* `SANITY_PROJECT_ID` is set (step 4, no token involved). The token below only lets Sanity
> tell GitHub "something was published, rebuild". Without it the site still shows real content after
> step 4, but only updates on a push or on the hourly safety net.

Chain: Sanity publish -> webhook -> GitHub `repository_dispatch` (`sanity-publish`) -> the existing
workflow rebuilds and deploys. The workflow already listens for that event.

**a. A GitHub token** (needs your GitHub account):
https://github.com/settings/personal-access-tokens/new -> *Resource owner*: you -> *Repository access*:
**Only select repositories** -> `basblokland.com` -> *Repository permissions* -> **Contents: Read and
write** (GitHub's permission table lists `POST /repos/{owner}/{repo}/dispatches` under Contents: write)
-> generate and copy the token once. Give it a long expiry and put the date in your calendar: when it
expires, publishing silently stops updating the site.

**b. The Sanity webhook:** https://www.sanity.io/manage -> project -> **API** -> **Webhooks** -> create:

| Field | Value |
| --- | --- |
| Name | `GitHub rebuild` |
| URL | `https://api.github.com/repos/remcovolkers/basblokland.com/dispatches` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["work", "labEntry", "about", "siteSettings"]` |
| Projection | `{"event_type": "sanity-publish"}` |
| HTTP method | POST |
| HTTP headers | `Authorization: Bearer <the token>`, `Accept: application/vnd.github+json`, `User-Agent: sanity-webhook` |
| Drafts and versions | leave **off** (then it only fires on real publishes, not on every keystroke) |

**c. Test it:** publish a small change, then watch GitHub -> Actions for a run whose event is
`repository_dispatch`, and the webhook's **attempts log** in Sanity for HTTP **204**.

Unverified: whether Sanity accepts a constant projection like `{"event_type": "sanity-publish"}` (its docs do not
say; the attempts log will). If it is rejected: HTTP 422 from GitHub.

**The safety net (already in the workflow).** Whatever happens to the webhook or its token, the workflow
also rebuilds **every hour** (`schedule`, minute 17, UTC). So the worst case is a delay of up to about an
hour, never "Bas published and nothing ever happened". Details:
- It only runs once `SANITY_PROJECT_ID` is set. Before that it is skipped, otherwise it would rebuild the same
  placeholders every hour.
- GitHub **disables scheduled workflows in a public repo after 60 days without repository activity**
  (GitHub's docs do not say whether a scheduled run itself counts). So a `keepalive` job, on those same
  scheduled runs, adds **one empty commit once the last commit is 45+ days old**, and does nothing
  otherwise. Pushes by `GITHUB_TOKEN` do not start new runs, so it cannot loop. This needs the job-level
  `contents: write` permission; if your repo is locked to read-only workflow tokens in Settings -> Actions
  -> General, the keepalive's push would fail and you would see it in the run.
- Scheduled runs can be delayed or, under heavy GitHub load, dropped (GitHub's own warning). It is a safety
  net, not a guarantee.

#### If "Publiceren" does not start a run

Two **separate** things can be wrong; check both:

1. **The site does not read Sanity at all yet.** Until the variable in step 4 is set, a rebuild produces the
   same placeholder site, so even a perfect webhook shows nothing new. (How to see which one you are
   looking at: view the page source and find `<meta name="content-source">`: `fixtures` = placeholders, `sanity` = the CMS. Or look for "placeholder work" on the site.)
2. **The webhook does not arrive or is rejected.** Open it in Sanity (sanity.io/manage -> project -> API ->
   Webhooks) and read its attempt log for the publish. The status code says what is wrong (typical GitHub API
   behaviour, not verified against this repo):

| Status in the log | Usual cause |
| --- | --- |
| no attempt at all | webhook disabled, **Update** not ticked under *Trigger on*, wrong dataset, or the filter does not match |
| 204 | GitHub accepted it. Then look in Actions for event `repository_dispatch`; if none, `event_type` is not exactly `sanity-publish` |
| 401 | token typo, expired, or the header is not `Authorization` = `Bearer <token>` (name and value are separate fields) |
| 403 | missing `User-Agent` header (GitHub rejects requests without one), or the token lacks **Contents: write** |
| 404 | the token was not given access to *this* repository (GitHub answers 404 instead of 403), or a typo in the URL |
| 422 | the body is wrong: the projection was not applied, so there is no `event_type` |

**Test the token and repo without Sanity** (type the token locally; never paste it anywhere else). In PowerShell:

```powershell
$s = Read-Host "Paste the token" -AsSecureString
$t = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/remcovolkers/basblokland.com/dispatches" `
  -Headers @{ Authorization = "Bearer $t"; Accept = "application/vnd.github+json"; "User-Agent" = "manual-test" } `
  -ContentType "application/json" -Body '{"event_type":"sanity-publish"}'
```

No output = HTTP 204 = GitHub accepted it, and a run with event `repository_dispatch` should appear in Actions
within seconds. An error shows the status code from the table above. If this works, the token and repo are fine
and the problem is in the Sanity webhook settings.

### 4. Switch the site to the real content
Only after step 1 of "How placeholders disappear" (otherwise the live site is nearly empty):

GitHub -> Settings -> Secrets and variables -> Actions -> **Variables** -> New repository variable:
`SANITY_PROJECT_ID` = `p9agaeq5`. Then Actions -> **Run workflow**. The page source then
says `<meta name="content-source" content="sanity">` and the placeholder works are gone.

### 5. Check
`npm run content:status`, then open the live site and compare with the Studio: footer e-mail, `/contact`,
`/about`, one work with photos and audio, the carousel.

## Later (with Bas)
Domain, DNS and the move to Cloudflare Pages: [domain-move.md](domain-move.md). Remember the MX warning there.
