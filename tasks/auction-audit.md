# Auction Feature Audit

## 1. Current User Flow

### Pre-Auction (Info Screen)
User sees a comprehensive auction guide covering budget (90 Cr), squad rules (max 25, min 18, max 8 overseas), player trait explanations with visual badges, and bidding tips. Tapping "Continue to Auction" dismisses the guide.

### Auction Start Screen
Three options: **Start Auction** (begins the live auction), **Auto-Complete** (AI handles everything, skips to dashboard), or **Back to Guide**.

### Main Auction Loop (per player)
1. **Player Card** renders with name, OVR rating, role, overseas badge, quick stats (BAT/BOWL/PWR), batting intent badge, trait badges (clickable for descriptions), collapsible DNA section, and base price.
2. **Current Bid Display** shows the live bid amount and highest bidder team name, with a scale animation on each bid change.
3. **User decides** via one of three paths:

| Path | Flow |
|------|------|
| **Manual Bid** | User taps Bid > API `bid()` > `simulateBidding()` > check state > if user highest: `finalizePlayer()` and show result; if AI highest: toast "Outbid by [team]", return to user turn |
| **Auto-Bid** | User enables checkbox, enters max cap in crore > single `autoBid(maxBid)` call > returns `won`, `lost`, `cap_exceeded`, or `budget_limit` > UI shows result or asks user to raise cap / pass |
| **Pass** | `quickPass()` > AI teams compete among themselves > player sold or unsold > show result |

4. **Result Modal** shows sold/unsold badge, price, winning team. Tapping "Next Player" calls `nextPlayer()` which either loads the next player or signals auction completion.

### Category Skip
From the Player List Drawer, user can skip an entire category (e.g., "Skip Bowlers"). All remaining players in that category are auctioned AI-only (user's team excluded). A results overlay shows each player's outcome.

### Auction End
If user's team has >= 11 players, navigate to Dashboard. If not, show "Season Disqualified" screen with a shortfall count and "Start New Career" button.

---

## 2. File Inventory

### Frontend (4 files, ~2,200 lines)
| File | Lines | Responsibility |
|------|-------|----------------|
| `src/pages/Auction.tsx` | 1,389 | Main page: info screen, start screen, auction loop, result modals, team grid, DNA section |
| `src/components/auction/PlayerListDrawer.tsx` | 509 | Slide-in drawer: categorized player lists (remaining + sold), skip-category button, skip results modal |
| `src/components/common/TraitBadge.tsx` | 167 | Trait badges (clutch, finisher, choker, etc.) with click-to-explain modals |
| `src/components/common/IntentBadge.tsx` | 136 | Batting intent badges (anchor, accumulator, aggressive, power_hitter) |

### Backend (4 files, ~2,400 lines)
| File | Lines | Responsibility |
|------|-------|----------------|
| `app/api/auction.py` | 703 | 13 REST endpoints for the auction lifecycle |
| `app/engine/auction_engine.py` | 788 | Core logic: initialization, AI bidding decisions, player valuation, competitive bidding loops |
| `app/models/auction.py` | 174 | Models: Auction, AuctionPlayerEntry, AuctionBid, TeamAuctionState |
| `app/api/schemas.py` (partial) | ~200 | Request/response schemas for auction endpoints |

### API Surface (13 endpoints)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/{id}/start` | POST | Initialize auction, create entries |
| `/{id}/state` | GET | Current player, bid, counts |
| `/{id}/teams` | GET | All 8 teams' budgets and squad composition |
| `/{id}/remaining-players` | GET | Category-grouped remaining + sold players |
| `/{id}/next-player` | POST | Advance to next player or complete auction |
| `/{id}/bid` | POST | User places a bid |
| `/{id}/pass` | POST | User passes (stub endpoint) |
| `/{id}/simulate-bidding` | POST | One round of AI counter-bidding |
| `/{id}/finalize-player` | POST | Settle current player as sold/unsold |
| `/{id}/auto-bid` | POST | Automated bidding up to user's max cap |
| `/{id}/quick-pass` | POST | Complete current player with AI-only bidding |
| `/{id}/skip-category/{cat}` | POST | Auto-auction all remaining in a category |
| `/{id}/auto-complete` | POST | Skip entire auction |

---

## 3. Unused / Redundant Code

### Redundant Utilities (DRY violation)
- **`formatPrice()`** is defined identically in both `Auction.tsx` (line 407) and `PlayerListDrawer.tsx` (line 66). Should be extracted to a shared `src/utils/format.ts`.
- **`getPlayerType()`** is defined identically in both `Auction.tsx` (line 415) and `PlayerListDrawer.tsx` (line 73). Same fix.

### Dead / Stub Endpoint
- **`POST /{id}/pass`** (backend `auction.py` line 296-311) returns `{"message": "Passed"}` with no actual logic. The frontend never calls it directly -- it uses `quickPass()` instead. This endpoint is dead weight and should be removed or wired up properly.

### Unused Model Field
- **`AuctionPlayerEntry.auction_set`** (default=1) exists for "multi-round auctions" but is never read or written anywhere in the engine or API. Dead field.

---

## 4. Bugs & Edge Cases

### Bug: `max_bid_possible` Goes Negative (Backend)
**File:** `app/models/auction.py`, line 168
**Issue:** When a team already has >= 18 players, `min_players_needed = 0`, so `slots_to_fill = 0 - 1 = -1`. This makes `reserved = -20,000,000`, which means `max_bid_possible = remaining_budget + 20M` -- the team can bid *more* than its actual budget.
**Fix:** `slots_to_fill = max(0, self.min_players_needed - 1)`

### Missing Error Handling: Team Squad Fetch (Frontend)
**File:** `Auction.tsx`, line 390-396
**Issue:** `careerApi.getSquad(careerId, selectedTeamId).then(...)` has no `.catch()`. If the API fails, the squad modal stays empty with no error feedback.

### No Double-Submit Protection on Pass
**File:** `Auction.tsx`
**Issue:** During manual bid sequence (`isManualBidding=true`), the Bid button is correctly disabled, but the Pass button remains enabled. Rapid tap on Pass could trigger concurrent mutations.

### Missing Input Validation on Max Bid Cap
**File:** `Auction.tsx`, line 313-318
**Issue:** `parseMaxBidCap()` uses `parseFloat` which accepts negative numbers, NaN, and extremely large values without bounds checking. Should clamp to `[0, remaining_budget]`.

### Mobile Keyboard Overlap
**File:** `Auction.tsx`, line 995-1002
**Issue:** The max bid cap text input sits in the middle-bottom area of the screen. On mobile portrait, the virtual keyboard can obscure this input since there's no scroll-into-view or keyboard-aware layout.

---

## 5. Areas for Improvement

### Code Quality
1. **Extract shared utilities** -- `formatPrice()`, `getPlayerType()` into `src/utils/format.ts`
2. **Remove dead `pass` endpoint** or merge its intent into `quickPass`
3. **Add explicit transactions** around `finalize_player()` in the engine (currently relies on SQLAlchemy implicit rollback)
4. **Add auction event logging** -- currently no server-side logging of bids, state transitions, or AI decisions. Would help debugging production issues.

### UX Polish
5. **Auction pacing feels mechanical** -- after each player, user must tap "Next Player" manually. There's no sense of auction momentum. A short auto-advance timer (3s) with a cancel option would improve flow.
6. **No bid history visible** -- the backend records all bids per player, but the frontend never displays them. Showing a live bid ticker ("Team A: 5.5 Cr > Team B: 6.0 Cr > You: 6.5 Cr") would add drama and context.
7. **DNA section defaults to collapsed** -- most users won't discover it. For marquee players (OVR 80+), it should auto-expand to surface the depth of the simulation.
8. **Category progress is hidden** -- user doesn't know how many players remain in the current category without opening the drawer. A small "Player 3/12 in Marquee" label in the header would help.
9. **No "undo" or bid withdrawal** -- once a bid is placed, there's no way to retract it before AI responds. Real auctions allow a brief window.
10. **Team comparison is tap-only** -- seeing your squad requires tapping a team chip, which opens a modal. A persistent mini-bar showing your squad breakdown (BAT: 3, BOWL: 2, AR: 1, WK: 0) would reduce cognitive load.

---

## 6. Three Mobile UX Improvements for Engagement

### Improvement 1: Live Bid War Ticker

**Problem:** When AI teams counter-bid during `simulateBidding()`, the user only sees the final result ("Outbid by KK at 8.5 Cr"). The entire bidding war between AI teams is invisible, making the auction feel like a single-step process rather than a competitive event.

**Proposal:** Replace the static bid display with a real-time scrolling ticker that shows each bid as it happens:

```
  ┌──────────────────────────────┐
  │  5.0 Cr  MT (You)    ●      │
  │  5.5 Cr  DC           ↑     │
  │  6.0 Cr  PL           ↑     │
  │  6.5 Cr  DC           ↑     │  ← auto-scrolls
  │  7.0 Cr  KK        current  │
  └──────────────────────────────┘
```

**Implementation approach:**
- Backend: Modify `simulate-bidding` to return the full list of bids placed in that round (not just the last one), or add a new `/{id}/bid-history/{player_id}` endpoint.
- Frontend: Animate each bid entry sliding in from the bottom with the team's primary color as a left-border accent. Use `framer-motion` `AnimatePresence` for enter/exit. Show a brief (300ms) scale pulse on the latest bid amount.
- Mobile: Stack vertically in a `max-h-[120px]` scrollable container below the player card. Auto-scroll to bottom on new bids.

**Impact:** Transforms the auction from "click and wait" into a spectator sport. Creates tension when bids climb. Makes the user feel like they're in a real auction room.

---

### Improvement 2: Budget Pressure Gauge

**Problem:** The user's remaining budget is shown as a plain number ("32.5 Cr remaining") in the header. There's no visual sense of *urgency* -- whether 32.5 Cr is comfortable or dangerously low depends on how many squad slots remain. The user has to do mental math.

**Proposal:** Replace the budget number with an animated pressure gauge that combines budget, squad slots, and overseas count into a single visual:

```
  ┌──────────────────────────────────┐
  │  BUDGET        ████████░░  72%   │
  │  32.5 Cr / 45.0 Cr effective     │
  │                                   │
  │  SQUAD  ██████████████░░  14/18  │
  │  OVERSEAS  ████████░░░░░   5/8   │
  │                                   │
  │  ⚠ 4 slots left, avg 8.1 Cr each │
  └──────────────────────────────────┘
```

**Implementation approach:**
- Frontend: New `<BudgetGauge>` component replacing the current budget text in the sticky header.
  - **Budget bar**: Green > 60%, amber 30-60%, red < 30%. Width = `remaining_budget / salary_cap * 100`.
  - **Effective budget**: `max_bid_possible` (accounts for reserved slots). Shows what user can actually spend on this player.
  - **Squad bar**: Fills as players are bought. Minimum line at 18. Maximum at 25.
  - **Overseas bar**: Same, max 8.
  - **Warning text**: When `remaining_budget / slots_remaining < 3 Cr`, show amber warning. When < 2 Cr, show red "Critical" warning.
- Animate bar transitions with `framer-motion layout` for smooth width changes after each purchase.

**Impact:** Eliminates mental math. Creates escalating tension as the budget shrinks. The color transitions from green to amber to red create a natural sense of urgency that drives faster, more engaged decisions.

---

### Improvement 3: Swipe-to-Bid / Swipe-to-Pass Gesture Controls

**Problem:** The current bid/pass flow requires tapping small buttons and sometimes typing a bid cap value. On mobile, this is fiddly -- especially in the heat of an auction where quick decisions matter. The keyboard popup for max-bid-cap obscures the player card.

**Proposal:** Add swipe gesture controls as the primary mobile interaction:

```
  ← SWIPE LEFT: Pass          SWIPE RIGHT: Bid →

  ┌──────────────────────────────────┐
  │        [Player Card]             │
  │                                  │
  │   ← 🔴 PASS    BID 🟢 →        │  ← hint arrows
  │                                  │
  └──────────────────────────────────┘

  On swipe right (bid):
  - Short swipe (< 50% screen): Bid at minimum increment
  - Long swipe (> 50% screen): Opens auto-bid sheet with slider

  On swipe left (pass):
  - Haptic feedback + red flash
  - Quick-passes the player immediately
```

**Implementation approach:**
- Use `framer-motion` drag gesture on the player card: `drag="x"` with `dragConstraints` and `onDragEnd` handler.
- **Right swipe**: Card slides right with green tint overlay, "BID" text appears. On release past threshold, trigger `bid()` mutation. Below-threshold: spring back.
- **Left swipe**: Card slides left with red tint overlay, "PASS" text appears. On release past threshold, trigger `quickPass()`.
- **Long right swipe** (> 60% screen width): Instead of instant bid, open a bottom sheet with a continuous slider for setting auto-bid max cap. Slider range: `current_bid` to `max_bid_possible`. No keyboard needed.
- Keep existing buttons as fallback for accessibility. Swipe is additive, not exclusive.
- Add subtle directional hint arrows that pulse on first 3 players, then fade.

**Impact:** Makes the auction feel like a native mobile game rather than a web form. Swipe gestures are the most natural mobile interaction pattern. Eliminates the keyboard-overlap problem for auto-bid cap entry. Creates a visceral, physical connection to bid decisions.

---

## 7. Action Plan

### Phase A: Quick Wins (1-2 hours)
| # | Task | Files |
|---|------|-------|
| A1 | Extract `formatPrice()` and `getPlayerType()` to shared `src/utils/format.ts` | Auction.tsx, PlayerListDrawer.tsx, new utils file |
| A2 | Fix `max_bid_possible` negative slots bug | `app/models/auction.py` line 168 |
| A3 | Remove dead `POST /pass` endpoint | `app/api/auction.py` |
| A4 | Add `.catch()` to team squad fetch | `Auction.tsx` line 390 |
| A5 | Disable Pass button during `isManualBidding` | `Auction.tsx` |
| A6 | Add input validation to max bid cap (clamp to 0..remaining) | `Auction.tsx` line 313 |

### Phase B: Budget Pressure Gauge (2-3 hours)
| # | Task | Files |
|---|------|-------|
| B1 | Create `<BudgetGauge>` component with budget/squad/overseas bars | New: `src/components/auction/BudgetGauge.tsx` |
| B2 | Replace budget text in Auction.tsx header with BudgetGauge | `Auction.tsx` header section |
| B3 | Add warning logic (amber < 30%, red < 15%) | BudgetGauge.tsx |
| B4 | Add "avg per remaining slot" calculation and display | BudgetGauge.tsx |

### Phase C: Live Bid War Ticker (3-4 hours)
| # | Task | Files |
|---|------|-------|
| C1 | Backend: Return bid list from `simulate-bidding` (or add bid-history endpoint) | `app/api/auction.py`, `app/engine/auction_engine.py` |
| C2 | Create `<BidTicker>` component with animated bid entries | New: `src/components/auction/BidTicker.tsx` |
| C3 | Integrate ticker below player card in auction loop | `Auction.tsx` |
| C4 | Auto-scroll, team color accents, pulse animation on latest bid | BidTicker.tsx |

### Phase D: Swipe Gesture Controls (4-5 hours)
| # | Task | Files |
|---|------|-------|
| D1 | Add drag gesture to player card using `framer-motion` | `Auction.tsx` player card section |
| D2 | Implement swipe-right-to-bid with green overlay | `Auction.tsx` |
| D3 | Implement swipe-left-to-pass with red overlay | `Auction.tsx` |
| D4 | Build bottom-sheet slider for auto-bid cap (replaces keyboard input) | New: `src/components/auction/AutoBidSheet.tsx` |
| D5 | Add directional hint arrows for first 3 players | `Auction.tsx` |
| D6 | Haptic feedback via `navigator.vibrate()` on swipe completion | `Auction.tsx` |

### Recommended Order
**A (bugs/cleanup) > B (budget gauge) > C (bid ticker) > D (swipe gestures)**

Phases A and B are independent and can be done in a single session. Phase C requires a small backend change. Phase D is the most ambitious but has the highest engagement impact.

---

## 8. Skip Player / Skip Category UX Deep Dive

### Current Skip Flow

There are two "skip" mechanisms:

1. **Per-Player Pass** (`quickPass`): On the main auction screen, a "Pass" button sits in a 2-column grid next to "Bid". Tapping it triggers `quickPassMutation` → AI teams compete for the current player → result modal appears.

2. **Category Skip** (`skipCategory`): User must open the `PlayerListDrawer` (slide-in from right) → navigate to the active category tab → scroll to the bottom → tap "Skip [Category] Category" → confirm in a dialog → wait for spinner → see flat results list → tap "Continue Auction".

### Problems Identified

#### Problem 1: Category Skip is Buried (High Friction)
The skip category button requires **4 taps and a drawer open** just to reach: (1) open drawer, (2) ensure active tab, (3) scroll to bottom, (4) tap "Skip [Category]", then (5) confirm. For something that should be a quick "I don't care about bowlers, move on" decision, this is too much friction. Most users won't even discover this feature exists.

**Location:** `PlayerListDrawer.tsx` lines 423-437

#### Problem 2: No Per-Player Skip from Drawer
The drawer shows a full list of upcoming players with names, ratings, and base prices — perfect for previewing. But there's no way to act on individual players from the drawer. If user sees 8 remaining bowlers and only wants 2, they can either skip-all (loses access to 2 they wanted) or manually pass on each one (6 taps + waits). There's no middle ground like "mark players to skip."

#### Problem 3: Skip Results Are a Flat Wall of Text
The skip results modal (`PlayerListDrawer.tsx` lines 173-241) shows every player in a single unstructured list. For a 15-player category skip, this is an overwhelming wall of cards. There's no summary header (e.g., "8 sold, 7 unsold, total spent: 42 Cr"), no grouping by sold/unsold, no indication of which teams benefited most (did one rival snap up 4 marquee players?).

#### Problem 4: No Preview of Consequences Before Skipping
The confirmation dialog (`PlayerListDrawer.tsx` lines 450-502) says "All N remaining [Category] players will be auctioned instantly with AI teams competing for them. You won't be able to bid on these players." — but doesn't preview:
- Which specific players you're giving up (their ratings, star players)
- How other teams might benefit (team needs vs available players)
- Budget impact ("You'll save your 32 Cr budget for remaining categories")

The user is making a blind decision about potentially 15+ players.

#### Problem 5: No Progress Indicator During Category Skip
When skipping a large category, the user sees a generic spinner and "Auctioning players..." text (`PlayerListDrawer.tsx` lines 279-283). For 15+ players, this could take several seconds. There's no progress bar, no player-by-player reveal, no indication of how much is left. The wait feels dead.

#### Problem 6: Quick Pass Button on Main Screen Lacks Context
The "Pass" button on the main auction screen (`Auction.tsx` line 1031-1038) is a small secondary button with just the text "Pass". For users who want to quickly skip through low-interest players, there's no visual preview of who's next — they pass on one player, wait for the result, tap "Next Player", see the new card, decide to pass again. Each pass is a 3-step loop.

### Proposed Improvements

#### Skip Improvement 1: Surface Skip Category as a Sticky Action Bar

**Problem it solves:** Category skip is buried in the drawer.

**Proposal:** Add a subtle "Skip remaining [N] [Category]" link/button at the top of the main auction screen, visible when there are 3+ remaining players in the current category. This surfaces the action without requiring drawer navigation.

```
  ┌──────────────────────────────────┐
  │ Marquee  •  Player 5/12         │
  │ ┌────────────────────────────┐   │
  │ │ Skip remaining 7 Marquee ▸│   │
  │ └────────────────────────────┘   │
  │                                  │
  │       [Player Card]              │
  │                                  │
  │     [Bid]     [Pass]             │
  └──────────────────────────────────┘
```

**Implementation:** Add a small text button below the category progress header in `Auction.tsx`. Tap triggers the same `skipCategoryMutation`. Keeps the drawer version as secondary access.

**Files:** `Auction.tsx` (add sticky link near header)

---

#### Skip Improvement 2: Skip Results Summary Card + Grouping

**Problem it solves:** Results are a flat, overwhelming list.

**Proposal:** Replace the flat list with a structured summary:

```
  ┌──────────────────────────────────┐
  │      Category Completed          │
  │                                  │
  │  ┌──────────┐  ┌──────────┐     │
  │  │ 8 Sold   │  │ 4 Unsold │     │
  │  │ 42.5 Cr  │  │          │     │
  │  └──────────┘  └──────────┘     │
  │                                  │
  │  Top Buys:                       │
  │  ● DC bought V.Kohli (12 Cr)    │
  │  ● KK bought J.Root (8.5 Cr)    │
  │                                  │
  │  ▾ Show all 12 results           │
  │                                  │
  │  [Continue Auction]              │
  └──────────────────────────────────┘
```

**Implementation:**
- Add summary stats at top: sold count, unsold count, total amount spent by AI teams
- Highlight "Top Buys" — top 3 most expensive purchases, with team name and price
- Collapse the full list behind a "Show all" toggle, expanded by default only for small lists (< 6 results)
- Group sold and unsold players separately within the expanded list

**Files:** `PlayerListDrawer.tsx` (skip results modal, lines 173-241)

---

#### Skip Improvement 3: Quick-Skip Queue (Batch Individual Passes)

**Problem it solves:** No middle ground between pass-one and skip-all.

**Proposal:** In the player list drawer, add a toggle/checkbox on each upcoming player: "Skip" or "Want". By default all are un-toggled. User can mark specific players as "Skip" (red) or leave them for normal auction flow. A "Process Skips" button at bottom batch-passes all marked players.

```
  ┌──────────────────────────────────┐
  │ Remaining (7)                    │
  │                                  │
  │  ☐ V. Kumar     85 ★  5.0 Cr   │
  │  ☑ R. Patel     62 ★  2.0 Cr   │  ← marked to skip
  │  ☑ S. Singh     58 ★  2.0 Cr   │  ← marked to skip
  │  ☐ A. Sharma    78 ★  4.0 Cr   │
  │  ...                             │
  │                                  │
  │  [Skip 2 Selected Players]       │
  └──────────────────────────────────┘
```

**Backend change:** This would need a new endpoint (e.g., `POST /{id}/batch-pass`) that accepts a list of player IDs and processes them in order through `quick_pass_player()`, skipping to the next player in the auction order that isn't in the skip list when the user's turn comes.

**Complexity note:** This is the most complex improvement and could be simplified to just reordering — "deprioritize" marked players to the end of the category, so user handles interesting ones first and can then skip-category for the rest.

**Files:** Backend: `auction.py`, `auction_engine.py` (new endpoint). Frontend: `PlayerListDrawer.tsx` (checkboxes + batch action)

---

#### Skip Improvement 4: Quick-Pass Streak Mode

**Problem it solves:** Passing individual players is a 3-step loop (Pass → result → Next Player).

**Proposal:** Add a "Quick Mode" toggle on the main auction screen. When enabled, passing a player auto-advances to the next player without showing the result modal. Results are queued in a small ticker at the top. User can exit quick mode by tapping "Bid" on any player they want.

```
  ┌──────────────────────────────────┐
  │ ⚡ Quick Mode ON                 │
  │ ┌────────────────────────────┐   │
  │ │ Skipped: R.Patel → DC 3Cr │   │  ← auto-fading ticker
  │ └────────────────────────────┘   │
  │                                  │
  │       [Player Card]              │
  │                                  │
  │     [Bid]     [Quick Pass ▸▸]    │
  └──────────────────────────────────┘
```

**Implementation:** When quick mode is ON and user taps Pass:
- `quickPassMutation` fires
- On success, instead of `setPhase('auction_end')`, immediately call `nextPlayerMutation`
- Show result as a small auto-dismissing toast (team name + price)
- Player card crossfades to next player without intermediate modal

**Files:** `Auction.tsx` (toggle state, modified quickPass onSuccess, toast instead of result modal)

---

### Skip UX Action Plan

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| S1 | Surface "Skip remaining N" link on main auction screen | Small | High | `Auction.tsx` |
| S2 | Add summary card (sold/unsold counts, top buys, total spend) to skip results | Small | Medium | `PlayerListDrawer.tsx` |
| S3 | Group skip results into sold/unsold sections with collapse toggle | Small | Medium | `PlayerListDrawer.tsx` |
| S4 | Add category progress label ("Player 5/12 in Marquee") to main screen header | Small | Medium | `Auction.tsx` |
| S5 | Quick-Pass Streak Mode (auto-advance, toast results) | Medium | High | `Auction.tsx` |
| S6 | Add key player preview to skip confirmation dialog (top 3 players by rating) | Small | Medium | `PlayerListDrawer.tsx` |
| S7 | Add progress bar during category skip (X of N auctioned) | Medium | Low | Backend: streaming or polling; Frontend: `PlayerListDrawer.tsx` |
| S8 | Quick-Skip Queue with per-player checkboxes (batch pass) | Large | Medium | Backend: `auction.py`, `auction_engine.py`; Frontend: `PlayerListDrawer.tsx` |

**Recommended order:** S1 + S4 (instant wins) → S2 + S3 + S6 (skip results polish) → S5 (streak mode) → S7 + S8 (advanced)
