# Fort Llama: Causal Chain & Starting Balance — v0.5

> **Purpose**: Single reference for how every player action flows through the simulation to produce outcomes. Covers the four-layer pipeline, the starting scenario analysis, and tuning parameters.
>
> **Version note (v0.5)**: This version reflects the codebase after the `structural-formula-changes` branch merge. All six structural changes from the original spec are implemented, along with three additional mechanics (policy fun penalty, tidiness on maintenance, consideration penalty on fun). Prototype comparison notes have been removed — the formulas documented here match the running code. The fatigue `/N` scaling bug has been corrected. Budget config keys use the standardised naming (`supplyPerPound`, `outflowBoostPerPound`).
>
> **Companion documents**: Fort_Llama_Design_Principles.md (strategic anchor), Pre_Merge_Cleanup.md (change rationale for v0.5 fixes)

---

## 1. The Causal Chain

The game has four layers. Every player action flows through all four before it affects outcomes.

```
PLAYER LEVERS → PRIMITIVES → HEALTH METRICS → OUTCOMES
(what you do)   (what changes)  (how it reads)   (what happens)
```

### Layer 1 — Player Levers

These are the only things the player can directly control:

| Lever | Constraints | Primary Effect |
|-------|------------|----------------|
| **Rent** (£50–£500) | Set once per week | Income = N × rent; higher rent → higher churn (modulated by Living Standards) |
| **Budgets** (6 sliders) | Cost deducted weekly | Boost coverage supply or amplify accumulator outflow |
| **Build** (1/week) | Costs £200–£800; raises ground rent + utilities | Adds capacity (bedrooms, bathrooms, heaven, hot tub) |
| **Research** (1/week) | Costs £500–£2000; takes 1 week | Unlocks policies, buildings, fixed costs, upgrades |
| **Policies** (toggle, 1/week) | Locked until tech researched | Exclude worst 25% from stat averaging; >3 active = fun penalty |
| **Fixed Costs** (toggle) | Weekly cost when active | Multiplier boosts (Starlink → drive, Cleaner → cleaning) |
| **Invite** (1+ per week) | Requires bedroom capacity | Add 1 resident; extra slots from high Partytime |

### Layer 2 — Primitives (8 metrics, 0–100)

Three distinct types, each with a different mechanical shape:

#### Coverage Primitives — supply vs demand, scored via `log2CoverageScore`

| Primitive | Supply formula | Demand | Key levers |
|-----------|---------------|--------|------------|
| **Nutrition** | min(N, kitchenCap) × outputRate × tierMult × kitchenQ × foodMult × (1 + skillMult × cookSkill) × **budgetMult** | N × consumptionRate | Kitchen capacity, cooking skill, ingredients budget |
| **Fun** | min(N, livCap) × outputRate × tierMult × livQ × funMult × (1 + skillMult × avg(socio, stamina)) × policyMult × considerationDamp × **budgetMult** + heavenOutput + hotTubOutput | N × consumptionRate | Living room cap/quality, sociability, party supplies budget, heaven/hot tub buildings |
| **Drive** | min(N, livCap) × outputRate × tierMult × livQ × (1 + skillMult × workEthic) × starlinkMult × **budgetMult** | N × slackRate | Living room cap/quality, work ethic, internet budget, Starlink |

**Great Hall upgrade**: The Great Hall (researched via the Productivity tech tree) replaces the living room. It provides capacity 30 (up from 20) and quality 2.0 (up from 1.0). The quality boost flows through `livQ` in fun, drive, and noise formulas — doubling living-room-based output and halving noise. It is a complete building replacement, not a multiplier on top of the existing room.

Two new modifiers on Fun supply (see New Mechanics below):

**Policy fun penalty** (`policyMult`): When more than 3 policies are active, fun supply is reduced. This creates a cost to bureaucratic overreach — each policy individually helps, but stacking too many dampens the commune's spontaneity.

**Consideration dampener** (`considerationDamp`): Considerate residents slightly reduce fun output (max 5%). This creates a meaningful trade-off: consideration reduces noise (helping Productivity) but dampens fun (hurting Partytime). The player's resident composition now has a genuine tension between considerate and carefree llamas.

The `log2CoverageScore` converts supply/demand ratio to 0–100:

| Ratio | Score | Label |
|-------|-------|-------|
| 0.25 | 0 | Shortfall |
| 0.50 | 25 | Shortfall |
| 0.75 | 40 | Tight |
| 1.00 | 50 | Adequate |
| 1.50 | 65 | Good |
| 2.00 | 75 | Great |
| 4.00 | 100 | Superb |

Coverage budgets multiply base supply via the shared budget curve: `budgetMult = floor + (ceiling − floor) × budget / (budget + refBudget)` where `refBudget = basePerCapita × N^scaleExp`. At £0 spend, supply drops to 50% (`floor`). At the default £10/category (N=10), `budgetMult ≈ 1.0` — equivalent to old baseline. The hyperbolic curve provides built-in diminishing returns and population scaling with economies of scale.

#### Accumulator Primitives — debt that builds over time (higher = worse)

| Primitive | Inflow (mess/wear/exertion) | Outflow (cleaning/repair/recovery) |
|-----------|----------------------------|--------------------------------------|
| **Cleanliness** | messPerRes × N × overcrowdPenalty(N/capBath) | cleanBase × bathQ × cleanMult × (1 + skillMult × tidiness) × **choresRotaBoost** × **cleanerBoost** × **budgetMult** |
| **Maintenance** | wearPerRes × N × overcrowdPenalty(N/capUtil) [custom K=4, P=3] | repairBase × utilQ × repairMult × (1 + handinessCoeff × handiness + tidinessCoeff × tidiness) × **choresRotaBoost** × **budgetMult** |
| **Fatigue** | exertBase × (1 + workMult × workEthic + socioMult × sociability) + **activityFatigue** | recoverBase × bedroomQ × recoveryMult × (1 + partyCoeff × partyStamina) × **wellnessBoost** × **budgetMult** × **recoveryOCDamp** |

Where `budgetMult = floor + (ceiling − floor) × budget / (budget + refBudget)` (shared hyperbolic curve; see Budget Effectiveness) and `recoveryOCDamp = 1 / overcrowdPenalty(rBed)`.

**Activity fatigue**: Fun and drive production feed directly into fatigue exertion: `activityFatigue = funFatigueCoeff × (funSupply / N) + driveFatigueCoeff × (driveSupply / N)`. This creates a natural cost to high fun/drive output — partying hard and working hard are both tiring. The coefficients (0.005 each) add roughly 15–25% to base exertion at moderate-to-high budget, making fatigue a genuine concern that the player must actively manage.

**Tech boosts**: `choresRotaBoost = 1 + chores_rota.effectPercent/100` (15%, passive on research); `cleanerBoost = 1 + cleaner.effectPercent/100` (40%, requires fixed cost activation); `wellnessBoost = 1 + wellness.effectPercent/100` (20%, passive on research). These stack multiplicatively with budgetMult.

Note: fatigue exertion (base + activity) is NOT budget-funded — residents get tired regardless of spend. Only recovery uses the budget curve.

**Accumulator overcrowding denominators**: Cleanliness uses bathroom capacity (`capBath`) — more people sharing fewer bathrooms creates more mess, creating an early incentive to build bathrooms. At N=15 with 3 bathrooms (cap 12), ratio=1.25, penalty=1.5 — a 50% inflow increase that building another bathroom directly relieves. Maintenance uses utility closet capacity (`capUtil` = 40) with custom penalty parameters (K=4, P=3). This stays dormant until ~30 residents, then ramps sharply:

| N | Ratio (capUtil=40) | Penalty | Feel |
|---|---|---|---|
| 30 | 0.75 | 1.000 | Onset |
| 40 | 1.00 | 1.063 | Gentle |
| 50 | 1.25 | 1.500 | Heavy |
| 60 | 1.50 | 2.688 | Punishing |

The steep cubic curve makes maintenance a serious late-game constraint, requiring investment in utility infrastructure beyond 40 residents.

**Tidiness on maintenance** (new in v0.5): The `+ 0.05 × tidiness` term in the maintenance outflow means tidy residents contribute to maintenance as well as cleanliness. This broadens the stat-to-outcome web — tidiness is no longer a single-purpose stat.

**Fatigue scaling**: Fatigue exertion and recovery operate at absolute rates (not divided by population). Raw population growth does not dilute fatigue — the score represents the commune's work/rest balance, not a per-capita average. Population pressure on fatigue is introduced specifically via `recoveryOCDamp`: when bedroom occupancy exceeds `penaltyOnset` (0.75), the overcrowding penalty reduces recovery, causing fatigue to build. Building more bedrooms or researching bedroom upgrades directly relieves this. This differs from cleanliness and maintenance, where inflow scales with N directly (more residents = more mess/wear).

Per-tick update:

```
netFlow = inflow − outflow
if (netFlow < 0) {
    netFlow = netFlow × recoveryDamping    // recovery is slower than accumulation
}
debt = clamp(debt + netFlow × tickScale, 0, 100)
```

**Tick scale**: `tickScale = 0.5` for cleanliness and maintenance; `1.0` for fatigue. This means cleanliness and maintenance accumulate at half the speed their raw net flow suggests, while fatigue moves at full speed. The base rates in Section 6 are stated as raw net flow — actual stock change per tick is halved for the two former accumulators. This asymmetry may be revisited during the tuning pass.

Three structural features to note here:

**Budgets fund the outflow process.** Without budget, outflow runs at the `floor` rate (50%). Budget investment raises this via a shared hyperbolic curve that naturally provides diminishing returns and population scaling. A cleaning budget is more effective when paired with tidy residents and a cleaner tech upgrade, because they all multiply the same outflow term. This is the intended stacking design — multipliers compound, with budget providing the base that other multipliers amplify.

**Recovery is slower than accumulation.** The `recoveryDamping` factor (0.65) means that when outflow exceeds inflow, debt goes down at only 65% of the speed it went up. This creates "memory" — neglect has lasting consequences, and prevention is more valuable than cure. The player learns to invest early rather than react late.

**Overcrowding amplifies inflow (cleanliness/maintenance) and dampens recovery (fatigue).** The overcrowding penalty applies to different sides of the equation depending on the accumulator type, but the effect is consistent: crowded buildings make every accumulator worse.

#### Instantaneous Primitives — recalculated fresh each tick

| Primitive | Formula |
|-----------|---------|
| **Crowding** | max(bedRatio, bathRatio, kitchRatio, livRatio) × baseMult(50) × overcrowdPenalty; effectiveN reduced by 30% × sharingTolerance |
| **Noise** | (N × baseSocial × (1 + socioMult × sociability) × (1 − considMult × consideration) + baseAmbient × overcrowdPenalty) / livingRoomQ |

**Overcrowding penalty** engages below full capacity:

```
overcrowdPenalty(ratio) = 1 + K × max(0, ratio − penaltyOnset)^P
```

With `penaltyOnset = 0.75`, the penalty starts gently at 75% capacity and ramps up through 100% and beyond. This creates graduated pressure rather than a cliff edge — the player feels rooms getting tighter before they hit the wall, which makes building decisions proactive rather than reactive.

| Capacity ratio | Penalty | Feel |
|---------------|---------|------|
| 75% | 1.000 | Just starting |
| 85% | 1.020 | Gentle nudge |
| 90% | 1.045 | Noticeable |
| 100% | 1.125 | Significant |
| 120% | 1.405 | Heavy |

### Layer 3 — Health Metrics (0–100)

Each health metric uses a **multiplicative raw formula** passed through a **population-scaled sigmoid**. The multiplicative structure is a deliberate design choice: one terrible input drags the whole metric down. You can't compensate for terrible cleanliness with great nutrition.

#### Raw Formulas

**Living Standards:**
```
LS_raw = (nutrition/100)^0.5 × (1 − cleanliness/100)^0.35 × (1 − crowding/100)^0.35 × (1 − maintenance/100)^0.35
```

**Productivity** (before fatigue dampening):
```
PR_raw_prefatigue = (drive/100)^1.0 × (1 − noise/100)^0.35 × (1 − crowding/100)^0.25
```

**Partytime** (before fatigue dampening):
```
PT_raw_prefatigue = (fun/100)^1.0
```

Noise is purely negative — it dampens Productivity, full stop. Partytime has no noise component. This gives noise a clean identity: it's bad, and consideration is the stat that fights it.

#### Dynamic Fatigue Dampening

Fatigue dampens whichever of PR and PT the player is pushing hardest, creating the "work hard OR party hard, but not both" tension:

```
prShare = PR_raw_prefatigue / (PR_raw_prefatigue + PT_raw_prefatigue)
ptShare = 1 − prShare

fatigueWeightPR = baseFatigueWeight + (prShare − 0.5) × weightSwing
fatigueWeightPT = baseFatigueWeight + (ptShare − 0.5) × weightSwing

PR_raw = PR_raw_prefatigue × (1 − fatigue/100)^fatigueWeightPR
PT_raw = PT_raw_prefatigue × (1 − fatigue/100)^fatigueWeightPT
```

With `baseFatigueWeight = 0.5` and `weightSwing = 0.5`, the fatigue weight ranges from 0.3 to 0.7. If the player is pushing Productivity hard (prShare = 0.67), PR gets dampened at weight 0.585 while PT only gets 0.415. If perfectly balanced, both sit at 0.5. The asymmetry naturally pulls the player back toward balance — exactly the tension the three-pillar design requires.

#### Sigmoid Scaling

Raw values are converted to 0–100 scores via a population-scaled sigmoid:

```
mRef = ref0 × (pop / pop0)^alpha × tierMult[tier]
x = rawValue / mRef
score = 100 × x^p / (1 + x^p)
```

With defaults: ref0 = 0.3–0.5, pop0 = 2, alpha = 0.15, p = 2, tierMult = [1.0, 1.1, 1.2, 1.35, 1.5, 1.7].

This creates an S-curve where raw values near `mRef` map to ~50, and values well below map to <20. The reference point scales up with population and tier, making higher scores harder to achieve as the commune grows. This is the "scale is the ultimate challenge" principle in mechanical form.

| Pop | Tier | LS mRef (ref0=0.5) | PR/PT mRef (ref0=0.3) |
|-----|------|---------------------|----------------------|
| 2 | 0 | 0.500 | 0.300 |
| 10 | 1 | 0.700 | 0.420 |
| 20 | 2 | 0.872 | 0.523 |
| 50 | 3 | 1.143 | 0.686 |

### Layer 4 — Outcomes

**Vibes:**

OverallLevel = (LS × PR × PT)^(1/3) — geometric mean. Determines tier label (Shambles through Utopia) and branch label based on spread between highest and lowest metric.

**Churn** (end of week):

```
rentToleranceMult = 1 + rentCurve × (50 − LS) / 50
churnRate = baseChurn + (rent × rentMult × rentToleranceMult) + (churnBaselinePR − PR) × churnScalePerPoint
residents leaving = floor(N × churnRate)
```

Each health metric has a distinct outcome lever:

| Metric | Outcome | Mechanism |
|--------|---------|-----------|
| **Productivity** | Churn rate | Low PR → residents leave faster |
| **Partytime** | Recruitment slots | High PT → more invite slots per week |
| **Living Standards** | Rent tolerance | High LS → residents tolerate higher rent without leaving |

The rent tolerance connection means LS directly affects the player's revenue ceiling. At LS = 75, rent hits 35% less hard. At LS = 25, rent hits 35% harder. This completes the three-pillar outcome loop and ensures no metric is ignorable.

**Recruitment** (during weekly planning):

```
slots = 1 + floor((PT − recruitBaselinePT) / recruitScalePerSlot)
```

PT must exceed 35 to get more than 1 invite per week. Each additional 15 points of PT earns another slot.

**Economy** (weekly):

```
Income = N × rent
Costs = groundRent + utilities + Σbudgets + fixedCosts + researchCost
```

Building adds capacity but permanently increases ground rent and utilities via multipliers. Game over at −£20,000 treasury.

---

## 2. New Mechanics (v0.5)

Three mechanics were added beyond the original six structural changes. They are small in numerical impact but expand the stat-to-outcome web and introduce new trade-offs.

### Policy Fun Penalty

**Location**: Fun supply calculation, applied before heaven/hot tub bonuses.

```
policyMult = activePolicies > threshold ? max(0, 1 − K × (activePolicies − threshold)^P) : 1
```

With `threshold = 3`, `K = 0.15`, `P = 1.5`:

| Active policies | policyMult | Fun reduction |
|----------------|------------|---------------|
| 1–3 | 1.00 | None |
| 4 | 0.85 | 15% |
| 5 | 0.58 | 42% |
| 6+ | Near zero | Severe |

**Design rationale**: Policies are individually beneficial (each one excludes the worst 25% of a stat from averaging), but stacking too many dampens the commune's spontaneity. This creates a genuine policy budget — the player must choose which 3 policies matter most, not simply toggle everything on. The steep curve between 4 and 5 is intentional: 4 policies carries a manageable cost, but 5 is a serious commitment that needs to be justified by the stat improvements.

**Current context**: Only 3 policy types exist in the current build (cooking_rota, cleaning_rota, ocado). The penalty is future-proofing for when more policies are added via tech research. At 3 policies, there is zero penalty.

### Tidiness on Maintenance

**Location**: Maintenance outflow formula.

```
repairOut × (1 + handinessCoeff × handiness + tidinessCoeff × tidiness)
```

With `handinessCoeff = 0.1` and `tidinessCoeff = 0.05`, a perfectly handy resident contributes up to +0.1 to the maintenance multiplier; a perfectly tidy resident contributes up to +0.05. Handiness remains ~2× as important as tidiness — tidiness is a welcome secondary contributor, not a rival primary stat.

**Design rationale**: In the original spec, tidiness only affected cleanliness. Maintenance was driven solely by handiness. This made tidiness a narrow stat — useful for exactly one thing. Adding a modest tidiness contribution to maintenance means tidy residents are broadly helpful with upkeep, which feels intuitive (tidy people look after things, not just clean them). The coefficient is deliberately small — handiness remains the primary maintenance stat.

### Consideration Penalty on Fun

**Location**: Fun supply calculation, applied to base fun supply.

```
funSupply × (1 − considerationPenalty × avgConsideration)
```

With `considerationPenalty = 0.05`, the maximum reduction is 5% (at perfect consideration).

**Design rationale**: Consideration already reduces noise, which helps Productivity. Without a downside, it's a purely positive stat — more consideration is always better. The fun penalty introduces a genuine trade-off: considerate llamas are quieter (good for work) but slightly less fun (bad for parties). This creates a composition tension between considerate and carefree residents that reinforces the PR/PT pillar trade-off at the resident recruitment level.

The 5% cap is intentionally small — consideration should still feel like a positive stat overall, just not a free lunch.

---

## 3. Prototype Starting Conditions (Week 1, Tick 1)

> **Historical note**: This section describes what the Replit prototype produced before the structural changes. It is preserved as diagnostic context — the numbers illustrate why the changes were necessary. The rebuild produces different results at these starting conditions.

### Setup

Ten residents (random from 76-llama pool), £0 treasury, £100 rent, all budgets at £0, no tech, no policies. Buildings: 8 bedrooms (cap 16), 1 kitchen (cap 20), 3 bathrooms (cap 12), 1 living room (cap 20), 1 utility closet (cap 40). Population tier 1 (bracket 6–12), output multiplier 1.15×, health tier multiplier 1.1×.

### Expected Resident Stats

The 76-llama pool averages. A random 10-pick will approximate these:

| Stat | Pool avg | As 0–1 | Role |
|------|---------|--------|------|
| Sharing Tolerance | 10.6 | 0.507 | Dampens crowding |
| Cooking Skill | 10.2 | 0.485 | Boosts nutrition output |
| Tidiness | 11.9 | 0.573 | Boosts cleaning output, reduces wear, modest maintenance boost |
| Handiness | 11.3 | 0.543 | Boosts repair output |
| Consideration | 11.6 | 0.560 | Reduces noise; slight fun penalty |
| Sociability | 10.6 | 0.506 | Boosts fun, increases noise and fatigue exertion |
| Party Stamina | 8.4 | 0.388 | Fatigue recovery, minor fun boost |
| Work Ethic | 12.6 | 0.611 | Boosts drive, increases fatigue exertion |

The pool skews productive over fun — Work Ethic is the strongest stat (12.6), Party Stamina the weakest (8.4). This tilts the starting experience toward higher drive but weaker fun output.

### Prototype Primitive Results (Tick 1)

| Primitive | Value | Rating | Key Finding |
|-----------|-------|--------|-------------|
| **Crowding** | 35.3 | Moderate | Bathroom bottleneck (71% cap). Under capacity everywhere — manageable |
| **Noise** | 53.7 | High | 10 people in 1 living room. Major PR dampener |
| **Nutrition** | 35.5 | Tight | Supply/demand ratio 0.67. Underwater from day 1 |
| **Fun** | 31.6 | Tight | Supply/demand ratio 0.60. Same problem |
| **Drive** | 32.2 | Tight | Supply/demand ratio 0.61. Same problem |
| **Cleanliness** | 0→100 by Day 5 | 🔴 Catastrophic | messIn=12.0 vs cleanOut=3.17. Net +8.83/tick. Runaway |
| **Maintenance** | 0→100 by Day 7 | 🔴 Catastrophic | wearIn=10.0 vs repairOut=4.16. Net +5.84/tick. Runaway |
| **Fatigue** | Slow climb | 🟢 Tuned | Base exertion (0.62) + activity fatigue (~0.10) vs recovery (0.51 × budgetMult). Requires wellness tech + budget to stabilise |

### Prototype Health Metrics (Tick 1)

| Metric | Raw | mRef | Score | Notes |
|--------|-----|------|-------|-------|
| **Living Standards** | 0.512 | 0.700 | 34.8 | Nutrition barely adequate; cleanliness will crater this within days |
| **Productivity** | 0.220 | 0.420 | 21.6 | Low drive AND noise dampener. Below the churn threshold (35) |
| **Partytime** | 0.330 | 0.420 | 38.1 | Low fun but noise gives a small boost. Just above recruit threshold |

**Vibes: 30.3** — "Scrappy" tier. Balanced (spread under 0.18), but that's because everything is uniformly poor.

### Prototype Day-by-Day Collapse

| Day | Clean | Maint | Fatigue | LS | PR | PT | Vibes |
|-----|-------|-------|---------|-----|-----|-----|-------|
| 1 | 4 | 3 | 0 | 33.7 | 21.6 | 38.1 | 30.3 |
| 2 | 31 | 20 | 0 | 26.0 | 21.6 | 38.1 | 27.8 |
| 3 | 57 | 38 | 0 | 17.4 | 21.6 | 38.1 | 24.3 |
| 4 | 84 | 56 | 0 | 7.8 | 21.6 | 38.1 | 18.6 |
| **5** | **100** | 73 | 0 | **0.0** | 21.6 | 38.1 | **0.0** |
| 7 | 100 | 100 | 0 | 0.0 | 21.6 | 38.1 | 0.0 |

By Day 5, the commune hits Vibes 0 ("Shambles") regardless of anything the player does. There are no affordable tools to prevent this.

### Prototype Economy (Week 1)

| Item | Amount |
|------|--------|
| Income (10 × £100) | +£1,000 |
| Ground rent | −£1,000 |
| Utilities | −£200 |
| Budgets | £0 |
| **Net** | **−£200** |

The player can't afford any budget spending without going further into debt. At 75% bedroom capacity (12 residents), income would be £1,200 — exactly break-even before budgets.

### Prototype Churn (End of Week 1)

```
churnRate = 0.20 + (100 × 0.0003) + (35 − 21.6) × 0.01 = 0.369
Residents leaving: floor(10 × 0.369) = 3
Recruitment slots: 1
Net population: 10 − 3 + 1 = 8
```

Three residents leave out of ten. Low Productivity (+13.4% churn penalty) is the main driver. The player gets 1 invite slot, producing a net loss of 2 residents per week.

---

## 4. Diagnosis: What the Prototype Got Wrong

The prototype had three critical problems and two secondary ones. All are addressed by the structural changes and tuning now implemented. This section is preserved as design rationale — it explains *why* the changes were made.

### 🔴 Accumulators were wildly unbalanced

| Accumulator | Inflow | Outflow | Ratio | Behaviour |
|-------------|--------|---------|-------|-----------|
| Cleanliness | 12.0 | 3.17 | **3.79:1** | Hits 100 by Day 5 |
| Maintenance | 10.0 | 4.16 | **2.40:1** | Hits 100 by Day 7 |
| Fatigue | 0.62 + ~0.10 activity | 0.51 × budgetMult | **~1.4:1** | Requires wellness tech to reverse |

The design intent is that accumulators should "drift negative at baseline — visible pressure within a weekly cycle that motivates the player to act." The original prototype had catastrophic ratios (3.79:1 for cleanliness) and an inert fatigue (0.69:1, permanently zero). After tuning: base rates produce slow drift (~1.2–1.5:1), activity fatigue from fun/drive production makes fatigue a genuine concern, and tech investment (chores_rota, cleaner, wellness) provides the tools to stabilise.

**What was fixed**: Accumulator base rates retuned (messPerRes: 1.2→0.4, wearPerRes: 1.0→0.5, exertBase: 3→5, recoverBase: 5→4.5). Budgets now boost outflow (stacking with multipliers) instead of subtracting from stock. Asymmetric recovery adds "memory." Dynamic fatigue dampening creates work/party tension even at moderate fatigue.

### 🔴 Coverage primitives were supply-starved

All three sat at 0.60–0.67 supply/demand ratio, mapping to scores of 31–36. The design target is 35–45 at baseline — still "Tight" but with "Adequate" reachable through moderate investment.

**What was fixed**: Output rates increased (nutrition: 5→7, fun: 6→9, drive: 4→6) to produce base ratios of ~0.85–0.95 with tier 1 bonus.

### 🔴 Economy didn't allow budget investment

Income (£1,000) minus fixed costs (£1,200) = −£200/week. The player couldn't afford any budget spending — the tutorial-by-stealth couldn't function.

**What was fixed**: Ground rent reduced from £1,000 to £800, giving break-even at starting conditions with ~£100–200/week headroom for small budget experiments.

### 🟡 Accumulator budgets didn't work (structural)

The prototype's stock-subtraction structure produced 0.048/tick of debt reduction against 4.42/tick of net inflow — 1% effective.

**What was fixed**: The outflow-boost structure makes a £100 budget produce a 1.5× multiplier on cleaning output. Meaningful, scales with other multipliers, and teaches the player how budgets work.

### 🟡 Living Standards had no outcome lever (structural)

LS fed into Vibes (a display metric) but had no mechanical effect on churn, recruitment, or economy. The `rentCurve: 0.7` config parameter existed but was never wired in.

**What was fixed**: LS wired into rent tolerance, completing the three-pillar outcome loop.

---

## 5. The Death Spiral (Prototype, No Intervention)

> **Historical note**: This describes the prototype behaviour. The rebuild's retuned parameters should produce a very different trajectory — see Target Starting Experience (Section 7).

| Week | Residents | Income | Costs | Treasury | Churn | Net Pop |
|------|-----------|--------|-------|----------|-------|---------|
| 1 | 10 | £1,000 | £1,200 | −£200 | 3 leave, 1 join | 8 |
| 2 | 8 | £800 | £1,200 | −£600 | 2–3 leave, 1 join | 6 |
| 3 | 6 | £600 | £1,200 | −£1,200 | 1–2 leave, 1 join | 5 |
| 4 | 5 | £500 | £1,200 | −£1,900 | 1 leave, 1 join | 5 |

Meanwhile cleanliness hits 100 within 2 days, which craters Living Standards to zero, which (via rent tolerance) amplifies rent churn further. By Week 3, the player is losing money, losing residents, and all three health metrics are declining. The player has no affordable counter-moves.

This death spiral is the prototype's starting experience. The rebuild aims to replace it with what the design principles describe: "perilous but survivable" — visible pressure that motivates action, with affordable tools to respond.

---

## 6. Implemented Tuning Parameters

These are the tuning values currently in the codebase. They were set based on the analysis in Sections 3–5 and assume all structural changes are in place. They are best-guess starting parameters and will need play-testing.

### Accumulator Base Rates

Target: unbudgeted inflow:outflow ratio of roughly 1.2:1 to 1.4:1.

| Accumulator | Inflow param | Value | Outflow param | Value | Approx ratio (at budgetMult=1.0) |
|-------------|-------------|-------|---------------|-------|--------------|
| **Cleanliness** | messPerRes | 0.10 | cleanBase | 0.52 | ~1.92:1 |
| **Maintenance** | wearPerRes | 0.08 | repairBase | 0.54 | ~1.48:1 |
| **Fatigue** | exertBase | 0.62 | recoverBase | 0.51 | ~1.22:1 (base only) |

Fatigue's base ratio looks tight, but **activity fatigue** from fun/drive production adds roughly 15–25% to exertion at moderate budget, pushing the effective ratio to ~1.4–1.5:1. This makes fatigue the primary accumulator pressure in an actively managed commune — the player can stabilise cleanliness and maintenance with budget + tech, but fatigue requires dedicated investment via the wellness tech and fatigue budget.

**Budget interaction (cleanliness example)**: At £0 budget, budgetMult=0.5, so outflow is halved — net flow strongly positive, cleanliness deteriorates rapidly. At the default £10/category (N=10), budgetMult≈1.0, restoring baseline behaviour (slow positive drift). At £30/category, budgetMult≈1.25, outflow exceeds inflow, drift halts and slowly reverses via recovery damping.

**Budget interaction (fatigue example)**: At £0 budget, recovery runs at 50%, fatigue builds fast. At £20/category (N=10), budgetMult≈1.17, recovery nearly matches base exertion — but activity fatigue from fun/drive still pushes the balance negative. The player needs both budget AND the wellness tech (+20% recovery) to stabilise fatigue at moderate investment levels.

**Tech interaction**: Chores Rota (+15%) is a cheap L1 tech that boosts both cleanliness and maintenance outflow. Stacked with Cleaner (+40%, L2 fixed expense), cleanliness becomes fully recoverable at moderate budget. Wellness (+20%, L2 culture) targets fatigue recovery specifically, offsetting the activity fatigue penalty. The tech tree creates a clear progression: early research stabilises accumulators, freeing budget for coverage investment.

### Coverage Base Ratios

Target: supply/demand ratio of ~0.85–0.95 at 10 residents with tier 1 bonus, producing scores of 43–49 ("Tight" approaching "Adequate").

| Primitive | outputRate | consumptionRate | Approx ratio | Score |
|-----------|-----------|-----------------|--------------|-------|
| **Nutrition** | 7 | 9 | 0.89 | ~47 |
| **Fun** | 9 | 12 | 0.86 | ~45 |
| **Drive** | 6 | 8 | 0.86 | ~45 |

Fun and Drive score slightly lower than Nutrition. This is deliberate — Nutrition feeds Living Standards (the foundation pillar), while Fun and Drive feed the two competing pillars. The player's first "Adequate" achievement is likely to be in nutrition, which feels right for the early learning curve.

### Economy Starting Point

Target: slight deficit at starting config (10 residents, £100 rent, default budgets), requiring growth or optimisation to break even.

| Item | Amount |
|------|--------|
| Income (10 × £100) | £1,000 |
| Ground rent | **£800** |
| Utilities | £200 |
| Default budgets (6 × £10) | £60 |
| **Net** | **−£60/week** |

The player starts with a small deficit. This is deliberate — budgets are now mandatory operating costs (not optional boosts), and the deficit creates immediate growth pressure. Growing to 12 residents covers the gap; optimising budgets (reducing underperforming categories, investing in high-impact ones) teaches the core mechanic.

With the LS → rent tolerance mechanic active, a player who invests in LS earns the ability to raise rent without spiking churn. This creates a positive feedback loop: invest in quality → tolerate higher rent → more income → invest further. The starting economy needs to be tight enough that this loop feels earned, not automatic.

### Other Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| penaltyOnset | 0.75 | Overcrowding penalty starts at 75% capacity |
| recoveryDamping | 0.65 | Debt recovers at 65% of accumulation speed |
| budgetCurve.basePerCapita | 2.0 | Reference budget per capita (£ per resident at neutral) |
| budgetCurve.scaleExp | 0.7 | Economies of scale — sublinear growth with population |
| budgetCurve.floor | 0.5 | Effectiveness at £0 (scrounging / volunteer effort) |
| budgetCurve.ceiling | 1.5 | Asymptotic max effectiveness (diminishing returns cap) |
| baseFatigueWeight | 0.5 | Centre point for dynamic fatigue dampening |
| fatigueWeightSwing | 0.5 | Range of fatigue weight shift (0.3–0.7) |
| rentCurve | 0.7 | LS influence on rent tolerance |
| rentTierCurvature | 2 | Curved LS scaling for rent tier display labels |
| funFatigueCoeff | 0.005 | Fun supply per-capita contribution to fatigue exertion |
| driveFatigueCoeff | 0.005 | Drive supply per-capita contribution to fatigue exertion |
| chores_rota.effectPercent | 15 | Passive cleanliness + maintenance outflow boost on research |
| cleaner.effectPercent | 40 | Cleanliness outflow boost (fixed expense) |
| wellness.effectPercent | 20 | Passive fatigue recovery boost on research |
| handinessCoeff | 0.25 | Handiness contribution to maintenance outflow (primary) |
| tidinessCoeff | 0.12 | Tidiness contribution to maintenance outflow (secondary) |
| considerationPenalty | 0.12 | Fun reduction from consideration |
| funPenalty.threshold | 3 | Policies above this count reduce fun |
| funPenalty.K | 0.15 | Policy fun penalty severity |
| funPenalty.P | 1.5 | Policy fun penalty curvature |

### Sigmoid and Evaluation — Still Needs Testing

Once the above parameters are producing healthier primitive values in play-testing, the sigmoid layer needs checking. Two things to watch:

**LS sensitivity matters more now.** With LS wired to rent tolerance, the sigmoid's effect on LS scores directly affects the economy. If the sigmoid compresses LS into a narrow band (say 30–50), the rent tolerance effect becomes muted. The current ref0=0.5 may be too aggressive — consider reducing to 0.4 if LS scores cluster too tightly.

**Score clustering in the 40–60 range.** If all three health metrics sit in the same narrow band, the player loses the ability to distinguish "doing well" from "doing poorly." Consider reducing `p` from 2 to 1.5 (gentler S-curve) if this happens.

---

## 7. Target Starting Experience

After all structural changes and tuning, the ideal week-by-week experience:

**Week 1**: Vibes at "Rough" to "Scrappy" (15–35). Coverage primitives are "Tight" (43–47) — not great, but not alarm bells. Cleanliness and maintenance are visibly building but manageable. Economy is roughly break-even. The player can afford £75–100 in one budget category — their first real choice. Churn is 1–2 residents (not 3), and they get 1 invite slot. Net population is stable or slightly declining.

**Weeks 2–4**: The player makes choices — invest in cleaning budget vs ingredients vs building a bathroom vs saving for research. If they do nothing, cleanliness and maintenance drift upward, pulling down LS, which makes rent hit harder (via rent tolerance). If they invest wisely, metrics improve noticeably. Fatigue is starting to build — not critical, but the player notices it. The work/party tension begins to matter. First research completes by week 3–4.

**Week 5+**: First tech unlocks (Chores Rota, etc.) give a meaningful boost. The player starts to feel progression — multipliers stacking. Churn rate drops as PR climbs above 35. Growth begins. The early crisis is over; the mid-game strategic layer opens up.

**Weeks 8–12**: Second tier of tech. New buildings open new strategies. Player approaches 75% bedroom capacity and starts generating real surplus. The three-pillar balance becomes the central strategic puzzle. Which tech tree? How to balance PR vs PT with fatigue as the constraint? How high can rent go before LS can't support it?

---

## Appendix A: Key Formula Reference

| Formula | Expression |
|---------|-----------|
| Stat → 0-1 | `(stat − 1) / 19` |
| Overcrowding | `1 + K × max(0, ratio − penaltyOnset)^P` |
| Coverage score | `25 × (log₂(supply/demand) + 2)`, clamped 0–100 |
| Dampener | `(1 − value/100)^weight` |
| Baseline | `(value/100)^weight` |
| Sigmoid | `100 × x^p / (1 + x^p)` where `x = raw / mRef` |
| Budget multiplier | `floor + (ceiling − floor) × budget / (budget + refBudget)` where `refBudget = basePerCapita × N^scaleExp` |
| Activity fatigue | `funFatigueCoeff × funSupply/N + driveFatigueCoeff × driveSupply/N` |
| Fatigue exertion | `exertBase × (1 + workMult × workEthic + socioMult × sociability) + activityFatigue` |
| Recovery damping | `netFlow × recoveryDamping` (when netFlow < 0) |
| Rent tolerance | `1 + rentCurve × (50 − LS) / 50` |
| Policy fun penalty | `max(0, 1 − K × (policies − threshold)^P)` when policies > threshold |
| Consideration fun damp | `1 − considerationPenalty × avgConsideration` |
| Vibes | `(LS × PR × PT)^(1/3)` |
| Churn | `baseChurn + (rent × rentMult × rentToleranceMult) + (35 − PR) × churnScale` |
| Recruit | `1 + floor((PT − 35) / 15)` |

## Appendix B: Config Locations

All tunable values are in modular files under `server/`:

| Config object | File | What it controls |
|---------------|------|-----------------|
| `DEFAULT_PRIMITIVE_CONFIG` | `server/config.js` | All 8 primitive formulas — rates, multipliers, penalty curves, `recoveryDamping`, `penaltyOnset`, `tidinessCoeff`, `handinessCoeff`, `considerationPenalty` |
| `DEFAULT_POLICY_CONFIG` | `server/config.js` | Policy effect scaling: `excludePercent`, `funPenalty` (threshold, K, P) |
| `DEFAULT_HEALTH_CONFIG` | `server/config.js` | Health metric weights, sigmoid parameters, churn/recruit thresholds, `baseFatigueWeight`, `fatigueWeightSwing`, `rentCurve` |
| `DEFAULT_VIBES_CONFIG` | `server/config.js` | Tier labels, balance thresholds, branch labels |
| `DEFAULT_BUDGET_CONFIG` | `server/config.js` | Budget curve parameters (`floor`, `ceiling`, `basePerCapita`, `scaleExp`), category labels |
| `DEFAULT_TIER_CONFIG` | `server/config.js` | Population brackets, output/health multipliers, quality caps |
| `DEFAULT_TECH_CONFIG` | `server/config.js` | Tech costs, weekly costs, effect percentages |
| `INITIAL_DEFAULTS` | `server/config.js` | Economy: treasury, rent, ground rent, utilities, churn rates |
| `DEFAULT_BUILDINGS` | `server/config.js` | Building capacities, costs, multipliers |

Engine logic is split across:

| Module | What it does |
|--------|-------------|
| `server/primitives.js` | Layer 1–2 calculations (coverage, accumulators, instantaneous) |
| `server/healthMetrics.js` | Layer 3 calculations (LS, PR, PT, sigmoid, fatigue dampening) |
| `server/outcomes.js` | Layer 4 calculations (vibes, churn, recruitment, rent tiers) |
| `server/gameState.js` | Tick loop orchestration |
| `server/residents.js` | Resident stat utilities |
| `server/state.js` | Shared mutable state object |
| `server/routes.js` | API endpoints |
| `server/utils.js` | Helper functions |

## Appendix C: Structural Changes — Implementation Status

All six structural changes from the original spec are implemented, plus three additional mechanics.

| # | Change | Status | Files |
|---|--------|--------|-------|
| 1 | Asymmetric accumulator recovery | ✅ Implemented | primitives.js |
| 2 | Budgets boost outflow | ✅ Implemented | primitives.js |
| 3 | Dynamic fatigue dampening | ✅ Implemented | healthMetrics.js |
| 4 | Noise boost removed from PT | ✅ Implemented | healthMetrics.js |
| 5 | Overcrowding starts below capacity | ✅ Implemented | primitives.js |
| 6 | LS wired to rent tolerance | ✅ Implemented | outcomes.js |
| B | Policy fun penalty | ✅ New in v0.5 | primitives.js |
| C | Tidiness on maintenance | ✅ New in v0.5 | primitives.js |
| F | Consideration penalty on fun | ✅ New in v0.5 | primitives.js |

### v0.5 Cleanup (Pre_Merge_Cleanup.md)

| Change | Status | What |
|--------|--------|------|
| Fatigue `/N` removal | ✅ Done | Remove population division from exertion and recovery |
| Dead code removal | ✅ Done | `getTierHealthMult`, `statToPercentage` |
| Legacy config removal | ✅ Done | `rentTierThresholds` from INITIAL_DEFAULTS |
| Budget naming | ✅ Done | `efficiency` → `supplyPerPound`, `budgetEfficiency` → `outflowBoostPerPound` |
| Budget as base rate | ✅ Done | Replaced additive/multiplicative budget model with unified hyperbolic `budgetEffectiveness` curve. Budget now funds base production; buildings multiply. Zero-spend penalty, population scaling, economies of scale, diminishing returns. Default starting budgets £10/category. |
| Activity fatigue | ✅ Done | Fun/drive supply feeds fatigue exertion via `funFatigueCoeff` and `driveFatigueCoeff` (0.005 each). Calculation order restructured: fun/drive supply computed before fatigue. |
| Tech effects wired | ✅ Done | Chores Rota (+15% cleanliness & maintenance outflow), Cleaner (20→40%), Wellness (+20% fatigue recovery). Passive techs check `researchedTechs`. |
