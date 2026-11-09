import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import type { StructureBuilder, StructureResolver } from 'sanity/structure';

/**
 * The Studio's left-hand menu mirrors the website's sections:
 *   Kunst · Sieraden · Lab · ─── · Over · Instellingen
 * "Kunst" and "Sieraden" are drag-and-drop lists: the order Bas sets there is the order on the site.
 */
const sectionList = (S: StructureBuilder, context: Parameters<StructureResolver>[1], section: 'art' | 'jewelry') => {
  const isArt = section === 'art';
  return orderableDocumentListDeskItem({
    type: 'work',
    id: isArt ? 'orderable-art' : 'orderable-jewelry',
    title: isArt ? 'Kunst' : 'Sieraden',
    filter: '_type == "work" && section == $section',
    params: { section },
    // New works are created from the "+" menu item below, so the section is filled in for Bas.
    createIntent: false,
    menuItems: [
      S.menuItem()
        .title(isArt ? 'Nieuw kunstwerk' : 'Nieuw sieraad')
        .intent({ type: 'create', params: { type: 'work', template: isArt ? 'art-work' : 'jewelry-work' } })
        .showAsAction(true)
        .serialize(),
    ],
    S,
    context,
  });
};

export const structure: StructureResolver = (S, context) =>
  S.list()
    .id('root')
    .title('Inhoud')
    .items([
      sectionList(S, context, 'art'),
      sectionList(S, context, 'jewelry'),
      S.documentTypeListItem('labEntry')
        .title('Lab')
        .child(
          S.documentTypeList('labEntry')
            .title('Lab')
            .defaultOrdering([{ field: 'date', direction: 'desc' }]),
        ),
      S.divider(),
      S.listItem()
        .id('about')
        .title('Over')
        .child(S.document().schemaType('about').documentId('about').title('Over')),
      S.listItem()
        .id('siteSettings')
        .title('Instellingen')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Instellingen')),
    ]);
