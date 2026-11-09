/**
 * Loads all published content from Sanity with GROQ, once per build. The dataset is PUBLIC, so no
 * token is needed (and none is ever used here). Drafts are never returned (perspective "published").
 */
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { AboutPage, LabEntry, SiteSettings, Work } from '../types.ts';
import { mapAbout, mapLabEntry, mapSiteSettings, mapWork, type RawAbout, type RawLabEntry, type RawSiteSettings, type RawWork } from './map.ts';

export interface LoadedContent {
  works: Work[];
  lab: LabEntry[];
  about: AboutPage | undefined;
  settings: SiteSettings;
}

// An image with everything the pipeline needs: alt, caption, crop, hotspot and asset metadata.
const IMAGE = `{
  alt, caption, hotspot, crop,
  asset->{ _id, metadata { lqip, dimensions { width, height } } }
}`;
const AUDIO = `{ source, title, embedUrl, "fileUrl": file.asset->url }`;

const WORKS = `*[_type == "work" && defined(slug.current) && defined(section)] | order(orderRank asc, _createdAt asc) {
  _id, section, title, "slug": slug.current, year, medium, dimensions, shortText, status,
  details[]{ label, value },
  cover ${IMAGE},
  gallery[] ${IMAGE},
  audio ${AUDIO}
}`;
const LAB = `*[_type == "labEntry"] | order(date desc) {
  _id, type, date, title, note,
  images[] ${IMAGE},
  audio ${AUDIO}
}`;
const ABOUT = `*[_id == "about"][0] {
  bio,
  portrait ${IMAGE},
  cvGroups[]{ title, items[]{ year, title, detail } }
}`;
const SETTINGS = `*[_id == "siteSettings"][0] { homeStatement, email, instagram, statusLine, colophon }`;

export async function loadFromSanity(config: { projectId: string; dataset: string; apiHost?: string | undefined }): Promise<LoadedContent> {
  const { apiHost, ...project } = config;
  const client = createClient({
    ...project,
    ...(apiHost ? { apiHost, useProjectHostname: false } : {}),
    apiVersion: '2025-01-01',
    // Fresh data, not the edge cache: a publish webhook rebuilds right after the edit, and the CDN
    // could still hold the previous version for a moment.
    useCdn: false,
    perspective: 'published',
  });
  const builder = createImageUrlBuilder(project);

  const [works, lab, about, settings] = await Promise.all([
    client.fetch<RawWork[]>(WORKS),
    client.fetch<RawLabEntry[]>(LAB),
    client.fetch<RawAbout | null>(ABOUT),
    client.fetch<RawSiteSettings | null>(SETTINGS),
  ]);

  return {
    works: works.map((w) => mapWork(w, builder)),
    lab: lab.map((e) => mapLabEntry(e, builder)),
    about: mapAbout(about, builder),
    settings: mapSiteSettings(settings),
  };
}
