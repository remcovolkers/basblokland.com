// Content readiness report: `npm run content:status` (optionally `-- <projectId> [dataset]`).
// Reads the PUBLISHED content of the Sanity project (public dataset, no token) and says what is
// still missing before the site shows nothing but real content.
// Exit code: 0 = ready, 1 = something important is missing, 2 = could not read the project.
//
// It never calls process.exit() and never throws after the request: exiting while the HTTP
// connection is still closing crashes Node on Windows (UV_HANDLE_CLOSING). The code is set and
// the process ends by itself.
import { existsSync, readFileSync } from 'node:fs';

/** Non-secret values from studio/.env, as a fallback for the project id. */
function fromStudioEnv(name) {
  if (!existsSync('studio/.env')) return undefined;
  return readFileSync('studio/.env', 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();
}

const QUERY = `{
  "works": *[_type == "work" && !(_id in path("drafts.**"))] | order(_createdAt asc) {
    title, section, status,
    "cover": defined(cover.asset), "coverAlt": defined(cover.alt) && cover.alt != "",
    "galleryMissingAlt": count(gallery[defined(asset) && (!defined(alt) || alt == "")])
  },
  "lab": count(*[_type == "labEntry" && !(_id in path("drafts.**"))]),
  "about": *[_id == "about"][0]{ "bio": length(bio) > 0, "portrait": defined(portrait.asset),
    "cvLines": count(exhibitions) + count(residencies) + count(publications) },
  "settings": *[_id == "siteSettings"][0]{ "email": defined(email) && email != "",
    "instagram": defined(instagram) && instagram != "", "statement": defined(homeStatement) && homeStatement != "" },
  "drafts": count(*[_id in path("drafts.**")])
}`;

/** Prints the report and returns the exit code. */
function report(r, projectId, dataset) {
  let blocking = 0;
  const line = (ok, label, note = '', blocks = true) => {
    if (!ok && blocks) blocking++;
    console.log(`  ${ok ? 'ok     ' : blocks ? 'MISSING' : 'todo   '}  ${label}${note ? '  - ' + note : ''}`);
  };

  console.log(`\nContent status for ${projectId} / ${dataset} (published documents only)\n`);

  console.log('Instellingen');
  line(Boolean(r.settings), 'document exists', 'open Instellingen in the Studio and publish');
  line(r.settings?.email, 'e-mail', 'shown in the footer and on /contact');
  line(r.settings?.instagram, 'instagram', 'optional', false);
  line(r.settings?.statement, 'home statement', 'without it the home page shows the name instead', false);

  console.log('\nOver');
  line(Boolean(r.about), 'document exists');
  line(r.about?.bio, 'biography');
  line(r.about?.portrait, 'portrait', 'optional', false);
  line((r.about?.cvLines ?? 0) > 0, 'at least one CV line', 'optional', false);

  const art = r.works.filter((w) => w.section === 'art');
  const jewelry = r.works.filter((w) => w.section === 'jewelry');
  console.log(`\nWorks: ${art.length} art, ${jewelry.length} jewelry (review the titles: test content must go)`);
  line(r.works.length > 0, 'at least one work');
  for (const w of r.works) {
    const problems = [
      !w.cover && 'no cover photo',
      w.cover && !w.coverAlt && 'cover has no description',
      w.galleryMissingAlt > 0 && `${w.galleryMissingAlt} gallery photo(s) without description`,
      w.section === 'jewelry' && !w.status && 'no availability',
    ].filter(Boolean);
    console.log(`  ${problems.length ? 'FIX    ' : 'ok     '}  [${w.section}] ${w.title}${problems.length ? '  - ' + problems.join(', ') : ''}`);
    if (problems.length) blocking++;
  }

  console.log(`\nLab: ${r.lab} entr${r.lab === 1 ? 'y' : 'ies'} (optional)`);
  if (r.drafts > 0) console.log(`\nNote: ${r.drafts} draft(s) exist that are NOT published, so they are not on the site.`);

  console.log(blocking === 0 ? '\nREADY: nothing important is missing.\n' : `\nNOT READY: ${blocking} thing(s) to fix.\n`);
  return blocking === 0 ? 0 : 1;
}

async function main() {
  const projectId = process.argv[2] ?? process.env.SANITY_PROJECT_ID ?? fromStudioEnv('SANITY_STUDIO_PROJECT_ID');
  const dataset = process.argv[3] ?? process.env.SANITY_DATASET ?? fromStudioEnv('SANITY_STUDIO_DATASET') ?? 'production';
  if (!projectId) {
    console.error('No project id. Use: npm run content:status -- <projectId>');
    return 2;
  }
  let res;
  try {
    res = await fetch(`https://${projectId}.api.sanity.io/v2025-01-01/data/query/${dataset}?query=${encodeURIComponent(QUERY)}`);
  } catch (error) {
    console.error(`Could not reach Sanity: ${error.message}`);
    return 2;
  }
  if (!res.ok) {
    console.error(`Sanity answered HTTP ${res.status}. Is the dataset "${dataset}" public and the project id right?`);
    await res.body?.cancel();
    return 2;
  }
  const { result } = await res.json();
  return report(result, projectId, dataset);
}

process.exitCode = await main();
