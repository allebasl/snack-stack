# Rewards & Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 12 code-drawn rewards (8 characters incl. golden sheep, 4 skins), a mystery-card pick after beating Level 2, a collection album, equip-able card skins, and an animated buddy.

**Architecture:** First split `index.html` into classic scripts under `js/` with no behaviour change (top-level `const`s stay shared across classic scripts). Then add `js/art-characters.js` (art + skin definitions) and `js/rewards.js` (pure collection logic + storage), and wire screens in `js/ui.js`. Tests stay in the in-page self-test (`?debug`), moved to `js/selftest.js`.

**Tech Stack:** HTML, CSS, vanilla JS (classic `<script src>`), inline SVG, localStorage.

**Spec:** `docs/spec-rewards.md`

## Global Constraints

- Must still work opened via `file://` and on GitHub Pages: classic scripts only, no modules, no build step, no libraries.
- Art is code-drawn SVG, thick outline `#3b2a2a`, matching `_samples/code-samples.html` (characters `viewBox="0 0 200 240"`).
- Reward ids exactly: `princess_sheep gentleman_sheep queen_sheep frilly_cat bunny_ballerina frog_prince bear_wizard golden_sheep skin_strawberry skin_mint skin_starry skin_cookie`; default skin `skin_classic` always owned.
- Storage key `snackstack.collection` = `{ owned: string[], buddy: string|null, skin: string }`; every read/write in try/catch.
- Rewards only on Level 2 win. Mystery cards = `min(3, pool)`; pool excludes owned and `golden_sheep`.
- Buddy is visual only. Existing 40 self-tests keep passing.

## Review Focus

1. Saved collection from an older/corrupt save (e.g. `owned` not an array, buddy id not owned, skin id unknown) → load sanitises to defaults. (Task 3 test `load sanitises bad data`.)
2. Winning while 1 or 2 pool items remain → exactly that many cards; with 0 left and golden owned → no mystery screen. (Task 3 tests + Task 5 test.)
3. Tapping a second mystery card or tapping fast → only one reward claimed. (Task 5 test `only one card can be claimed`.)
4. Unequipping/equipping a skin mid-game re-renders tiles without breaking clicks. (Task 4 manual check + test that skin vars change.)
5. Buddy box must not overlap any tile on phone width 375 or desktop. (Task 6 test `buddy does not overlap tiles`.)

---

### Task 1: Split into files (no behaviour change)

**Files:** Modify `index.html`; Create `js/art-snacks.js`, `js/rules.js` (rules + generator), `js/game.js` (isBetterResult, createGame), `js/sound.js`, `js/ui.js` (SHOW_SKIP + ui), `js/selftest.js` (harness, mulberry32, all tests, debug run + badge).

- [ ] Move each existing section verbatim into its file; `index.html` keeps `<head>`, CSS, `<div id="app">`, `const DEBUG = …` inline, then `<script src>` tags in order: art-snacks, rules, game, sound, ui, selftest.
- [ ] Run `http://localhost:8765/index.html?debug` → expect `__selftest` 40/40, no console errors; open without `?debug` and play a tile.

### Task 2: Character art + skin definitions

**Files:** Create `js/art-characters.js` (load before ui.js). Test in `js/selftest.js`.

**Produces:** `charArt.CHARACTERS: {[id]: {name: string, svg: () => string}}` (8 ids incl. `golden_sheep`); `charArt.SKINS: {[id]: {name, face, edge, ink, bg}}` (5 ids incl. `skin_classic`), values copied from the samples page.

- [ ] Failing test `every reward has art`: for each id in Global Constraints list, characters return a string containing `viewBox="0 0 200 240"`, skins have `face`,`edge`,`ink` strings; `skin_classic` exists.
- [ ] Implement by porting the 7 sample characters; golden_sheep = princess-sheep shape with gown `#ffd34d`/`#ffe27a`, gold crown, sparkle stars.
- [ ] Test passes; open `?debug&gallery` shows characters too (extend gallery).

### Task 3: Collection logic + saving

**Files:** Create `js/rewards.js`. Tests in `js/selftest.js`.

**Produces:**
- `REWARDS: Array<{id, kind: 'character'|'skin', name}>` (12 items, spec order).
- `createCollection(storage) -> { owned(): string[], has(id): boolean, claim(id): boolean /*true if newly added*/, pool(): string[], drawCards(rng, n=3): string[], grantGoldenIfComplete(): boolean, buddy(): string|null, setBuddy(id|null): boolean, skin(): string, setSkin(id): boolean, count(): number /*owned rewards excl. classic*/ }`. Saves after every change.

- [ ] Failing tests:
  - `pool excludes owned and golden` — claim `frog_prince` → pool length 10, no `golden_sheep`, no `frog_prince`.
  - `drawCards distinct, <=3, fewer when pool small` — fresh: 3 distinct from pool; own 10 of 11 → 1 card; own all 11 → 0.
  - `claim once` — `claim(x)` true then false; owned length +1.
  - `golden after all 11` — after 10 claims `grantGoldenIfComplete()` false; after 11 → true and `has('golden_sheep')`; again → false.
  - `first character auto-equips buddy, skins do not` — claim `skin_mint` → buddy null, skin `skin_classic`; claim `bear_wizard` → buddy `bear_wizard`; claim `frog_prince` → buddy stays `bear_wizard`.
  - `equip rules` — `setSkin('skin_starry')` false when not owned; true after claim; `setSkin('skin_classic')` always true; `setBuddy(null)` true; `setBuddy('queen_sheep')` false when not owned.
  - `save/load round-trip` — new collection on same fake storage sees same owned/buddy/skin.
  - `load sanitises bad data` — storage `{"owned":"x","buddy":"queen_sheep","skin":"nope"}` → owned [], buddy null, skin `skin_classic`; unknown ids in owned dropped.
  - `blocked storage does not throw` — storage whose getItem/setItem throw → claim works in memory.
- [ ] Run → fail; implement; run → pass.

### Task 4: Skins applied + album + Collection button

**Files:** Modify `index.html` (CSS vars), `js/ui.js`.

- [ ] CSS: tile face/edge/outline/pattern use `--skin-face`, `--skin-edge`, `--skin-ink`, `--skin-bg` on `#stage` (defaults = classic). Bases use `--skin-edge`/`--skin-ink`.
- [ ] `applySkin(id)` sets those vars from `charArt.SKINS[id]`. Failing test `applySkin sets stage vars` (skin_starry → `--skin-face` = `#ece8ff`) then pass.
- [ ] Title card: `Collection N / 12` button → album overlay with tabs Characters (8) / Skins (5); owned = art + name, unowned = silhouette (`filter: brightness(0) opacity(.25)`) + "?"; tap equips/unequips per spec; "Equipped" badge; Close returns to title.
- [ ] Test `album shows silhouettes for unowned` (fresh collection → 8 + 4 locked, classic unlocked) then pass.

### Task 5: Mystery cards after a win + Test win

**Files:** Modify `js/game.js` (add `winNow()`), `js/ui.js`.

**Produces:** `game.winNow(): boolean` — only when `screen==='play' && level===2`: empties board/bar/hold, `screen='won'`, sets `endTime`, saves best; returns true.

- [ ] Failing tests: `winNow only on level 2` (level 1 → false; after skipLevel → true, screen won); `mystery screen shows min(3,pool) cards` (UI: test collection with 10 owned → 1 card); `only one card can be claimed` (click two cards → owned grows by 1).
- [ ] Implement: on win → if `drawCards` non-empty show mystery overlay (face-down cards with "?"), tap → flip (CSS rotateY), claim, reveal others, then "Continue" → `grantGoldenIfComplete()` (if true show golden reveal) → normal win screen. If no cards and golden granted now, show golden reveal. `Test win` pill in top bar when `SHOW_SKIP && level===2`.
- [ ] Run → pass. Manual: Skip → Test win → pick card → album shows it.

### Task 6: Buddy

**Files:** Modify `index.html` (CSS keyframes), `js/ui.js`.

- [ ] Buddy element inside stage at x = 1.6u..4.6u, y = 17.6u..21.0u (left of hold slots, below left stack, above tray), shows `CHARACTERS[buddy].svg()`; hidden if no buddy or not playing.
- [ ] Moods via class: `idle` (bob), `happy` (bounce 600ms after a match), `nervous` (wobble while bar ≥5), `sad` (on loss), `dance` (on win).
- [ ] Failing test `buddy does not overlap tiles`: with buddy set, render a level-2 board at current size; buddy rect intersects no `.tile` rect and no tray; then pass. Check at 375×812 and 1366×768.

### Task 7: Verify end to end

- [ ] `?debug` → all tests pass, no console errors.
- [ ] Manual at 1366×768 and 375×812: Play → Skip → Test win → mystery cards → Continue → win screen → Collection shows item → equip skin (tiles change) → equip buddy → play: buddy reacts to a match and to a loss.
- [ ] Final review (fresh reviewer), fix Critical/Important with a failing test first.
- [ ] Commit locally; publishing to GitHub Pages is a separate step the user approves.
