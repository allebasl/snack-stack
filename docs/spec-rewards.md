# Snack Stack — Rewards & Collection Spec

Date: 2026-11-10

## Goal

Give rare, cute rewards for beating Level 2: fancy-dressed animal characters (who become your on-screen buddy) and card skins (new tile looks). All art is code-drawn SVG in the same thick-outline style as the snacks.

## Rewards (12)

| id | kind | name |
|---|---|---|
| `princess_sheep` | character | Princess sheep |
| `gentleman_sheep` | character | Gentleman sheep |
| `queen_sheep` | character | Queen sheep |
| `frilly_cat` | character | Cat in a frilly dress |
| `bunny_ballerina` | character | Bunny ballerina |
| `frog_prince` | character | Frog prince |
| `bear_wizard` | character | Bear wizard |
| `skin_strawberry` | skin | Strawberry milk |
| `skin_mint` | skin | Mint picnic |
| `skin_starry` | skin | Starry night |
| `skin_cookie` | skin | Cookie |
| `golden_sheep` | character | Golden sheep (gold gown + gold crown) |

- `skin_classic` (today's look) is always owned and is the default skin.
- Character and skin art come from the approved samples in `_samples/code-samples.html`. Golden sheep is new: the princess-sheep shape in gold.

## Earning

- Rewards are granted **only when Level 2 is cleared** (the win screen).
- After a win, before the win screen, a **mystery-card screen** shows `n = min(3, pool size)` face-down cards. The pool = all rewards not owned, **excluding `golden_sheep`**. Cards draw distinct random items from the pool.
- The player taps one card: it flips and shows the reward's art and name. That reward is owned. The other cards then flip to show what they were ("You could have had…"), and return to the pool (nothing else changes).
- Then a "Continue" button leads to the normal win screen.
- When all 11 pool rewards are owned, `golden_sheep` is granted automatically on that same win, shown with its own reveal ("Collection complete!").
- If the pool is empty and golden is owned, no mystery screen appears.
- A newly won character is auto-equipped as buddy if no buddy is set. A newly won skin is not auto-equipped.

## Collection album

- Title screen gets a **Collection** button (with "N / 12" count).
- Album is an overlay with two tabs: **Characters** (8 slots) and **Skins** (5 slots incl. Classic).
- Owned items show their art and name; unowned show a dark silhouette with "?" and no name.
- Tapping an owned character equips it as buddy (tap again to unequip → no buddy). Tapping an owned skin equips it. Equipped item has a highlighted border and "Equipped" label.
- Close button returns to the title.

## Buddy

- Shown during play, small (about 1.5 tiles wide × 1.7 tiles tall), in the gap left of the 3 hold slots: below the left side stack and above the tray, so it never covers tiles. Not shown if no buddy equipped.
- Reactions (CSS animations, no new art per mood except a face swap):
  - idle: gentle breathing bob
  - 3 tiles pop: happy bounce
  - tray has ≥5 tiles: nervous wobble (continues while ≥5)
  - lose: sad droop (sinks and tilts)
  - win: dance (side-to-side hop)
- Purely visual. No gameplay effect.

## Skins

- A skin sets CSS variables on the stage: tile face colour, face pattern, 3D edge colour, outline colour. Applies to board tiles, side stacks, hold and tray tiles, and the stack-depth bases. Snack drawings are unchanged.
- Equipped skin applies immediately (also on the title screen preview behind the overlay).

## Saving

- `localStorage` key `snackstack.collection` = `{ owned: string[], buddy: string|null, skin: string }`. Read/write wrapped in try/catch; on failure the game works with an in-memory collection (rewards are lost on reload).
- Unknown ids in saved data are ignored.

## Testing aid

- While `SHOW_SKIP` is true, Level 2 shows a temporary **Test win** button in the top bar that clears the level instantly (counts as a real win: rewards + best time).

## Code structure

Split the single `index.html` into files (all classic `<script src>` so it still works via file:// and GitHub Pages):

| file | job |
|---|---|
| `index.html` | markup, CSS, script tags |
| `js/art-snacks.js` | 14 snack SVGs (existing `art`) |
| `js/art-characters.js` | 8 character SVGs + 5 skin definitions |
| `js/rules.js` | `rules` + `generator` (unchanged logic) |
| `js/game.js` | `createGame`, `isBetterResult` |
| `js/rewards.js` | `REWARDS` list, `createCollection(storage)`, `drawMysteryCards(collection, rng)`, `claim(id)`, golden logic |
| `js/sound.js` | sound |
| `js/ui.js` | rendering, screens, album, mystery cards, buddy |
| `js/selftest.js` | tests (run with `?debug`) |

## Tests (selftest, `?debug`)

- pool excludes owned and golden; draws ≤3 distinct; draws fewer when pool is small; empty pool → 0 cards.
- claim adds to owned once; claiming an owned id is a no-op.
- golden granted when all 11 owned, not before.
- first character won auto-equips buddy; skins don't auto-equip.
- save/load round-trip; corrupted or blocked storage falls back to defaults without throwing; unknown ids dropped.
- equip rules: only owned items equip; unequip buddy works; classic always equippable.
- every reward id has art (character svg or skin definition).
- UI: after a test win, mystery screen shows `min(3, pool)` cards; tapping one adds it to owned.
- Existing 40 tests keep passing after the file split.

## Out of scope

- Cross-device sync, accounts, more rewards beyond these 12, buddy perks.
