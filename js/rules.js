'use strict';
/* ===================== rules ===================== */
// Tile: {id, type, x, y, layer, stack:null|'L'|'R', stackIndex}. x,y in half-tile units; a tile is 2x2 units.
const rules = {
  overlaps(a, b) { return Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2; },
  isFree(tile, board) {
    if (tile.stack) return !board.some(t => t.stack === tile.stack && t.stackIndex > tile.stackIndex);
    return !board.some(t => !t.stack && t.layer > tile.layer && rules.overlaps(t, tile));
  },
  insertIntoBar(bar, tile) {
    let at = -1;
    bar.forEach((t, i) => { if (t.type === tile.type) at = i; });
    const out = bar.slice();
    if (at === -1) out.push(tile); else out.splice(at + 1, 0, tile);
    return out;
  },
  resolveMatches(bar) {
    const count = {};
    for (const t of bar) count[t.type] = (count[t.type] || 0) + 1;
    const hit = bar.find(t => count[t.type] >= 3);
    if (!hit) return { bar, removed: [] };
    const removed = bar.filter(t => t.type === hit.type).slice(0, 3);
    return { bar: bar.filter(t => !removed.includes(t)), removed };
  },
  isLost(bar) { return bar.length >= 7; },
};

/* ===================== generator ===================== */
const generator = (() => {
  const BOARD_W = 18, BOARD_H = 14; // units (9 x 7 tiles)
  const MAX_LAYER = 10; // normal towers; super-towers go past this on purpose
  // Level 2 difficulty: super-towers added on top of the normal 201-tile pile, and the prize chance on a win.
  const DIFFICULTIES = {
    light: { name: 'Light', towers: 0, extra: 0, chance: 0.10 },
    medium: { name: 'Medium', towers: 3, extra: 25, chance: 0.67 },
    brutal: { name: 'Brutal', towers: 4, extra: 30, chance: 1 },
  };
  const LEVELS = {
    1: { types: [0, 10, 4], total: 18, base: 15, offsetShare: 0, stackSize: 0 },
    2: { types: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], total: 201, offsetShare: 0.2, stackSize: 15 },
  };
  const DEBUG_LEVEL2 = { types: [2, 3, 5, 0], total: 12, offsetShare: 0, stackSize: 0 };
  // Footprints: 9 x 7 whole-tile cells, 'X' = tiles allowed. Empty cells stay empty (gaps).
  const SHAPES1 = [
    ['.........', '.........', '..XXXXX..', '..XXXXX..', '..XXXXX..', '.........', '.........'],
    ['.........', '.........', '.XXX.XXX.', '..XX.XX..', '.XXX.XXX.', '.........', '.........'],
  ];
  const SHAPES2 = [
    ['XXXX.XXXX', 'XXX...XXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXX...XXX', 'XXXX.XXXX', 'XX.....XX'], // towers + bridge
    ['XXX...XXX', 'XXXX.XXXX', '.XXXXXXX.', '..XXXXX..', '.XXXXXXX.', 'XXXX.XXXX', 'XXX...XXX'], // X
    ['XXXXXXXXX', 'XXX...XXX', 'XX.XXX.XX', 'XX.XXX.XX', 'XX.XXX.XX', 'XXX...XXX', 'XXXXXXXXX'], // ring
    ['XXXX.XXXX', 'XXXX.XXXX', 'XXX...XXX', '..XXXXX..', 'XXX...XXX', 'XXXX.XXXX', 'XXXX.XXXX'], // four blocks
    ['XX.XXX.XX', 'XXXXXXXXX', 'XX.XXX.XX', 'XX.XXX.XX', 'XX.XXX.XX', 'XXXXXXXXX', 'XX.XXX.XX'], // pillars
  ];
  const DEBUG_SHAPE = ['.........', '.........', '..XX.XX..', '..XX.XX..', '.........', '.........', '.........'];

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  // Pool of type indices 0..numTypes-1, each a multiple of 3, spread evenly.
  function typePool(total, numTypes, rng) {
    const pool = [];
    const order = shuffle([...Array(numTypes).keys()], rng);
    for (let k = 0; k < total / 3; k++) { const ty = order[k % numTypes]; pool.push(ty, ty, ty); }
    return shuffle(pool, rng);
  }
  const parse = rows => {
    const cells = [];
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') cells.push({ x: i * 2, y: j * 2 }); }));
    return cells;
  };
  const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];
  // Remove `pairs` random mirrored pairs of cells so no two runs look identical.
  function knockOut(cells, pairs, rng) {
    let out = cells;
    for (let k = 0; k < pairs; k++) {
      const left = out.filter(c => c.x < (BOARD_W - 2) / 2);
      if (!left.length) break;
      const c = pickOne(left, rng);
      out = out.filter(d => !(d.y === c.y && (d.x === c.x || d.x === BOARD_W - 2 - c.x)));
    }
    return out;
  }
  // Build a pile: one tile on every footprint cell, then pile the rest on top. Most extra tiles stack
  // exactly on a cell (hiding the tile below); `offsetShare` of them sit half a tile over 4 cells.
  // A new tile's layer is 1 + the highest tile it overlaps, so same-layer tiles never overlap.
  function buildPile(cells, total, offsetShare, rng) {
    const tiles = cells.map(c => ({ x: c.x, y: c.y, layer: 0 }));
    const inMask = new Set(cells.map(c => c.x + ',' + c.y));
    const offsets = [];
    for (let y = 1; y + 2 <= BOARD_H; y += 2) for (let x = 1; x + 2 <= BOARD_W; x += 2) {
      if ([[-1, -1], [1, -1], [-1, 1], [1, 1]].every(([dx, dy]) => inMask.has((x + dx) + ',' + (y + dy)))) offsets.push({ x, y });
    }
    const weights = cells.map(() => 0.3 + rng() * 1.7);
    const wsum = weights.reduce((a, b) => a + b, 0);
    const pickCell = () => { let r = rng() * wsum; for (let i = 0; i < cells.length; i++) { r -= weights[i]; if (r <= 0) return cells[i]; } return cells[cells.length - 1]; };
    for (let guard = 0; tiles.length < total && guard < 50000; guard++) {
      const p = offsets.length && rng() < offsetShare ? pickOne(offsets, rng) : pickCell();
      let layer = 0;
      for (const t of tiles) if (rules.overlaps(t, p) && t.layer + 1 > layer) layer = t.layer + 1;
      if (layer > MAX_LAYER) continue;
      tiles.push({ x: p.x, y: p.y, layer });
    }
    if (tiles.length !== total) throw new Error('pile does not fit: ' + tiles.length + '/' + total);
    return tiles;
  }
  // Super-towers: extra tiles stacked straight down on a few footprint spots (one centre spot,
  // the rest in mirrored pairs). Each new tile goes on top of whatever is there, so layers stay valid.
  function addSuperTowers(pile, cells, count, extra, rng) {
    if (!count) return pile;
    const mid = (BOARD_W - 2) / 2;
    const centre = shuffle(cells.filter(c => c.x === mid), rng);
    const left = shuffle(cells.filter(c => c.x < mid), rng);
    const spots = [];
    if (count % 2 && centre.length) spots.push(centre[0]);
    for (const c of left) {
      if (spots.length + 2 > count) break;
      const m = cells.find(d => d.y === c.y && d.x === BOARD_W - 2 - c.x);
      if (m) spots.push(c, m);
    }
    for (const c of shuffle(cells.slice(), rng)) { if (spots.length >= count) break; if (!spots.includes(c)) spots.push(c); }
    for (const s of spots) for (let i = 0; i < extra; i++) {
      let layer = 0;
      for (const t of pile) if (rules.overlaps(t, s) && t.layer + 1 > layer) layer = t.layer + 1;
      pile.push({ x: s.x, y: s.y, layer });
    }
    return pile;
  }
  function makeLevel(levelNum, rng = Math.random, debug = false, difficulty = 'light') {
    const cfg = levelNum === 2 && debug ? DEBUG_LEVEL2 : LEVELS[levelNum];
    let pile = null, cells;
    for (let attempt = 0; !pile; attempt++) {
      if (levelNum === 1) cells = shuffle(parse(pickOne(SHAPES1, rng)), rng).slice(0, cfg.base);
      else if (debug) cells = parse(DEBUG_SHAPE);
      else cells = knockOut(parse(pickOne(SHAPES2, rng)), attempt < 5 ? Math.floor(rng() * 3) : 0, rng);
      try { pile = buildPile(cells, cfg.total, attempt < 10 ? cfg.offsetShare : 0, rng); }
      catch (e) { if (attempt >= 20) throw e; }
    }
    if (levelNum === 2 && !debug) {
      const d = DIFFICULTIES[difficulty] || DIFFICULTIES.light;
      addSuperTowers(pile, cells, d.towers, d.extra, rng);
    }
    const tiles = pile.map(t => ({ ...t, stack: null, stackIndex: 0 }));
    for (const side of ['L', 'R']) for (let i = 0; i < cfg.stackSize; i++) {
      tiles.push({ x: 0, y: 0, layer: 0, stack: side, stackIndex: i });
    }
    const pool = typePool(tiles.length, cfg.types.length, rng);
    tiles.forEach((t, i) => { t.id = levelNum * 1000 + i + 1; t.type = cfg.types[pool[i]]; });
    if (levelNum === 2 && !debug) seedStarterGroups(tiles, 3, rng);
    return tiles;
  }
  // Make `n` groups of 3 nearby free tiles share a type, so Level 2 opens with a few easy matches.
  // Only swaps types between tiles, so every type count stays a multiple of 3.
  function seedStarterGroups(tiles, n, rng) {
    const free = tiles.filter(t => !t.stack && rules.isFree(t, tiles));
    const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    const locked = new Set(), usedTypes = new Set();
    for (let g = 0; g < n; g++) {
      const avail = shuffle(free.filter(t => !locked.has(t)), rng);
      let group = null;
      for (const s of avail) {
        const [a, b] = avail.filter(t => t !== s).sort((p, q) => dist(s, p) - dist(s, q));
        if (a && b && dist(s, a) <= 6 && dist(s, b) <= 6 && dist(a, b) <= 6) { group = [s, a, b]; break; }
      }
      if (!group) break;
      const ty = (group.map(t => t.type).find(x => !usedTypes.has(x)) ?? [...new Set(tiles.map(t => t.type))].find(x => !usedTypes.has(x)));
      for (const m of group) {
        if (m.type === ty) continue;
        const donor = tiles.find(d => d.type === ty && !group.includes(d) && !locked.has(d));
        [donor.type, m.type] = [m.type, donor.type];
      }
      group.forEach(t => locked.add(t));
      usedTypes.add(ty);
    }
  }
  return { BOARD_W, BOARD_H, MAX_LAYER, LEVELS, DIFFICULTIES, typePool, makeLevel, shuffle };
})();
