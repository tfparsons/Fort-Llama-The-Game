# Fort Llama: Causal Chain & Starting Balance

> **Purpose**: Single reference for how every player action flows through the simulation to produce outcomes. Covers the four-layer pipeline, the starting scenario analysis, and tuning recommendations for the rebuild.
>
> **How to read this document**: The causal chain (Section 1) describes the *rebuild target* â€” formulas as they should work after all structural changes are implemented. Where the Replit prototype differs, this is flagged with a âš ï¸ **Prototype** note explaining what currently exists and why it's changing. The starting balance analysis (Sections 2â€“4) diagnoses the prototype's problems. The tuning recommendations (Section 5) are best-guess starting parameters for the rebuild.
>
> **Source documents**: Fort_Llama_Design_Principles.md (strategic anchor), Fort_Llama_Structural_Changes.md (implementation specs)

---

## 1. The Causal Chain

The game has four layers. Every player action flows through all four before it affects outcomes.

```
PLAYER LEVERS â†’ PRIMITIVES â†’ HEALTH METRICS â†’ OUTCOMES
(what you do)   (what changes)  (how it reads)   (what happens)
```

### Layer 1 â€” Player Levers

These are the only things the player can directly control:

| Lever | Constraints | Primary Effect |
|-------|------------|----------------|
| **Rent** (Â£50â€“Â£500) | Set once per week | Income = N Ã— rent; higher rent â†’ higher churn (modulated by Living Standards) |
| **Budgets** (6 sliders) | Cost deducted weekly | Boost coverage supply or amplify accumulator outflow |
| **Build** (1/week) | Costs Â£200â€“Â£800; raises ground rent + utilities | Adds capacity (bedrooms, bathrooms, heaven, hot tub) |
| **Research** (1/week) | Costs Â£500â€“Â£2000; takes 1 week | Unlocks policies, buildings, fixed costs, upgrades |
| **Policies** (toggle, 1/week) | Locked until tech researched | Exclude worst 25% from stat averaging; >3 active = fun penalty |
| **Fixed Costs** (toggle) | Weekly cost when active | Multiplier boosts (Starlink â†’ drive, Cleaner â†’ cleaning) |
| **Invite** (1+ per week) | Requires bedroom capacity | Add 1 resident; extra slots from high Partytime |

### Layer 2 â€” Primitives (8 metrics, 0â€“100)

Three distinct types, each with a different mechanical shape:

#### Coverage Primitives â€” supply vs demand, scored via `log2CoverageScore`

| Primitive | Supply formula | Demand | Key levers |
|-----------|---------------|--------|------------|
| **Nutrition** | min(N, kitchenCap) Ã— outputRate Ã— tierMult Ã— kitchenQ Ã— foodMult Ã— (1 + skillMult Ã— cookSkill) + budget Ã— efficiency | N Ã— consumptionRate | Kitchen capacity, cooking skill, ingredients budget |
| **Fun** | min(N, livCap) Ã— outputRate Ã— tierMult Ã— livQ Ã— funMult Ã— (1 + skillMult Ã— avg(socio, stamina)) Ã— policyMult + budget + heavenOutput + hotTubOutput | N Ã— consumptionRate | Living room cap, sociability, party supplies budget, heaven/hot tub buildings |
| **Drive** | min(N, livCap) Ã— outputRate Ã— tierMult Ã— livQ Ã— (1 + skillMult Ã— workEthic) Ã— starlinkMult + budget | N Ã— slackRate | Living room cap, work ethic, internet budget, Starlink |

The `log2CoverageScore` converts supply/demand ratio to 0â€“100:

| Ratio | Score | Label |
|-------|-------|-------|
| 0.25 | 0 | Shortfall |
| 0.50 | 25 | Shortfall |
| 0.75 | 40 | Tight |
| 1.00 | 50 | Adequate |
| 1.50 | 65 | Good |
| 2.00 | 75 | Good |
| 4.00 | 100 | Superb |

Coverage budgets add directly to supply. They provide immediate, legible feedback â€” more budget = better coverage ratio. Diminishing returns come naturally from the logarithmic scoring: the first Â£50 matters more than the fifth.

#### Accumulator Primitives â€” debt that builds over time (higher = worse)

| Primitive | Inflow (mess/wear/exertion) | Outflow (cleaning/repair/recovery) |
|-----------|----------------------------|--------------------------------------|
| **Cleanliness** | messPerRes Ã— N Ã— overcrowdPenalty | cleanBase Ã— bathQ Ã— cleanMult Ã— (1 + skillMult Ã— tidiness) Ã— cleanerMult Ã— **budgetBoost** |
| **Maintenance** | wearPerRes Ã— N Ã— overcrowdPenalty | repairBase Ã— utilQ Ã— repairMult Ã— (1 + 0.5 Ã— handiness + 0.2 Ã— tidiness) Ã— **budgetBoost** |
| **Fatigue** | N Ã— exertBase Ã— (1 + workMult Ã— workEthic + socioMult Ã— sociability) | N Ã— recoverBase Ã— bedroomQ Ã— recoveryMult Ã— (1 + 0.3 Ã— partyStamina) Ã— **budgetBoost** |

Where `budgetBoost = 1 + (budget Ã— budgetEfficiency)`.

Per-tick update:

```
netFlow = inflow âˆ’ outflow
if (netFlow < 0) {
    netFlow = netFlow Ã— recoveryDamping    // recovery is slower than accumulation
}
debt = clamp(debt + netFlow Ã— scale, 0, 100)
```

Two structural features to note here:

**Budgets boost outflow, not subtract from stock.** This means budgets amplify the underlying cleaning/repair/recovery process rather than fighting accumulated results. A cleaning budget is more effective when paired with tidy residents and a cleaner tech upgrade, because they all multiply the same outflow term. This is the intended stacking design â€” multipliers compound.

**Recovery is slower than accumulation.** The `recoveryDamping` factor (target: 0.65) means that when outflow exceeds inflow, debt goes down at only 65% of the speed it went up. This creates "memory" â€” neglect has lasting consequences, and prevention is more valuable than cure. The player learns to invest early rather than react late.

> âš ï¸ **Prototype difference**: The Replit prototype uses a completely different budget structure for accumulators. Budgets subtract a tiny amount directly from the accumulated debt stock each tick: `debt -= budget Ã— reductionRate / ticksPerWeek`. With `reductionRate = 0.02` and 42 ticks per week, a Â£100 budget reduces debt by 0.048/tick â€” roughly 1% of the net inflow. Budgets for accumulators are functionally useless in the prototype. There is also no recovery damping â€” accumulation and recovery are symmetric. Both issues are addressed by Structural Changes 1 and 2.

#### Instantaneous Primitives â€” recalculated fresh each tick

| Primitive | Formula |
|-----------|---------|
| **Crowding** | max(bedRatio, bathRatio, kitchRatio, livRatio) Ã— baseMult(50) Ã— overcrowdPenalty; effectiveN reduced by 30% Ã— sharingTolerance |
| **Noise** | (N Ã— baseSocial Ã— (1 + socioMult Ã— sociability) Ã— (1 âˆ’ considMult Ã— consideration) + baseAmbient Ã— overcrowdPenalty) / livingRoomQ |

**Overcrowding penalty** engages below full capacity:

```
overcrowdPenalty(ratio) = 1 + K Ã— max(0, ratio âˆ’ penaltyOnset)^P
```

With `penaltyOnset = 0.75`, the penalty starts gently at 75% capacity and ramps up through 100% and beyond. This creates graduated pressure rather than a cliff edge â€” the player feels rooms getting tighter before they hit the wall, which makes building decisions proactive rather than reactive.

| Capacity ratio | Penalty | Feel |
|---------------|---------|------|
| 75% | 1.000 | Just starting |
| 85% | 1.020 | Gentle nudge |
| 90% | 1.045 | Noticeable |
| 100% | 1.125 | Significant |
| 120% | 1.405 | Heavy |

> âš ï¸ **Prototype difference**: The prototype uses `penaltyOnset = 1.0`, meaning zero penalty until a room exceeds 100% capacity. This is a cliff edge that gives no signal as rooms fill up. Changed by Structural Change 5.

### Layer 3 â€” Health Metrics (0â€“100)

Each health metric uses a **multiplicative raw formula** passed through a **population-scaled sigmoid**. The multiplicative structure is a deliberate design choice: one terrible input drags the whole metric down. You can't compensate for terrible cleanliness with great nutrition.

#### Raw Formulas

**Living Standards:**
```
LS_raw = (nutrition/100)^0.5 Ã— (1 âˆ’ cleanliness/100)^0.35 Ã— (1 âˆ’ crowding/100)^0.35 Ã— (1 âˆ’ maintenance/100)^0.35
```

**Productivity** (before fatigue dampening):
```
PR_raw_prefatigue = (drive/100)^1.0 Ã— (1 âˆ’ noise/100)^0.35 Ã— (1 âˆ’ crowding/100)^0.25
```

**Partytime** (before fatigue dampening):
```
PT_raw_prefatigue = (fun/100)^1.0
```

#### Dynamic Fatigue Dampening

Fatigue dampens whichever of PR and PT the player is pushing hardest, creating the "work hard OR party hard, but not both" tension:

```
prShare = PR_raw_prefatigue / (PR_raw_prefatigue + PT_raw_prefatigue)
ptShare = 1 âˆ’ prShare

fatigueWeightPR = baseFatigueWeight + (prShare âˆ’ 0.5) Ã— weightSwing
fatigueWeightPT = baseFatigueWeight + (ptShare âˆ’ 0.5) Ã— weightSwing

PR_raw = PR_raw_prefatigue Ã— (1 âˆ’ fatigue/100)^fatigueWeightPR
PT_raw = PT_raw_prefatigue Ã— (1 âˆ’ fatigue/100)^fatigueWeightPT
```

With `baseFatigueWeight = 0.5` and `weightSwing = 0.5`, the fatigue weight ranges from 0.3 to 0.7. If the player is pushing Productivity hard (prShare = 0.67), PR gets dampened at weight 0.585 while PT only gets 0.415. If perfectly balanced, both sit at 0.5. The asymmetry naturally pulls the player back toward balance â€” exactly the tension the three-pillar design requires.

> âš ï¸ **Prototype difference**: The prototype uses fixed fatigue weights â€” PR at 0.55, PT at 0.45. This makes fatigue a universal drag rather than a balancing mechanism. The prototype also gives PT a small noise boost (`1 + 0.08 Ã— noise/100`), which confuses noise's identity by making it simultaneously bad for PR and good for PT. Both are removed. Noise is now purely negative â€” it dampens Productivity, full stop. Addressed by Structural Changes 3 and 4.

#### Sigmoid Scaling

Raw values are converted to 0â€“100 scores via a population-scaled sigmoid:

```
mRef = ref0 Ã— (pop / pop0)^alpha Ã— tierMult[tier]
x = rawValue / mRef
score = 100 Ã— x^p / (1 + x^p)
```

With defaults: ref0 = 0.3â€“0.5, pop0 = 2, alpha = 0.15, p = 2, tierMult = [1.0, 1.1, 1.2, 1.35, 1.5, 1.7].

This creates an S-curve where raw values near `mRef` map to ~50, and values well below map to <20. The reference point scales up with population and tier, making higher scores harder to achieve as the commune grows. This is the "scale is the ultimate challenge" principle in mechanical form.

| Pop | Tier | LS mRef (ref0=0.5) | PR/PT mRef (ref0=0.3) |
|-----|------|---------------------|----------------------|
| 2 | 0 | 0.500 | 0.300 |
| 10 | 1 | 0.700 | 0.420 |
| 20 | 2 | 0.872 | 0.523 |
| 50 | 3 | 1.143 | 0.686 |

### Layer 4 â€” Outcomes

**Vibes:**

OverallLevel = (LS Ã— PR Ã— PT)^(1/3) â€” geometric mean. Determines tier label (Shambles through Utopia) and branch label based on spread between highest and lowest metric.

**Churn** (end of week):

```
rentToleranceMult = 1 + rentCurve Ã— (50 âˆ’ LS) / 50
churnRate = baseChurn + (rent Ã— rentMult Ã— rentToleranceMult) + (churnBaselinePR âˆ’ PR) Ã— churnScalePerPoint
residents leaving = floor(N Ã— churnRate)
```

Each health metric now has a distinct outcome lever:

| Metric | Outcome | Mechanism |
|--------|---------|-----------|
| **Productivity** | Churn rate | Low PR â†’ residents leave faster |
| **Partytime** | Recruitment slots | High PT â†’ more invite slots per week |
| **Living Standards** | Rent tolerance | High LS â†’ residents tolerate higher rent without leaving |

The rent tolerance connection means LS directly affects the player's revenue ceiling. At LS = 75, rent hits 35% less hard. At LS = 25, rent hits 35% harder. This completes the three-pillar outcome loop and ensures no metric is ignorable.

> âš ï¸ **Prototype difference**: The prototype churn formula is `baseChurn + rent Ã— 0.0003 + (35 âˆ’ PR) Ã— 0.01` â€” only PR and rent affect churn. LS has no direct outcome lever; it feeds into Vibes (a display metric) but doesn't mechanically affect anything. There IS a `rentCurve: 0.7` parameter in the health config that was clearly intended for this purpose, but it's never referenced in the churn formula. This is an unimplemented feature, not a design choice. Fixed by Structural Change 6.

**Recruitment** (during weekly planning):

```
slots = 1 + floor((PT âˆ’ recruitBaselinePT) / recruitScalePerSlot)
```

PT must exceed 35 to get more than 1 invite per week. Each additional 15 points of PT earns another slot.

**Economy** (weekly):

```
Income = N Ã— rent
Costs = groundRent + utilities + Î£budgets + fixedCosts + researchCost
```

Building adds capacity but permanently increases ground rent and utilities via multipliers. Game over at âˆ’Â£20,000 treasury.

---

## 2. Prototype Starting Conditions (Week 1, Tick 1)

This section describes what the Replit prototype actually produces with default settings. It's a diagnostic snapshot â€” the numbers reveal where the mechanical problems are.

### Setup

Ten residents (random from 76-llama pool), Â£0 treasury, Â£100 rent, all budgets at Â£0, no tech, no policies. Buildings: 8 bedrooms (cap 16), 1 kitchen (cap 20), 3 bathrooms (cap 12), 1 living room (cap 20), 1 utility closet (cap 40). Population tier 1 (bracket 6â€“12), output multiplier 1.15Ã—, health tier multiplier 1.1Ã—.

### Expected Resident Stats

The 76-llama pool averages. A random 10-pick will approximate these:

| Stat | Pool avg | As 0â€“1 | Role |
|------|---------|--------|------|
| Sharing Tolerance | 10.6 | 0.507 | Dampens crowding |
| Cooking Skill | 10.2 | 0.485 | Boosts nutrition output |
| Tidiness | 11.9 | 0.573 | Boosts cleaning, reduces wear |
| Handiness | 11.3 | 0.543 | Boosts repair output |
| Consideration | 11.6 | 0.560 | Reduces noise |
| Sociability | 10.6 | 0.506 | Boosts fun, increases noise |
| Party Stamina | 8.4 | 0.388 | Fatigue recovery, minor fun boost |
| Work Ethic | 12.6 | 0.611 | Boosts drive, increases fatigue |

The pool skews productive over fun â€” Work Ethic is the strongest stat (12.6), Party Stamina the weakest (8.4). This tilts the starting experience toward higher drive but weaker fun output.

### Primitive Results (Tick 1)

| Primitive | Value | Rating | Key Finding |
|-----------|-------|--------|-------------|
| **Crowding** | 35.3 | Moderate | Bathroom bottleneck (71% cap). Under capacity everywhere â€” manageable |
| **Noise** | 53.7 | High | 10 people in 1 living room. Major PR dampener |
| **Nutrition** | 35.5 | Tight | Supply/demand ratio 0.67. Underwater from day 1 |
| **Fun** | 31.6 | Tight | Supply/demand ratio 0.60. Same problem |
| **Drive** | 32.2 | Tight | Supply/demand ratio 0.61. Same problem |
| **Cleanliness** | 0â†’100 by Day 5 | ðŸ”´ Catastrophic | messIn=12.0 vs cleanOut=3.17. Net +8.83/tick. Runaway |
| **Maintenance** | 0â†’100 by Day 7 | ðŸ”´ Catastrophic | wearIn=10.0 vs repairOut=4.16. Net +5.84/tick. Runaway |
| **Fatigue** | 0 (permanent) | ðŸŸ¡ Inert | Recovery (55.8) exceeds exertion (38.5). No tension |

### Health Metrics (Tick 1)

| Metric | Raw | mRef | Score | Notes |
|--------|-----|------|-------|-------|
| **Living Standards** | 0.512 | 0.700 | 34.8 | Nutrition barely adequate; cleanliness will crater this within days |
| **Productivity** | 0.220 | 0.420 | 21.6 | Low drive AND noise dampener. Below the churn threshold (35) |
| **Partytime** | 0.330 | 0.420 | 38.1 | Low fun but noise gives a small boost. Just above recruit threshold |

**Vibes: 30.3** â€” "Scrappy" tier. Balanced (spread under 0.18), but that's because everything is uniformly poor.

### Day-by-Day Collapse

| Day | Clean | Maint | Fatigue | LS | PR | PT | Vibes |
|-----|-------|-------|---------|-----|-----|-----|-------|
| 1 | 4 | 3 | 0 | 33.7 | 21.6 | 38.1 | 30.3 |
| 2 | 31 | 20 | 0 | 26.0 | 21.6 | 38.1 | 27.8 |
| 3 | 57 | 38 | 0 | 17.4 | 21.6 | 38.1 | 24.3 |
| 4 | 84 | 56 | 0 | 7.8 | 21.6 | 38.1 | 18.6 |
| **5** | **100** | 73 | 0 | **0.0** | 21.6 | 38.1 | **0.0** |
| 7 | 100 | 100 | 0 | 0.0 | 21.6 | 38.1 | 0.0 |

By Day 5, the commune hits Vibes 0 ("Shambles") regardless of anything the player does. There are no affordable tools to prevent this.

### Economy (Week 1)

| Item | Amount |
|------|--------|
| Income (10 Ã— Â£100) | +Â£1,000 |
| Ground rent | âˆ’Â£1,000 |
| Utilities | âˆ’Â£200 |
| Budgets | Â£0 |
| **Net** | **âˆ’Â£200** |

The player can't afford any budget spending without going further into debt. At 75% bedroom capacity (12 residents), income would be Â£1,200 â€” exactly break-even before budgets.

### Churn (End of Week 1)

```
churnRate = 0.20 + (100 Ã— 0.0003) + (35 âˆ’ 21.6) Ã— 0.01 = 0.369
Residents leaving: floor(10 Ã— 0.369) = 3
Recruitment slots: 1
Net population: 10 âˆ’ 3 + 1 = 8
```

Three residents leave out of ten. Low Productivity (+13.4% churn penalty) is the main driver. The player gets 1 invite slot, producing a net loss of 2 residents per week.

---

## 3. Diagnosis: What's Wrong and Why

The prototype has three critical problems and two secondary ones. The structural changes address the architectural causes; the numerical tuning pass (Section 5) addresses the parameter values.

### ðŸ”´ Accumulators are wildly unbalanced

| Accumulator | Inflow | Outflow | Ratio | Behaviour |
|-------------|--------|---------|-------|-----------|
| Cleanliness | 12.0 | 3.17 | **3.79:1** | Hits 100 by Day 5 |
| Maintenance | 10.0 | 4.16 | **2.40:1** | Hits 100 by Day 7 |
| Fatigue | 38.5 | 55.8 | **0.69:1** | Permanently zero |

The design intent (from design notes) is that accumulators should "drift negative at baseline â€” visible pressure within a weekly cycle that motivates the player to act." A 3.79:1 inflow ratio isn't "visible pressure within a weekly cycle" â€” it's a catastrophe that completes before the player's first weekly planning phase. The target is roughly 1.2:1 to 1.4:1 â€” debt builds noticeably across a week, but the player has time to see the trend and choose to address it.

Fatigue has the opposite problem. With recovery massively outpacing exertion, fatigue is permanently zero and the intended work/party tension doesn't exist. Both PR and PT always get a fatigue dampener of 1.0, removing an entire dimension of strategic trade-off.

**What the structural changes fix**: Budgets now boost outflow (stacking with other multipliers) instead of subtracting from stock. Asymmetric recovery adds "memory" to accumulator debt. Dynamic fatigue dampening creates the work/party tension even at moderate fatigue levels. **What still needs numerical tuning**: The inflow/outflow base rates need rebalancing to produce the target 1.2:1 to 1.4:1 ratios (see Section 5).

### ðŸ”´ Coverage primitives are all supply-starved

| Primitive | Output rate | Consumption rate | Ratio (with tier 1.15 + skill) |
|-----------|-------------|-----------------|-------------------------------|
| Nutrition | 5 | 9 | 0.674 |
| Fun | 6 | 12 | 0.601 |
| Drive | 4 | 8 | 0.606 |

All three sit at 0.60â€“0.67 supply/demand ratio, mapping to scores of 31â€“36 ("Tight"). The design target is 35â€“45 at baseline â€” still "Tight" but with "Adequate" (50) reachable through a small budget investment or good resident stats. The current ratios are too far below 1.0 for moderate investment to close the gap.

**What needs numerical tuning**: Output rates or consumption rates need adjusting to produce base ratios of ~0.85â€“0.95 with tier 1 bonus.

### ðŸ”´ Economy doesn't allow budget investment

Income (Â£1,000) minus fixed costs (Â£1,200) = âˆ’Â£200/week. The player can't afford any budget spending. Since budgets are the primary early-game learning tool â€” the way the player discovers cause and effect â€” a starting state where budgets are unaffordable means the tutorial-by-stealth can't function.

**What needs numerical tuning**: Either a starting treasury (Â£500â€“Â£1,000), reduced base costs (groundRent from Â£1,000 to ~Â£800), or more starting residents. The target is break-even at starting config with ~Â£100â€“200/week headroom for small budget experiments.

### ðŸŸ¡ Accumulator budgets don't work (structural)

This is the architectural problem behind the accumulator crisis. Even if the player had money, the prototype's stock-subtraction budget structure produces 0.048/tick of debt reduction against 4.42/tick of net inflow â€” 1% effective. Spending Â£100 on cleaning achieves nothing measurable.

**Fixed by structural changes**: The outflow-boost structure (Change 2) makes a Â£100 budget produce a 1.5Ã— multiplier on cleaning output. This is meaningful, scales with other multipliers, and teaches the player how budgets work.

### ðŸŸ¡ Living Standards has no outcome lever (structural)

LS feeds into Vibes (a display metric) but has no mechanical effect on churn, recruitment, or economy. A player who discovers this can rationally ignore LS entirely. The `rentCurve: 0.7` config parameter exists but is never wired into the churn formula â€” this appears to be an unimplemented feature.

**Fixed by structural changes**: Change 6 wires LS into rent tolerance, completing the three-pillar outcome loop. Each metric now has a distinct consequence the player can reason about.

---

## 4. The Death Spiral (Prototype, No Intervention)

| Week | Residents | Income | Costs | Treasury | Churn | Net Pop |
|------|-----------|--------|-------|----------|-------|---------|
| 1 | 10 | Â£1,000 | Â£1,200 | âˆ’Â£200 | 3 leave, 1 join | 8 |
| 2 | 8 | Â£800 | Â£1,200 | âˆ’Â£600 | 2â€“3 leave, 1 join | 6 |
| 3 | 6 | Â£600 | Â£1,200 | âˆ’Â£1,200 | 1â€“2 leave, 1 join | 5 |
| 4 | 5 | Â£500 | Â£1,200 | âˆ’Â£1,900 | 1 leave, 1 join | 5 |

Meanwhile cleanliness hits 100 within 2 days, which craters Living Standards to zero, which (once LS â†’ rent tolerance is wired) would amplify rent churn further. By Week 3, the player is losing money, losing residents, and all three health metrics are declining. The player has no affordable counter-moves.

This death spiral is the prototype's starting experience. The rebuild aims to replace it with what the design principles describe: "perilous but survivable" â€” visible pressure that motivates action, with affordable tools to respond.

---

## 5. Rebuild Tuning Recommendations

These are best-guess starting parameters. They assume all six structural changes are in place. The numbers are directionally correct but will need play-testing. Grouped by priority.

### Priority 1 â€” Accumulator Base Rates

The target: unbudgeted inflow:outflow ratio of roughly 1.2:1 to 1.4:1. Debt builds visibly across a week but doesn't collapse before the player can respond. With a moderate budget (~Â£75â€“100), the player should be able to slow or halt the drift. Stacking budget + good residents + tech should reverse it.

| Accumulator | Current inflow | â†’ Target | Current outflow | â†’ Target | Resulting ratio |
|-------------|---------------|----------|-----------------|----------|----------------|
| **Cleanliness** | messPerRes: 1.2 (total: 12.0) | **messPerRes: 0.4** (total: 4.0) | cleanBase: 3 (total: 3.17) | **cleanBase: 3** (total: 3.17) | ~1.26:1 |
| **Maintenance** | wearPerRes: 1.0 (total: 10.0) | **wearPerRes: 0.5** (total: 5.0) | repairBase: 3 (total: 4.16) | **repairBase: 3** (total: 4.16) | ~1.20:1 |
| **Fatigue** | exertBase: 3 (total: 38.5) | **exertBase: 5** (total: 55.5) | recoverBase: 5 (total: 55.8) | **recoverBase: 4.5** (total: 50.2) | ~1.11:1 |

**Commentary on fatigue**: The target ratio is deliberately tighter than cleanliness/maintenance (1.11:1 vs 1.2â€“1.26:1). Fatigue is the strategic primitive â€” it creates the work/party tension via dynamic dampening. It should build slowly, creating a background pressure that the player notices over 2â€“3 weeks rather than 1 week. The dynamic dampening system (Change 3) means even moderate fatigue creates meaningful trade-offs between PR and PT, so the value doesn't need to be high to matter.

**Commentary on the interaction with budgets**: With `budgetEfficiency = 0.005`, a Â£100 wellness budget gives a 1.5Ã— recovery multiplier. At the target fatigue numbers: unbudgeted net flow is +5.3/tick (slowly building). With Â£100 budget, recovery becomes 75.3, making net flow âˆ’19.8/tick Ã— 0.65 (recovery damping) = âˆ’12.9/tick (recovering, but slowly). This feels right â€” the budget clearly helps, but recovery takes time due to the asymmetric damping.

**For cleanliness with budget**: Unbudgeted net flow is +0.83/tick (slowly building). With Â£75 cleaning budget, outflow becomes 3.17 Ã— 1.375 = 4.36, net flow becomes âˆ’0.36/tick Ã— 0.65 = âˆ’0.23/tick. Drift halted and slowly reversing. This is the "moderate budget slows or halts the drift" target from the design principles.

### Priority 2 â€” Coverage Base Ratios

The target: supply/demand ratio of ~0.85â€“0.95 at 10 residents with tier 1 bonus, producing coverage scores of 43â€“49 ("Tight" approaching "Adequate"). Reaching "Adequate" (50) should require either a small budget investment or favourable resident stats â€” creating a meaningful early decision.

| Primitive | Current output | â†’ Target | Current consumption | Resulting ratio | Score |
|-----------|---------------|----------|---------------------|----------------|-------|
| **Nutrition** | outputRate: 5 | **outputRate: 7** | consumptionRate: 9 | 0.89 | ~47 |
| **Fun** | outputRate: 6 | **outputRate: 9** | consumptionRate: 12 | 0.86 | ~45 |
| **Drive** | outputRate: 4 | **outputRate: 6** | slackRate: 8 | 0.86 | ~45 |

The alternative approach â€” reducing consumption rates instead â€” produces the same ratios and is equivalent. The choice is cosmetic.

**Commentary**: Fun and Drive score slightly lower than Nutrition. This is deliberate â€” Nutrition feeds Living Standards (the foundation pillar), while Fun and Drive feed into the two pillars that compete with each other. Giving the foundation a slight edge means the player's first "Adequate" achievement is likely to be in nutrition, which feels right for the early learning curve. ("We fixed the food" is more intuitive than "we fixed the vibes.")

### Priority 3 â€” Economy Starting Point

The target: break-even at starting config (10 residents, Â£100 rent), with ~Â£100â€“200/week headroom for small budget experiments. The player should feel the squeeze but have enough room to learn what budgets do.

**Recommended approach**: Reduce `groundRentBase` from Â£1,000 to **Â£800**.

| Item | Current | â†’ Rebuild |
|------|---------|-----------|
| Income (10 Ã— Â£100) | Â£1,000 | Â£1,000 |
| Ground rent | Â£1,000 | **Â£800** |
| Utilities | Â£200 | Â£200 |
| **Net (before budgets)** | **âˆ’Â£200** | **Â£0** |

This gives the player exactly break-even â€” not comfortable, but not bleeding. They can afford a Â£75â€“100 budget in one category if they accept a small weekly loss, or they can prioritise growing to 12 residents first (which gives Â£200/week surplus for budget experiments).

An alternative: keep ground rent at Â£1,000 but give a starting treasury of Â£500â€“Â£1,000. This preserves the "losing money from day 1" pressure but gives a runway for early experimentation. The design principles favour "tight but not hopeless" â€” either approach works, but the reduced ground rent is simpler and doesn't introduce a one-time cushion that disappears.

**Consideration**: With the LS â†’ rent tolerance mechanic now active, the economy interacts more richly with gameplay. A player who invests in LS (cleaning budget, nutrition) earns the ability to raise rent further without spiking churn. This creates a positive feedback loop: invest in quality â†’ tolerate higher rent â†’ more income â†’ invest in more quality. The starting economy needs to be tight enough that this loop feels earned, not automatic.

### Priority 4 â€” Overcrowding Onset

`penaltyOnset = 0.75` as specified in Structural Change 5. No further tuning needed â€” the K=2 and P=2 values produce the right curve shape.

Worth noting: with 10 residents and 12 bathroom capacity, the bathroom ratio is 0.71 (using effective N after sharing tolerance). This sits just below the penalty onset, meaning the starting state has zero overcrowding penalty but the player is very close to the threshold. Adding even 2â€“3 residents without building a bathroom will start to feel it. This is the "graduated pressure" the design calls for.

### Priority 5 â€” Recovery Damping

`recoveryDamping = 0.65` as specified in Structural Change 1. This means debt recovers at 65% of the speed it accumulates.

**Why 0.65**: High enough that recovery is clearly happening (the player sees progress when they invest), low enough that a week of neglect takes noticeably more than a week to undo. At 0.65, two weeks of accumulation at +1/tick takes roughly three weeks of equivalent recovery effort to reverse. This teaches the "prevention over cure" lesson without making recovery feel futile.

### Priority 6 â€” Evaluate Sigmoid After Testing

Once the above changes are in place and producing healthier primitive values, the sigmoid layer needs checking. Two things to watch for:

**LS sensitivity matters more now.** With LS wired to rent tolerance, the sigmoid's effect on LS scores directly affects the economy. If the sigmoid compresses LS into a narrow band (say 30â€“50), the rent tolerance effect becomes muted and the LS â†’ revenue loop won't feel meaningful. The current ref0=0.5 may be too aggressive for the early game â€” consider reducing to 0.4 if LS scores cluster too tightly.

**Score clustering in the 40â€“60 range.** If all three health metrics sit in the same narrow band after rebalancing, the player loses the ability to distinguish "doing well" from "doing poorly." Consider reducing `p` from 2 to 1.5 (gentler S-curve, more sensitivity to changes in the mid-range) if this happens.

---

## 6. Target Starting Experience

After all structural changes and numerical tuning, the ideal week-by-week experience:

**Week 1**: Vibes at "Iffy" to "Scrappy" (25â€“40). Coverage primitives are "Tight" (43â€“47) â€” not great, but not alarm bells. Cleanliness and maintenance are visibly building but manageable. Economy is roughly break-even. The player can afford Â£75â€“100 in one budget category â€” their first real choice. Churn is 1â€“2 residents (not 3), and they get 1 invite slot. Net population is stable or slightly declining.

**Weeks 2â€“4**: The player makes choices â€” invest in cleaning budget vs ingredients vs building a bathroom vs saving for research. If they do nothing, cleanliness and maintenance drift upward, pulling down LS, which makes rent hit harder (via the new rent tolerance mechanic). If they invest wisely, metrics improve noticeably. Fatigue is starting to build â€” not critical, but the player notices it. The work/party tension begins to matter. First research completes by week 3â€“4.

**Week 5+**: First tech unlocks (Chores Rota, etc.) give a meaningful boost. The player starts to feel progression â€” multipliers stacking. Churn rate drops as PR climbs above 35. Growth begins. The early crisis is over; the mid-game strategic layer opens up.

**Weeks 8â€“12**: Second tier of tech. New buildings open new strategies. Player approaches 75% bedroom capacity and starts generating real surplus. The three-pillar balance becomes the central strategic puzzle. Which tech tree? How to balance PR vs PT with fatigue as the constraint? How high can rent go before LS can't support it?

---

## Appendix A: Key Formula Reference

| Formula | Expression |
|---------|-----------|
| Stat â†’ 0-1 | `(stat âˆ’ 1) / 19` |
| Overcrowding | `1 + K Ã— max(0, ratio âˆ’ penaltyOnset)^P` |
| Coverage score | `25 Ã— (logâ‚‚(supply/demand) + 2)`, clamped 0â€“100 |
| Dampener | `(1 âˆ’ value/100)^weight` |
| Baseline | `(value/100)^weight` |
| Sigmoid | `100 Ã— x^p / (1 + x^p)` where `x = raw / mRef` |
| Budget boost (accum.) | `1 + budget Ã— budgetEfficiency` |
| Recovery damping | `netFlow Ã— recoveryDamping` (when netFlow < 0) |
| Rent tolerance | `1 + rentCurve Ã— (50 âˆ’ LS) / 50` |
| Vibes | `(LS Ã— PR Ã— PT)^(1/3)` |
| Churn | `baseChurn + (rent Ã— rentMult Ã— rentToleranceMult) + (35 âˆ’ PR) Ã— churnScale` |
| Recruit | `1 + floor((PT âˆ’ 35) / 15)` |

## Appendix B: Config Locations

All tunable values in `server/index.js`:

| Config object | What it controls |
|---------------|-----------------|
| `DEFAULT_PRIMITIVE_CONFIG` | All 8 primitive formulas â€” rates, multipliers, penalty curves, `recoveryDamping`, `penaltyOnset` |
| `DEFAULT_HEALTH_CONFIG` | Health metric weights, sigmoid parameters, churn/recruit thresholds, `baseFatigueWeight`, `fatigueWeightSwing`, `rentCurve` |
| `DEFAULT_VIBES_CONFIG` | Tier labels, balance thresholds, branch labels |
| `DEFAULT_BUDGET_CONFIG` | Budget efficiency rates, `budgetEfficiency` (per accumulator) |
| `DEFAULT_TIER_CONFIG` | Population brackets, output/health multipliers, quality caps |
| `DEFAULT_TECH_CONFIG` | Tech costs, weekly costs, effect percentages |
| `INITIAL_DEFAULTS` | Economy: treasury, rent, ground rent, utilities, churn rates |
| `DEFAULT_BUILDINGS` | Building capacities, costs, multipliers |

## Appendix C: Structural Changes Summary

Six structural changes are specified for the rebuild, addressing architectural issues rather than numerical tuning. Full implementation details are in `Fort_Llama_Structural_Changes.md`.

| # | Change | What it fixes |
|---|--------|---------------|
| 1 | Asymmetric accumulator recovery | Debt recovers slower than it builds â€” creates "memory," rewards prevention over cure |
| 2 | Budgets boost outflow (not subtract from stock) | Budgets become meaningful, stack with other multipliers, create diminishing returns |
| 3 | Dynamic fatigue dampening | Fatigue punishes the higher pillar more â€” creates work/party tension |
| 4 | Remove noise boost from Partytime | Noise is purely negative (dampens PR). Cleaner mental model |
| 5 | Overcrowding penalty starts below full capacity | Graduated pressure replaces cliff edge at 100% capacity |
| 6 | Wire LS to rent tolerance | Completes three-pillar outcome loop. Each metric has a distinct consequence |

Implementation order: 6 â†’ 4 â†’ 5 â†’ 2 â†’ 1 â†’ 3 (least to most complex, respecting dependencies).
