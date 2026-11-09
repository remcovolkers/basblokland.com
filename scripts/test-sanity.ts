// Unit tests for the Sanity mapping layer: `npm run test:sanity` (Node runs the .ts directly).
// No network, no Sanity project: the mappers and the image pipeline are pure functions.
import assert from 'node:assert/strict';
import { createImageUrlBuilder } from '@sanity/image-url';
import { WIDTHS, mapImage, type RawImage } from '../src/lib/sanity/images.ts';
import { mapAbout, mapLabEntry, mapSiteSettings, mapWork, type RawWork } from '../src/lib/sanity/map.ts';

const builder = createImageUrlBuilder({ projectId: 'test1234', dataset: 'production' });
const HASH = 'a'.repeat(40);
const asset = (w: number, h: number, lqip?: string) => ({
  _id: `image-${HASH}-${w}x${h}-jpg`,
  metadata: { ...(lqip ? { lqip } : {}), dimensions: { width: w, height: h } },
});
const img = (over: Partial<RawImage> = {}): RawImage => ({ alt: 'a black steel sculpture', asset: asset(2000, 1500), ...over });

let passed = 0;
const test = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}\n       ${(error as Error).message}`);
    process.exitCode = 1;
  }
};

console.log('image pipeline');
test('builds a WebP + JPEG srcset on the project CDN path', () => {
  const r = mapImage(img(), 'x', builder)!;
  assert.ok(r.src.startsWith('https://cdn.sanity.io/images/test1234/production/'), r.src);
  assert.match(r.src, /[?&]fm=jpg/);
  assert.equal(r.sources?.length, 1);
  assert.equal(r.sources?.[0]?.type, 'image/webp');
  assert.match(r.sources?.[0]?.srcset ?? '', /fm=webp/);
  assert.match(r.srcset ?? '', /320w/);
});
test('never upscales: only widths below the image width, plus the full width', () => {
  const r = mapImage(img({ asset: asset(700, 500) }), 'x', builder)!;
  const widths = [...(r.srcset ?? '').matchAll(/ (\d+)w/g)].map((m) => Number(m[1]));
  assert.deepEqual(widths, [320, 480, 640, 700]);
  assert.ok(widths.every((w) => w <= 700));
});
test('a small image gets a single entry', () => {
  const r = mapImage(img({ asset: asset(300, 200) }), 'x', builder)!;
  assert.deepEqual([...(r.srcset ?? '').matchAll(/ (\d+)w/g)].map((m) => Number(m[1])), [300]);
});
test('width/height describe the CROPPED image, not the original', () => {
  const r = mapImage(img({ crop: { left: 0.1, right: 0.1, top: 0, bottom: 0.2 } }), 'x', builder)!;
  assert.equal(r.width, 1600);
  assert.equal(r.height, 1200);
  assert.match(r.src, /rect=/, 'the crop must reach the CDN URL');
});
test('keeps lqip, caption and the focal point', () => {
  const r = mapImage(img({ caption: ' detail ', hotspot: { x: 0.25, y: 0.75 }, asset: asset(2000, 1500, 'data:image/jpeg;base64,AAAA') }), 'x', builder)!;
  assert.equal(r.lqip, 'data:image/jpeg;base64,AAAA');
  assert.equal(r.caption, 'detail');
  assert.deepEqual(r.focal, { x: 0.25, y: 0.75 });
});
test('no asset -> undefined; image without alt text -> throws (build fails)', () => {
  assert.equal(mapImage({ alt: 'x' }, 'x', builder), undefined);
  assert.equal(mapImage(null, 'x', builder), undefined);
  assert.throws(() => mapImage(img({ alt: '  ' }), 'work w1 cover', builder), /no alt text/);
  assert.throws(() => mapImage({ alt: 'x', asset: { _id: 'image-b-1x1-jpg' } }, 'w', builder), /no dimensions/);
});
test('widths list is sane', () => {
  assert.ok(WIDTHS.every((w, i) => i === 0 || w > WIDTHS[i - 1]!));
});

console.log('works');
const baseWork = (over: Partial<RawWork> = {}): RawWork => ({
  _id: 'w1',
  section: 'art',
  title: ' unincessant ',
  slug: 'unincessant',
  cover: img(),
  ...over,
});
test('maps an art work and trims text; GROQ nulls are ignored', () => {
  const w = mapWork(baseWork({ year: 2026, medium: null, dimensions: ' 10 x 10 ', shortText: '', gallery: [img(), null, { alt: 'x' }] }), builder);
  assert.equal(w.title, 'unincessant');
  assert.equal(w.year, 2026);
  assert.equal('medium' in w, false);
  assert.equal(w.dimensions, '10 x 10');
  assert.equal(w.gallery.length, 1, 'null and asset-less gallery entries are dropped');
  assert.equal(w.details.length, 0);
});
test('jewelry needs a status; art ignores a stale one', () => {
  assert.throws(() => mapWork(baseWork({ section: 'jewelry' }), builder), /Beschikbaarheid/);
  assert.equal(mapWork(baseWork({ section: 'jewelry', status: 'sold' }), builder).status, 'sold');
  assert.equal('status' in mapWork(baseWork({ status: 'sold' }), builder), false);
});
test('rejects incomplete or unknown content with the document id', () => {
  assert.throws(() => mapWork(baseWork({ cover: null }), builder), /w1.*cover photo/);
  assert.throws(() => mapWork(baseWork({ title: '' }), builder), /w1.*Titel/);
  assert.throws(() => mapWork(baseWork({ section: 'painting' }), builder), /unknown section/);
  assert.throws(() => mapWork(baseWork({ section: 'jewelry', status: 'lost' }), builder), /unknown status/);
});
test('details: rows without both label and value are dropped', () => {
  const w = mapWork(baseWork({ details: [{ label: 'edition', value: 'unique' }, { label: 'x', value: '' }, { label: null, value: 'y' }] }), builder);
  assert.deepEqual(w.details, [{ label: 'edition', value: 'unique' }]);
});
test('audio: file, embed, file-without-upload, embed-without-link', () => {
  assert.deepEqual(mapWork(baseWork({ audio: { source: 'file', fileUrl: 'https://cdn.sanity.io/files/a/b/x.mp3', title: 'rec' } }), builder).audio, {
    source: 'file',
    url: 'https://cdn.sanity.io/files/a/b/x.mp3',
    title: 'rec',
  });
  assert.equal(mapWork(baseWork({ audio: { source: 'embed', embedUrl: 'https://artist.bandcamp.com/track/x' } }), builder).audio?.source, 'embed');
  assert.equal(mapWork(baseWork({ audio: { source: 'file', fileUrl: null } }), builder).audio, undefined);
  assert.throws(() => mapWork(baseWork({ audio: { source: 'embed', embedUrl: '' } }), builder), /link is required/);
});

console.log('lab, about, settings');
test('lab entry maps and rejects unknown types', () => {
  const e = mapLabEntry({ _id: 'l1', type: 'sound-sketch', date: '2026-01-29', title: 'hydrophone', images: [img()] }, builder);
  assert.equal(e.type, 'sound-sketch');
  assert.equal(e.images.length, 1);
  assert.throws(() => mapLabEntry({ _id: 'l2', type: 'poem', date: '2026-01-01', title: 'x' }, builder), /unknown type/);
});
test('about: blank line = new paragraph, empty CV groups/items dropped', () => {
  const a = mapAbout(
    {
      bio: 'First paragraph\nstill the first.\n\n\nSecond paragraph.\n   \nThird.',
      exhibitions: [{ year: '2025', title: 'a show', detail: 'a place' }, { title: '' }],
      residencies: [{ title: '   ' }],
      publications: [{ title: 'a book' }, { year: '2024', title: 'an essay' }],
    },
    builder,
  )!;
  assert.deepEqual(a.bio, ['First paragraph still the first.', 'Second paragraph.', 'Third.']);
  // fixed order, English titles; the residencies list has no usable line, so it is left out
  assert.deepEqual(a.cvGroups.map((g) => g.title), ['exhibitions', 'publications']);
  assert.deepEqual(a.cvGroups[0]?.items, [{ year: '2025', title: 'a show', detail: 'a place' }]);
  assert.deepEqual(a.cvGroups[1]?.items, [{ title: 'a book' }, { year: '2024', title: 'an essay' }]);
  assert.equal(mapAbout(null, builder), undefined);
});
test('settings: instagram is normalised to a bare handle', () => {
  assert.equal(mapSiteSettings({ instagram: '@some.name' }).instagram, 'some.name');
  assert.equal(mapSiteSettings({ instagram: 'https://www.instagram.com/some.name/?hl=nl' }).instagram, 'some.name');
  assert.deepEqual(mapSiteSettings(null), {});
  assert.equal('email' in mapSiteSettings({ email: ' ' }), false);
});

console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ''}`);
