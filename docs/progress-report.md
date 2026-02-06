# Willow & Leather — Development Progress Report

**Last Updated:** February 2026
**Status:** Phase 2 complete, ready for deployment

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Tech Stack](#tech-stack)
3. [Phase 1: v2 Match Engine (Complete)](#phase-1-v2-match-engine)
4. [Phase 2: Captain's Tactical Interface (Complete)](#phase-2-captains-tactical-interface)
5. [What's Next: Phase 3+](#whats-next)
6. [File Reference](#file-reference)
7. [Deployment](#deployment)

---

## Product Overview

Willow & Leather is a **T20 cricket management simulation game** — a mobile-first web app where the user manages a franchise through auctions, squad building, playing XI selection, and interactive match play across a full season.

### Core Features (Pre-Phase 1)

| Feature | Description |
|---------|-------------|
| **Career Mode** | Create and manage franchise careers across multiple seasons |
| **Auction System** | Real-time player auction with manual bidding, auto-bid caps, skip categories, and AI opponent teams bidding against you |
| **Squad Management** | View full roster, filter by role, see player stats and traits |
| **Playing XI** | Drag-and-drop batting order with overseas caps and role validation |
| **Live Match** | Ball-by-ball interactive T20 simulation with batting/bowling controls |
| **Season Progression** | League stage (round-robin) → IPL-style playoffs (Q1, Eliminator, Q2, Final) |
| **Fixtures & Standings** | Full schedule, NRR-based league table, simulate non-user matches |
| **Leaderboards** | Orange Cap (runs), Purple Cap (wickets), Most Sixes, Most Catches |
| **Scorecards** | Live in-match scorecard + full post-match result with Man of the Match |
| **Google Auth** | OAuth 2.0 login, JWT tokens, multi-user support |

### Pages

`Login` → `Home` → `New Career` → `Auction` → `Dashboard` → `Squad` → `Playing XI` → `Fixtures` → `Standings` → `Leaderboards` → `Match`

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript 5.9** + **Vite**
- **Tailwind CSS 3.4** — dark glassmorphism theme (dark-950 base, pitch-green primary, ball-red danger)
- **Framer Motion 12** — animations (modals, transitions, milestone alerts)
- **TanStack React Query 5** — server state, caching, mutations
- **Zustand 5** — client state (careerId, career info)
- **React Router 7** — SPA routing
- **@dnd-kit** — drag-and-drop for Playing XI
- **Lucide React** — icon library
- **Axios** — HTTP client
- **Fonts:** Inter (body) + Outfit (display/headings)

### Backend
- **FastAPI 0.109** + **Python 3.11**
- **SQLAlchemy 2.0** — ORM with SQLite
- **Pydantic 2.5** — request/response validation
- **Uvicorn** — ASGI server
- **python-jose** — JWT authentication
- **google-auth** — OAuth token validation

### Infrastructure
- **Frontend:** Vercel (auto-deploy on git push)
- **Backend:** Docker container on GCP VM (`socialflow`)
- **Database:** SQLite in Docker persistent volume
- **Port mapping:** 8001 (external) → 8000 (internal)

---

## Phase 1: v2 Match Engine

**Status:** Complete and deployed
**Goal:** Replace the simple v1 engine with a DNA-driven matchup system that models realistic T20 cricket

### What Changed

The v1 engine used flat skill numbers (batting 0-100, bowling 0-100) and simple random rolls to determine outcomes. v2 introduces a multi-dimensional system where every ball is a specific matchup between a batter's DNA profile, a bowler's delivery choice, and the pitch conditions.

### DNA System

**Batter DNA (7 attributes, 0-100 scale):**

| Attribute | What it models |
|-----------|---------------|
| `vs_pace` | Handling swing, seam, full-length fast bowling |
| `vs_bounce` | Handling short balls, rising deliveries, bouncers |
| `vs_spin` | Reading turn, playing spin-friendly pitches |
| `vs_deception` | Picking googlies, slower balls, arm balls, variations |
| `off_side` | Scoring through off-side (cover drive, cut, punch) |
| `leg_side` | Scoring through leg-side (flick, pull, sweep) |
| `power` | Six-hitting ability and boundary distance |

Every batter gets 1-2 **weaknesses** (15-25 points below average), creating tactical diversity. A strong batter might have `vs_pace: 82` but `vs_bounce: 38` — meaning bouncers are the way to attack them.

**Pacer DNA (4 attributes):**

| Attribute | What it models |
|-----------|---------------|
| `speed` | Raw pace in kph (120-155 range, normalized to 0-100) |
| `swing` | Lateral air movement |
| `bounce` | Vertical extraction from pitch |
| `control` | Execution probability — can they land the intended delivery? |

**Spinner DNA (4 attributes):**

| Attribute | What it models |
|-----------|---------------|
| `turn` | Lateral movement off the pitch |
| `flight` | Deception in the air, drift |
| `variation` | Mystery ball quality (googly, doosra, carrom) |
| `control` | Execution probability |

### Delivery System (12 deliveries)

Each delivery targets specific batter DNA attributes and has its own dismissal profile.

**Pacer Deliveries (7):**

| Delivery | Difficulty | Targets | Key Dismissals |
|----------|-----------|---------|----------------|
| Good Length | 30 | vs_pace, off_side | Bowled, caught, LBW |
| Outswinger | 42 | vs_pace, off_side | Caught behind, caught |
| Inswinger | 45 | vs_pace, leg_side | LBW, bowled |
| Bouncer | 38 | vs_bounce, leg_side | Caught, top edge |
| Yorker | 58 | vs_pace, power, leg_side | Bowled, LBW |
| Slower Ball | 48 | vs_deception, power | Caught, bowled |
| Wide Yorker | 55 | vs_pace, off_side | Bowled, caught behind |

**Spinner Deliveries (5):**

| Delivery | Difficulty | Targets | Key Dismissals |
|----------|-----------|---------|----------------|
| Stock Ball | 28 | vs_spin, off_side | Bowled, stumped, caught |
| Flighted | 40 | vs_spin, vs_deception, power | Stumped, caught |
| Arm Ball | 52 | vs_deception, vs_spin | Bowled, LBW |
| Flat Quick | 32 | power, vs_spin | Caught, bowled |
| Wide of Off | 38 | off_side, vs_spin | Caught, stumped |

**Repertoire system:** Not every bowler can bowl every delivery. Each bowler's DNA determines which deliveries they unlock (e.g., bouncers require bounce >= 40, wide yorker requires control >= 55).

### Pitch System (6 types)

| Pitch | Pace | Spin | Bounce | Deterioration | Character |
|-------|------|------|--------|---------------|-----------|
| Green Seamer | 80 | 15 | 70 | 25 | Fast bowlers dominate |
| Dust Bowl | 20 | 85 | 35 | 80 | Spinners thrive, crumbles fast |
| Flat Deck | 40 | 35 | 55 | 20 | Batting paradise |
| Bouncy Track | 75 | 20 | 90 | 20 | Express pace + steep bounce |
| Slow Turner | 30 | 60 | 40 | 55 | Spin from ball one |
| Balanced | 55 | 45 | 60 | 35 | Fair contest |

Pitch stats modify bowler effectiveness. Deterioration makes the pitch harder to bat on in the 2nd innings (benefits spinners especially).

### Stat Compression

Raw DNA values (0-100) are compressed before simulation:

```
effective_skill = 28 + raw_skill × 0.45
```

This maps the full 0-100 range to a realistic ~28-73 band, preventing:
- Tail-enders being literally unable to bat (floor ~28)
- Elite batters being invincible (ceiling ~73)

### Simulation Pipeline (per ball)

```
1. Bowler chooses delivery (AI auto-pick or user selection)
2. Execution check — bowler control stat determines if delivery lands as intended
3. Failed execution → random weaker delivery (half-tracker, full toss)
4. Matchup calculation — batter DNA vs delivery weights → effective skill
5. Stat compression → realistic range
6. Modifiers applied (pitch, fatigue, settled/unsettled, pressure, match phase)
7. Gaussian roll → raw outcome (0-100, mean=skill, stddev varies by phase)
8. Outcome resolution → dots, singles, boundaries, wickets
9. Edge detection → edge dismissals always produce caught/caught_behind
10. Commentary generation → contextual ball-by-ball text
```

### Additional Systems

- **Fatigue:** Bowlers degrade over 4 overs (economy increases ~15-20%)
- **Ball age:** Swing is strongest in overs 1-6, diminishes with older ball
- **Settled batter bonus:** +5 after 10 balls, +10 after 20 balls (plays into v1 system too)
- **On fire:** Consecutive boundaries trigger a streak bonus
- **Progressive jaffa:** Consecutive dots by same bowler increase wicket probability
- **Pressure cooker:** Required rate > 12 or wickets falling fast adds pressure modifier
- **Run out system:** Probability-based with fielding quality factored in

### POC Validation

The engine was validated through a 66-test POC suite across 11 categories:

1. **Aggregate realism** — Average scores 155-175, wickets 6-7, dot ball % 38-42%
2. **Matchup validation** — Elite vs average, strength vs weakness pairings
3. **Tactical systems** — Execution checks, fatigue, ball age, pitch deterioration
4. **Edge cases** — No all-out-in-5-overs, no 300+ scores, balanced wins
5. **Weakness exploitation** — Bouncer vs weak vs_bounce produces measurably more wickets
6. **Batter strength** — Strong attributes produce higher SR and fewer dismissals
7. **Equal skill** — Evenly matched players produce close/balanced outcomes
8. **Pitch variations** — Pacers dominate green seamer, spinners dominate dust bowl
9. **Bowler types** — Pace vs spin produce different dismissal patterns
10. **Power hitting** — Power hitters produce more sixes with higher SR
11. **Delivery dismissal patterns** — Each delivery type produces its characteristic dismissal distribution

All 66 tests pass.

### Backend Changes (Phase 1)

| File | Change |
|------|--------|
| `app/engine/match_engine_v2.py` | New file — ~1084 lines, full engine class |
| `app/engine/dna.py` | New file — BatterDNA, PacerDNA, SpinnerDNA, PitchDNA dataclasses |
| `app/engine/deliveries.py` | New file — 12 delivery definitions with weights |
| `app/models/player.py` | Added `batting_dna_json`, `bowler_dna_json` columns + property deserializers |
| `app/generators/player_generator.py` | Updated to generate DNA profiles for all players |
| `app/api/match.py` | Switched from v1 MatchEngine to v2 MatchEngineV2 |
| DB migration | Added `batting_dna_json` and `bowler_dna_json` TEXT columns to player table |

---

## Phase 2: Captain's Tactical Interface

**Status:** Complete, ready to deploy
**Goal:** Transform the UI into a tactical interface — delivery selection when bowling, DNA scouting, matchup insights, pitch display

### What Changed

The v1 UI had a simple 3-level aggression control (defend/balanced/attack) for both batting and bowling, flat stat bars (BAT/BOWL/PWR), and no visibility into the v2 engine's DNA system. Phase 2 makes the interface **context-aware** — showing different controls and information depending on whether the user is batting or bowling.

### Backend API Changes

**New schemas added to `schemas.py`:**
- `BatterDNABrief` — 7 batting DNA attributes + weaknesses list
- `BowlerDNABrief` — pacer or spinner DNA attributes
- `DeliveryOptionResponse` — delivery name, description, difficulty, weakness targeting
- `PitchInfoResponse` — pitch name, display name, 4 stat attributes

**Extended existing schemas:**
- `PlayerStateBrief` → added `batting_dna` (visible when user is bowling)
- `BowlerStateBrief` → added `bowling_dna`
- `MatchStateResponse` → added `pitch_info`, `available_deliveries`, `last_delivery_name`
- `BallRequest` → added optional `delivery_type` (user picks delivery when bowling)
- `BallResultResponse` → added `delivery_name`, `contact_quality`
- `AvailableBowlerResponse` → added `bowling_dna`, `repertoire` (list of delivery names)
- `PlayerResponse` → added `batting_dna`, `bowling_dna` (dict format for squad/XI views)

**New endpoint:**
- `GET /match/{career_id}/match/{fixture_id}/scout/{player_id}` — returns full batting DNA for an opponent batter during a live match

**Match API changes (`match.py`):**
- 4 new helper functions: `_player_batting_dna_brief()`, `_player_bowling_dna_brief()`, `_get_pitch_info()`, `_get_delivery_options()`
- `play_ball()` now reads `delivery_type` from request and passes it to the engine
- Match state response populated with DNA data, pitch info, and available deliveries when user is bowling
- Available bowlers endpoint includes DNA profiles and delivery repertoires

**Player API changes (`career.py`):**
- Squad endpoint includes `batting_dna` and `bowling_dna` in player responses
- Playing XI endpoints include DNA in player responses
- New helper `_get_dna_dicts()` for serialization

**Engine change (`match_engine_v2.py`):**
- `_simulate_ball_v2()`, `calculate_ball_outcome()`, and `_simulate_ball()` accept optional `delivery_type` parameter
- When provided, uses the specific delivery instead of AI auto-picking

### Frontend: New Components

**1. MatchupPanel** (`src/components/match/MatchupPanel.tsx`)
- Replaces the separate BattingSection + BowlingSection with a unified batter-vs-bowler card
- **Batting mode:** Shows striker/non-striker with runs, balls, traits, settled/on-fire status + bowler below with "vs" connector
- **Bowling mode:** Shows the same + opponent's weakness badge, bowler's key DNA stat, and a tactical tip (e.g., "Weak against spin — try flighted or arm ball")
- Scout icon (eye) on opponent batter name opens ScoutPopup

**2. ScoutPopup** (`src/components/match/ScoutPopup.tsx`)
- Bottom-sheet slide-up with animated DNA bar chart
- Shows all 7 batting DNA attributes with color-coded bars
- Weakness attributes highlighted in red with warning icons
- Summary section listing all weaknesses as pills
- Only available when user is bowling

**3. PitchReveal** (`src/components/match/PitchReveal.tsx`)
- Modal shown after toss, before first ball
- Displays pitch type name with themed gradient (green for seamer, amber for dust bowl, etc.)
- Shows 4 pitch stats with animated bars: Pace Assist, Spin Assist, Bounce, Deterioration
- Flavor text per pitch type (e.g., "Fast bowlers will love this surface")
- Auto-dismisses after 6 seconds or on tap

### Frontend: Modified Components

**4. TacticsPanel** (`src/components/match/TacticsPanel.tsx`) — **Major Redesign**
- **Batting mode (unchanged):** iOS-style segmented control — Defend / Balanced / Attack
- **Bowling mode (new):** Horizontal scrollable delivery card picker
  - Each card shows delivery display name, execution difficulty number, and a star icon if it targets the batter's weakness
  - Difficulty color coded: green (<35), amber (35-50), red (>50)
  - Tap to select/deselect; "Auto" button to clear selection and let engine pick
  - Selected delivery has pitch-green border glow
- Primary CTA changes text: "Play Next Ball" (batting) vs "Bowl" (bowling)
- Secondary: "Sim Over" and "Skip Innings" (unchanged)

**5. BowlerSelection** (`src/components/match/BowlerSelection.tsx`) — **Enhanced**
- Each bowler row now shows **DNA mini-bars**: 4 horizontal stat bars (SPD/SWG/BNC/CTL for pacers, TRN/FLT/VAR/CTL for spinners)
- **Repertoire tags**: Small pill chips showing which deliveries the bowler can throw (e.g., "Yorker", "Bouncer", "Outswinger")
- Existing features preserved: name, bowling skill badge, type, W/R, overs, economy, traits

**6. BallDisplay** (`src/components/match/BallDisplay.tsx`) — **Enhanced**
- Now shows **delivery name** below the outcome circle (e.g., "Bouncer", "Yorker")
- Shows **contact quality** indicator: "middled" (green), "edged" (amber), "beaten" (red)
- Layout adjusted: outcome circle + delivery name on left, commentary + contact quality on right

**7. ScoreHeader** (`src/components/match/ScoreHeader.tsx`) — **Enhanced**
- Added **pitch badge chip** next to the overs display
- Color-coded per pitch type: emerald (green seamer), amber (dust bowl), gray (flat deck), orange (bouncy), purple (slow turner), blue (balanced)

**8. PlayerDetailModal** (`src/components/common/PlayerDetailModal.tsx`) — **Enhanced**
- New collapsible **"DNA Profile"** section between Attributes and Traits
- Shows batting DNA (7 bars) with weakness highlighting
- Shows bowling DNA (pacer or spinner stats)
- Starts collapsed with chevron tap-to-expand — avoids overwhelming the modal

**9. PlayerCard** (`src/components/common/PlayerCard.tsx`) — **Enhanced**
- Added **DNA micro-dots**: 3-4 tiny colored dots below the stat grid
- Batter dots: Pace, Spin, Power (green >= 70, amber >= 40, red < 40)
- Bowler gets a 4th dot: Control
- Visible on Squad page, Playing XI selection, anywhere PlayerCard is used

### Frontend: Orchestration (Match.tsx)

- Removed imports: `BattingSection`, `BowlingSection`
- Added imports: `MatchupPanel`, `ScoutPopup`, `PitchReveal`
- New state: `selectedDelivery`, `scoutPlayerId`, `showPitchReveal`
- `playBallMutation` now accepts `{ agg, delivery }` object instead of just aggression string
- Delivery selection reset to null after each ball
- Pitch reveal triggered on `startMutation` success
- Scout popup wired to MatchupPanel's `onScoutBatter` callback
- TacticsPanel receives `isUserBatting`, `availableDeliveries`, `selectedDelivery`, `onSelectDelivery`

### TypeScript Types Added (`client.ts`)

```typescript
BatterDNA        // 7 attributes + weaknesses[]
BowlerDNA        // type + pacer or spinner attributes
DeliveryOption   // name, display_name, description, exec_difficulty, targets_weakness
PitchInfo        // name, display_name, pace/spin/bounce/deterioration
```

Extended: `PlayerStateBrief`, `BowlerStateBrief`, `MatchState`, `AvailableBowler`, `BallResult`, `Player`

Updated: `matchApi.playBall()` accepts optional `deliveryType`, new `matchApi.scoutPlayer()` method

### UX Flow Summary

**When user is BATTING:**
1. ScoreHeader shows score + pitch badge
2. MatchupPanel shows striker/non-striker + bowler (compact face-off)
3. TacticsPanel shows Defend/Balanced/Attack selector
4. Tap "Play Next Ball" → see outcome in BallDisplay with commentary
5. Milestones (50/100) trigger alerts

**When user is BOWLING:**
1. At start of over: BowlerSelection modal with DNA bars + repertoire
2. Select bowler → TacticsPanel switches to delivery picker
3. See opponent batter's weakness badge in MatchupPanel
4. Tap eye icon → ScoutPopup shows full DNA bar chart
5. Pick a delivery (or let engine auto-select)
6. Deliveries targeting weaknesses have a star indicator
7. Tap "Bowl" → BallDisplay shows delivery name + contact quality
8. Bowler change at next over

---

## What's Next

### Phase 3: Field Placement Visualization (Not Started)

From the v2 spec's Appendix B, these features are planned for future phases:

| Feature | Description | Priority |
|---------|-------------|----------|
| **Field placement** | Visual cricket field with draggable fielder positions that affect run scoring and catching probability | High |
| **DRS** | Decision Review System — challenge LBW/caught decisions with limited reviews per innings | Medium |
| **Weather effects** | Rain delays, Duckworth-Lewis adjustments, overcast conditions boosting swing | Medium |
| **Player injuries** | Mid-match injuries forcing substitutions and affecting batting order | Medium |
| **AI captain** | Smarter opponent decision-making (delivery selection, field changes, bowling changes) | Medium |
| **Multi-format** | ODI (50 overs) and Test (5-day) match support | Low |
| **Multiplayer** | Head-to-head mode where two users manage opposing teams | Low |

### Other Potential Improvements

| Area | Idea |
|------|------|
| **Match** | Batting approach selector (survive/rotate/push/all_out) — currently only aggression levels |
| **Match** | Over-by-over wagon wheel / pitch map visualization |
| **Match** | Post-match analysis with DNA matchup breakdowns |
| **Auction** | DNA preview during auction (currently only BAT/BOWL/PWR visible) |
| **Squad** | DNA comparison tool for squad analysis |
| **Season** | Player form system that carries across matches |
| **Season** | Transfer window between seasons |
| **UI** | Push notifications for milestone moments |
| **UI** | Replay/highlight system for key moments |
| **Performance** | Code-split the 709KB JS bundle (dynamic imports for Match, Auction pages) |

---

## File Reference

### Backend Files Modified/Created (Phase 1 + 2)

| File | Phase | Action | Description |
|------|-------|--------|-------------|
| `app/engine/match_engine_v2.py` | 1 | NEW | v2 engine class (~1084 lines) |
| `app/engine/dna.py` | 1 | NEW | DNA dataclasses + pitch presets (143 lines) |
| `app/engine/deliveries.py` | 1+2 | NEW+MOD | 12 delivery definitions with display metadata |
| `app/models/player.py` | 1 | MOD | Added DNA JSON columns + property deserializers |
| `app/generators/player_generator.py` | 1 | MOD | DNA generation for all player archetypes |
| `app/api/schemas.py` | 2 | MOD | 4 new schemas + 7 extended schemas |
| `app/api/match.py` | 1+2 | MOD | v2 engine swap + DNA responses + delivery passthrough + scout endpoint |
| `app/api/career.py` | 2 | MOD | DNA in squad/playing XI responses |

### Frontend Files Modified/Created (Phase 2)

| File | Action | Description |
|------|--------|-------------|
| `src/api/client.ts` | MOD | 4 new interfaces + 6 extended types + updated playBall + scoutPlayer |
| `src/pages/Match.tsx` | MOD | MatchupPanel, delivery state, pitch reveal, scout popup wiring |
| `src/components/match/MatchupPanel.tsx` | **NEW** | Unified batter-vs-bowler DNA face-off card |
| `src/components/match/ScoutPopup.tsx` | **NEW** | Bottom-sheet DNA bar chart for opponent scouting |
| `src/components/match/PitchReveal.tsx` | **NEW** | Pre-match pitch card with animated stats |
| `src/components/match/TacticsPanel.tsx` | MOD | Context-aware: batting aggression + bowling delivery picker |
| `src/components/match/BowlerSelection.tsx` | MOD | DNA mini-bars + delivery repertoire tags |
| `src/components/match/BallDisplay.tsx` | MOD | Delivery name + contact quality display |
| `src/components/match/ScoreHeader.tsx` | MOD | Pitch badge chip |
| `src/components/common/PlayerDetailModal.tsx` | MOD | Collapsible DNA Profile section |
| `src/components/common/PlayerCard.tsx` | MOD | DNA micro-dots indicator |
| `src/components/match/BattingSection.tsx` | UNUSED | Replaced by MatchupPanel (can be deleted) |
| `src/components/match/BowlingSection.tsx` | UNUSED | Replaced by MatchupPanel (can be deleted) |

---

## Deployment

### Pre-deployment Checklist

- [x] Backend: All imports clean (`match.py`, `career.py`, `schemas.py`)
- [x] Frontend: TypeScript compilation passes (`tsc --noEmit`)
- [x] Frontend: Production build succeeds (`npm run build`)
- [x] No breaking changes to existing API contracts (all new fields are optional)
- [ ] Backend: Start server locally and verify `/docs` shows new schemas
- [ ] Run batch match test (20 matches through API) to confirm no engine regressions
- [ ] Deploy backend to GCP VM (docker-compose build + up)
- [ ] Deploy frontend to Vercel (git push)
- [ ] Run DB migration on production (add DNA columns if not already present)
- [ ] Smoke test: create career → auction → play match → verify delivery selection works

### Deploy Commands

```bash
# Backend (GCP VM)
ssh-social  # alias for gcloud ssh
cd willow-leather-api
git pull
docker-compose down && docker-compose build && docker-compose up -d

# DB migration (if needed — DNA columns were added in Phase 1)
docker exec willow-leather-api python scripts/migrate_auth.py --yes

# Frontend (auto-deploys on push)
cd willow-leather-web
git push origin main
```
