# Snack Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single-file browser tile-stacking game (Snack Stack) with a 30-tile warm-up and a ~230-tile, fully random Level 2, a 7-slot bar, and 3 once-per-run helpers.

**Architecture:** One `index.html` containing CSS and one `<script>` split into sections (`art`, `rules`, `generator`, `game`, `ui`, `sound`, `selftest`). `rules` and `generator` are pure functions; `game` owns run state and exposes actions; `ui` renders from state. Tests are an in-page self-test suite run with `?debug`, reporting pass/fail to the console and to `window.__selftest`.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES2020), inline SVG, Web Audio API, localStorage. No libraries, no build step.

**Spec:** `snack-stack/docs/spec.md`

## Global Constraints

- Exactly one deliverable file: `snack-stack/index.html`. Works when opened via `file://` with no internet.
- No emoji in tile art; all snacks are inline SVG.
- Bar has 7 slots; 3 identical tiles in the bar are removed; 7 tiles after match-resolution = loss.
- Level 1: 3 types, 30 tiles, 2 layers. Level 2: 14 types, ~200 pile tiles in 8–10 layers + 2 side stacks of 15. Total tiles per level is a multiple of 3 and each type count is a multiple of 3.
- No solvability check. Fresh randomness every run.
- Helpers (Pop out, Undo, Shuffle) are once per **run**, not per level.
- Covered tiles: darker but snack visible.
- localStorage keys: `snackstack.best`, `snackstack.muted`.
- `?debug`: Level 2 shrinks to 12 tiles / 4 types / 2 layers, no side stacks; self-tests run.
- Mouse input via pointer events (touch layout is out of scope).

## Review Focus

1. Clicking very fast / clicking during an animation — must not double-insert a tile or place a covered tile. (Task 4: `game.click` ignores tiles not free *at time of click* and tiles already moved; test included.)
2. Bar hits 7 on the same click that completes a triple — must pop, not lose. (Task 1 test `noLossWhenSeventhMatches`.)
3. Undo after the placed tile caused a match — must be disabled, not resurrect popped tiles. (Task 4 test.)
4. Pop out when bar has fewer than 3 tiles, or holding row already full — moves what's there; button still consumed only if at least 1 tile moved. (Task 4 test.)
5. Shuffle keeps each type count a multiple of 3 across board+bar+holding so a run isn't made unwinnable by miscount. (Task 4 test: counts of board tile types unchanged as a multiset.)

---

### Task 1: File skeleton + rules + self-test harness

**Files:** Create `snack-stack/index.html`

**Interfaces — Produces:**
- Tile: `{id:number, type:number, x:number, y:number, layer:number, stack:null|'L'|'R', stackIndex:number}`; `x,y` in half-tile units; a tile is 2×2 units.
- `rules.overlaps(a, b) -> boolean` — rectangles `[x,x+2)×[y,y+2)` intersect (for stack tiles: same stack).
- `rules.isFree(tile, boardTiles) -> boolean` — no tile with higher `layer` (or for stacks, higher `stackIndex` in the same stack) overlaps it.
- `rules.insertIntoBar(bar, tile) -> newBar` — inserts after the last tile of the same type, else at end.
- `rules.resolveMatches(bar) -> {bar, removed: Tile[]}` — removes the first type with ≥3 copies (3 copies only).
- `rules.isLost(bar) -> boolean` — `bar.length >= 7`.
- `selftest.test(name, fn)`, `selftest.eq(a, b)`, `selftest.run()` → logs and sets `window.__selftest = {passed, failed, failures}`.

- [ ] **Step 1:** Write the HTML shell (title, `<div id="app">`, CSS variables for pastel palette) and the self-test harness, plus these failing tests:
  - `isFree: tile with higher overlapping tile is not free` — A `{x:0,y:0,layer:0}`, B `{x:1,y:1,layer:1}` → `isFree(A,[A,B]) === false`, `isFree(B,[A,B]) === true`.
  - `isFree: non-overlapping higher tile does not cover` — B at `{x:2,y:0,layer:1}` → A free.
  - `isFree: side stack only top is free` — stack L indices 0,1,2 → only index 2 free.
  - `insertIntoBar groups same type` — bar types `[1,2]`, insert 1 → `[1,1,2]`.
  - `resolveMatches removes triple` — `[1,1,1,2]` → bar `[2]`, removed length 3.
  - `noLossWhenSeventhMatches` — bar of 6 `[1,1,2,3,4,5]`, insert 1, resolve → length 4, `isLost` false.
  - `isLost at 7` — 7 distinct types → true.
- [ ] **Step 2:** Open `index.html?debug` in the browser; expect failures (rules undefined).
- [ ] **Step 3:** Implement `rules`.
- [ ] **Step 4:** Reload; expect `__selftest.failed === 0`.

### Task 2: Level generator

**Interfaces — Consumes:** Tile shape from Task 1. **Produces:**
- `LEVELS = {1:{types:3,pile:30,layers:2,stacks:0,stackSize:0}, 2:{types:14,pile:201,layers:9,stacks:2,stackSize:15}}`; debug override `2:{types:4,pile:12,layers:2,stacks:0,stackSize:0}`.
- `generator.makeLevel(levelNum, rng=Math.random) -> Tile[]`
- `generator.typePool(total, numTypes, rng) -> number[]` — each type gets a multiple of 3, spread as evenly as possible, shuffled.

Board grid is 14 units wide × 16 units tall (7×8 tiles). Per layer: pick random positions on the half-tile grid (layer parity alternates whole/half offsets so layers interleave), reject positions overlapping another tile on the same layer, distribute the pile count across layers with lower layers bigger. Stack tiles get `stack:'L'|'R'`, `stackIndex 0..14`.

- [ ] **Step 1:** Failing tests:
  - `level1 has 30 tiles, 3 types, each count %3==0`.
  - `level2 total = 231 and each type count %3==0` (201 + 30).
  - `no two tiles on same layer overlap` (level 2, 20 seeds).
  - `every tile within board bounds`.
  - `level 1 has at least one free tile`.
- [ ] **Step 2:** Run, expect fail. **Step 3:** Implement. **Step 4:** Run, expect pass.

### Task 3: Snack art

**Interfaces — Produces:** `art.SNACKS: Array<{name, svg: () => string}>` length 14, order: donut, cupcake, strawberry, cherry, ice cream, cookie, croissant, lollipop, candy, pudding, watermelon, cake, macaron, pretzel. `art.LEVEL1_TYPES = [0,10,4]` (donut, watermelon, ice cream — clearly distinct). Each svg uses `viewBox="0 0 100 100"`, thick dark outline (`stroke:#3b2a2a`, width ~4), simple shapes, some with small cute faces.

- [ ] **Step 1:** Failing test `14 snacks each return svg string containing viewBox`.
- [ ] **Step 2:** Implement the 14 drawings.
- [ ] **Step 3:** Debug gallery: `?debug&gallery` renders all 14 on tiles; screenshot and check each is recognizable and look-alike pairs (strawberry/cherry, cookie/donut, macaron/pudding) are distinguishable but similar.

### Task 4: Game state and helpers

**Interfaces — Consumes:** rules, generator. **Produces:** `createGame(opts)` returning object with:
- state: `{screen:'title'|'play'|'lost'|'won', level, board:Tile[], bar:Tile[], hold:Tile[], used:{pop,undo,shuffle}, lastMove:null|{tile, from:'board'|'hold', matched:boolean}, startTime, endTime}`
- actions: `start()`, `click(tileId) -> {ok, matched, removed, lost, levelCleared}`, `clickHold(tileId)`, `popOut()`, `undo()`, `shuffle()`, `canUndo()`.
- `onChange(cb)` subscription for UI.

Rules: `click` only acts when `screen==='play'` and the tile is in `board` and `isFree`. Level cleared when board, bar and hold are all empty → level 1 → `level=2` new board (helpers keep their used state); level 2 → `won`. `hold` max 3 tiles, not subject to covering. Shuffle permutes `type` among board tiles only. Best result: `{level, left}` or `{won:true, ms}`; better = won with lower ms > reached higher level > fewer tiles left.

- [ ] **Step 1:** Failing tests (using a fixed hand-built board injected via `opts.board`):
  - `click covered tile does nothing`.
  - `click same tile twice inserts once`.
  - `three clicks of same type empties bar`.
  - `seventh non-matching tile → screen lost`.
  - `clearing level 1 moves to level 2 keeping used helpers`.
  - `popOut moves up to 3 tiles to hold, then disabled`; `popOut with empty bar does not consume`.
  - `undo returns tile to board at same x,y,layer`; `undo disabled after a match`.
  - `shuffle preserves multiset of board types`, then disabled.
  - `best result comparison` cases.
- [ ] **Step 2:** Run, fail. **Step 3:** Implement. **Step 4:** Run, pass.

### Task 5: UI, animation, sound

**Interfaces — Consumes:** `createGame`, `art`. Renders title / play / lost / won screens.

- Board: absolutely positioned tiles; unit size computed from viewport so the 14×16 grid plus side stacks, hold row, bar and buttons fit in the window. Higher layers higher `z-index`. Non-free tiles get `filter: brightness(0.55)`, `cursor: default`.
- Tile style: cream face `#fff8e7`, dark outline, darker bottom/right edge (box-shadow), rounded corners.
- Side stacks: bottom-left and bottom-right, each tile offset 3px so depth is visible.
- Animations: fly-to-bar via FLIP transform (~200ms); match: scale squish then pop with sparkle particles (~300ms); loss: bar shakes red. Input is locked while a fly animation runs (`busy` flag).
- Top bar: "Level N", "Tiles left: N", mute button. Helper buttons labeled with icon + text, greyed when used/disabled.
- Background: pastel picnic-blanket gingham via CSS gradients.
- Sound (`sound` section): Web Audio synth `click()`, `pop()`, `lose()`, `win()`; muted state in `snackstack.muted`.
- Title shows best result text; lost screen "Run over! You reached Level X, N tiles left"; won screen shows run time `mm:ss`.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Open in browser, screenshot each screen, confirm layout fits at 1366×768 and 1920×1080.

### Task 6: End-to-end verification

- [ ] Normal mode: play Level 1 to completion; confirm Level 2 shows ~231 tiles with 2 side stacks; deliberately fill bar → lost screen → Try again resets to Level 1 with a different layout.
- [ ] Debug mode: win Level 2 → won screen with time; best result shown on title after reload.
- [ ] Each helper used once, buttons grey afterward and stay grey on Level 2.
- [ ] Mute persists after reload. Self-tests: `__selftest.failed === 0`. No console errors.
