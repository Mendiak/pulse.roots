function countNodes(node) {
  let count = 1;
  if (node.substyles) for (const child of node.substyles) count += countNodes(child);
  return count;
}

function countDescendants(node) {
  if (!node.substyles || node.substyles.length === 0) return 0;
  let count = node.substyles.length;
  for (const child of node.substyles) count += countDescendants(child);
  return count;
}

function computeStats(data) {
  const families = data;
  const totalGenres = families.reduce((sum, f) => sum + countNodes(f), 0);

  let largest = { name: '', count: 0 };
  for (const f of families) {
    const c = countDescendants(f);
    if (c > largest.count) largest = { name: f.style || f.name, count: c };
  }

  let maxDepth = 0;
  function walk(node, depth) {
    if (depth > maxDepth) maxDepth = depth;
    if (node.substyles) for (const c of node.substyles) walk(c, depth + 1);
  }
  for (const f of families) walk(f, 1);

  let artists = 0;
  function scan(node) {
    if (node.key_artists) artists += node.key_artists.length;
    if (node.substyles) for (const c of node.substyles) scan(c);
  }
  for (const f of families) scan(f);

  return { totalGenres, totalFamilies: families.length, largest, maxDepth, artists };
}

export function renderStats(data) {
  const s = computeStats(data);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-total-genres', s.totalGenres);
  set('stat-families', s.totalFamilies);
  set('stat-largest-family', `${s.largest.name} (${s.largest.count})`);
  set('stat-deepest', s.maxDepth);
  set('stat-artists', s.artists);
}
