import { loadGenres, flattenGenres } from './genres-data.js';

/**
 * Build the static paths for genre pages in a given locale.
 *
 * The English and Spanish datasets share the same slugs, so both routes expose
 * the same URLs under their language prefix. Every prop is resolved from the
 * dataset of that language (names, descriptions, artists, breadcrumbs).
 */
export function buildGenrePaths(lang = 'en') {
  const allGenres = flattenGenres(loadGenres(lang), lang);
  const byPath = new Map(allGenres.map(g => [g.fullSlugPath, g]));

  // Some styles live in more than one branch of the tree (e.g. Acid House under
  // Chicago House and under Acid Techno). Detect them so the heading and title
  // can carry the parent name instead of publishing duplicate metadata.
  const byName = new Map();
  const byParent = new Map();
  for (const g of allGenres) {
    const key = g.genreName.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(g);

    const parentKey = g.fullSlugPath.split('/').slice(0, -1).join('/');
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey).push(g);
  }

  // Artist name -> genre paths. Used to build "styles that share key artists".
  const artistIndex = new Map();
  for (const g of allGenres) {
    for (const artist of g.keyArtists || []) {
      const key = (artist.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!artistIndex.has(key)) artistIndex.set(key, []);
      artistIndex.get(key).push(g.fullSlugPath);
    }
  }

  return allGenres.map(g => {
    const parent = g.breadcrumbs[g.breadcrumbs.length - 1] || null;
    const sameName = byName.get(g.genreName.trim().toLowerCase()) || [];
    const parentKey = g.fullSlugPath.split('/').slice(0, -1).join('/');
    const siblings = (byParent.get(parentKey) || [])
      .filter(s => s.fullSlugPath !== g.fullSlugPath)
      .map(s => ({ name: s.genreName, fullSlugPath: s.fullSlugPath }))
      .slice(0, 12);
    const isAmbiguous = sameName.length > 1;
    const alternate = isAmbiguous
      ? sameName.find(o => o.fullSlugPath !== g.fullSlugPath) || null
      : null;

    // Styles that share key artists with this one, excluding the links already
    // rendered elsewhere on the page (parent, children, siblings).
    const relatedCounts = new Map();
    for (const artist of g.keyArtists || []) {
      const key = (artist.name || '').trim().toLowerCase();
      if (!key) continue;
      for (const path of artistIndex.get(key) || []) {
        if (path === g.fullSlugPath) continue;
        relatedCounts.set(path, (relatedCounts.get(path) || 0) + 1);
      }
    }
    const excluded = new Set([
      g.fullSlugPath,
      parentKey,
      ...g.children.map(child => child.fullSlugPath),
      ...siblings.map(sibling => sibling.fullSlugPath),
    ]);
    const related = [...relatedCounts.entries()]
      .filter(([path]) => !excluded.has(path) && byPath.has(path))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([path, shared]) => ({
        name: byPath.get(path).genreName,
        fullSlugPath: path,
        shared,
      }));

    const descendantCount = allGenres.filter(other =>
      other.fullSlugPath.startsWith(`${g.fullSlugPath}/`)
    ).length;

    return {
      params: { slug: g.fullSlugPath },
      props: {
        genreName: g.genreName,
        fullSlugPath: g.fullSlugPath,
        description: g.description,
        wikipediaUrl: g.wikipediaUrl,
        spotifyTrackId: g.spotifyTrackId,
        exampleTrack: g.exampleTrack,
        keyArtists: g.keyArtists,
        children: g.children,
        breadcrumbs: g.breadcrumbs,
        isAmbiguous,
        contextLabel: parent ? parent.name : '',
        siblings,
        related,
        descendantCount,
        alternate: alternate
          ? {
              path: alternate.fullSlugPath,
              contextLabel: alternate.breadcrumbs.length
                ? alternate.breadcrumbs[alternate.breadcrumbs.length - 1].name
                : '',
            }
          : null,
      },
    };
  });
}
