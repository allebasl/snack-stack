# Snack Stack — Design Spec

Date: 2026-11-03

## Goal

A small, cute-looking but brutally hard tile-stacking browser game the user can play on any computer by opening one HTML file. Roguelike feel: losing wipes the whole run, everything is re-randomized every time.

## Platform

- Single file `snack-stack/index.html` (HTML + CSS + plain JavaScript, no libraries, no internet needed).
- All tile art is hand-made inline SVG drawn in code (no emoji, no image files), so it looks identical on every computer.
- Mouse input first. Touch support is a later phase (not in this version), but layout uses pointer events so it's easy to add.

## Core rules

- Tiles are stacked in overlapping layers. A tile is **clickable only if no tile on a higher layer overlaps it**.
- Covered tiles are drawn **darker but still show their snack**, so the player can plan ahead.
- Clicking a free tile moves it into the **7-slot bar** at the bottom. It is inserted right after any identical tiles already in the bar (otherwise at the end).
- When **3 identical tiles** are in the bar, they are removed (pop animation).
- If the bar holds **7 tiles after match-checking**, the run is lost.
- Clearing every tile on the board (including side stacks) completes the level.

## Levels and run structure

A run = Level 1 then Level 2. Losing on either level ends the run; "Try again" starts a new run at Level 1 with everything re-randomized.

| | Level 1 (warm-up) | Level 2 (the wall) |
|---|---|---|
| Snack types | 3 | 14 (includes look-alike pairs) |
| Main pile | 30 tiles, 2 layers | ~200 tiles, 8–10 layers |
| Side stacks | none | 2 stacks × 15 tiles (bottom-left, bottom-right) |
| Total | 30 | ~230 (exact total always a multiple of 3) |

### Randomness

- **Fully random, no solvability check.** Some runs are unwinnable by design.
- Each run: tile positions are generated randomly per layer on a half-tile grid (so tiles partially overlap tiles below), then snack types are assigned by shuffling a pool where every type appears a multiple of 3 times.
- Side stacks: tiles stacked with a small offset; only the top tile is free.

## Helpers

Three buttons under the bar. Each can be used **once per run** (not per level). Used buttons are greyed out.

1. **Pop out** — moves up to 3 tiles from the left of the bar into a holding row above the bar. Tiles in the holding row are clickable and go back into the bar when clicked.
2. **Undo** — returns the last tile placed into the bar back to its original board position. Cannot undo a match that already popped (button is disabled in that case).
3. **Shuffle** — randomly reassigns snack types among all tiles still on the board (positions stay the same).

## Screens

- **Title:** game name "Snack Stack", Play button, best result line (e.g. "Best: Level 2, 41 tiles left"; or "Best: Cleared in 12:34"). Best result saved in `localStorage`.
- **Game:** top bar shows level number, tiles remaining, and mute toggle. Board in the center, side stacks bottom-left/right, holding row, 7-slot bar, 3 helper buttons.
- **Run over:** "Run over! You reached Level X, N tiles left" + Try again.
- **Win:** celebration screen with total run time + Play again.

## Art and feel

- Background: soft pastel picnic-blanket pattern.
- Tiles: cream face, thick dark cartoon outline, slightly darker bottom/right edge for a 3D look.
- 14 snacks (simple, cute, some with tiny faces): donut, cupcake, strawberry, cherry, ice cream cone, cookie, croissant, lollipop, candy (wrapped), pudding, watermelon slice, cake slice, macaron, pretzel. Look-alike pairs on purpose: strawberry/cherry, cookie/donut, macaron/pudding.
- Level 1 uses 3 clearly different snacks.
- Animations: tile slides from board to bar; 3-match squish + pop + sparkles; bar shakes red on loss.
- Sounds: generated with Web Audio (click, pop, lose, win). Mute toggle, remembered in `localStorage`.

## Code structure (inside the one file)

- `art` — SVG drawing functions, one per snack.
- `generator` — builds a level's tile list `{id, type, x, y, layer, stack?}` from level config + random seed.
- `rules` — pure functions: `isFree(tile, tiles)`, `insertIntoBar(bar, tile)`, `resolveMatches(bar)`, `isLost(bar)`, `isCleared(tiles)`.
- `game` — run state (level, tiles, bar, holding row, helpers used, timer), handles clicks and helpers.
- `ui` — renders board/bar/screens from state, runs animations and sound.

## Testing

- Debug mode via URL `index.html?debug`: Level 2 is tiny (e.g. 12 tiles), and the console exposes the `rules` functions plus quick self-checks (free/covered detection, bar insertion order, 3-match removal, loss at 7, helpers).
- Manual play-through in a browser: win path and loss path for both levels, each helper once, mute, best-result saving.

## Out of scope (this version)

- Touch/mobile layout (next phase).
- Solvability guarantee, levels beyond 2, accounts, online leaderboard.
