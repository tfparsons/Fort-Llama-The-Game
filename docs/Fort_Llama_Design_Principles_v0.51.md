# FORT LLAMA — Game Design Principles v0.5

*A strategic anchor document for the project*
*February 2026 · v0.5*
*Synthesised from design notes, planning spreadsheets, and mechanical analysis*

> **Version note (v0.5)**: Updated to reflect the implemented structural changes and three new mechanics (policy fun penalty, tidiness on maintenance, consideration penalty on fun). Budget effectiveness section updated to describe the outflow-boost structure. Principle 5 (Residents) updated for consideration's dual role. Principle 6 (Levers) updated for the policy fun penalty trade-off. No core design principles have changed — the strategic intent is the same, the language now matches the running code.

---

## What This Document Is

This document captures the core design principles of Fort Llama, extracted from the accumulated design notes, planning spreadsheets, and mechanical analysis work done to date. It is intended to serve as a strategic anchor: a reference point for every future decision about balance, features, and priorities.

These principles are not implementation details. They describe what the game should feel like and why, so that when specific numbers need tuning or new features need designing, there is a shared understanding of what we are trying to achieve.

*This is a living document. It should be updated as the design evolves, but changes should be deliberate and explicit — if a principle is being revised, that revision should be discussed and documented.*

---

## The Game in One Sentence

> **Found a commune and expand. Recruit members, invest in facilities, find equilibrium — or spiral into acrimony, burnout, and bankruptcy.**

Fort Llama is a management simulation where the player runs a communal living facility for anthropomorphic llamas. The core fantasy is building something that works: a place where people want to live, where the books balance, and where the whole thing doesn't collapse under its own weight. Most games will end in collapse. The ones that don't will feel earned.

---

## Core Design Principles

### 1. The Double Ledger Is the Heartbeat

Everything in the game flows through money. Residents pay rent; rent pays for upkeep, investment, and expansion. The player's core weekly rhythm is a financial one: did I make money this week, or lose it? Can I afford to invest, or am I just surviving?

This economic pressure is the pacing mechanism of the entire game. Early on, the player should feel the squeeze — income barely covers costs, and every budget decision matters. Growth (more residents) increases income but also increases strain. The player is always chasing a moving equilibrium.

**What this means in practice:**

— The starting economy should feel tight but not hopeless. The player should be able to break even with smart early decisions, not require perfect play just to survive.

— Every new mechanic should ultimately connect back to the ledger. If something doesn't affect income or costs (directly or indirectly), question whether it belongs.

— Bankruptcy is the primary fail state. The game-over threshold exists to create stakes, not to punish experimentation.


### 2. Three Pillars, One Tension

The three health metrics — Living Standards, Productivity, and Partytime — are the strategic soul of the game. They represent three distinct dimensions of commune life that the player must keep in balance. Each has a clear identity and failure mode:

| Metric | What It Represents |
|--------|-------------------|
| **Living Standards** | Is this a decent place to live? Nutrition, cleanliness, maintenance, crowding. Failure mode: "We're not students, we have standards." |
| **Productivity** | Can people work and function here? Drive, focus, quiet. Failure mode: "This is fun, but I have a career to think about." |
| **Partytime** | Is this place socially magnetic? Fun, energy, atmosphere. Failure mode: "I'm bored and burnt out living here." |

The central tension is between Productivity and Partytime: pushing one tends to pull the other down. Living Standards acts as the foundation that both depend on — neglect it and both suffer regardless.

Balance is the goal. The Vibes formula (geometric mean of the three metrics) mathematically enforces this: one metric dragging creates a disproportionate penalty. Imbalances produce distinct narrative identities — Party Mansion, Sweat Shop, Shanty Town — that signal the problem to the player.

**The key design commitment:** no single metric should be ignorable, and no single metric should dominate strategy. Investment in any one area should have diminishing returns and increasing side-effects that pull the player back toward balance.


### 3. Feedback Loops, Not Brick Walls

The core mechanics should use graduated pressure, not sudden death. More dramatic mechanics will be added later (disasters — mid/late game mechanic). For the normal state of play, when things go wrong, the player should see it coming and have time to react. When things go right, the improvement should feel tangible and encourage continued investment.

Growth increases income but also strain. Strain increases churn and disaster risk. Stabilisation reduces risk but slows growth. This creates a natural rhythm of expansion and consolidation that the player learns to navigate.

**What this means in practice:**

— Accumulators (cleanliness, maintenance, fatigue) should build at rates that create meaningful pressure. The player needs to notice the trend and choose to address it during their weekly planning.

— Base state conditions should be engineered to mildly frustrate the player. The multiplier mechanics — budgets, policies, tech, and so on — represent the key to shifting the balance in their favour. Until they hit another scaling bottleneck, and need more multipliers, more baseline capacity.

— Success needs to be possible. If a player catches a declining metric and invests in fixing it, improvement should be achievable. The game should feel perilous, but permanent death spirals with no escape are a design failure.


### 4. The Player Learns by Doing, Not by Failing

The early game is a tutorial by stealth. The player starts with a small commune, limited tools, and a manageable set of problems. Each week introduces a new pressure or decision point. The goal is to teach systems gradually, so that by the time the commune grows and complexity increases, the player has already internalised how things work.

This means the starting state must feel perilous, but be survivable. A new player making reasonable (not optimal) choices should be able to keep the commune running through the first few weeks. The challenge should come from optimisation and growth imperatives.

**What this means in practice:**

— The starting pressures should be legible. The player should be able to trace cause and effect without reading documentation: "Cleanliness is dropping, and there's a cleaning budget slider." The path from problem to solution should be discoverable, even if affording the solution requires hard choices.

— Tech trees and policies arriving over time create natural pacing. The player doesn't need to understand everything in Week 1 because many tools aren't available yet. Each unlock should feel like a new answer to a pressure the player has already been feeling.


### 5. Residents Are the Composition Mechanic

Residents are not just population count. Each llama brings a unique stat profile that shapes how the commune operates. Recruitment is a team-composition decision: a house full of sociable party animals will feel and play differently from a house of tidy, hardworking introverts.

Stats should create meaningful trade-offs. High sociability boosts fun but increases noise and fatigue. High work ethic boosts drive but increases fatigue. High consideration reduces noise (helping Productivity) but slightly dampens fun (hurting Partytime). Tidiness boosts both cleanliness and maintenance — a broadly useful stat, but one that doesn't help the PR/PT pillars directly. No single stat is purely good or bad; the value of a stat depends on what the commune currently needs.

**What this means in practice:**

— Resident stats should be noticeable but not dominant. Buildings and investment should remain the primary levers; residents tilt the playing field.

— Recruitment choices should feel meaningful. The three-candidate pick should regularly present a genuine dilemma: "I need a cook, but this person is also messy." The consideration trade-off adds another dimension: "This person would quiet the house down, but they'd also be a bit of a buzzkill."

— The stat pool should be diverse enough that no two playthroughs have exactly the same composition challenge.


### 6. Every Lever Should Feel Like a Choice

The player's weekly toolkit — rent setting, budgets, building, research, policies, recruitment — should present genuine decisions, not obvious optimal plays. Every action should have an opportunity cost or a trade-off.

**What this means in practice:**

— Rent is an income-versus-churn trade-off: higher rent means more money but faster turnover. Living Standards modulates this — a well-run commune tolerates higher rent.

— Budgets compete for limited funds: spending on cleaning means less for ingredients.

— Building adds capacity but increases fixed costs permanently.

— Research costs money now for benefits later, and choosing one tech means not choosing another.

— Policies provide stat bonuses by excluding the weakest performers from averages, but carry a fun penalty at scale. The first three policies are free; the fourth starts to cost. This creates a genuine policy budget — the player must decide which policies matter most rather than toggling everything on. The fun penalty is the cost of bureaucracy: too many rules and the commune stops being spontaneous.

— The player should rarely feel that one lever is the "correct" answer. Different strategies should be viable.


### 7. Scale Is the Ultimate Challenge

The game gets harder as it grows, not just busier. More residents mean more income but also more demand on every system. The population tier system raises expectations: what counts as "adequate" at 10 residents is "tight" at 30.

Late-game complexity should come from managing interdependencies at scale, not from new mechanics that invalidate early learning. A player who understood the basics at 10 residents should find the same principles apply at 50 — they're just harder to maintain.

**What this means in practice:**

— The sigmoid scoring system should ensure that early improvements feel significant and late improvements require real investment. The S-curve flattens at both ends: terrible performance is hard to make worse, and excellent performance is hard to maintain.

— Tier multipliers should rise steeply enough that growth alone doesn't solve problems. The player must invest in quality, not just quantity.

— The eventual win condition (if one exists) should require mastering balance at scale, not just surviving.

---

## System Architecture Principles

These describe how the mechanical systems should work, independent of specific numbers.

### The Four-Layer Pipeline

Every player action flows through four layers before it affects outcomes. This pipeline is the backbone of the simulation and should not be short-circuited.

| Layer | Role |
|-------|------|
| **Player Levers** | The only things the player directly controls: rent, budgets, building, research, policies, recruitment. |
| **Primitives** | The eight underlying condition variables that the simulation updates every tick. Three types: coverage (supply vs demand), accumulators (debt that builds over time), and instantaneous (recalculated fresh). |
| **Health Metrics** | The three pillar scores derived from primitives via multiplicative formulas and sigmoid scaling. These are the player-facing strategic indicators. |
| **Outcomes** | Vibes, churn, recruitment, and economy. These close the loop back to the player's next set of decisions. |

**Why this matters:** the pipeline creates legibility. The player learns that their actions (layer 1) change underlying conditions (layer 2), which shift the big-picture scores (layer 3), which determine how the commune evolves (layer 4). If any layer is bypassed or muddied, the cause-and-effect chain breaks and the player loses the ability to reason about their choices.


### Primitive Types and Their Roles

#### Coverage Primitives: Nutrition, Fun, Drive

These model supply versus demand. Every resident creates demand; buildings, skills, and budgets create supply. The coverage score uses a logarithmic scale that makes the first unit of supply far more valuable than the last — getting from "Shortfall" to "Adequate" is easier than getting from "Good" to "Superb."

**Design intent:** the baseline coverage state should be undersupplied. Budget investment is required to maintain even basic supply — at £0 spend, supply is strangled to 50% of its potential (the `floor` parameter on the budget curve). The default starting budget of £10/category restores roughly old-baseline behaviour, but the player sees it costing money and is incentivised to optimise. Reaching "Adequate" requires meaningful budget investment; reaching "Good" requires stacking multipliers (tier bonuses, skill bonuses, policies, buildings) on top of that spend.

#### Accumulator Primitives: Cleanliness, Maintenance, Fatigue

These model debt that builds when inflow exceeds outflow and recovers when the balance reverses. They create memory: neglect has lasting consequences that can't be instantly fixed. Recovery is deliberately slower than accumulation — a week of neglect takes more than a week to undo.

**Design intent:** accumulators should drift negative at baseline. Without budget investment, outflow (cleaning, repair, recovery) runs at 50% effectiveness — debt builds rapidly, creating visible pressure that motivates the player to act. The budget funds the outflow process: cleaning supplies, maintenance materials, wellness programmes. Buildings and resident stats multiply whatever the budget provides. A moderate budget should slow or halt the drift; stacking multipliers (budget + tech) should reverse it.

**Fatigue and activity**: Fatigue is unique among accumulators — it's driven not just by a fixed base rate but by what the commune is actually doing. Fun and drive supply both feed into fatigue exertion (`funFatigueCoeff × funSupply/N + driveFatigueCoeff × driveSupply/N`), so pushing harder on Partytime or Productivity directly increases fatigue pressure. This creates a natural cost to ambition: a player who invests heavily in fun and drive must also invest in fatigue recovery (wellness tech + fatigue budget) or face accumulating exhaustion. The dynamic dampening system in health metrics then punishes whichever pillar the player is pushing hardest, pulling them back toward balance. Together, activity fatigue and dynamic dampening create the "work hard OR party hard, but not both for free" tension that the three-pillar design requires.

**Tech progression**: Early tech research is the primary tool for stabilising accumulators. Chores Rota (L1, £500) provides a 15% passive boost to both cleanliness and maintenance outflow — cheap and broadly useful. Cleaner (L2, £1000 + £150/wk fixed cost) adds a powerful 40% cleanliness boost. Wellness (L2, £1000) provides 20% fatigue recovery boost, specifically targeting the activity fatigue pressure. The tech tree creates a clear investment arc: stabilise accumulators early, then redirect budget toward coverage and growth.

#### Instantaneous Primitives: Crowding, Noise

These are recalculated every tick from current conditions. They respond immediately to structural changes like building bedrooms or upgrading the living room.

**Design intent:** instant primitives are the game's responsiveness mechanism. When a player builds a bathroom, the crowding improvement should be immediately visible. These primitives should feel like direct consequences of capacity decisions.


### Multiplicative Health Metrics

Health metrics use multiplicative formulas: a baseline raised by a good primitive, dampened by bad ones. This is a deliberate design choice with a specific consequence: one terrible input drags the whole metric down, regardless of how good the other inputs are.

You cannot compensate for terrible cleanliness with great nutrition. You cannot compensate for zero drive with low noise. Each input must be at least passable for the metric to function. This forces the player into balanced investment rather than min-maxing a single variable.

**Design intent:** the multiplicative structure prevents compensation exploits and creates the "weakest link" pressure that makes balance matter. The sigmoid layer then normalises scores to 0–100, scaling expectations with population tier so that "good" means more as the commune grows.


### The Vibes Aggregation

Vibes uses a geometric mean of the three health metrics: (LS × PR × PT)^(1/3). Like the multiplicative health formulas, this punishes imbalance. A commune with LS=80, PR=80, PT=80 will have dramatically higher Vibes than one with LS=95, PR=95, PT=10.

The spread between the highest and lowest metric determines the "branch label" — the narrative identity of the commune. This is a signal for the player, not a mechanical penalty (the penalty is already baked into the geometric mean). Branch labels like "Party Mansion" or "Sweat Shop" tell the player what's unbalanced and what direction they need to correct.

---

## Economy Principles

The economy is the pacing mechanism. Get it wrong and every other system breaks, regardless of how well-designed it is.

### The Starting Economy

> **Target: Start in debt. Recruit to survive. Profitability requires growth to ~75% capacity.**
>
> The player starts with 4 residents, zero treasury, and immediately begins losing money. Fixed costs (ground rent £700 + utilities £250 = £950/week) exceed income (4 × £150 rent = £600). The player must recruit aggressively to close the gap, reaching break-even around N=11 and profitability at N=12 (75% of 16-bed capacity).

**The Difficulty Squeeze:** Recruiting solves the economy but *worsens the accumulators*. More residents mean more mess, more wear, more fatigue — systems that were manageable at N=4 (cleanliness and maintenance stay at zero with a small group) begin accumulating relentlessly at N=8+. Tech progression is the escape valve: chores_rota and cleaner handle the accumulator pressure that growth creates. The player is always choosing between financial survival (recruit now) and operational stability (invest in tech first).

**The debt model:** There is no starting treasury. The player goes into debt from day one, with game-over at -£5,000. At N=4 with frugal budgets, the burn rate is ~£570/week — giving roughly 9 weeks before bankruptcy. A player who recruits steadily (1/week) troughs around -£2,000 at week 5 and begins climbing out. A player who also invests in tech (£500–£1,000 lump sums) may trough at -£3,000 to -£4,000 — sailing close to the -£5,000 cliff but building the operational capacity to sustain a larger commune.

**The key constraint:** vibes must stay high enough to attract recruits. If the player neglects quality of life to save money, vibes drop, recruitment stalls, and the debt spiral becomes inescapable. Budget investment keeps vibes healthy, which enables recruitment, which enables profitability. Cutting budgets to slow the burn actually accelerates failure.

### Growth Economics

More residents means more income (rent) but also more demand on every system. Growth is the only path to solvency — but each new resident adds accumulator pressure that budget alone cannot contain. The player must pair recruitment with tech investment to avoid trading financial collapse for operational collapse.

| Pop | Income @£150 | Neutral budget | Fixed £950 | Net/week |
|-----|-------------|---------------|-----------|---------|
| 4 (start) | £600 | £322 | £950 | **-£672** |
| 8 | £1,200 | £523 | £950 | -£273 |
| 12 (75%) | £1,800 | £694 | £950 | **+£156** |
| 16 (100%) | £2,400 | £849 | £950 | **+£601** |

Building costs are one-time but increase ongoing costs (ground rent and utilities multipliers). Research costs money now for benefits later — and in the debt model, every lump-sum investment pushes the player closer to the -£5,000 cliff. The player is always juggling short-term solvency against long-term capacity.

### Budget Effectiveness

Budgets are the player's primary weekly tactical lever and the first multiplier mechanic they encounter. Unlike the old additive model (where budgets topped up supply), **budget now funds base production**. Buildings provide capacity and processing efficiency; resident stats provide skill multipliers; but without budget, there's nothing to process. The kitchen can't cook without ingredients; bathrooms can't be cleaned without supplies.

All six budget categories share a single **hyperbolic budget curve** with four key properties:

1. **Zero-spend penalty.** At £0, effectiveness drops to `floor` (default 0.5 = 50%). Supply is strangled, outflow halved. The player can't ignore budgets.
2. **Diminishing returns.** The curve is hyperbolic — the first £10 has far more impact than the next £10. Spreading budget across categories always outperforms dumping into one.
3. **Population scaling.** The reference budget (`refBudget`) scales with population: more residents need more total spend. The formula is `refBudget = basePerCapita × N^scaleExp`. Each budget category has its own `basePerCapita` reflecting realistic per-llama weekly costs (e.g. Ingredients £44, Entertainment £26, Cleaning £10).
4. **Economies of scale.** The `scaleExp` parameter (default 0.7) means per-capita cost *falls* as the commune grows. Communal bulk buying and shared infrastructure mean 12 llamas cost less per head than 4.

The curve formula: `budgetMult = floor + (ceiling − floor) × budget / (budget + refBudget)`

| Category | basePerCapita | Neutral @N=4 | Neutral @N=12 | Feel |
|---|---|---|---|---|
| Ingredients | £44 | £116 | £250 | £3/day/llama bulk cooking |
| Cleaning supplies | £10 | £26 | £57 | Communal cleaning products |
| Repairs & tools | £18 | £48 | £102 | Parts, tools, maintenance |
| Wellness | £10 | £26 | £57 | Rest supplies, activities |
| Entertainment | £26 | £69 | £148 | Games, outings, events |
| Internet & workspace | £14 | £37 | £80 | Broadband, equipment |
| **Total** | **£122** | **£322** | **£694** | |

The budget multiplier applies uniformly to both coverage and accumulator primitives. For coverage, it multiplies base supply (so buildings and skills amplify the budget's effect). For accumulators, it multiplies outflow (so tidy residents and building quality make each cleaning £ go further). This creates the intended stacking design: budget is necessary but insufficient alone — the player must also invest in buildings, research, and recruit skilled residents.

---

## Progression and Pacing

### The Core Loop

The game's progression follows a repeating cycle: the baseline state creates pressure → the player finds and deploys multipliers (budgets, policies, tech, buildings) to stabilise → growth introduces new pressures at a higher scale → the cycle repeats. Each iteration should feel like a distinct chapter, with new tools unlocking to meet new challenges. The game is the act of finding and stacking multipliers against an ever-rising baseline of entropy.

### The Early Game (Weeks 1–4)

The player starts with 4 residents, basic buildings, no tech, and mounting debt. The commune itself is manageable — with only 4 llamas, cleanliness and maintenance accumulators stay near zero and the place feels like a "Showhome." But the books don't balance: £600 income vs £950+ costs means ~£570/week burn. The goal of this phase is to recruit urgently while maintaining vibes high enough to attract new residents.

**Target experience:** Vibes at "Scrappy" (25–30) — surprisingly decent for a small group. Coverage primitives are "Tight" but not collapsing. Fatigue is the only accumulator building (~7–9/week). The economy is clearly unsustainable — the player sees debt growing and feels the urgency to recruit. First tech research (chores_rota, £500) completes by week 3–4, preparing for the accumulator pressure that growth will bring.

### The Mid Game (Weeks 5–12)

Tech research begins to unlock. Policies, fixed costs, and new buildings open up new strategic options. The player starts to develop an identity for their commune. Growth targets full bedroom capacity, and each new batch of residents brings both more income and more strain that the previous multipliers can't fully cover.

**Target experience:** Vibes climbing toward "Fine" to "Good" (40–65). Churn rate dropping as Productivity exceeds the baseline threshold. Meaningful choices between competing tech investments. The economy generates enough surplus for one major investment per week, but never enough for everything — the player is always choosing which bottleneck to address next. The policy fun penalty starts to matter once the third or fourth policy is researched — the player must decide whether the stat improvement justifies the fun cost.

### The Late Game (Weeks 12+)

The commune is large and complex. Multiple systems interact in ways that require active management. The population tier system raises expectations. The player must invest in quality (upgrades, policies, high-tier tech) not just quantity — the baseline hostility scales with population, and brute-force solutions stop working.

**Target experience:** Vibes in the "Good" to "Great" range (60–80) for well-managed communes, with "Superb" (80–90) achievable through sustained excellence. The satisfaction of a well-oiled machine, punctuated by difficult trade-off decisions and the occasional crisis.

---

## Balance Principles

These are the specific commitments that should guide every numerical tuning decision.

### Starting State

| Principle | Target |
|-----------|--------|
| **Economy** | In debt from day one. ~£570/week burn at N=4. Break-even at N=11, profitable at N=12 (75% capacity). Game-over at -£5,000 (~9 weeks passive). |
| **Coverage primitives** | Undersupplied at baseline (score ~35–45, "Tight"). Budget investment or good resident stats needed to reach "Adequate." |
| **Accumulator drift** | Negative without investment. Visible pressure within a weekly cycle — enough to motivate action, not enough to collapse before the player can respond. |
| **Fatigue** | Slightly positive net exertion plus activity fatigue from fun/drive. Builds meaningfully (~7/week without wellness tech). Wellness tech + budget stabilises it. |
| **Churn** | 1–2 residents per week at starting conditions, not 3+. |
| **Recruitment** | 1 slot base, with Partytime able to earn a second slot through moderate investment. |
| **Vibes tier** | "Rough" to "Scrappy" (15–35), with a clear upward path for engaged players. |

### Ongoing Balance

| Principle | Guidance |
|-----------|----------|
| **Baseline hostility** | The default state always drifts toward failure. The game is finding the multipliers that push back. |
| **Multipliers and capacity are the game** | The player fights entropy two ways: stacking multipliers (budgets, policies, tech, resident stats) that improve efficiency, and expanding baseline capacity (buildings, upgrades) that raise the ceiling. Both should feel impactful. A new bathroom reduces crowding directly; a cleaning budget makes the existing bathrooms work harder. The interplay between the two is the strategic core. |
| **Scaling bottlenecks** | Each population tier should introduce pressures that the previous tier's multipliers can't fully address, driving the player toward the next wave of investment. |
| **No single lever dominates** | If one budget slider or building solves everything, the game loses strategic depth. |
| **Diminishing returns** | Investment should have decreasing marginal impact. The first £50 in cleaning matters more than the tenth. |
| **No compensation exploits** | Multiplicative formulas prevent trading one input for another. You can't fix hygiene with better food. |
| **Recoverable failure** | A bad week should be recoverable with focused corrective play. A bad month may not be. |
| **Trade-offs compound at every layer** | Stats trade off at the resident level (consideration helps PR but hurts PT). Budgets trade off at the resource level (spending here means not spending there). Policies trade off at the system level (each one helps a stat but too many hurt fun). The player should feel these trade-offs reinforcing the same central tension. |

---

## MVP Priority: Overall Score

> **Status: Priority task for the rebuild. Design TBD.**

The game needs an arcade-style Overall Score — a single cumulative number that grows throughout a playthrough and gives the player a persistent measure of how well they're doing. This is distinct from Vibes (which reflects current commune state) and the economy (which reflects current financial position). The Overall Score is a lifetime achievement number.

The score should reward four things: **performance** (sustained high Vibes), **expansion** (growing the commune), **longevity** (surviving more weeks), and **scale** (maintaining quality at higher population tiers). The intent is to create a number that feels satisfying to chase, enables comparison across playthroughs, and supports a future leaderboard.

The specific formula and weighting are not defined here — this is a design task for the rebuild. But the principle is clear: the score should incentivise the core gameplay loop (grow, stabilise, improve) and make restarts feel like a fresh attempt at a high score rather than a failure.

---

## Deferred Features

These features are part of the design vision but explicitly deferred from the current build. They are noted here so that the MVP architecture doesn't preclude them.

| Feature | Design Intent |
|---------|--------------|
| **Party planning mechanic** | Boost income and vibes at the cost of productivity, living standards, and disaster risk. Ticketed events with configurable budget and capacity. |
| **Disaster system** | Random adverse events (leaks, fires, noise complaints) whose frequency scales with strain and overcrowding. Mid/late game mechanic — should create pivots, not coin flips. |
| **MVP characters** | Special recruitable residents at milestone points with strong bonuses paired with real downsides. The "legendary loot" of resident recruitment. |
| **House theming** | Kink house, party mansion, tech hub — distinct identities with unique mechanics and trade-offs. |
| **Research speed** | Productivity-linked research speed creates an inherent incentive to invest in drive. |
| **Resident happiness** | Individual satisfaction scores affecting per-resident churn, creating a more granular personnel management layer. |
| **Advanced stat aggregation** | Tech upgrades that exclude the weakest 50% of stats from averages, rewarding specialised recruitment. |

---

## What Success Looks Like

**For the player:** Every week feels perilous and every decision feels consequential. The player understands why things are getting better or worse. Growth feels earned, failure feels instructive (not arbitrary), and the desire to restart and try a different approach is strong. The numbers tell a story of a commune always on the edge — held together by the player's choices, never coasting.

**For the designer:** The systems are tuneable without being fragile. Changing one parameter has predictable, bounded effects. The baseline hostility is clearly located in specific config values, and multipliers stack in transparent ways. New content (buildings, tech, residents, events) can be added via data without touching simulation code.

---

*End of document — v0.5*
