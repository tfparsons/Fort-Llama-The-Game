# Fort Llama: Structural Formula Changes

> **Purpose**: Instructions for implementing structural changes to game formulas in `server/index.js`
> **Context**: These changes address architectural issues in how systems connect, not numerical tuning. They should be implemented before any number-balancing pass.
> **Reference docs**: Fort_Llama_Causal_Chain_Analysis.md, Fort_Llama_Design_Principles.md

---

## Change 1: Asymmetric Accumulator Recovery

### What exists now

Accumulators (cleanliness, maintenance, fatigue) accumulate and recover at the same rate. If mess builds at +5/tick, reversing the balance clears it at -5/tick. There's no penalty for letting things get bad â€” a week of neglect followed by a week of investment leaves you exactly where you started.

### Why it needs to change

The design principles state that accumulators should "create memory: neglect has lasting consequences that can't be instantly fixed." The current symmetric rates don't deliver this. Accumulators should feel like debt â€” easy to accumulate, harder to pay down. This makes prevention more valuable than cure, which teaches the player to invest early rather than react late.

### What to change

When the net flow for an accumulator is negative (i.e. outflow exceeds inflow, so debt is being *reduced*), apply a recovery multiplier that slows the rate of improvement. Debt still goes down, just more slowly than it went up.

**Implementation**: In the per-tick accumulator update, when `(inflow - outflow)` is negative (recovery), multiply the negative value by a `recoveryDamping` factor (0.6â€“0.7). When positive (accumulating), apply at full rate.

```
// Pseudocode for the per-tick accumulator update
netFlow = inflow - outflow
if (netFlow < 0) {
    netFlow = netFlow * recoveryDamping  // e.g. 0.65 = recovery at 65% speed
}
debt = clamp(debt + netFlow * scale - budgetReduction, 0, 100)
```

**New config value needed**: `recoveryDamping` (float, 0â€“1). Suggest adding to `DEFAULT_PRIMITIVE_CONFIG` as a shared value for all three accumulators. A value of 0.65 means debt recovers at 65% of the speed it accumulates.

**Applies to**: Cleanliness, Maintenance, Fatigue â€” all three accumulators.

---

## Change 2: Accumulator Budgets Boost Outflow (Not Subtract from Stock)

### What exists now

Budget spending on accumulators (cleaning, handiman, wellness) subtracts a tiny amount directly from the accumulated debt stock each tick:

```
debt = oldDebt + netMess * scale - (budget * reductionRate / ticksPerWeek)
```

With `reductionRate = 0.02` and `ticksPerWeek = 42`, a Â£100 cleaning budget reduces debt by 0.048 per tick â€” roughly 1% of the net inflow. Budgets for accumulators are functionally useless.

### Why it needs to change

Beyond the numbers being wrong, the *structure* is wrong. Subtracting from the stock means the budget fights accumulated results rather than improving the underlying process. It's bailing water instead of patching the hull. It also means budget effectiveness is independent of other multipliers â€” a cleaning budget does the same thing whether your residents are tidy or messy, which breaks the intended stacking design.

The fix isn't to increase the subtraction rate. It's to change *what the budget does*: it should boost the outflow rate (cleaning speed, repair speed, recovery speed), not subtract from the debt.

### What to change

Remove the stock subtraction. Instead, incorporate the budget as a multiplier on the outflow calculation for each accumulator.

**For cleanliness**:
```
// CURRENT (remove this):
// debt -= budget * reductionRate / ticksPerWeek

// NEW: budget boosts cleaning output
budgetBoost = 1 + (budget * budgetEfficiency)
cleanOut = cleanBase * bathQ * cleanMult * (1 + skillMult * tidiness01) * cleanerMult * budgetBoost
```

**For maintenance**:
```
budgetBoost = 1 + (budget * budgetEfficiency)
repairOut = repairBase * utilQ * repairMult * (1 + 0.5 * handiness01 + 0.2 * tidiness01) * budgetBoost
```

**For fatigue**:
```
budgetBoost = 1 + (budget * budgetEfficiency)
recovery = N * recoverBase * bedroomQ * recoveryMult * (1 + 0.3 * partyStamina01) * budgetBoost
```

**New config value needed**: `budgetEfficiency` (float) in `DEFAULT_BUDGET_CONFIG` for each accumulator category. This controls how much each Â£1 of budget boosts the outflow multiplier. Suggested starting value: `0.005` per Â£1, meaning a Â£100 budget gives a 1.5Ã— outflow multiplier (50% boost). This should be tuned during the numerical balancing pass.

**Config values to remove**: The existing `reductionRate` parameter for accumulator budgets, and any per-tick stock subtraction logic for these three primitives.

**Why this is better**: The budget now stacks multiplicatively with resident stats, tech multipliers, and building quality â€” just like the design principles intend. A cleaning budget is more effective when paired with tidy residents and a cleaner tech upgrade, because they all amplify the same outflow. It also naturally means budgets are better at preventing debt than curing it (since outflow can't reduce debt below zero).

---

## Change 3: Fatigue Dampens the Higher Pillar More Heavily

### What exists now

Fatigue dampens Productivity and Partytime at nearly equal weights:
- PR: `(1 - fatigue/100)^0.55`
- PT: `(1 - fatigue/100)^0.45`

This means fatigue acts as a universal drag on *both* metrics. It doesn't create the intended tension between work and play â€” it just makes both worse equally.

### Why it needs to change

The design principles say fatigue should create the "work hard OR party hard, but not both" tension. The current equal-weight dampening doesn't achieve this. What's needed is for fatigue to punish whichever pillar the player is pushing hardest, creating a natural balancing pressure.

### What to change

Instead of fixed dampening weights, make fatigue's dampening weight on each metric proportional to how high that metric's *raw value* is relative to the other. The pillar the player is pushing harder gets dampened more.

**Implementation**:

```
// Calculate the balance ratio between PR_raw and PT_raw
// (before fatigue dampening is applied)
prShare = PR_raw_prefatigue / (PR_raw_prefatigue + PT_raw_prefatigue)
ptShare = 1 - prShare

// Scale the dampening weights based on which pillar is higher
// Base weights: 0.5 each. Range: 0.3 to 0.7
fatigueWeightPR = baseFatigueWeight + (prShare - 0.5) * weightSwing
fatigueWeightPT = baseFatigueWeight + (ptShare - 0.5) * weightSwing

// Apply dampening with the dynamic weights
PR_raw = PR_raw_prefatigue * (1 - fatigue/100)^fatigueWeightPR
PT_raw = PT_raw_prefatigue * (1 - fatigue/100)^fatigueWeightPT
```

**Worked example**: If the player is pushing Productivity hard (PR_raw_prefatigue = 0.6, PT_raw_prefatigue = 0.3):
- prShare = 0.67, ptShare = 0.33
- fatigueWeightPR = 0.5 + (0.67 - 0.5) Ã— 0.5 = 0.585
- fatigueWeightPT = 0.5 + (0.33 - 0.5) Ã— 0.5 = 0.415
- PR gets dampened more heavily than PT

If perfectly balanced (both at 0.4): both weights stay at 0.5. No asymmetry.

**New config values needed** (in `DEFAULT_HEALTH_CONFIG`):
- `baseFatigueWeight`: 0.5 (the weight when PR and PT are equal)
- `fatigueWeightSwing`: 0.5 (how much the weight can shift â€” with 0.5, the range is 0.3 to 0.7)

**Config values to update**: Remove the fixed `fatigueWeight` from both `productivity` and `partytime` config objects, replacing with the shared dynamic system.

**Important note on calculation order**: The PR and PT raw values used to calculate `prShare` and `ptShare` must be computed *before* applying fatigue dampening. The fatigue dampening is then applied as the final step in each health metric's raw calculation.

---

## Change 4: Remove Noise Boost from Partytime

### What exists now

Partytime gets a small positive boost from noise:
```
noiseBonus = 0.08 * noise/100
PT_raw = fun^1.0 * (1 - fatigue/100)^0.45 * (1 + noiseBonus)
```

At starting noise of 53.7, this adds +4.3% to PT. The intent was that a noisy house has better atmosphere for partying.

### Why it needs to change

This creates a confused identity for noise. Every action that reduces noise (building living rooms, recruiting considerate residents) improves Productivity but hurts Partytime. The player can't independently manage the trade-off. The effect is also tiny (+4%) â€” too small to be a real strategic factor but large enough to confuse the mental model.

Fun already has its own supply/demand mechanic that handles social atmosphere. Sociability contributes to fun output directly. The noise boost is redundant and the confusion isn't worth the marginal flavour.

### What to change

Remove the `noiseBoostScale` term from the Partytime formula entirely.

**New formula**:
```
PT_raw = fun^1.0 * (1 - fatigue/100)^fatigueWeightPT
```

(Note: the fatigue weight here will now be the dynamic weight from Change 3.)

**Config value to remove**: `noiseBoostScale` from `DEFAULT_HEALTH_CONFIG.partytime`.

**Result**: Noise is purely negative â€” it dampens Productivity. Simple, legible, intuitive.

---

## Change 5: Overcrowding Penalty Starts Below Full Capacity

### What exists now

The overcrowding penalty uses:
```
overcrowdPenalty(ratio) = 1 + K * max(0, ratio - 1)^P
```

This is exactly 1.0 (zero effect) until a room exceeds 100% capacity, then ramps up quadratically. A player at 95% capacity sees no penalty; at 105% they see a significant one. It's a cliff edge.

### Why it needs to change

The design principles say "feedback loops, not brick walls." The current structure gives zero signal as rooms fill up, then a sudden penalty when they overflow. Players should feel rooms getting tighter *before* they hit the wall, which both creates graduated pressure and makes building decisions more interesting (you build because things are getting tight, not because you slammed into a limit).

### What to change

Shift the penalty curve to start engaging below full capacity, using a `penaltyOnset` threshold.

**New formula**:
```
overcrowdPenalty(ratio) = 1 + K * max(0, ratio - penaltyOnset)^P
```

**New config value needed**: `penaltyOnset` (float) in `DEFAULT_PRIMITIVE_CONFIG`. Suggested value: **0.75**. This means the penalty starts applying gently at 75% capacity and ramps up through 100% and beyond.

**Config values unchanged**: `penaltyK` (2) and `penaltyP` (2) stay the same. The shape of the curve is fine â€” it's just the starting point that needs to shift.

**Impact**: At 75% capacity (ratio = 0.75), penalty = 1 + 2 Ã— (0)Â² = 1.0 (just starting). At 90% capacity (ratio = 0.9), penalty = 1 + 2 Ã— (0.15)Â² = 1.045 (gentle pressure). At 100%, penalty = 1 + 2 Ã— (0.25)Â² = 1.125 (noticeable). At 120%, penalty = 1 + 2 Ã— (0.45)Â² = 1.405 (significant). The curve is gentler at the bottom and steeper at the top â€” exactly the graduated pressure the design calls for.

---

## Change 6: Wire Living Standards to Rent Tolerance (Bug Fix)

### What exists now

The churn formula is:
```
churnRate = baseChurn(0.20) + rent * 0.0003 + (35 - PR*100) * 0.01
```

Only Productivity affects churn. Living Standards has no direct outcome lever â€” it feeds into Vibes (a display metric) but doesn't mechanically affect churn, recruitment, or the economy.

There IS a `rentCurve: 0.7` parameter in the Living Standards health config (`DEFAULT_HEALTH_CONFIG.livingStandards`), which strongly suggests the *intent* was for LS to modulate rent sensitivity. But this parameter is not referenced in the churn formula. It appears to be unimplemented.

### Why it needs to change

The design principles state "no single metric should be ignorable." Without a direct outcome lever, a player who discovers that LS only affects Vibes can rationally deprioritise it. The causal chain diagram explicitly shows `Living Standards â†’ Rent tolerance`, confirming this was always the intended design.

The intended behaviour: higher Living Standards means residents tolerate higher rent before leaving. Low LS means even moderate rent drives churn. This closes the loop and gives LS a concrete, player-facing consequence.

### What to change

Modify the churn formula so that LS modulates the rent sensitivity term. Higher LS reduces rent's contribution to churn; lower LS amplifies it.

**New formula**:
```
// LS modulates how sensitive residents are to rent
// At LS=50 (adequate), rent sensitivity is at baseline
// At LS=100, rent sensitivity is reduced
// At LS=0, rent sensitivity is amplified
rentToleranceMult = 1 + rentCurve * (50 - LS) / 50

// Full churn formula
churnRate = baseChurn + (rent * rentMult * rentToleranceMult) + (churnBaselinePR - PR) * churnScalePerPoint
```

**Worked examples**:
- LS = 50 (adequate): `rentToleranceMult = 1 + 0.7 Ã— 0/50 = 1.0` â€” baseline rent sensitivity
- LS = 75 (good): `rentToleranceMult = 1 + 0.7 Ã— (-25)/50 = 0.65` â€” rent hits 35% less hard
- LS = 25 (poor): `rentToleranceMult = 1 + 0.7 Ã— 25/50 = 1.35` â€” rent hits 35% harder
- LS = 0 (collapsed): `rentToleranceMult = 1 + 0.7 Ã— 50/50 = 1.7` â€” rent hits 70% harder

**Config value already exists**: `rentCurve: 0.7` in `DEFAULT_HEALTH_CONFIG.livingStandards`. This should now be used as described above. No new config needed â€” just wire the existing parameter into the churn calculation.

**Result**: Each health metric now has a distinct outcome lever:
- **Productivity â†’ Churn rate** (existing): low PR makes residents leave
- **Partytime â†’ Recruitment slots** (existing): high PT attracts more candidates
- **Living Standards â†’ Rent tolerance** (this fix): high LS lets you charge more rent without driving churn

This completes the three-pillar outcome loop that the design always intended.

---

## Implementation Order

These changes have some interdependencies. Recommended order:

1. **Change 6** (LS â†’ rent tolerance) â€” bug fix, no formula restructuring, immediate design benefit
2. **Change 4** (remove noise boost from PT) â€” simple removal, cleans up PT formula before Change 3 modifies it
3. **Change 5** (overcrowding onset) â€” single parameter addition, standalone
4. **Change 2** (budget â†’ outflow boost) â€” restructures accumulator tick logic, should be done before Change 1
5. **Change 1** (asymmetric recovery) â€” modifies accumulator tick logic, builds on Change 2's restructured flow
6. **Change 3** (dynamic fatigue dampening) â€” modifies health metric calculation, most complex change

After all structural changes are in place, a numerical tuning pass should follow to set appropriate values for the new parameters and rebalance the existing ones (accumulator inflow/outflow rates, coverage output/consumption rates, economy starting values). That tuning work is documented separately in the existing causal chain analysis.

---

## Config Summary

### New config values to add

| Parameter | Location | Suggested value | Purpose |
|-----------|----------|----------------|---------|
| `recoveryDamping` | `DEFAULT_PRIMITIVE_CONFIG` | 0.65 | Accumulators recover at 65% of accumulation speed |
| `budgetEfficiency` | `DEFAULT_BUDGET_CONFIG` (per accumulator) | 0.005 | Â£1 budget = 0.005 boost to outflow multiplier |
| `baseFatigueWeight` | `DEFAULT_HEALTH_CONFIG` | 0.5 | Base fatigue dampening weight (equal PR/PT) |
| `fatigueWeightSwing` | `DEFAULT_HEALTH_CONFIG` | 0.5 | How much fatigue weight shifts toward higher pillar |
| `penaltyOnset` | `DEFAULT_PRIMITIVE_CONFIG` | 0.75 | Capacity ratio where overcrowding penalty begins |

### Config values to remove

| Parameter | Location | Reason |
|-----------|----------|--------|
| `noiseBoostScale` | `DEFAULT_HEALTH_CONFIG.partytime` | Noise boost removed from PT |
| `reductionRate` | `DEFAULT_BUDGET_CONFIG` (accumulators) | Replaced by outflow boost structure |
| `fatigueWeight` | `DEFAULT_HEALTH_CONFIG.productivity` | Replaced by dynamic fatigue system |
| `fatigueWeight` | `DEFAULT_HEALTH_CONFIG.partytime` | Replaced by dynamic fatigue system |

### Config values now actively used (previously dormant)

| Parameter | Location | Now used in |
|-----------|----------|-------------|
| `rentCurve` | `DEFAULT_HEALTH_CONFIG.livingStandards` | Churn formula rent tolerance |
