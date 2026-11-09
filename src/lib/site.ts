import { stripBase } from './url';

/** Prototype mode (GitHub Pages). Production has this unset, so none of it ships. */
export const isPrototype = import.meta.env.PUBLIC_PROTOTYPE === 'true';

export const wordmark = 'bas den exter blokland';

export const siteDescription =
  'archive and portfolio of bas den exter blokland: sculpture, installation, sound, material research and handmade jewelry.';

/** Section numbers as used in the designs ("01 / art", "[01.03]"). */
export const sections = {
  art: { no: '01', label: 'art', href: '/art/' },
  jewelry: { no: '02', label: 'jewelry', href: '/jewelry/' },
  lab: { no: '03', label: 'lab', href: '/lab/' },
} as const;

export interface NavItem {
  label: string;
  /** Path relative to the base, always passed through url(). */
  href: string;
}

export const navItems: readonly NavItem[] = [
  { label: 'art', href: '/art/' },
  { label: 'jewelry', href: '/jewelry/' },
  { label: 'lab', href: '/lab/' },
  { label: 'about', href: '/about/' },
  { label: 'contact', href: '/contact/' },
];

/** Section is active for its index and every child route (/art/ and /art/some-work/). */
export function isActive(item: NavItem, pathname: string): boolean {
  const current = stripBase(pathname);
  return current === item.href || current.startsWith(item.href);
}
