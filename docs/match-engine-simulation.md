# Cricket Match Engine - Ball-by-Ball Simulation

This document explains how the T20 cricket match simulation engine works, including all the probability calculations, modifiers, and game mechanics.

## Overview

The match engine simulates T20 cricket matches ball-by-ball using a **probability-based outcome system**. The core mechanic is a **contest between bowler and batter** where:

1. The **bowler sets a difficulty target** based on their skill
2. The **batter makes a roll** based on their skill and chosen aggression
3. The **margin** (batter roll - bowler difficulty) determines the outcome

This creates realistic cricket dynamics where better players perform better on average, but randomness ensures upsets can happen.

---

## Core Data Structures

### MatchContext
Dynamic match situation that affects calculations:
```
- pitch_type: "green_top" | "dust_bowl" | "flat_deck"
- is_pressure_cooker: true when RRR > 12 or wickets < 3
- partnership_runs: runs scored in current partnership
```

### BatterState
Tracks batter's current form:
```
- balls_faced: balls faced this innings
- is_settled: true after 15+ balls (small bonus)
- is_on_fire: true after 2 boundaries in last 3 balls
- recent_outcomes: list of recent ball outcomes
```

### BowlerState
Tracks bowler's current spell:
```
- consecutive_overs: overs bowled in a row
- is_tired: true after 4+ consecutive overs
- has_confidence: true if took wicket last over
```

---

## The Ball Outcome Calculation

This is the heart of the simulation. Every ball follows this process:

### Step 1: Calculate Bowling Difficulty (The Target)

```python
bowling_difficulty = bowler.bowling * 0.78  # Scale to 78% for balanced scoring
bowling_difficulty += pitch_modifier          # +/- based on pitch and bowling type
bowling_difficulty -= 3 if settled else 0     # Settled batters get small bonus
bowling_difficulty += bowler_trait_bonus      # From traits like CLUTCH
```

The 0.78 multiplier was calibrated to produce T20-like scoring rates (typically 7-9 runs per over).

### Step 2: Calculate Batter's Roll

```python
# Aggression affects variance and safety
aggression_multiplier = {"defend": 0.7, "balanced": 1.0, "attack": 1.4}
base_adjustment = {"defend": +8, "balanced": 0, "attack": -5}

# Batting intent affects natural variance (see Batting Intent section)
intent_multiplier = {"anchor": 0.75, "accumulator": 0.95, "aggressive": 1.15, "power_hitter": 1.25}
intent_floor_bonus = {"anchor": +3, "accumulator": 0, "aggressive": 0, "power_hitter": 0}

# Combined skill multiplier
skill_multiplier = aggression_multiplier * intent_multiplier
base_adjustment += intent_floor_bonus

# Minimum effective batting prevents tail-ender massacres
effective_batting = max(batter.batting, 55)

# Roll calculation: 1/3 guaranteed + 2/3 variable
batting_base = effective_batting / 3 + base_adjustment
batting_variable = (effective_batting * 2/3) * skill_multiplier
batting_roll = batting_base + random(0, batting_variable)
batting_roll += batter_trait_bonus
batting_roll += run_rate_adjustment    # Keeps scores in 50-260 range
batting_roll += wicket_protection      # Protects struggling teams
```

### Step 3: Resolve the Margin

```python
margin = batting_roll - bowling_difficulty
```

| Margin | Outcome |
|--------|---------|
| >= boundary_threshold (18+) | **BOUNDARY** (4 or 6 based on power stat) |
| >= 6 | **2 or 3 runs** (good shot) |
| >= 0 | **0 or 1 runs** (rotation) |
| -1 to -11 | **0, 1, or 2 runs** (bowler ahead but batter survives) |
| -12 to -21 | **0 or 1 runs** (beaten but survives) |
| -22 to -37 | **25% catch chance**, else beaten/dropped |
| <= -38 | **CLEAN WICKET** (bowled or LBW) |

---

## Pitch Effects

Different pitch types favor different bowling styles:

### Green Top (Pace-friendly)
| Bowling Type | Modifier |
|--------------|----------|
| Pace | +3 |
| Medium | +4 |
| Spin | -3 |

### Dust Bowl (Spin-friendly)
| Bowling Type | Modifier |
|--------------|----------|
| Spin | +4 |
| Pace | -2 |

### Flat Deck (Batting-friendly)
All bowlers get **-2** (slight disadvantage).

---

## Player Traits

Players can have special traits that activate in specific situations:

### Batter Traits

| Trait | Condition | Effect |
|-------|-----------|--------|
| **CLUTCH** | Pressure situation | +10 to roll |
| **CHOKER** | Pressure situation | -15 to roll |
| **FINISHER** | Pressure situation | +15 to roll |

### Bowler Traits

| Trait | Condition | Effect |
|-------|-----------|--------|
| **CLUTCH** | Pressure situation | +10 to difficulty |
| **CHOKER** | Pressure situation | -15 to difficulty |
| **PARTNERSHIP_BREAKER** | Partnership >= 50 runs | +10 to difficulty |

**Pressure situation**: Required run rate > 12 OR wickets remaining < 3

---

## Aggression Modes

Players can choose their batting approach:

### Defend
- **Skill multiplier**: 0.7 (less variance)
- **Base adjustment**: +8 (safer)
- **Effect**: Fewer boundaries, fewer wickets, more dot balls

### Balanced
- **Skill multiplier**: 1.0 (normal)
- **Base adjustment**: 0
- **Effect**: Standard T20 play

### Attack
- **Skill multiplier**: 1.4 (more variance)
- **Base adjustment**: -5 (riskier)
- **Effect**: More boundaries possible, but also more wickets
- **Bonus**: Lower boundary threshold (18 -> 10) makes boundaries easier

---

## Batting Intent

Each batter has a natural **batting intent** that affects their playstyle variance. This is separate from the aggression mode (which is tactical) - intent represents the player's natural style.

### Intent Types

| Intent | Variance Multiplier | Floor Bonus | Description |
|--------|---------------------|-------------|-------------|
| **Anchor** | 0.75 | +3 | Low variance, consistent accumulator. Rarely gets out but scores slowly. |
| **Accumulator** | 0.95 | 0 | Slightly below average variance. Standard rotator of strike. |
| **Aggressive** | 1.15 | 0 | Above average variance. Looks to score but takes more risks. |
| **Power Hitter** | 1.25 | 0 | High variance - boom or bust. Big scores or quick dismissals. |

### How Intent Affects Outcomes

The intent multiplier is applied to the skill multiplier:

```python
skill_multiplier = aggression_multiplier * intent_multiplier
```

For example, a Power Hitter in Attack mode:
- Aggression multiplier: 1.4 (attack)
- Intent multiplier: 1.25 (power_hitter)
- Final skill multiplier: 1.4 * 1.25 = 1.75

This creates very high variance - they'll either hit big or get out trying.

### Statistical Impact (from 150-match simulations)

| Intent | Full 20 Overs | All Out Rate | Avg Wickets | Avg Score |
|--------|---------------|--------------|-------------|-----------|
| Anchor | 99% | 1% | 2.2 | 167 |
| Accumulator | 91% | 10% | 4.6 | 173 |
| Aggressive | 89% | 12% | 5.7 | 197 |
| Power Hitter | 85% | 15% | 6.4 | 204 |
| Mixed Team | 91% | 10% | 4.3 | 190 |

This shows the risk/reward tradeoff:
- Anchors are safest but score lowest
- Power hitters score highest but lose most wickets
- Mixed teams balance both for optimal results

---

## Run Rate Governors

The engine applies adjustments to keep scores realistic (50-260 runs per innings):

### Floor Protection (Struggling Teams)
When run rate < 3.5 and wickets < 8:
```python
deficit = 3.5 - current_run_rate
bonus = min(30, deficit * 12)  # Up to +30 boost
```

### Ceiling Cap (High-Scoring Teams)
When run rate > 11:
```python
excess = current_run_rate - 11
penalty = max(-40, -excess * 10)  # Up to -40 penalty
```

This prevents unrealistic scores like 300+ or below 60.

---

## Wicket Protection

Prevents unrealistic early collapses:

| Condition | Bonus |
|-----------|-------|
| Runs < 60 and wickets < 6 | +15 |
| Wickets >= 5 before over 10 | +18 |
| Wickets >= 7 before over 12 | +25 |

Additionally, **maximum 3 wickets per over** - any 4th+ wicket is converted to a dot ball (survival).

---

## Boundary Calculation

Whether a boundary is a 4 or 6 depends on the batter's **power** stat:

```python
is_six = random() < (batter.power / 170)
```

A power stat of 85 gives ~50% chance of six vs four on boundaries.

The **boundary threshold** is also dynamic:
- Base: 18
- When run rate > 12: 22 (harder to hit boundaries)
- In attack mode: threshold - 8 (easier boundaries)

---

## Over Simulation Flow

1. **Select bowler** (if not manually selected)
   - Cannot be same as last over
   - Max 4 overs per bowler
   - Weighted by bowling skill

2. **Reset over tracking**
   ```python
   innings.this_over = []
   balls_bowled = 0
   ```

3. **For each ball** (until 6 legal deliveries or innings complete):
   - Check for extras (1.5% wide, 0.5% no-ball)
   - Calculate ball outcome
   - Update batter stats (runs, balls, boundaries)
   - Update bowler stats (runs, wickets, extras)
   - Handle wicket (if any) - bring in next batter
   - Rotate strike on odd runs

4. **End of over**:
   - Increment overs, reset balls to 0
   - Record last bowler (for exclusion next over)
   - Reset current bowler to None (requires new selection)
   - Rotate strike

---

## Innings Completion

An innings ends when ANY of these conditions are met:

1. **All out**: 10 wickets fallen
2. **Overs complete**: 20 overs bowled
3. **Target achieved**: (2nd innings only) total >= target

---

## Batting Order

Teams are automatically ordered by:

1. **Role priority**: Bowlers bat last
2. **Batting skill**: Higher skill bats higher (within role groups)

---

## Extras

- **Wide**: 1.5% chance, 1 run, doesn't count as ball faced
- **No-ball**: 0.5% chance, 1+ runs (can be hit for boundary), doesn't count as ball faced

---

## Dismissal Types

When a wicket falls, the type is determined:

| Type | Probability | Condition |
|------|-------------|-----------|
| Bowled | 20% | Clean wicket (margin <= -38) |
| LBW | 15% | Clean wicket (margin <= -38) |
| Caught | 50% | Edge zone (-22 to -37), 25% catch success |
| Caught Behind | 10% | Edge zone (-22 to -37), 25% catch success |
| Run Out | 3% | Random |
| Stumped | 2% | Random |

---

## Key Calibration Values

These values were tuned through testing to produce realistic T20 outcomes:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Bowling skill scale | 0.78 | Produces 7-9 RPO typically |
| Minimum effective batting | 55 | Prevents tail-ender massacre |
| Clean wicket threshold | -38 | ~3-5% wicket rate |
| Edge zone | -22 to -37 | Creates "close calls" |
| Catch success rate | 25% | In edge zone |
| Boundary threshold | 18 | Calibrates boundary frequency |
| Max wickets per over | 3 | Prevents unrealistic collapses |
| Run rate floor | 3.5 | Minimum ~70 runs per innings |
| Run rate ceiling | 11 | Maximum ~220 runs per innings |
| Anchor intent multiplier | 0.75 | Low variance, safe batting |
| Accumulator intent multiplier | 0.95 | Standard baseline |
| Aggressive intent multiplier | 1.15 | Higher risk/reward |
| Power hitter intent multiplier | 1.25 | Highest variance |
| Anchor floor bonus | +3 | Extra safety for defensive play |

---

## Example Ball Calculation

**Setup:**
- Bowler: Skill 85, Pace, on green_top pitch
- Batter: Skill 70, no traits, 8 balls faced, **aggressive** intent
- Aggression: Balanced
- Run rate: 6.5 (normal)

**Calculation:**

```
Bowling Difficulty:
= 85 * 0.78 + 3 (green_top pace bonus) + 0 (no traits)
= 66.3 + 3 = 69.3 ≈ 69

Batter Roll:
effective_batting = max(70, 55) = 70
aggression_multiplier = 1.0 (balanced)
intent_multiplier = 1.15 (aggressive)
skill_multiplier = 1.0 * 1.15 = 1.15
base_adjustment = 0 (balanced) + 0 (aggressive intent) = 0

base = 70/3 + 0 = 23.3 ≈ 23
variable = (70 * 2/3) * 1.15 = 53.7 ≈ 53
roll = 23 + random(0, 53)  # Let's say 32
total = 55 + 0 (no traits) + 0 (normal RR) + 0 (no protection)
= 55

Margin = 55 - 69 = -14

Result: Margin in range (-12 to -21)
→ "Beaten but survives" - 0 or 1 runs
```

Note: The aggressive intent gives a wider variable range (0-53 vs 0-46 for accumulator), meaning this batter could roll higher for boundaries OR lower for wickets.

---

## Summary

The engine creates realistic cricket by:

1. **Skill-based contests** - Better players win more often
2. **Variance through aggression** - Risk/reward tradeoffs via tactical mode
3. **Batting intent** - Player personalities affect natural variance (anchors vs power hitters)
4. **Situational modifiers** - Pitch, pressure, traits
5. **Guardrails** - Run rate floors/ceilings, wicket protection
6. **Randomness** - Upsets can still happen

This produces scores typically between 140-200 for T20 matches, with realistic wicket fall patterns and dramatic finishes when chasing targets. Teams with more aggressive/power hitter batters score higher on average but lose more wickets, while anchor-heavy teams play safer but score lower.
