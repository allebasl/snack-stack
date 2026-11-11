'use strict';
/* ===================== ui ===================== */
// TEMPORARY testing aid: shows a "Skip to Level 2" button while on Level 1. Set to false to remove it.
const SHOW_SKIP = true;

const ui = (() => {
  const app = document.getElementById('app');
  const game = createGame({ debug: DEBUG });
  if (DEBUG) window.game = game;

  // Layout in units (u px). Board 18 x 14 (+0.8 top margin), stacks/hold row at 15.5, tray at 18.
  const BOARD_TOP = 0.3, ROW_Y = 15.5, HOLD_Y = 18.4, TRAY_Y = 21.2;
  const STACK_STEP = 0.26, HOLD_W = 2.1, BAR_SLOT = 18 / 7;
  let u = 30;
  let busy = false;
  const els = new Map(); // tile id -> element

  app.innerHTML = `
    <div class="topbar">
      <span class="pill" id="lvl">Level 1</span>
      <span class="pill" id="left">Tiles left: 0</span>
      <button class="pill mute" id="skip">Skip<span class="long"> to Level 2</span></button>
      <button class="pill mute" id="mute"></button>
    </div>
    <div class="stage" id="stage">
      <div class="tray" id="tray"></div>
    </div>
    <div class="btns">
      <button class="btn" id="b-pop">Pop out<span class="count">1</span></button>
      <button class="btn" id="b-undo">Undo<span class="count">1</span></button>
      <button class="btn" id="b-shuffle">Shuffle<span class="count">1</span></button>
    </div>
    <div class="banner" id="banner"></div>
    <div id="overlay"></div>`;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), tray = $('tray');
  for (let k = 0; k < 7; k++) {
    const s = document.createElement('div'); s.className = 'slot';
    s.style.left = `calc(var(--u) * ${k * BAR_SLOT + (BAR_SLOT - 2.15) / 2} - 4px)`;
    tray.appendChild(s);
  }
  const holdX = k => 9 - (HOLD_W * 3) / 2 + k * HOLD_W + (HOLD_W - 2) / 2;

  function fit() {
    // size from the real space left inside the safe area after the top bar and buttons
    const cs = getComputedStyle(app);
    const availW = app.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = app.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const chrome = app.querySelector('.topbar').offsetHeight + app.querySelector('.btns').offsetHeight + 16;
    const byW = (availW - 16) / 18;
    const byH = (availH - chrome) / 24.8;
    u = Math.max(14, Math.min(42, byW, byH));
    document.documentElement.style.setProperty('--u', u + 'px');
  }

  function pos(t, where, k) {
    if (where === 'bar') return { x: k * BAR_SLOT + (BAR_SLOT - 2) / 2, y: TRAY_Y + 0.42, z: 1000 + k };
    if (where === 'hold') return { x: holdX(k), y: HOLD_Y, z: 900 + k };
    if (t.stack === 'L') return { x: t.stackIndex * STACK_STEP, y: ROW_Y, z: 10 + t.stackIndex };
    if (t.stack === 'R') return { x: 16 - t.stackIndex * STACK_STEP, y: ROW_Y, z: 10 + t.stackIndex };
    // Board tiles are drawn exactly on their own spot (no lift), so a tile only ever looks covered
    // when it is logically covered. Stack height is shown by the edge base underneath (see renderBases).
    return { x: t.x, y: BOARD_TOP + t.y, z: 100 + t.layer * 10 };
  }

  // One base per occupied spot, drawn below every tile face: a dark tile shape with one cream+ink
  // edge line per tile in the pile at that exact spot (max 6), so taller towers look thicker.
  const bases = new Map(); // "x,y" -> element
  function renderBases(board) {
    const depth = new Map();
    for (const t of board) if (!t.stack) { const k = t.x + ',' + t.y; depth.set(k, (depth.get(k) || 0) + 1); }
    for (const [k, d] of depth) {
      let b = bases.get(k);
      if (!b) {
        b = document.createElement('div'); b.className = 'tbase enter'; stage.appendChild(b); bases.set(k, b);
        const nb = b; requestAnimationFrame(() => requestAnimationFrame(() => nb.classList.remove('enter')));
      }
      const [x, y] = k.split(',').map(Number);
      b.style.left = x * u + 'px'; b.style.top = (BOARD_TOP + y) * u + 'px';
      const shadows = [];
      for (let i = 0; i < Math.min(d, 6); i++) {
        const off = u * (0.16 + i * 0.08);
        shadows.push(`0 ${off}px 0 #e0bd85`, `0 ${off + 2}px 0 #3b2a2a`);
      }
      b.style.boxShadow = shadows.join(',');
    }
    for (const [k, b] of bases) if (!depth.has(k)) { b.remove(); bases.delete(k); }
  }

  function getEl(t, p) {
    let el = els.get(t.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'tile enter';
      el.dataset.id = t.id;
      el.innerHTML = '<div class="face"></div>';
      el.style.left = p.x * u + 'px'; el.style.top = p.y * u + 'px';
      stage.appendChild(el);
      els.set(t.id, el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('enter')));
    }
    if (el.dataset.type !== String(t.type)) { el.dataset.type = t.type; el.firstChild.innerHTML = art.SNACKS[t.type].svg(); }
    return el;
  }

  // view = {board, hold, bar}; keep = ids whose elements must not be removed (animating)
  function render(view = game.state, keep = new Set()) {
    const seen = new Set();
    const place = (t, where, k, cls) => {
      const p = pos(t, where, k);
      const el = getEl(t, p);
      el.style.left = p.x * u + 'px'; el.style.top = p.y * u + 'px'; el.style.zIndex = p.z;
      el.classList.toggle('free', cls === 'free');
      el.classList.toggle('covered', cls === 'covered');
      el.classList.toggle('inbar', cls === 'inbar');
      el.classList.toggle('onboard', where === 'board' && !t.stack);
      seen.add(t.id);
    };
    renderBases(view.board);
    for (const t of view.board) place(t, 'board', 0, rules.isFree(t, view.board) ? 'free' : 'covered');
    view.hold.forEach((t, k) => place(t, 'hold', k, 'free'));
    view.bar.forEach((t, k) => place(t, 'bar', k, 'inbar'));
    for (const [id, el] of els) if (!seen.has(id) && !keep.has(id)) { el.remove(); els.delete(id); }
    renderHud();
  }

  function renderHud() {
    const s = game.state;
    $('lvl').innerHTML = '<span class="long">Level </span><span class="short">Lv </span>' + s.level;
    $('left').innerHTML = '<span class="long">Tiles left: </span><span class="short">Left </span>' + game.tilesLeft();
    $('mute').innerHTML = '<span class="long">Sound: </span><span class="short">&#9834; </span>' + (sound.muted ? 'off' : 'on');
    $('skip').style.display = SHOW_SKIP && s.screen === 'play' && s.level === 1 ? '' : 'none';
    const play = s.screen === 'play';
    const setBtn = (id, used, enabled) => {
      const b = $(id); b.disabled = !play || used || !enabled || busy;
      b.querySelector('.count').textContent = used ? '0' : '1';
    };
    setBtn('b-pop', s.used.pop, s.bar.length > 0 && s.hold.length === 0);
    setBtn('b-undo', s.used.undo, game.canUndo());
    setBtn('b-shuffle', s.used.shuffle, s.board.length > 1);
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fmt = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function bestText() {
    const b = game.loadBest();
    if (!b) return 'No runs yet. Good luck!';
    return b.won ? 'Best: cleared it in ' + fmt(b.ms) + '!' : 'Best: Level ' + b.level + ', ' + b.left + ' tiles left';
  }

  function sparkles(el) {
    const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const colors = ['#ffd34d', '#ff8fc0', '#7fd6ff', '#9fe6c8', '#fff'];
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('div'); s.className = 'sparkle';
      const a = (Math.PI * 2 * i) / 8;
      s.style.left = (r.left - sr.left + r.width / 2 - 5) + 'px'; s.style.top = (r.top - sr.top + r.height / 2 - 5) + 'px';
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--dx', Math.cos(a) * u * 1.6 + 'px'); s.style.setProperty('--dy', Math.sin(a) * u * 1.6 + 'px');
      stage.appendChild(s); setTimeout(() => s.remove(), 550);
    }
  }

  async function banner(text, ms = 900) {
    const b = $('banner'); b.textContent = text; b.classList.add('show');
    await wait(ms); b.classList.remove('show');
  }

  function overlay(html) {
    $('overlay').innerHTML = html ? `<div class="overlay"><div class="card">${html}</div></div>` : '';
    const go = $('go'); if (go) go.onclick = () => { sound.click(); startRun(); };
  }
  function showScreen() {
    const s = game.state;
    const row = [0, 1, 2, 4, 12, 13].map(i => art.SNACKS[i].svg()).join('');
    if (s.screen === 'title') overlay(`<h1>Snack Stack</h1><div class="row">${row}</div>
      <p>Tap a snack to drop it in the tray.<br>3 alike pop. 7 in the tray and the run is over.</p>
      <p class="best">${bestText()}</p><button class="btn big" id="go">Play</button>`);
    else if (s.screen === 'lost') overlay(`<h1>Run over!</h1>
      <p>You reached <b>Level ${s.level}</b> with <b>${game.tilesLeft()}</b> tiles left.</p>
      <p class="best">${bestText()}</p><button class="btn big" id="go">Try again</button>`);
    else if (s.screen === 'won') overlay(`<h1>You did it!</h1><div class="row">${row}</div>
      <p>Every snack cleared in <b>${fmt(s.endTime - s.startTime)}</b>.</p>
      <p class="best">${bestText()}</p><button class="btn big" id="go">Play again</button>`);
    else overlay('');
  }

  async function startRun() {
    tray.classList.remove('bad');
    game.start();
    render(); showScreen();
    busy = true; renderHud();
    await banner('Level 1', 700);
    busy = false; renderHud();
  }

  async function onTileClick(id) {
    const s = game.state;
    const fromHold = s.hold.some(t => t.id === id);
    const r = fromHold ? game.clickHold(id) : game.click(id);
    const el = els.get(id);
    if (!r.ok) { if (el && !el.classList.contains('inbar')) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); sound.nope(); } return; }
    busy = true;
    sound.click();
    el.classList.add('flying');
    const removedIds = new Set(r.removed.map(t => t.id));
    // phase 1: tile flies into its slot (before any match is removed)
    const view = r.levelCleared ? { board: [], hold: [], bar: r.barBefore } : { board: s.board, hold: s.hold, bar: r.barBefore };
    render(view, removedIds);
    await wait(190);
    el.classList.remove('flying');
    // phase 2: matched snacks pop
    if (r.matched) {
      sound.pop();
      r.removed.forEach(t => { const e = els.get(t.id); if (e) { sparkles(e); e.classList.add('pop'); } });
      await wait(210);
    }
    if (r.lost) {
      render();
      tray.classList.add('bad', 'shake'); sound.lose();
      await wait(800);
      tray.classList.remove('shake');
      busy = false; showScreen(); renderHud();
      return;
    }
    if (r.won) {
      render({ board: [], hold: [], bar: [] });
      sound.win(); await wait(300);
      busy = false; showScreen(); renderHud();
      return;
    }
    if (r.levelCleared) {
      render({ board: [], hold: [], bar: [] });
      sound.win();
      await banner('Level 2', 1000);
      render();
      busy = false; renderHud();
      return;
    }
    render();
    busy = false; renderHud();
  }

  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const el = e.target.closest('.tile');
    if (!el || busy || game.state.screen !== 'play') return;
    e.preventDefault();
    onTileClick(Number(el.dataset.id));
  });
  $('b-pop').onclick = () => { if (!busy && game.popOut()) { sound.click(); render(); } };
  $('b-undo').onclick = () => { if (!busy && game.undo()) { sound.click(); render(); } };
  $('b-shuffle').onclick = () => {
    if (busy || !game.shuffle()) return;
    sound.pop(); render();
    for (const t of game.state.board) { const e = els.get(t.id); if (e) { e.classList.remove('wiggle'); void e.offsetWidth; e.classList.add('wiggle'); } }
  };
  $('mute').onclick = () => { sound.toggle(); renderHud(); };
  $('skip').onclick = async () => {
    if (busy || !game.skipLevel()) return;
    busy = true; sound.click();
    render({ board: [], hold: [], bar: [] });
    await banner('Level 2', 900);
    render(); busy = false; renderHud();
  };
  window.addEventListener('resize', () => { fit(); render(); });
  window.addEventListener('orientationchange', () => setTimeout(() => { fit(); render(); }, 200));
  // iOS Safari ignores user-scalable=no; block pinch-zoom gestures directly
  document.addEventListener('gesturestart', e => e.preventDefault());

  fit(); render(); showScreen();

  if (DEBUG && /[?&]gallery\b/.test(location.search)) {
    const g = document.createElement('div'); g.className = 'gallery';
    g.innerHTML = art.SNACKS.map(s => `<div><div class="tile" style="--u:55px"><div class="face">${s.svg()}</div></div><div class="lbl">${s.name}</div></div>`).join('')
      + Object.values(charArt.CHARACTERS).map(c => `<div style="width:110px;text-align:center">${c.svg().replace('<svg ', '<svg width="110" height="132" ')}<div class="lbl">${c.name}</div></div>`).join('');
    document.body.appendChild(g);
  }
  return { game, render };
})();
