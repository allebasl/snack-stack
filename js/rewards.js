'use strict';
// Rewards & collection: what can be won, what is owned/equipped, and saving it on this device.
const REWARDS = [
  { id: 'princess_sheep', kind: 'character', name: 'Princess sheep' },
  { id: 'gentleman_sheep', kind: 'character', name: 'Gentleman sheep' },
  { id: 'queen_sheep', kind: 'character', name: 'Queen sheep' },
  { id: 'frilly_cat', kind: 'character', name: 'Cat in a frilly dress' },
  { id: 'bunny_ballerina', kind: 'character', name: 'Bunny ballerina' },
  { id: 'frog_prince', kind: 'character', name: 'Frog prince' },
  { id: 'bear_wizard', kind: 'character', name: 'Bear wizard' },
  { id: 'golden_sheep', kind: 'character', name: 'Golden sheep' },
  { id: 'skin_strawberry', kind: 'skin', name: 'Strawberry milk' },
  { id: 'skin_mint', kind: 'skin', name: 'Mint picnic' },
  { id: 'skin_starry', kind: 'skin', name: 'Starry night' },
  { id: 'skin_cookie', kind: 'skin', name: 'Cookie' },
];
const GOLDEN_ID = 'golden_sheep';

// Does this Level 2 win drop a prize? Chance depends on difficulty (Light 10%, Medium 67%, Brutal always).
function rollPrize(difficulty, rng = Math.random) {
  const d = generator.DIFFICULTIES[difficulty] || generator.DIFFICULTIES.light;
  return rng() < d.chance;
}
const DEFAULT_SKIN = 'skin_classic';

// storage: anything with getItem/setItem (localStorage, or a fake in tests). Never throws.
function createCollection(storage) {
  const KEY = 'snackstack.collection';
  const byId = Object.fromEntries(REWARDS.map(r => [r.id, r]));
  const isChar = id => byId[id] && byId[id].kind === 'character';
  const isSkin = id => byId[id] && byId[id].kind === 'skin';

  let owned = [], buddy = null, skin = DEFAULT_SKIN;
  try {
    const d = JSON.parse(storage.getItem(KEY));
    if (d && Array.isArray(d.owned)) owned = [...new Set(d.owned.filter(id => typeof id === 'string' && byId[id]))];
    if (d && owned.includes(d.buddy) && isChar(d.buddy)) buddy = d.buddy;
    if (d && owned.includes(d.skin) && isSkin(d.skin)) skin = d.skin;
  } catch (e) { /* blocked or corrupt: start fresh */ }

  const save = () => { try { storage.setItem(KEY, JSON.stringify({ owned, buddy, skin })); } catch (e) { /* keep in memory */ } };
  const has = id => owned.includes(id);

  function claim(id) {
    if (!byId[id] || has(id)) return false;
    owned.push(id);
    if (isChar(id) && !buddy) buddy = id;
    save(); return true;
  }
  const pool = () => REWARDS.filter(r => r.id !== GOLDEN_ID && !has(r.id)).map(r => r.id);
  function drawCards(rng = Math.random, n = 3) {
    const p = pool();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    return p.slice(0, n);
  }
  const grantGoldenIfComplete = () => (pool().length === 0 && !has(GOLDEN_ID) ? claim(GOLDEN_ID) : false);
  function setBuddy(id) {
    if (id !== null && !(isChar(id) && has(id))) return false;
    buddy = id; save(); return true;
  }
  function setSkin(id) {
    if (id !== DEFAULT_SKIN && !(isSkin(id) && has(id))) return false;
    skin = id; save(); return true;
  }
  return {
    owned: () => owned.slice(), has, claim, pool, drawCards, grantGoldenIfComplete,
    buddy: () => buddy, setBuddy, skin: () => skin, setSkin, count: () => owned.length,
  };
}
