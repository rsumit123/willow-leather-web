# Phase 2: v2 Engine UI — Captain's Tactical Interface

## Context

Phase 1 (v2 engine integration into production APIs) is complete and deployed. The backend now has DNA-based matchups (BatterDNA, PacerDNA/SpinnerDNA), delivery repertoires (7 pacer + 5 spinner deliveries), 6 pitch types, and stat compression — but the frontend still shows the v1 UI: simple 3-level aggression (defend/balanced/attack), flat stat bars (BAT/BOWL/PWR), and no delivery selection or DNA visibility.

Phase 2 transforms the UI into a **Captain's Tactical Interface** — giving the user the tools to make meaningful cricket decisions: choosing deliveries when bowling, setting batting approaches, seeing DNA-based scouting reports, and understanding matchup advantages. The goal is a mobile-first, modern, uncluttered experience that makes T20 tactics feel strategic and immersive.

**Design principles:**
- Mobile-first (375px primary target, 428px max-width containers)
- Progressive disclosure — show summary by default, details on tap
- Glassmorphism dark theme (existing design system: dark-950 base, pitch-green, ball-red)
- No clutter: every pixel must earn its place
- Existing tech stack: React 19 + TypeScript + Tailwind + Framer Motion + Lucide icons

---

## Part 1: Backend API Changes

These API changes expose DNA data and accept delivery selections from the frontend.

### 1.1 New schemas (`app/api/schemas.py`)

```
BatterDNABrief:
  vs_pace, vs_bounce, vs_spin, vs_deception, off_side, leg_side, power: int
  weaknesses: list[str]

BowlerDNABrief:
  type: str  ("pacer" | "spinner")
  # Pacer fields:
  speed: Optional[int], swing: Optional[int], bounce: Optional[int], control: Optional[int]
  # Spinner fields:
  turn: Optional[int], flight: Optional[int], variation: Optional[int], control: Optional[int]

DeliveryOption:
  name: str             # "bouncer", "yorker", "stock_ball", etc.
  display_name: str     # "Bouncer", "Yorker", "Stock Ball"
  description: str      # "Short pitched, targets the body"
  exec_difficulty: int   # 30-58 scale
  targets_weakness: Optional[str]  # null or "vs_bounce" — helps UI highlight matchup tips

PitchInfoResponse:
  name: str
  display_name: str     # "Green Seamer", "Dust Bowl", etc.
  pace_assist: int
  spin_assist: int
  bounce: int
  deterioration: int
```

**Modify existing schemas:**

- `PlayerStateBrief` — add optional `batting_dna: BatterDNABrief` (only when user is bowling, to support scouting)
- `BowlerStateBrief` — add optional `bowling_dna: BowlerDNABrief`
- `MatchStateResponse` — add:
  - `pitch_info: Optional[PitchInfoResponse]` (full pitch DNA summary)
  - `available_deliveries: Optional[list[DeliveryOption]]` (when user is bowling, what deliveries current bowler can throw)
  - `last_delivery_name: Optional[str]` (what delivery was just bowled — for ball display enrichment)
- `BallRequest` — add optional `delivery_type: Optional[str]` (null = engine auto-picks)
- `BallResultResponse` — add:
  - `delivery_name: Optional[str]` (what was bowled)
  - `contact_quality: Optional[str]` (for enriched ball display)
- `AvailableBowlerResponse` — add:
  - `bowling_dna: Optional[BowlerDNABrief]`
  - `repertoire: list[str]` (list of delivery names this bowler can bowl)
- `PlayerResponse` — add optional `batting_dna: Optional[BatterDNABrief]` and `bowling_dna: Optional[BowlerDNABrief]` (for player detail views)

### 1.2 Match API changes (`app/api/match.py`)

- `play_ball()`: Read `request.delivery_type` (optional). If provided and user is bowling, pass it to `engine.simulate_ball()` instead of letting the engine auto-pick. If user is batting, ignore it.
- `_get_match_state_response()`: When `is_user_batting=False` (user bowling), populate `available_deliveries` from the current bowler's repertoire and `striker.batting_dna` for scouting. Include `pitch_info` always.
- `_get_available_bowlers()`: Add `bowling_dna` and `repertoire` to each bowler's response.

### 1.3 Player API changes (`app/api/career.py` or `app/api/squad.py`)

- Squad/player detail endpoints: Include `batting_dna` and `bowling_dna` in `PlayerResponse` when the player has DNA data. This enables DNA display in PlayerDetailModal, auction, squad, and playing XI screens.

### 1.4 New endpoint: Scout report

```
GET /match/{career_id}/match/{fixture_id}/scout/{player_id}
```
Returns the full DNA of an opponent batter (when user is bowling) — used for the "tap to scout" feature during match. Lightweight endpoint, reads from DB player model.

**Files modified (backend):**
- `app/api/schemas.py` — new schemas + modify existing ones
- `app/api/match.py` — delivery_type handling, DNA in responses
- `app/api/career.py` — DNA in player detail responses
- `app/engine/match_engine_v2.py` — accept optional `delivery_type` param in `simulate_ball()`
- `app/engine/deliveries.py` — add `display_name` and `description` fields to Delivery dataclass

---

## Part 2: Live Match Screen Redesign

The live match screen (`Match.tsx`) is the core of Phase 2. Current layout (top → bottom): ScoreHeader → BallDisplay → BattingSection → BowlingSection → ThisOver → TacticsPanel (fixed bottom). This gets a significant redesign.

### 2.1 New Layout Architecture

```
┌─────────────────────────────────┐
│  ScoreHeader (compact)          │  ← Same but with pitch badge
├─────────────────────────────────┤
│  CommentaryBanner               │  ← Ball result + delivery name
├─────────────────────────────────┤
│  MatchupPanel                   │  ← NEW: Batter vs Bowler DNA face-off
│  (when batting: batter stats)   │
│  (when bowling: scout + tips)   │
├─────────────────────────────────┤
│  ThisOver                       │  ← Same
├─────────────────────────────────┤
│                                 │
│  TacticsPanel (fixed bottom)    │  ← REDESIGNED: Context-aware
│  Batting mode: aggression pick  │
│  Bowling mode: delivery picker  │
│                                 │
└─────────────────────────────────┘
```

### 2.2 ScoreHeader update (`ScoreHeader.tsx`)

**Changes:**
- Add a small pitch badge chip next to the overs: e.g. a colored dot + "Green Seamer" in tiny text
- Pitch colors: green_seamer=emerald, dust_bowl=amber, flat_deck=gray, bouncy_track=orange, slow_turner=purple, balanced=blue
- No other changes — the current score header is clean and works well

### 2.3 CommentaryBanner (replaces `BallDisplay.tsx`)

**Replaces** the current BallDisplay with a richer commentary display:
- Still shows outcome circle (W/4/6/0/1/2/3) with color coding
- Adds small delivery name tag below outcome: "Bouncer" / "Yorker" / "Stock Ball"
- Commentary text stays the same
- Contact quality shown as subtle icon: "middled" = bat icon green, "edged" = bat icon amber, "beaten" = bat icon red

This is a reskin of BallDisplay, not a new component.

### 2.4 MatchupPanel (NEW component — `MatchupPanel.tsx`)

This is the key new addition. A compact card that replaces BattingSection + BowlingSection with a unified matchup view.

**When user is BATTING (user's team at bat):**
```
┌─────────────────────────────────────┐
│ BATTING                             │
│ ┌─────────────────────────────────┐ │
│ │ Striker*  R Sharma    45 (32)   │ │
│ │ [Set] [Clutch]  4s:3  6s:2     │ │
│ ├─────────────────────────────────┤ │
│ │ Non-Str   V Kohli    12 (8)    │ │
│ │ [Aggressive]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ vs  J Bumrah (Pace, 2-24, 3.0ov)   │
│     [Tired] [Death Specialist]      │
│                                     │
│ Partnership: 34 runs                │
└─────────────────────────────────────┘
```

Essentially the current BattingSection + BowlingSection merged into one card with improved spacing. The "vs" connector makes it feel like a face-off.

**When user is BOWLING (opponent at bat) — THE BIG ADDITION:**
```
┌─────────────────────────────────────┐
│ ⚔ MATCHUP                          │
│ ┌──────────┐    ┌──────────────────┐│
│ │ Striker   │ vs │ Your Bowler      ││
│ │ AB de V.  │    │ R Ashwin         ││
│ │ 23 (14)   │    │ 1-18 (2.0)       ││
│ │ ⚠ vs_spin │    │ Off Spin         ││
│ │   38/100  │    │ Turn: 78         ││
│ └──────────┘    └──────────────────┘│
│                                     │
│ 💡 Tip: Weak against spin.          │
│    Try flighted or arm ball.        │
└─────────────────────────────────────┘
```

Key features:
- Shows the striker's **weakness** (from batting_dna) if relevant to current bowler type
- Shows a single bowler DNA stat that's most relevant (e.g. "Turn: 78" for spinner)
- Shows a **tactical tip** based on matchup analysis (derived from comparing bowler DNA vs batter DNA weaknesses)
- Tapping the batter name opens a quick DNA radar/summary (see 2.5)
- This data comes from `MatchStateResponse.striker.batting_dna` + `bowler.bowling_dna`

### 2.5 DNA Scout Popup (NEW component — `ScoutPopup.tsx`)

A bottom-sheet popup triggered by tapping a batter's name in the MatchupPanel (when bowling). Shows:

```
┌─────────────────────────────────────┐
│  ╳  SCOUT: AB de Villiers           │
│─────────────────────────────────────│
│                                     │
│  vs Pace     ████████░░  78        │
│  vs Bounce   ███░░░░░░░  38  ⚠    │
│  vs Spin     ██████░░░░  62        │
│  vs Deception████████░░  76        │
│  Off Side    ███████░░░  72        │
│  Leg Side    █████████░  85        │
│  Power       ██████░░░░  65        │
│                                     │
│  Weaknesses: vs_bounce, vs_spin     │
│                                     │
│  [Close]                            │
└─────────────────────────────────────┘
```

- Simple horizontal bar chart with red highlight on weakness stats
- Uses Framer Motion slide-up animation
- Only available when user is bowling (you wouldn't know opponent's full DNA when batting — that's game knowledge)

### 2.6 TacticsPanel Redesign (`TacticsPanel.tsx`)

The biggest change. The tactics panel becomes **context-aware** based on whether the user is batting or bowling.

**BATTING MODE (is_user_batting=true):**
```
┌─────────────────────────────────────────┐
│  [🛡 Defend] [⚖ Balanced] [⚡ Attack]   │  ← Same iOS segmented control
│                                         │
│  [ ▶ Play Next Ball ]                   │  ← Primary CTA
│                                         │
│  [⏩ Sim Over]     [⏭ Skip Innings]     │  ← Secondary buttons
└─────────────────────────────────────────┘
```
Essentially the same as current — the aggression selector is clean and works well for batting.

**BOWLING MODE (is_user_batting=false):**
```
┌─────────────────────────────────────────┐
│  DELIVERY                               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Good │ │Out- │ │Boun-│ │York-│  →    │
│  │Lngth│ │swing│ │cer  │ │er   │       │
│  │ 30  │ │ 42  │ │ 38  │ │ 58★│       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  [ ▶ Bowl ]                             │  ← Primary CTA
│                                         │
│  [⏩ Sim Over]     [⏭ Skip Innings]     │
└─────────────────────────────────────────┘
```

Key design decisions:
- **Horizontal scrollable row** of delivery option cards (not a dropdown — cricket games show deliveries visually)
- Each card shows: delivery name (short), execution difficulty number, star if it targets the batter's weakness
- Selected delivery has pitch-green border/glow
- Difficulty number uses color coding: green (<35), amber (35-50), red (>50)
- A "★" marker appears on deliveries that exploit the current batter's weakness
- If no delivery is selected, engine auto-picks (good_length for pace, stock_ball for spin) — this is the default
- Horizontal scroll with momentum, peek of next card visible (standard mobile pattern)
- The number below each delivery name is exec_difficulty (lower = easier to execute)

**BOWLING MODE with AI suggestion:**
When the batter has a weakness that matches a delivery, show a subtle highlight glow on that delivery card + optional tooltip "Targets weakness: vs_bounce"

### 2.7 BowlerSelection Modal Update (`BowlerSelection.tsx`)

When the user selects a bowler at the start of an over, the modal now shows richer info:

**Current:** Name, bowling skill number, type, W/R, overs, economy, traits
**New additions:**
- **DNA mini-bars** below each bowler: 4 horizontal bars showing their DNA stats (speed/swing/bounce/control or turn/flight/variation/control) — very compact, 1px height, color-coded
- **Repertoire tags**: Small pill chips showing which deliveries this bowler can bowl: "Yorker" "Bouncer" "Outswinger" etc.
- **Matchup hint**: If the current striker has a known weakness, show "Effective vs [weakness]" in green for bowlers whose DNA aligns

The modal keeps the same structure (full-screen overlay, glass card, scrollable list) but each bowler row becomes ~20px taller to fit the DNA bars and repertoire pills.

### 2.8 Match.tsx Orchestration Changes

- Add `selectedDelivery` state: `useState<string | null>(null)`
- Pass `delivery_type` to `playBall` mutation when bowling and a delivery is selected
- Reset `selectedDelivery` to null after each ball
- Pass `is_user_batting` to TacticsPanel to switch between batting/bowling modes
- Pass `available_deliveries` from match state to TacticsPanel
- Pass `striker.batting_dna` and `bowler.bowling_dna` to MatchupPanel

---

## Part 3: Player Detail & DNA Displays (All Screens)

### 3.1 PlayerDetailModal Update (`PlayerDetailModal.tsx`)

**Current:** Shows BAT/BOWL/PWR stat bars + traits + intent + price
**Add:**

A new **"DNA Profile"** section (collapsible, default collapsed) between Attributes and Traits:

```
▼ DNA PROFILE
  Batting DNA
  vs Pace     ████████░░  78
  vs Bounce   ███░░░░░░░  38  ⚠
  vs Spin     ██████░░░░  62
  vs Deception████████░░  76
  Off Side    ███████░░░  72
  Leg Side    █████████░  85
  Power       ██████░░░░  65

  Bowling DNA (Off Spin)
  Turn        ████████░░  78
  Flight      ██████░░░░  65
  Variation   █████░░░░░  52
  Control     ███████░░░  71
```

- Only shown when DNA data is available on the player response
- Weakness stats (from `weaknesses` array) have a red/amber bar and ⚠ icon
- Bowling DNA header shows bowler type (Pace/Off Spin/Leg Spin)
- The section starts collapsed with a tap-to-expand arrow — avoids overwhelming the modal

### 3.2 Auction Screen (`Auction.tsx`)

Currently shows BAT/BOWL/PWR bars for the current auction player.

**Changes:**
- When a player is presented for bidding, the existing stat bars stay (they're quick-scan info)
- Add a **small "DNA" chip/button** next to the player's role badge that opens the PlayerDetailModal (already exists but with new DNA section)
- No inline DNA bars in the auction card itself — too much data for a fast-paced auction context. The chip opens the modal for the user who wants deeper analysis.

### 3.3 Squad Screen (`Squad.tsx`)

Currently shows PlayerCard with name, role, rating, traits, overseas, price.

**Changes:**
- Add a tiny DNA indicator: a row of 3-4 micro dots below the player's rating showing relative DNA strength. Green = 70+, amber = 40-69, red = <40. For batters: vs_pace, vs_spin, power. For bowlers: primary stat, control.
- This is a "DNA summary glance" — tap to open PlayerDetailModal for full details
- Minimal visual footprint: 4 dots + labels are ~12px total height

### 3.4 Playing XI Screen (`PlayingXI.tsx`)

Currently shows position, name, role, intent, traits, BAT/BOWL stats in drag-and-drop order.

**Changes:**
- Between the stats line and traits, add a **compact DNA summary line**:
  For batters: "Pace:78 Spin:62 Power:65" (just 3 key numbers, color-coded)
  For bowlers: "Ctrl:71 [Off Spin] Turn:78"
- This is 1 line of tiny text (text-[10px]) — fits without breaking the drag layout
- Highlights weaknesses in red: "Pace:78 Spin:38⚠ Power:65"

---

## Part 4: Pitch Display

### 4.1 Pre-Match Pitch Reveal

After toss and match start, before the first ball, show a brief **pitch card animation**:

```
┌─────────────────────────────────────┐
│                                     │
│      🏏 GREEN SEAMER               │
│                                     │
│   Pace Assist  ████████░░  80      │
│   Spin Assist  ██░░░░░░░░  15      │
│   Bounce       ███████░░░  70      │
│   Carry        █████████░  85      │
│                                     │
│   "Expect fast bowlers to dominate" │
│                                     │
│   [Start Match]                     │
└─────────────────────────────────────┘
```

- Appears as a modal after match start response returns
- Auto-dismisses after 5 seconds or on tap
- Uses pitch-type-specific color gradients (green_seamer = emerald gradient, dust_bowl = amber, etc.)
- Brief flavor text per pitch type

### 4.2 In-Match Pitch Badge (ScoreHeader)

A small colored chip in the ScoreHeader (see 2.2) — just the pitch name. Tapping it shows a quick tooltip with the pitch stats.

---

## Part 5: TypeScript Types & API Client

### 5.1 New types (`client.ts`)

```typescript
interface BatterDNA {
  vs_pace: number; vs_bounce: number; vs_spin: number; vs_deception: number;
  off_side: number; leg_side: number; power: number;
  weaknesses: string[];
}

interface BowlerDNA {
  type: 'pacer' | 'spinner';
  speed?: number; swing?: number; bounce?: number;
  turn?: number; flight?: number; variation?: number;
  control: number;
}

interface DeliveryOption {
  name: string;
  display_name: string;
  description: string;
  exec_difficulty: number;
  targets_weakness?: string;
}

interface PitchInfo {
  name: string;
  display_name: string;
  pace_assist: number;
  spin_assist: number;
  bounce: number;
  deterioration: number;
}
```

**Extend existing types:**
- `PlayerStateBrief` — add `batting_dna?: BatterDNA`
- `BowlerStateBrief` — add `bowling_dna?: BowlerDNA`
- `MatchState` — add `pitch_info?: PitchInfo`, `available_deliveries?: DeliveryOption[]`, `last_delivery_name?: string`
- `BallResult` — add `delivery_name?: string`, `contact_quality?: string`
- `AvailableBowler` — add `bowling_dna?: BowlerDNA`, `repertoire?: string[]`
- `Player` — add `batting_dna?: BatterDNA`, `bowling_dna?: BowlerDNA`

### 5.2 API method update

- `matchApi.playBall()` — add optional `deliveryType` param, include in request body
- `matchApi.scoutPlayer()` — new method: `GET /match/{cid}/match/{fid}/scout/{pid}`

---

## Implementation Order

### Step 1: Backend API changes (no frontend yet)
1. Add `display_name` and `description` to `Delivery` dataclass in `deliveries.py`
2. New schemas in `schemas.py` (BatterDNABrief, BowlerDNABrief, DeliveryOption, PitchInfoResponse)
3. Modify existing schemas (PlayerStateBrief, BowlerStateBrief, MatchStateResponse, BallRequest, BallResultResponse, AvailableBowlerResponse, PlayerResponse)
4. Update `match.py` — pass delivery_type through, populate DNA in responses, populate available_deliveries
5. Update player detail endpoints to include DNA
6. Add scout endpoint
7. Test with curl/httpie to verify DNA shows in responses

### Step 2: TypeScript types + API client
8. Update `client.ts` — new types, extend existing types, update `playBall()` method, add `scoutPlayer()`

### Step 3: Live match screen — core structure
9. Create `MatchupPanel.tsx` — batter vs bowler display with DNA face-off
10. Update `BallDisplay.tsx` → show delivery name + contact quality
11. Update `ScoreHeader.tsx` → add pitch badge

### Step 4: TacticsPanel redesign
12. Refactor `TacticsPanel.tsx` — batting mode (existing) + bowling mode (delivery picker)
13. Wire up `selectedDelivery` state in `Match.tsx`, pass to `playBall` mutation

### Step 5: BowlerSelection modal + Scout popup
14. Update `BowlerSelection.tsx` — DNA mini-bars, repertoire tags, matchup hints
15. Create `ScoutPopup.tsx` — bottom-sheet DNA detail view

### Step 6: Pitch display
16. Create `PitchReveal.tsx` — pre-match pitch card animation
17. Add pitch badge to ScoreHeader

### Step 7: Player DNA in all screens
18. Update `PlayerDetailModal.tsx` — add collapsible DNA profile section
19. Update `Squad.tsx` — DNA micro-dot indicators
20. Update `PlayingXI.tsx` — compact DNA summary line
21. Add DNA chip to auction player card (`Auction.tsx`)

### Step 8: Polish & test
22. End-to-end test: create career → play match → verify delivery selection works, DNA displays correctly
23. Mobile responsiveness check (375px viewport)
24. Verify auction screen not broken
25. Run batch match test to confirm no engine regressions

---

## Files Modified/Created Summary

### Backend
| File | Action | Description |
|------|--------|-------------|
| `app/engine/deliveries.py` | MODIFY | Add display_name, description to Delivery dataclass |
| `app/api/schemas.py` | MODIFY | New DNA schemas + modify existing match schemas |
| `app/api/match.py` | MODIFY | delivery_type passthrough, DNA in responses |
| `app/api/career.py` | MODIFY | DNA in player detail responses |
| `app/engine/match_engine_v2.py` | MODIFY | Accept optional delivery_type in simulate_ball |

### Frontend
| File | Action | Description |
|------|--------|-------------|
| `src/api/client.ts` | MODIFY | New types + extend existing + update playBall |
| `src/pages/Match.tsx` | MODIFY | selectedDelivery state, conditional panel rendering |
| `src/components/match/TacticsPanel.tsx` | MODIFY | Batting mode + bowling mode (delivery picker) |
| `src/components/match/MatchupPanel.tsx` | **NEW** | Batter vs Bowler DNA face-off card |
| `src/components/match/ScoutPopup.tsx` | **NEW** | Bottom-sheet DNA detail for opponent batters |
| `src/components/match/PitchReveal.tsx` | **NEW** | Pre-match pitch card animation |
| `src/components/match/BallDisplay.tsx` | MODIFY | Show delivery name + contact quality |
| `src/components/match/ScoreHeader.tsx` | MODIFY | Add pitch badge chip |
| `src/components/match/BowlerSelection.tsx` | MODIFY | DNA mini-bars, repertoire tags |
| `src/components/match/BattingSection.tsx` | REMOVE | Replaced by MatchupPanel |
| `src/components/match/BowlingSection.tsx` | REMOVE | Replaced by MatchupPanel |
| `src/components/common/PlayerDetailModal.tsx` | MODIFY | Add collapsible DNA profile section |
| `src/pages/Squad.tsx` | MODIFY | DNA micro-dot indicators |
| `src/pages/PlayingXI.tsx` | MODIFY | Compact DNA summary line |
| `src/pages/Auction.tsx` | MODIFY | DNA chip button on auction player card |

---

## Verification

```bash
# 1. Backend: Re-run migration if schema changes added new columns
docker exec willow-leather-api python scripts/migrate_auth.py --yes

# 2. Backend: Run integration tests
python scripts/test_v2_integration.py 50

# 3. Frontend: Build check
cd willow-leather-web && npm run build

# 4. E2E: Start server, create career, play match through browser
#    - Verify batting mode shows aggression controls
#    - Verify bowling mode shows delivery picker
#    - Verify tapping delivery + bowling works
#    - Verify bowler selection shows DNA + repertoire
#    - Verify scout popup opens on batter name tap
#    - Verify pitch card shows after match start
#    - Verify PlayerDetailModal shows DNA section
#    - Verify Squad/PlayingXI show DNA indicators

# 5. Mobile: Chrome DevTools → iPhone 13 viewport (375x812)
#    - Ensure nothing overflows or clips
#    - Ensure delivery cards scroll horizontally
#    - Ensure bottom tactics panel doesn't block content

# 6. Batch match test through API (no regressions)
python scripts/test_batch_matches.py
```
