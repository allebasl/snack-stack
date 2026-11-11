'use strict';
/* ===================== game ===================== */
// Best result: {won:true, ms} or {level, left}. Better = won faster > higher level > fewer tiles left.
function isBetterResult(a, b) {
  if (!b) return true;
  if (a.won !== b.won) return !!a.won;
  if (a.won) return a.ms < b.ms;
  if (a.level !== b.level) return a.level > b.level;
  return a.left < b.left;
}

function createGame(opts = {}) {
  const rng = opts.rng || Math.random;
  const now = opts.now || (() => Date.now());
  let storage = opts.storage;
  if (!storage) { try { storage = window.localStorage; } catch (e) { storage = null; } }
  const levelFactory = opts.levelFactory || (lvl => generator.makeLevel(lvl, rng, !!opts.debug));
  const listeners = [];
  const state = {
    screen: 'title', level: 1, board: [], bar: [], hold: [],
    used: { pop: false, undo: false, shuffle: false }, lastMove: null, startTime: 0, endTime: 0,
  };
  const emit = () => listeners.forEach(cb => cb(state));

  function loadBest() { try { return JSON.parse(storage.getItem('snackstack.best')); } catch (e) { return null; } }
  function saveBest(result) {
    if (isBetterResult(result, loadBest())) { try { storage.setItem('snackstack.best', JSON.stringify(result)); } catch (e) {} }
  }
  const tilesLeft = () => state.board.length + state.bar.length + state.hold.length;

  function start() {
    Object.assign(state, {
      screen: 'play', level: 1, board: levelFactory(1), bar: [], hold: [],
      used: { pop: false, undo: false, shuffle: false }, lastMove: null, startTime: now(), endTime: 0,
    });
    emit();
  }

  function place(tile, from) {
    const barBefore = rules.insertIntoBar(state.bar, tile);
    const { bar, removed } = rules.resolveMatches(barBefore);
    state.bar = bar;
    state.lastMove = { tile, from, matched: removed.length > 0 };
    const result = { ok: true, tile, barBefore, removed, matched: removed.length > 0, lost: false, levelCleared: false, won: false };
    if (rules.isLost(state.bar)) {
      result.lost = true;
      state.screen = 'lost';
      saveBest({ level: state.level, left: tilesLeft() });
    } else if (tilesLeft() === 0) {
      result.levelCleared = true;
      if (state.level === 1) {
        state.level = 2; state.board = levelFactory(2); state.bar = []; state.hold = []; state.lastMove = null;
      } else {
        result.won = true;
        state.screen = 'won'; state.endTime = now();
        saveBest({ won: true, ms: state.endTime - state.startTime });
      }
    }
    emit();
    return result;
  }

  function click(tileId) {
    if (state.screen !== 'play') return { ok: false };
    const tile = state.board.find(t => t.id === tileId);
    if (!tile || !rules.isFree(tile, state.board)) return { ok: false };
    state.board = state.board.filter(t => t !== tile);
    return place(tile, 'board');
  }
  function clickHold(tileId) {
    if (state.screen !== 'play') return { ok: false };
    const tile = state.hold.find(t => t.id === tileId);
    if (!tile) return { ok: false };
    state.hold = state.hold.filter(t => t !== tile);
    return place(tile, 'hold');
  }
  function popOut() {
    if (state.screen !== 'play' || state.used.pop || state.bar.length === 0) return false;
    const n = Math.min(3, state.bar.length);
    state.hold = state.hold.concat(state.bar.slice(0, n));
    state.bar = state.bar.slice(n);
    state.used.pop = true; state.lastMove = null;
    emit(); return true;
  }
  const canUndo = () => state.screen === 'play' && !state.used.undo && !!state.lastMove && !state.lastMove.matched;
  function undo() {
    if (!canUndo()) return false;
    const { tile, from } = state.lastMove;
    state.bar = state.bar.filter(t => t !== tile);
    if (from === 'hold') state.hold = state.hold.concat([tile]); else state.board = state.board.concat([tile]);
    state.used.undo = true; state.lastMove = null;
    emit(); return true;
  }
  function shuffle() {
    if (state.screen !== 'play' || state.used.shuffle || state.board.length < 2) return false;
    const types = generator.shuffle(state.board.map(t => t.type), rng);
    state.board.forEach((t, i) => { t.type = types[i]; });
    state.used.shuffle = true;
    emit(); return true;
  }
  return {
    state, start, click, clickHold, popOut, undo, canUndo, shuffle, tilesLeft, loadBest,
    onChange(cb) { listeners.push(cb); },
    toTitle() { state.screen = 'title'; emit(); },
    // Testing shortcut: jump straight from Level 1 to a fresh Level 2 (helpers keep their used state).
    skipLevel() {
      if (state.screen !== 'play' || state.level !== 1) return false;
      Object.assign(state, { level: 2, board: levelFactory(2), bar: [], hold: [], lastMove: null });
      emit(); return true;
    },
  };
}
