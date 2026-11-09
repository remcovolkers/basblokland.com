import { about } from './about';
import { audio } from './audio';
import { labEntry } from './labEntry';
import { photo } from './photo';
import { siteSettings } from './siteSettings';
import { work } from './work';

export const schemaTypes = [work, labEntry, siteSettings, about, photo, audio];

/** Documents of which there is exactly one: no "new", no duplicate, no delete. */
export const SINGLETON_TYPES = ['siteSettings', 'about'] as const;
