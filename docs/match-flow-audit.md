# Match Screen Technical Audit

## 1. State Machine & Screen Transitions

### Full Flow: MatchStart → MatchResult

```
┌──────────────────┐
│  PreMatchXIReview │◄── Entry point: /match/:fixtureId
│  (Playing XI)     │
│                   │  ● If XI not set → redirect to /playing-xi
│                   │  ● If match already in progress → skip to Live Match
└────────┬─────────┘
         │ onProceed
         ▼
┌──────────────────┐
│   TossScreen      │
│                   │  ● Tap "Toss" → tossMutation → coin animation
│                   │  ● If user won: choose bat/bowl
│                   │  ● If AI won: AI always elects to bowl
└────────┬─────────┘
         │ startMutation
         ▼
┌──────────────────┐
│   PitchReveal     │  Full-screen modal showing pitch type + conditions
│                   │  User taps "Continue"
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                   LIVE MATCH                          │
│                                                       │
│  ┌─────────────┐  ScoreHeader (team, score, RR, RRR) │
│  │             │  Scorecard button → ScorecardDrawer  │
│  └─────────────┘                                      │
│  ┌─────────────┐  BallDisplay (outcome, commentary,   │
│  │             │  delivery name, contact quality)      │
│  └─────────────┘                                      │
│  ┌─────────────┐  MatchupPanel                        │
│  │             │  Striker + NonStriker + Bowler        │
│  │             │  Traits, DNA stats, weakness tips     │
│  │             │  Scout button (when user bowling)     │
│  └─────────────┘                                      │
│  ┌─────────────┐  ThisOver (6 balls visual)           │
│  └─────────────┘                                      │
│  ┌─────────────┐  TacticsPanel (FIXED bottom)         │
│  │             │  Batting: Defend/Balanced/Attack      │
│  │             │  Bowling: Delivery picker (scroll)    │
│  │             │  [Play Ball] / [Sim Over] [Skip Inn] │
│  └─────────────┘                                      │
│                                                       │
│  MODAL OVERLAYS:                                      │
│  ● BowlerSelection — start of over (user bowling)    │
│  ● InningsChange — target display between innings     │
│  ● MilestoneAlert — 50, 100, wicket, hat-trick       │
│  ● ScoutPopup — batter DNA radar (user bowling)      │
│  ● ScorecardDrawer — full scorecard slide-in          │
└──────────────────────┬────────────────────────────────┘
                       │ match status === 'completed'
                       ▼
┌──────────────────────────────┐
│   MatchCompletionScreen       │
│   Result + scorecard summary  │
│   + match analysis            │
│   → "Back to Dashboard"      │
└──────────────────────────────┘
```

### State Variables (Match.tsx)

| State | Type | Purpose |
|-------|------|---------|
| `showPreMatchReview` | boolean | Shows XI review screen |
| `showToss` | boolean | Shows toss screen |
| `tossResult` | TossResult | Stores toss outcome for election |
| `showInningsChange` | boolean | Innings change modal overlay |
| `showBowlerSelect` | boolean | Bowler selection modal |
| `showScorecard` | boolean | Scorecard drawer |
| `showPitchReveal` | boolean | Pitch reveal modal |
| `selectedDelivery` | string | Currently selected delivery type |
| `aggression` | string | Batting aggression (defend/balanced/attack) |
| `lastBall` | BallResult | Last ball outcome for display |
| `scoutPlayerId` | number | Player being scouted (null = closed) |
| `milestone` | object | Active milestone alert |

### Auto-Triggers

- **BowlerSelection**: Opens automatically when `can_change_bowler && !bowler` (start of every over when user is bowling)
- **InningsChange**: Opens automatically when `innings_just_changed` is true in ball response
- **Milestone**: Auto-dismisses after 3 seconds via `setTimeout`
- **PitchReveal**: Opens once after match start, closed by user

---

## 2. Redundancy Scan — Dead / Unused Code

### Dead Components (never imported)

| File | Status | Notes |
|------|--------|-------|
| `BattingSection.tsx` | **DEAD** | Not imported anywhere. Replaced by MatchupPanel batters display. |
| `BowlingSection.tsx` | **DEAD** | Not imported anywhere. Replaced by MatchupPanel bowler display. |

**Recommendation:** Delete both files. They are remnants of an older layout before MatchupPanel consolidated the matchup view.

### Partially Used Components

| File | Status | Notes |
|------|--------|-------|
| `DNAMatchupCard.tsx` | Used only in `MatchAnalysis.tsx` | Post-match analysis only — not shown during live play. Verify it's still needed. |

### UI Elements with No Underlying Logic

| Element | Location | Issue |
|---------|----------|-------|
| **Player Traits** (badges) | MatchupPanel, BowlerSelection | **Displayed but NOT used in V2 engine** (see Section 3) |
| **"Set" badge** | MatchupPanel line 103 | Shows when `is_settled` is true — this IS functional, settled modifier adds +5 to +12 to raw_skill in engine |
| **"On Fire" flame** | MatchupPanel line 105 | Shows when `is_on_fire` — this IS functional, tracked via recent_outcomes in engine but not currently adding skill bonus |

### On Fire Status — Gap

The `is_on_fire` status is tracked and displayed but has **no gameplay effect**. The engine sets it when a batter hits 2+ boundaries in last 3 balls (`recent_3.count("4/6") >= 2`), and the UI shows a flame icon, but no skill modifier is applied during simulation. This is a cosmetic-only indicator that implies gameplay impact.

**Recommendation:** Either add a `+5` skill bonus when `is_on_fire` or rename/restyle the indicator to be clearly cosmetic (e.g., "Hot Streak" stat rather than an icon that implies power-up).

---

## 3. Trait Discrepancy — Critical Finding

### Problem

Player traits are **parsed, stored, transmitted, and displayed** across the entire stack but have **zero effect on match simulation** in the V2 engine.

### Evidence

**Backend — Traits are parsed and sent to frontend:**
- `app/api/match.py`: `_parse_traits()` (line 48) converts JSON string to list
- Traits included in every `PlayerStateBrief` and `BowlerStateBrief` response (lines 250, 268, 285, 428, 460)
- Available bowler response includes traits (line 1532)

**Frontend — Traits are displayed prominently:**
- `MatchupPanel.tsx` lines 106-109: Striker traits shown as colored badge icons
- `MatchupPanel.tsx` lines 191-194: Bowler traits shown
- `BowlerSelection.tsx` lines 148-151: Traits shown in bowler picker
- `TraitBadge.tsx`: Full tooltip system with descriptions promising specific effects

**Engine — Traits are NEVER read:**
- `match_engine_v2.py`: Zero occurrences of "trait" in the entire 1,110-line file
- `_simulate_ball_v2()` only uses `batter.batting_dna` and `bowler.bowler_dna`
- No trait-based modifiers in any calculation function

### Trait Descriptions vs Reality

| Trait | UI Promise | Engine Reality |
|-------|-----------|----------------|
| `clutch` | "+10 skill in pressure situations" | No effect |
| `finisher` | "+15 batting in last 5 overs" | No effect |
| `choker` | "-15 skill in pressure situations" | No effect |
| `partnership_breaker` | "+10 bowling after 50+ partnership" | No effect |
| `bucket_hands` | "+20 catching success" | No effect |

### Recommendation

Implement trait modifiers in `_simulate_ball_v2()`. Natural insertion points:

```python
# After raw_skill and raw_attack are calculated (~line 755):

# Trait: clutch — pressure modifier
if innings.context.is_pressure_cooker:
    if 'clutch' in (batter.traits_list or []):
        raw_skill += 10
    if 'choker' in (batter.traits_list or []):
        raw_skill -= 15

# Trait: finisher — death overs boost
if overs >= 15 and 'finisher' in (batter.traits_list or []):
    raw_skill += 15

# Trait: partnership_breaker — bowling boost after big stand
if innings.context.partnership_runs >= 50:
    if 'partnership_breaker' in (bowler.traits_list or []):
        raw_attack += 10

# Trait: bucket_hands — modify edge catch probability
# (applies in resolve_edge() or as post-resolution modifier)
```

Priority: **HIGH** — Users see trait badges and read their descriptions expecting gameplay impact. This is the single largest expectation mismatch in the match screen.

---

## 4. Delivery Restrictions — Missing Mechanic

### Current State

There are **no per-over delivery usage restrictions**. A user can spam yorkers or bouncers every single ball of every over. The only "cost" is execution difficulty (yorker = 58, bouncer = 38), but a bowler with high control trivially overcomes this.

### Problem

This undermines tactical depth. In real T20 cricket, bouncers are restricted to 2 per over (ICC rules), and yorkers have diminishing returns as the batter adjusts to length.

### Proposed Restriction System

| Delivery | Max per Over | Penalty if Exceeded |
|----------|-------------|---------------------|
| Bouncer | 2 | Auto-called "No Ball" (free hit + extra run) |
| Yorker | 2 | +15 exec_difficulty (length gets predictable) |
| Wide Yorker | 2 | +15 exec_difficulty |
| Slower Ball | 2 | +12 exec_difficulty (batter reads the change) |
| Arm Ball | 2 | +12 exec_difficulty |
| All others | No limit | — |

### Implementation Approach

**Backend (`match_engine_v2.py`):**
1. Add `delivery_counts: Dict[str, int]` to `InningsState`, reset each over
2. In `_simulate_ball_v2()`, before execution check:
   ```python
   count = innings.delivery_counts.get(delivery.name, 0)
   if delivery.name == 'bouncer' and count >= 2:
       # No ball — bouncer restriction
       outcome.is_no_ball = True
       outcome.runs = 1
       return outcome
   if delivery.name in ('yorker', 'wide_yorker', 'slower_ball', 'arm_ball') and count >= 2:
       exec_difficulty_penalty = 15
   innings.delivery_counts[delivery.name] = count + 1
   ```

**Frontend (`TacticsPanel.tsx`):**
1. Add delivery usage count from state (backend sends remaining uses)
2. Show `(2/2)` counter on each delivery button
3. Dim/disable deliveries that are exhausted (bouncer) or show warning for penalized ones
4. Add info tooltip explaining the restriction

### Frontend Delivery Info Enhancement

Currently the delivery picker shows only the name and execution difficulty number. No explanation of what the delivery does or why it's effective.

**Recommendation:** Add an `(i)` info icon on each delivery button. Tapping opens a small tooltip/modal showing:
- Delivery description (already in `Delivery.description` on backend)
- Which batter weakness it targets (already in `Delivery.targets_stat`)
- Current-over usage count
- Exec difficulty explanation ("Higher = harder to execute cleanly")

This requires adding `description` and `targets_stat` to the `DeliveryOption` schema response.

---

## 5. Missing: Next Batter Selection (When User is Batting)

### Current Behavior

- **User bowling:** At each wicket, the engine auto-selects the next batter from `batting_order` (sequential). No user input.
- **User batting:** At each wicket, the engine auto-selects the next batter from `batting_order` (sequential). No user input.

When the user is **bowling**, they get a `BowlerSelection` modal at the start of every over — a full-screen picker with DNA bars, traits, economy rates, and repertoire tags. This is one of the richest interaction points in the match.

When the user is **batting**, there is **no equivalent**. The next batter just appears silently. The user cannot:
- Promote a power-hitter during death overs
- Send in a nightwatchman
- Choose between two all-rounders based on the current bowler's type

### Impact

This is a major asymmetry. Batting feels passive compared to bowling. In real cricket, batting order flexibility (especially positions 5-8) is a key tactical decision.

### Proposed: Batter Selection Screen

**Trigger:** When a wicket falls and user is batting, show a `BatterSelection` modal before the next ball.

**Backend changes:**
1. New endpoint: `GET /{career_id}/match/{fixture_id}/available-batters`
   - Returns remaining batters with: name, batting_skill, batting_dna, traits, batting_type (top-order, middle-order, etc.)
2. New endpoint: `POST /{career_id}/match/{fixture_id}/select-batter`
   - Accepts `batter_id`, validates the player hasn't batted yet, updates `innings.striker_id`
3. Add `can_change_batter` flag to match state response (analogous to `can_change_bowler`)

**Frontend changes:**
1. New component: `BatterSelection.tsx` (mirror BowlerSelection design)
   - Show remaining batters with batting DNA mini-bars
   - Highlight recommended batter (highest batting skill among remaining)
   - Show "Suggested" label based on match situation (e.g., power-hitter if RRR > 10)
2. In `Match.tsx`, add `showBatterSelect` state and auto-trigger logic (same pattern as bowler selection)

**Design:**
```
┌──────────────────────────────────┐
│         Select Next Batter       │
│                                  │
│  Wicket fell! Choose who bats:   │
│                                  │
│  ┌────────────────────────────┐  │
│  │ R. Sharma  85 ★  Top      │  │  ← recommended badge
│  │ ▓▓▓▓▓▓▓░ PWR  ▓▓▓▓▓▓░░ OFF│  │
│  │ Clutch ⚡  Finisher 🎯     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ V. Kumar   62 ★  All-Rnd  │  │
│  │ ▓▓▓▓░░░░ PWR  ▓▓▓░░░░░ OFF│  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ S. Singh   45 ★  Tail     │  │
│  └────────────────────────────┘  │
│                                  │
│          [ Confirm ]             │
└──────────────────────────────────┘
```

---

## 6. Mobile UX Critique — 3 High-Impact Improvements

### Improvement 1: Ball Outcome Haptics + Screen Flash

**Problem:** Playing a ball produces a text outcome and a small colored circle. Boundaries, wickets, and dots all feel identical. There's no sensory feedback differentiating a SIX from a dot ball.

**Current:** BallDisplay shows outcome circle + commentary text. No vibration, no screen flash, no sound cue.

**Proposal:**

| Event | Visual | Haptic |
|-------|--------|--------|
| Dot ball (0) | Subtle dark pulse on BallDisplay | None |
| Single/Double | Green flash on score counter | Light tap: `navigator.vibrate(50)` |
| Four | Gold screen flash (200ms), score counter scales up | Double tap: `navigator.vibrate([50, 30, 50])` |
| Six | Full gold flash + particle burst animation, score counter bounces | Heavy: `navigator.vibrate([100, 50, 100])` |
| Wicket | Red screen flash (300ms), score dims briefly | Long buzz: `navigator.vibrate(200)` |

**Implementation:**
- Add `useEffect` in `Match.tsx` watching `lastBall` changes
- Apply CSS class to a full-screen overlay div (`pointer-events-none`) with keyframe animation
- Call `navigator.vibrate()` with pattern based on outcome
- For SIX particle effect: use `framer-motion` `AnimatePresence` with 6-8 small golden circles that radiate outward from the score and fade

**Impact:** Transforms ball-by-ball play from a "click-and-read" loop into a visceral experience. Haptic feedback is the #1 driver of "one more ball" compulsion in mobile sports games.

### Improvement 2: Bowling Delivery Picker — Swipe Carousel + Contextual Hints

**Problem:** The delivery picker is a horizontal scroll of small buttons with cryptic difficulty numbers. Users don't know what "exec_difficulty: 58" means, can't see which delivery targets the current batter's weakness, and the small buttons are hard to tap on mobile.

**Current state:** `TacticsPanel.tsx` — horizontal scroll of 72px-wide buttons with name + difficulty number. Star icon if `targets_weakness`. No descriptions, no usage counts.

**Proposal:**
1. **Enlarge buttons to 88px** with a 2-line layout: delivery name + brief tag ("Seeks edge", "Targets stumps")
2. **Add weakness exploitation highlight**: If a delivery targets the batter's known weakness (already computed via `targets_weakness`), show a pulsing amber border + "Exploits weakness" micro-text
3. **Add info icon** on each delivery: Tap-and-hold or `(i)` button opens a bottom sheet with:
   - Full description (from `Delivery.description`)
   - Which DNA stat it targets
   - Success rate hint based on bowler's relevant DNA stat
4. **Per-over usage counter**: Show `●●○` (2 of 3 used) dots below delivery name when restrictions are implemented

**Backend data needed:**
- Add `description` and `targets_stat` to `DeliveryOption` response schema (already exist on the Delivery dataclass, just not serialized)

**Impact:** Reduces guesswork, teaches users the delivery system, and makes the bowling phase feel like a strategic mini-game rather than random button pressing.

### Improvement 3: Over Summary Card with Phase Progression

**Problem:** After each over, there's no pause or summary. The game just continues to the next over (or shows BowlerSelection if user is bowling). Users lose track of momentum — was that a good over? Are they ahead of rate?

**Current:** `ThisOver` component shows 6 ball circles. At over end, it resets silently.

**Proposal:** At the end of each over, show a 2-second auto-dismissing "Over Summary" overlay:

```
┌──────────────────────────────┐
│        Over 14 Complete       │
│                               │
│   ● ● 4 ● 6 1    = 11 runs  │
│                               │
│   Phase: DEATH OVERS          │
│   ┌─────────────────────────┐ │
│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░│ │  ← over progress bar (14/20)
│   └─────────────────────────┘ │
│   RRR: 8.50 → 9.23           │
│                               │
│   ┌──────────────┐            │
│   │ Select Bowler│  (if bowling)
│   └──────────────┘            │
└──────────────────────────────┘
```

**Features:**
- Shows runs scored that over + economy for the bowler
- Phase indicator: POWERPLAY (1-6) → MIDDLE (7-15) → DEATH (16-20)
- Run rate delta (did it go up or down?)
- Auto-transitions to BowlerSelection if user is bowling
- Tap anywhere to dismiss early

**Implementation:**
- New component: `OverSummary.tsx`
- In `Match.tsx`, detect over change via `state.balls === 0 && previousBalls === 6` (useRef to track)
- Show for 2s, then auto-dismiss or transition to bowler selection

**Impact:** Creates natural pacing breaks that make each over feel like a chapter. Phase labels (Powerplay/Middle/Death) teach cricket terminology and create strategic awareness. The RR delta creates "am I winning?" tension.

---

## 7. Additional Functional Improvements

### 7.1 Bowling End Summary After Over

When user is bowling and an over ends, the game jumps directly to BowlerSelection. The user never sees how the just-completed bowler performed in that over. This is lost information.

**Recommendation:** Show the bowler's over stats (runs conceded, wickets, dots) in the BowlerSelection header, e.g., "Previous: Bumrah — 1/8 (3 dots)".

### 7.2 Target Chase Info Panel (2nd Innings)

When chasing, the ScoreHeader shows "Need X from Y balls" but doesn't show:
- Required boundaries (how many 4s/6s needed mathematically)
- Win probability estimate
- Comparison to par score at this stage

**Recommendation:** Add a collapsible "Chase Status" panel below ScoreHeader in 2nd innings showing run rate required, boundaries needed, and a simple "Above par / On par / Below par" indicator.

### 7.3 Match Momentum Indicator

Neither innings shows momentum. A simple "last 3 overs run rate" vs "overall run rate" comparison would show whether the batting team is accelerating or stalling.

**Recommendation:** Add a small momentum arrow (up/down/flat) next to CRR in ScoreHeader. Green up-arrow if last 3 overs RR > CRR, red down-arrow if below.

### 7.4 Retired Batter Visibility

If a batter gets injured or retired hurt (if this mechanic exists), there's no indication in the UI. The next batter just appears.

### 7.5 Bowler Warning State

Bowlers who have bowled 3 of their max 4 overs should be visually flagged in BowlerSelection as "Last Over Available" to prevent users from accidentally using their best bowler's final over too early.

**Current:** BowlerSelection shows "X ov" for each bowler but doesn't highlight the "final over" situation.

**Recommendation:** Add an amber "LAST OVER" badge on bowlers with 3 overs bowled.

---

## 8. File Reference

### Frontend Components (18 files)

| File | Lines | Used | Purpose |
|------|-------|------|---------|
| `Match.tsx` | 537 | Yes | Main orchestrator, state machine |
| `ScoreHeader.tsx` | 110 | Yes | Score, RR, pitch badge |
| `BallDisplay.tsx` | 73 | Yes | Last ball outcome + commentary |
| `MatchupPanel.tsx` | 235 | Yes | Striker + nonStriker + bowler + traits + tips |
| `ThisOver.tsx` | 46 | Yes | 6-ball visual for current over |
| `TacticsPanel.tsx` | 192 | Yes | Aggression picker / delivery picker + play button |
| `BowlerSelection.tsx` | 205 | Yes | Modal for bowler choice at start of over |
| `TossScreen.tsx` | ~150 | Yes | Toss animation + election |
| `PitchReveal.tsx` | ~120 | Yes | Pitch type reveal modal |
| `PreMatchXIReview.tsx` | ~180 | Yes | Playing XI confirmation screen |
| `ScorecardDrawer.tsx` | ~200 | Yes | Slide-in full scorecard |
| `ScoutPopup.tsx` | ~150 | Yes | Batter DNA radar chart (bowling only) |
| `MilestoneAlert.tsx` | ~100 | Yes | 50/100/wicket/hat-trick overlay |
| `MatchCompletionScreen.tsx` | ~250 | Yes | Post-match result + summary |
| `MatchAnalysis.tsx` | ~200 | Yes | Post-match analysis view |
| `DNAMatchupCard.tsx` | ~150 | Yes* | Used only in MatchAnalysis |
| `BattingSection.tsx` | ~100 | **NO** | Dead code — delete |
| `BowlingSection.tsx` | ~100 | **NO** | Dead code — delete |

### Backend Files

| File | Lines | Purpose |
|------|-------|---------|
| `app/api/match.py` | 1,877 | 12 REST endpoints for match flow |
| `app/engine/match_engine_v2.py` | 1,110 | DNA-based simulation core |
| `app/engine/deliveries.py` | 146 | 12 delivery type definitions |
| `app/engine/dna.py` | 142 | DNA dataclasses + pitch presets |

---

## 9. Action Plan — Prioritized

### Priority 1: Correctness Fixes
| # | Task | Effort | Impact |
|---|------|--------|--------|
| M1 | Implement trait modifiers in V2 engine | Medium | Critical — traits are displayed but do nothing |
| M2 | Delete dead components (BattingSection, BowlingSection) | Trivial | Cleanup |
| M3 | Give `is_on_fire` a gameplay effect (+5 raw_skill) or remove misleading icon | Small | Medium |

### Priority 2: Tactical Depth
| # | Task | Effort | Impact |
|---|------|--------|--------|
| M4 | Add delivery usage restrictions (bouncer 2/over, yorker penalty) | Medium | High — prevents spam, adds strategy |
| M5 | Add delivery info tooltips (description, targets_stat) | Small | Medium — teaches the system |
| M6 | Add batter selection screen when user is batting | Large | High — major asymmetry fix |

### Priority 3: Engagement / Polish
| # | Task | Effort | Impact |
|---|------|--------|--------|
| M7 | Ball outcome haptics + screen flash | Small | High — visceral feedback |
| M8 | Over summary card with phase labels | Medium | Medium — pacing + education |
| M9 | Bowler "LAST OVER" warning badge | Trivial | Small — prevents frustration |
| M10 | Chase status panel (2nd innings) | Small | Medium — adds tension |
| M11 | Momentum arrow in ScoreHeader | Trivial | Small — quick win |
| M12 | Previous bowler stats in BowlerSelection header | Trivial | Small — lost information |

### Recommended Order
**M1 + M2 + M3** (correctness) → **M4 + M5** (delivery system) → **M7** (haptics) → **M6** (batter selection) → **M8-M12** (polish)
