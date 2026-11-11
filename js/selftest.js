'use strict';
/* ===================== selftest ===================== */
const selftest = (() => {
  const tests = [];
  const test = (name, fn) => tests.push({ name, fn });
  const eq = (a, b, msg) => {
    const ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja !== jb) throw new Error((msg ? msg + ': ' : '') + 'expected ' + jb + ' got ' + ja);
  };
  const ok = (v, msg) => { if (!v) throw new Error(msg || 'expected truthy'); };
  const run = () => {
    let passed = 0; const failures = [];
    for (const t of tests) {
      try { t.fn(); passed++; } catch (e) { failures.push(t.name + ' -> ' + e.message); }
    }
    window.__selftest = { passed, failed: failures.length, failures };
    console.log('[selftest] ' + passed + '/' + tests.length + ' passed');
    failures.forEach(f => console.error('[selftest] FAIL ' + f));
    return window.__selftest;
  };
  return { test, eq, ok, run };
})();

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

(() => {
  const { test, eq, ok } = selftest;
  const T = (id, type, x, y, layer, stack = null, stackIndex = 0) => ({ id, type, x, y, layer, stack, stackIndex });
  const types = bar => bar.map(t => t.type);

  // ---- Task 1: rules ----
  test('isFree: tile with higher overlapping tile is not free', () => {
    const A = T(1, 0, 0, 0, 0), B = T(2, 0, 1, 1, 1);
    eq(rules.isFree(A, [A, B]), false); eq(rules.isFree(B, [A, B]), true);
  });
  test('isFree: non-overlapping higher tile does not cover', () => {
    const A = T(1, 0, 0, 0, 0), B = T(2, 0, 2, 0, 1);
    eq(rules.isFree(A, [A, B]), true);
  });
  test('isFree: side stack only top is free', () => {
    const s = [0, 1, 2].map(i => T(10 + i, 0, 0, 0, 0, 'L', i));
    eq(s.map(t => rules.isFree(t, s)), [false, false, true]);
  });
  test('isFree: stack tiles and pile tiles do not cover each other', () => {
    const A = T(1, 0, 0, 0, 0), S = T(2, 0, 0, 0, 5, 'L', 0);
    eq(rules.isFree(A, [A, S]), true);
  });
  test('insertIntoBar groups same type', () => {
    eq(types(rules.insertIntoBar([T(1, 1, 0, 0, 0), T(2, 2, 0, 0, 0)], T(3, 1, 0, 0, 0))), [1, 1, 2]);
  });
  test('insertIntoBar appends new type at end', () => {
    eq(types(rules.insertIntoBar([T(1, 1, 0, 0, 0)], T(3, 5, 0, 0, 0))), [1, 5]);
  });
  test('resolveMatches removes triple', () => {
    const r = rules.resolveMatches([1, 1, 1, 2].map((ty, i) => T(i, ty, 0, 0, 0)));
    eq(types(r.bar), [2]); eq(r.removed.length, 3);
  });
  test('noLossWhenSeventhMatches', () => {
    let bar = [1, 1, 2, 3, 4, 5].map((ty, i) => T(i, ty, 0, 0, 0));
    bar = rules.insertIntoBar(bar, T(99, 1, 0, 0, 0));
    const r = rules.resolveMatches(bar);
    eq(r.bar.length, 4); eq(rules.isLost(r.bar), false);
  });
  test('isLost at 7', () => {
    eq(rules.isLost([0, 1, 2, 3, 4, 5, 6].map(ty => T(ty, ty, 0, 0, 0))), true);
    eq(rules.isLost([0, 1, 2, 3, 4, 5].map(ty => T(ty, ty, 0, 0, 0))), false);
  });

  // ---- Task 2: generator ----
  const countTypes = tiles => tiles.reduce((m, t) => (m[t.type] = (m[t.type] || 0) + 1, m), {});
  test('level1 is easy: 18 tiles, at least 12 free at start', () => {
    for (let s = 0; s < 20; s++) {
      const tiles = generator.makeLevel(1, mulberry32(300 + s), false);
      eq(tiles.length, 18);
      ok(tiles.filter(t => rules.isFree(t, tiles)).length >= 12, 'seed ' + s);
    }
  });
  test('level2 shapes have some gaps but not too many (8..22 of 63 cells empty)', () => {
    for (let s = 0; s < 20; s++) {
      const pile = generator.makeLevel(2, mulberry32(400 + s), false).filter(t => !t.stack);
      let empty = 0;
      for (let y = 0; y < 14; y += 2) for (let x = 0; x < 18; x += 2)
        if (!pile.some(t => rules.overlaps(t, { x, y }))) empty++;
      ok(empty >= 8 && empty <= 22, 'seed ' + s + ': ' + empty + ' empty cells');
    }
  });
  test('level2 hides many tiles directly under others, max layer capped', () => {
    for (let s = 0; s < 20; s++) {
      const pile = generator.makeLevel(2, mulberry32(500 + s), false).filter(t => !t.stack);
      const hidden = pile.filter(t => pile.some(o => o.x === t.x && o.y === t.y && o.layer > t.layer)).length;
      ok(hidden >= 60, 'seed ' + s + ' only ' + hidden + ' hidden');
      ok(pile.every(t => t.layer <= generator.MAX_LAYER), 'layer cap');
    }
  });
  test('level2 starts with >= 3 sets of three matching free tiles', () => {
    for (let s = 0; s < 50; s++) {
      const tiles = generator.makeLevel(2, mulberry32(600 + s), false);
      // a "group" = 3 free pile tiles of one type, all within 6 units of each other
      const free = tiles.filter(t => !t.stack && rules.isFree(t, tiles));
      const near = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 6;
      let groups = 0;
      for (const ty of new Set(free.map(t => t.type))) {
        const f = free.filter(t => t.type === ty);
        let found = false;
        for (let i = 0; i < f.length && !found; i++) for (let j = i + 1; j < f.length && !found; j++) for (let k = j + 1; k < f.length && !found; k++)
          if (near(f[i], f[j]) && near(f[i], f[k]) && near(f[j], f[k])) found = true;
        if (found) groups++;
      }
      ok(groups >= 3, 'seed ' + s + ' only ' + groups + ' grouped triples');
      ok(Object.values(countTypes(tiles)).every(n => n % 3 === 0), 'counts still %3');
    }
  });
  test('level1 has 3 types, each count %3==0', () => {
    const tiles = generator.makeLevel(1, mulberry32(1), false);
    const c = countTypes(tiles);
    eq(Object.keys(c).length, 3);
    ok(Object.values(c).every(n => n % 3 === 0), 'counts ' + JSON.stringify(c));
  });
  test('level2 total = 231 and each type count %3==0, 14 types', () => {
    const tiles = generator.makeLevel(2, mulberry32(2), false);
    eq(tiles.length, 231);
    const c = countTypes(tiles);
    eq(Object.keys(c).length, 14);
    ok(Object.values(c).every(n => n % 3 === 0), 'counts ' + JSON.stringify(c));
    eq(tiles.filter(t => t.stack === 'L').length, 15);
    eq(tiles.filter(t => t.stack === 'R').length, 15);
  });
  test('debug level2 is 12 tiles', () => {
    eq(generator.makeLevel(2, mulberry32(3), true).length, 12);
  });
  test('no two tiles on same layer overlap (20 seeds)', () => {
    for (let s = 0; s < 20; s++) {
      const pile = generator.makeLevel(2, mulberry32(100 + s), false).filter(t => !t.stack);
      for (let i = 0; i < pile.length; i++) for (let j = i + 1; j < pile.length; j++) {
        if (pile[i].layer === pile[j].layer && rules.overlaps(pile[i], pile[j]))
          throw new Error('overlap seed ' + s + ' ids ' + pile[i].id + ',' + pile[j].id);
      }
    }
  });
  test('every tile within board bounds', () => {
    const pile = generator.makeLevel(2, mulberry32(7), false).filter(t => !t.stack);
    ok(pile.every(t => t.x >= 0 && t.y >= 0 && t.x + 2 <= generator.BOARD_W && t.y + 2 <= generator.BOARD_H));
  });
  test('level 1 has at least one free tile', () => {
    const tiles = generator.makeLevel(1, mulberry32(9), false);
    ok(tiles.some(t => rules.isFree(t, tiles)));
  });
  test('typePool gives multiples of 3', () => {
    const p = generator.typePool(231, 14, mulberry32(4));
    eq(p.length, 231);
    ok(Object.values(countTypes(p.map(type => ({ type })))).every(n => n % 3 === 0));
  });

  // ---- Task 3: art ----
  test('14 snacks each return svg string containing viewBox', () => {
    eq(art.SNACKS.length, 14);
    ok(art.SNACKS.every(s => typeof s.name === 'string' && /viewBox/.test(s.svg())));
    eq(art.LEVEL1_TYPES.length, 3);
  });

  // ---- Task 4: game ----
  const fakeStorage = () => { const d = {}; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, d }; };
  const board1 = (base = 0) => [
    T(base + 1, 0, 0, 0, 0), T(base + 2, 0, 2, 0, 0), T(base + 3, 0, 4, 0, 0),
    T(base + 4, 1, 6, 0, 0), T(base + 5, 1, 8, 0, 0), T(base + 6, 1, 10, 0, 0),
    T(base + 7, 2, 0, 4, 0), T(base + 8, 2, 1, 5, 1), T(base + 9, 2, 6, 4, 0),
  ];
  const mk = (factory) => {
    const storage = fakeStorage();
    const g = createGame({ levelFactory: factory || (lvl => board1(lvl * 100)), storage, rng: mulberry32(5), now: () => 1000 });
    g.start();
    return { g, storage };
  };
  const id = (lvl, n) => lvl * 100 + n;

  test('click covered tile does nothing', () => {
    const { g } = mk(); eq(g.click(id(1, 7)).ok, false); eq(g.state.bar.length, 0);
  });
  test('click same tile twice inserts once', () => {
    const { g } = mk(); eq(g.click(id(1, 1)).ok, true); eq(g.click(id(1, 1)).ok, false); eq(g.state.bar.length, 1);
  });
  test('three clicks of same type empties bar', () => {
    const { g } = mk(); g.click(id(1, 1)); g.click(id(1, 2)); const r = g.click(id(1, 3));
    eq(r.matched, true); eq(r.removed.length, 3); eq(g.state.bar.length, 0);
    eq(r.barBefore.length, 3);
  });
  test('seventh non-matching tile -> screen lost, best saved', () => {
    const { g, storage } = mk(() => [0, 1, 2, 3, 4, 5, 6, 0, 1].map((ty, i) => T(i + 1, ty, i * 2, 0, 0)));
    let r; for (let i = 1; i <= 7; i++) r = g.click(i);
    eq(r.lost, true); eq(g.state.screen, 'lost');
    ok(storage.getItem('snackstack.best.light'), 'best saved');
    eq(g.click(8).ok, false);
  });
  test('clearing level 1 moves to level 2 keeping used helpers', () => {
    const { g } = mk();
    g.click(id(1, 4)); eq(g.popOut(), true); eq(g.state.hold.length, 1);
    g.click(id(1, 1)); g.click(id(1, 2)); g.click(id(1, 3));
    g.clickHold(id(1, 4)); g.click(id(1, 5)); g.click(id(1, 6));
    g.click(id(1, 8)); g.click(id(1, 7)); const r = g.click(id(1, 9));
    eq(r.levelCleared, true); eq(g.state.level, 2); eq(g.state.used.pop, true);
    eq(g.state.board.length, 9);
  });
  test('clearing level 2 -> won with time', () => {
    const { g } = mk(lvl => lvl === 1 ? [T(1, 0, 0, 0, 0), T(2, 0, 2, 0, 0), T(3, 0, 4, 0, 0)] : [T(11, 1, 0, 0, 0), T(12, 1, 2, 0, 0), T(13, 1, 4, 0, 0)]);
    [1, 2, 3, 11, 12, 13].forEach(n => g.click(n));
    eq(g.state.screen, 'won'); ok(g.state.endTime >= g.state.startTime);
  });
  test('popOut with empty bar does not consume', () => {
    const { g } = mk(); eq(g.popOut(), false); eq(g.state.used.pop, false);
  });
  test('popOut moves up to 3 tiles to hold, then disabled', () => {
    const { g } = mk();
    [1, 4, 9, 5].forEach(n => g.click(id(1, n)));
    eq(types(g.state.bar), [0, 1, 1, 2]);
    eq(g.popOut(), true); eq(types(g.state.hold), [0, 1, 1]); eq(types(g.state.bar), [2]);
    eq(g.popOut(), false);
  });
  test('undo returns tile to board at same x,y,layer', () => {
    const { g } = mk(); g.click(id(1, 8)); eq(g.canUndo(), true); eq(g.undo(), true);
    const t = g.state.board.find(t => t.id === id(1, 8));
    ok(t); eq([t.x, t.y, t.layer], [1, 5, 1]); eq(g.state.bar.length, 0);
    eq(g.state.used.undo, true); eq(g.canUndo(), false);
  });
  test('undo from hold returns tile to hold', () => {
    const { g } = mk(); g.click(id(1, 4)); g.popOut(); g.clickHold(id(1, 4)); eq(g.undo(), true);
    eq(g.state.hold.length, 1); eq(g.state.bar.length, 0);
  });
  test('undo disabled after a match', () => {
    const { g } = mk(); [1, 2, 3].forEach(n => g.click(id(1, n))); eq(g.canUndo(), false); eq(g.undo(), false);
  });
  test('shuffle preserves multiset of board types, then disabled', () => {
    const { g } = mk();
    const before = g.state.board.map(t => t.type).sort();
    eq(g.shuffle(), true);
    eq(g.state.board.map(t => t.type).sort(), before);
    eq(g.state.used.shuffle, true); eq(g.shuffle(), false);
  });
  test('start() resets helpers and level', () => {
    const { g } = mk(); g.click(id(1, 1)); g.popOut(); g.start();
    eq(g.state.level, 1); eq(g.state.used, { pop: false, undo: false, shuffle: false }); eq(g.state.hold.length, 0);
  });
  test('createGame survives blocked localStorage', () => {
    const owner = Object.prototype.hasOwnProperty.call(window, 'localStorage') ? window : Object.getPrototypeOf(window);
    const original = Object.getOwnPropertyDescriptor(owner, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      const g = createGame({ levelFactory: () => board1(100) });
      g.start(); g.click(101); eq(g.loadBest(), null);
    } finally {
      delete window.localStorage;
      if (owner === window && original) Object.defineProperty(window, 'localStorage', original);
    }
    ok(window.localStorage && typeof window.localStorage.getItem === 'function', 'real localStorage restored');
  });
  test('right-click does not place a tile', () => {
    const g = ui.game; g.start(); ui.render();
    const t = g.state.board.find(t => rules.isFree(t, g.state.board));
    document.querySelector(`.tile[data-id="${t.id}"]`).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 2 }));
    const placed = g.state.bar.length;
    g.toTitle(); ui.render();
    eq(placed, 0);
  });
  test('no clickable tile is drawn underneath another tile (20 boards)', () => {
    const g = ui.game; g.start();
    try {
      for (let s = 0; s < 20; s++) {
        g.state.level = 2; g.state.board = generator.makeLevel(2, mulberry32(800 + s), false); ui.render();
        const rect = el => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: el.offsetWidth, h: el.offsetHeight, z: +el.style.zIndex });
        const tiles = g.state.board.filter(t => !t.stack).map(t => ({ t, r: rect(document.querySelector(`.tile[data-id="${t.id}"]`)) }));
        for (const a of tiles) {
          if (!rules.isFree(a.t, g.state.board)) continue;
          for (const b of tiles) {
            if (a === b || b.r.z <= a.r.z) continue;
            const ox = Math.min(a.r.x + a.r.w, b.r.x + b.r.w) - Math.max(a.r.x, b.r.x);
            const oy = Math.min(a.r.y + a.r.h, b.r.y + b.r.h) - Math.max(a.r.y, b.r.y);
            if (ox > 1 && oy > 1) throw new Error('seed ' + s + ': free tile ' + a.t.id + ' drawn under ' + b.t.id);
          }
        }
      }
    } finally { g.toTitle(); ui.render(); }
  });
  test('skipLevel jumps from level 1 to a fresh level 2, only from level 1', () => {
    const { g } = mk(); g.click(id(1, 1)); g.click(id(1, 4)); g.popOut();
    eq(g.skipLevel(), true);
    eq(g.state.level, 2); eq(g.state.bar.length, 0); eq(g.state.hold.length, 0);
    eq(g.state.board.length, 9); eq(g.state.used.pop, true); eq(g.canUndo(), false);
    eq(g.skipLevel(), false);
  });
  test('whole game fits inside the window (no clipping)', () => {
    const g = ui.game; g.start(); ui.render(); // during Level 1 the top bar is fullest (Skip is shown)
    try {
      const W = window.innerWidth, H = window.innerHeight;
      for (const sel of ['.topbar', '#lvl', '#left', '#skip', '#mute', '.stage', '.btns', '#b-pop', '#b-shuffle']) {
        const r = document.querySelector(sel).getBoundingClientRect();
        ok(r.left >= -1 && r.right <= W + 1 && r.top >= -1 && r.bottom <= H + 1, sel + ' out of window ' + JSON.stringify([r.left, r.top, r.right, r.bottom, W, H].map(Math.round)));
      }
      const b = document.querySelector('#b-pop');
      ok(b.getBoundingClientRect().height < 50, 'helper button label wraps onto two lines');
    } finally { g.toTitle(); ui.render(); }
  });
  // ---- Rewards ----
  const CHAR_IDS = ['princess_sheep', 'gentleman_sheep', 'queen_sheep', 'frilly_cat', 'bunny_ballerina', 'frog_prince', 'bear_wizard', 'golden_sheep'];
  const SKIN_IDS = ['skin_classic', 'skin_strawberry', 'skin_mint', 'skin_starry', 'skin_cookie'];
  test('every reward has art', () => {
    eq(Object.keys(charArt.CHARACTERS).sort(), CHAR_IDS.slice().sort());
    for (const id of CHAR_IDS) ok(/viewBox="0 0 200 240"/.test(charArt.CHARACTERS[id].svg()) && charArt.CHARACTERS[id].name, id);
    eq(Object.keys(charArt.SKINS).sort(), SKIN_IDS.slice().sort());
    for (const id of SKIN_IDS) { const s = charArt.SKINS[id]; ok(s.name && s.face && s.edge && s.ink && typeof s.bg === 'string', id); }
  });
  const POOL_IDS = ['princess_sheep', 'gentleman_sheep', 'queen_sheep', 'frilly_cat', 'bunny_ballerina', 'frog_prince', 'bear_wizard',
    'skin_strawberry', 'skin_mint', 'skin_starry', 'skin_cookie'];
  const newCol = (storage = fakeStorage()) => createCollection(storage);
  test('REWARDS lists 12 rewards in spec order', () => {
    eq(REWARDS.map(r => r.id), [...POOL_IDS.slice(0, 7), 'golden_sheep', ...POOL_IDS.slice(7)]);
    ok(REWARDS.every(r => (r.kind === 'character') === !r.id.startsWith('skin_')));
  });
  test('pool excludes owned and golden', () => {
    const c = newCol(); c.claim('frog_prince');
    const p = c.pool(); eq(p.length, 10); ok(!p.includes('golden_sheep') && !p.includes('frog_prince'));
  });
  test('drawCards distinct, <=3, fewer when pool small', () => {
    const c = newCol(); const d = c.drawCards(mulberry32(1));
    eq(d.length, 3); eq(new Set(d).size, 3); ok(d.every(id => c.pool().includes(id)));
    POOL_IDS.slice(0, 10).forEach(id => c.claim(id)); eq(c.drawCards(mulberry32(2)).length, 1);
    c.claim(POOL_IDS[10]); eq(c.drawCards(mulberry32(3)).length, 0);
  });
  test('claim once', () => {
    const c = newCol(); eq(c.claim('queen_sheep'), true); eq(c.claim('queen_sheep'), false); eq(c.owned().length, 1); eq(c.count(), 1);
  });
  test('golden after all 11', () => {
    const c = newCol(); POOL_IDS.slice(0, 10).forEach(id => c.claim(id));
    eq(c.grantGoldenIfComplete(), false); c.claim(POOL_IDS[10]);
    eq(c.grantGoldenIfComplete(), true); ok(c.has('golden_sheep')); eq(c.grantGoldenIfComplete(), false); eq(c.count(), 12);
  });
  test('first character auto-equips buddy, skins do not', () => {
    const c = newCol(); c.claim('skin_mint'); eq(c.buddy(), null); eq(c.skin(), 'skin_classic');
    c.claim('bear_wizard'); eq(c.buddy(), 'bear_wizard'); c.claim('frog_prince'); eq(c.buddy(), 'bear_wizard');
  });
  test('equip rules', () => {
    const c = newCol(); eq(c.setSkin('skin_starry'), false); c.claim('skin_starry'); eq(c.setSkin('skin_starry'), true); eq(c.skin(), 'skin_starry');
    eq(c.setSkin('skin_classic'), true); eq(c.setBuddy(null), true); eq(c.setBuddy('queen_sheep'), false); eq(c.buddy(), null);
    eq(c.setSkin('frog_prince'), false); c.claim('frog_prince'); eq(c.setBuddy('skin_starry'), false);
  });
  test('save/load round-trip', () => {
    const st = fakeStorage(); const a = newCol(st); a.claim('frilly_cat'); a.claim('skin_cookie'); a.setSkin('skin_cookie');
    const b = newCol(st); eq(b.owned().sort(), ['frilly_cat', 'skin_cookie']); eq(b.buddy(), 'frilly_cat'); eq(b.skin(), 'skin_cookie');
  });
  test('load sanitises bad data', () => {
    const st = fakeStorage(); st.setItem('snackstack.collection', '{"owned":"x","buddy":"queen_sheep","skin":"nope"}');
    let c = newCol(st); eq(c.owned(), []); eq(c.buddy(), null); eq(c.skin(), 'skin_classic');
    st.setItem('snackstack.collection', '{"owned":["frog_prince","dragon",5],"buddy":"frog_prince","skin":"skin_mint"}');
    c = newCol(st); eq(c.owned(), ['frog_prince']); eq(c.buddy(), 'frog_prince'); eq(c.skin(), 'skin_classic');
    st.setItem('snackstack.collection', 'not json'); c = newCol(st); eq(c.owned(), []);
  });
  test('blocked storage does not throw', () => {
    const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    const c = newCol(bad); eq(c.claim('bunny_ballerina'), true); ok(c.has('bunny_ballerina'));
  });
  // UI reward tests swap in a throwaway collection so the player's real saved one is never touched
  const withCol = (c, fn) => { const prev = ui.useCollection(c); try { return fn(c); } finally { ui.useCollection(prev); ui.closeOverlay(); } };
  test('applySkin sets stage vars', () => {
    const c = newCol(); c.claim('skin_starry'); c.setSkin('skin_starry');
    withCol(c, () => eq(getComputedStyle(document.getElementById('stage')).getPropertyValue('--skin-face').trim(), '#ece8ff'));
    eq(getComputedStyle(document.getElementById('stage')).getPropertyValue('--skin-face').trim(), charArt.SKINS[ui.collection().skin()].face);
  });
  test('album shows silhouettes for unowned', () => withCol(newCol(), () => {
    ui.openAlbum();
    eq(document.querySelectorAll('.album .aslot.locked').length, 12);
    eq(document.querySelectorAll('.album .aslot:not(.locked)').length, 1);
  }));
  test('album equips owned items', () => withCol(newCol(), c => {
    c.claim('frog_prince'); c.claim('skin_mint'); ui.openAlbum();
    document.querySelector('.album .aslot[data-id="skin_mint"]').click(); eq(c.skin(), 'skin_mint');
    document.querySelector('.album .aslot[data-id="frog_prince"]').click(); eq(c.buddy(), null);
    document.querySelector('.album .aslot[data-id="frog_prince"]').click(); eq(c.buddy(), 'frog_prince');
    document.querySelector('.album .aslot[data-id="queen_sheep"]').click(); eq(c.buddy(), 'frog_prince');
  }));
  test('winNow only on level 2', () => {
    const { g, storage } = mk(); eq(g.winNow(), false); eq(g.state.screen, 'play');
    g.skipLevel(); eq(g.winNow(), true); eq(g.state.screen, 'won'); ok(JSON.parse(storage.getItem('snackstack.best.light')).won);
  });
  test('mystery screen shows min(3,pool) cards', () => {
    withCol(newCol(), () => { ui.showMystery(); eq(document.querySelectorAll('.mystery .mcard').length, 3); });
    const c = newCol(); POOL_IDS.slice(0, 10).forEach(id => c.claim(id));
    withCol(c, () => { ui.showMystery(); eq(document.querySelectorAll('.mystery .mcard').length, 1); });
  });
  test('only one card can be claimed', () => withCol(newCol(), c => {
    ui.showMystery(); const cards = document.querySelectorAll('.mystery .mcard');
    cards[0].click(); cards[1].click(); cards[0].click(); eq(c.count(), 1);
  }));
  test('new screen ignores a tap in its first 300ms (double-tap guard)', () => withCol(newCol(), () => {
    ui.showGolden(); const before = ui.tapsAccepted();
    document.getElementById('gcont').click();
    eq(ui.tapsAccepted(), before, 'tap right after showing must be ignored');
    ui.pretendShownLongAgo(); document.getElementById('gcont').click();
    eq(ui.tapsAccepted(), before + 1, 'later tap accepted');
  }));
  test('buddy does not overlap tiles', () => {
    const c = newCol(); c.claim('bear_wizard');
    withCol(c, () => {
      const g = ui.game; g.start(); g.skipLevel(); ui.render();
      try {
        const b = document.getElementById('buddy'); ok(getComputedStyle(b).display !== 'none', 'buddy hidden');
        const br = b.getBoundingClientRect();
        for (const el of document.querySelectorAll('#stage .tile, #tray')) {
          const r = el.getBoundingClientRect();
          const ox = Math.min(br.right, r.right) - Math.max(br.left, r.left), oy = Math.min(br.bottom, r.bottom) - Math.max(br.top, r.top);
          ok(!(ox > 1 && oy > 1), 'buddy overlaps ' + (el.dataset.id || el.id));
        }
      } finally { g.toTitle(); ui.render(); }
    });
  });
  // ---- Difficulty ----
  const depthAt = pile => { const m = {}; pile.forEach(t => { const k = t.x + ',' + t.y; m[k] = (m[k] || 0) + 1; }); return Object.values(m); };
  test('difficulty totals: light 231, medium 306, brutal 351', () => {
    for (let s = 0; s < 10; s++) {
      eq(generator.makeLevel(2, mulberry32(900 + s), false, 'light').length, 231);
      eq(generator.makeLevel(2, mulberry32(900 + s), false, 'medium').length, 306);
      eq(generator.makeLevel(2, mulberry32(900 + s), false, 'brutal').length, 351);
      eq(generator.makeLevel(2, mulberry32(900 + s), false).length, 231, 'default is light');
      eq(generator.makeLevel(1, mulberry32(900 + s), false, 'brutal').length, 18, 'level 1 same for all');
    }
  });
  test('super-towers: medium has 3 spots >=25 deep, brutal 4 spots >=30, light none past the cap', () => {
    for (let s = 0; s < 20; s++) {
      const pile = d => generator.makeLevel(2, mulberry32(950 + s), false, d).filter(t => !t.stack);
      ok(depthAt(pile('medium')).filter(n => n >= 25).length >= 3, 'medium seed ' + s);
      ok(depthAt(pile('brutal')).filter(n => n >= 30).length >= 4, 'brutal seed ' + s);
      ok(Math.max(...depthAt(pile('light'))) <= generator.MAX_LAYER + 1, 'light seed ' + s);
      for (const d of ['medium', 'brutal']) {
        const t = generator.makeLevel(2, mulberry32(970 + s), false, d);
        ok(Object.values(countTypes(t)).every(n => n % 3 === 0), d + ' counts %3');
        const p = t.filter(x => !x.stack);
        for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++)
          if (p[i].layer === p[j].layer && rules.overlaps(p[i], p[j])) throw new Error(d + ' same-layer overlap seed ' + s);
      }
    }
  });
  test('prize roll chances: light ~10%, medium ~67%, brutal 100%', () => {
    const rate = d => { const r = mulberry32(42); let n = 0; for (let i = 0; i < 10000; i++) if (rollPrize(d, r)) n++; return n / 10000; };
    const l = rate('light'), m = rate('medium');
    ok(Math.abs(l - 0.10) < 0.02, 'light ' + l); ok(Math.abs(m - 0.67) < 0.02, 'medium ' + m); eq(rate('brutal'), 1);
  });
  test('best is saved per difficulty; old best counts as light', () => {
    const storage = fakeStorage(); storage.setItem('snackstack.best', JSON.stringify({ level: 2, left: 40 }));
    const g = createGame({ levelFactory: lvl => board1(lvl * 100), storage, now: () => 1000 });
    eq(g.loadBest('light'), { level: 2, left: 40 }); eq(g.loadBest('brutal'), null);
    g.start('brutal'); eq(g.state.difficulty, 'brutal'); g.skipLevel(); g.winNow();
    ok(g.loadBest('brutal').won); eq(g.loadBest('light'), { level: 2, left: 40 });
  });
  test('start passes difficulty to the level factory', () => {
    const seen = []; const g = createGame({ levelFactory: (lvl, d) => { seen.push(lvl + ':' + d); return board1(lvl * 100); }, storage: fakeStorage() });
    g.start('medium'); g.skipLevel(); eq(seen, ['1:medium', '2:medium']);
    g.start(); eq(g.state.difficulty, 'light');
  });
  test('title shows 3 difficulty buttons; picking one starts that difficulty', () => {
    const g = ui.game; g.toTitle(); ui.closeOverlay();
    const btns = [...document.querySelectorAll('.diff')].map(b => b.dataset.d);
    eq(btns, ['light', 'medium', 'brutal']);
    ok(/306 tiles/.test(document.querySelector('.diff[data-d="medium"]').textContent), 'medium shows 306 tiles');
    ui.pretendShownLongAgo(); document.querySelector('.diff[data-d="brutal"]').click();
    try { eq(g.state.difficulty, 'brutal'); eq(g.state.screen, 'play'); }
    finally { g.toTitle(); ui.render(); ui.closeOverlay(); }
  });
  test('best result comparison', () => {
    eq(isBetterResult({ won: true, ms: 5000 }, { won: true, ms: 6000 }), true);
    eq(isBetterResult({ level: 2, left: 10 }, { won: true, ms: 9e9 }), false);
    eq(isBetterResult({ level: 2, left: 50 }, { level: 1, left: 3 }), true);
    eq(isBetterResult({ level: 2, left: 10 }, { level: 2, left: 20 }), true);
    eq(isBetterResult({ level: 1, left: 10 }, null), true);
  });
})();

if (DEBUG) {
  const r = selftest.run();
  const b = document.createElement('div'); b.className = 'debugbadge';
  b.textContent = 'debug | tests ' + r.passed + '/' + (r.passed + r.failed);
  document.body.appendChild(b);
}
