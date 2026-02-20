# Fort Llama – Claude Code Context

## What This Is

Fort Llama is a single-player browser-based city management simulation. Players run a communal living facility for anthropomorphic llamas, balancing economics, social systems, and resident wellbeing. The game models a four-layer pipeline:

**Player actions** (rent, budgets, buildings, policies) → **Primitives** (coverage, pressure, accumulators) → **Health metrics** (Living Standards, Productivity, Partytime) → **Outcomes** (vibes, churn, recruitment, economy)

The design philosophy is "perilous but navigable" — a mildly negative baseline drifts toward failure, requiring active player investment to push back against entropy.

## Project Structure

```
server/
  config.js        ← All tunable parameters (primitives, health, vibes, budgets, policies, tech)
  primitives.js    ← Coverage ratios + accumulator calculations
  healthMetrics.js ← Living Standards, Productivity, Partytime from primitives
  outcomes.js      ← Vibes, churn, recruitment, economy from health metrics
  gameState.js     ← Game loop: init, tick processing, week-end processing
  residents.js     ← Llama pool and resident management
  routes.js        ← Express API routes
  state.js         ← Shared mutable game state
  utils.js         ← Scoring functions (log2CoverageScore, dampener, baseline, statTo01)
client/
  src/App.jsx      ← Monolithic 186K React frontend with dev tools panel
tools/
  simulate.js      ← Headless simulator for balance testing (see below)
docs/
  Fort_Llama_Design_Principles_v0.5.md  ← Design targets and balance philosophy
  Fort_Llama_Causal_Chain_v0.5.md       ← Complete formula reference for every calculation
  Fort_Llama_Architecture.md            ← System architecture and contribution workflows
  Fort_Llama_MVP_Overview.md            ← High-level game overview
```

## Key Documentation

Before making balance changes, read the relevant docs:

- **Design Principles** (`docs/Fort_Llama_Design_Principles_v0.5.md`): Contains explicit targets for starting vibes (15–35 "Rough to Scrappy"), churn rates (1–2/week), coverage scores (~35–45 "Tight"), and economic balance. All tuning should be validated against these targets.
- **Causal Chain** (`docs/Fort_Llama_Causal_Chain_v0.5.md`): Every formula in the engine with exact variable names matching `config.js`. This is the ground truth for how systems connect.

## Headless Simulator

`tools/simulate.js` runs the game engine without a browser for rapid balance testing.

### Usage

```bash
# Basic: passive play (no budget) for 8 weeks, daily snapshots
node tools/simulate.js --weeks=8 --strategy=passive --log=day

# With budget strategy and CSV output
node tools/simulate.js --weeks=12 --strategy=balanced --budget=215 --csv

# With pre-researched techs (test tech impact without playing through)
node tools/simulate.js --weeks=12 --strategy=balanced --techs=chores_rota,wellness,cleaner --log=week

# With config overrides (test parameter changes without editing files)
node tools/simulate.js --weeks=6 --strategy=passive --overrides='{"primitives":{"fatigue":{"exertBase":0.5}}}'

# Weekly summary only (compact)
node tools/simulate.js --weeks=12 --strategy=balanced --log=week
```

### Options

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--weeks=N` | 1–50 | 8 | Weeks to simulate |
| `--strategy=X` | passive, balanced, ls-focus, pt-focus, pr-focus | passive | Budget allocation pattern |
| `--budget=N` | any | 215 | Total weekly budget (ignored for passive) |
| `--rent=N` | any | 150 | Weekly rent per resident |
| `--log=X` | tick, day, week | day | Snapshot frequency |
| `--csv` | flag | table | Output as CSV |
| `--overrides=JSON` | JSON string | none | Config overrides (same structure as config.js) |
| `--techs=X` | comma-separated | none | Pre-research techs, e.g. `chores_rota,wellness,cleaner` |

### Strategies

- **passive**: Zero budgets. Tests pure baseline drift — how fast things decay without intervention.
- **balanced**: Proportional spread across all 6 budget categories (weighted by basePerCapita). Tests whether investment can stabilise the system.
- **ls-focus**: Heavy Living Standards investment (nutrition, cleanliness, maintenance).
- **pt-focus**: Heavy Partytime investment (fun-weighted).
- **pr-focus**: Heavy Productivity investment (drive, fatigue-weighted).

### Output Columns

The simulator tracks every key metric per snapshot:

- **Primitives**: crowding, noise, nutrition, cleanliness, maintenance, fatigue, fun, drive (0–100 scale)
- **Coverage ratios**: nutrRatio, funRatio, driveRatio (supply/demand, 1.0 = balanced)
- **Health metrics**: LS, PR, PT (0–100 scale, from healthMetrics 0–1 × 100)
- **Vibes**: vibes (0–100), vTier (tier name), branch (special label), reputation

### Tuning Workflow

1. **Run baseline simulation** (`--strategy=passive`) to see unmanaged drift
2. **Run with budget** (`--strategy=balanced`) to see if player investment can stabilise
3. **Compare against design targets** in Design Principles doc
4. **Test parameter changes** via `--overrides` without editing files
5. **When satisfied**, apply changes to `server/config.js`
6. **Verify** by re-running simulations with the actual config (no overrides)

### Important: Cascade Awareness

Changes propagate through the four-layer pipeline. When tuning:

- **Layer 1 (Primitives)**: Accumulator rates, coverage ratios → affects everything downstream
- **Layer 2 (Health Metrics)**: Scaling parameters, weights → affects outcomes only
- **Layer 3 (Outcomes)**: Churn thresholds, recruitment, vibes → final player-facing numbers

Tune one layer at a time. Run simulations after each change to see the full cascade effect.

## Config Structure

All tunable values live in `server/config.js`. Key sections:

- `DEFAULT_PRIMITIVE_CONFIG` (line ~180): Accumulator rates, coverage ratios, capacity, noise
- `DEFAULT_HEALTH_CONFIG` (line ~233): Health metric scaling, fatigue weights, churn/recruitment params
- `DEFAULT_VIBES_CONFIG` (line ~281): Vibes thresholds, tier names, balance settings
- `DEFAULT_BUDGET_CONFIG` (line ~313): Budget curve (floor, ceiling, basePerCapita, scaleExp) and category labels
- `DEFAULT_POLICY_CONFIG` (line ~350+): Policy definitions and effects
- `DEFAULT_TECH_CONFIG` (line ~500+): Tech tree definitions

## Economy Model (v0.52)

The game uses a **debt-driven startup model**. The player starts with 4 residents, zero treasury, and immediately goes into debt. Growth is the only path to solvency.

- **Fixed costs**: Ground rent £700 + utilities £250 = £950/week
- **Rent**: £150/resident/week
- **Game over**: -£5,000 (the "overdraft limit")
- **Break-even**: ~N=11 at neutral budget. Profitable at N=12 (75% of 16-bed capacity)
- **Starting burn**: ~£570/week at N=4 with frugal budgets

**The Difficulty Squeeze**: Recruiting fixes the economy but worsens accumulators. At N=4, cleanliness and maintenance stay at zero (small group, manageable mess). At N=8+, accumulators build relentlessly. Tech progression (chores_rota, cleaner, wellness) is the escape valve.

## Known Issues (v0.52)

- **Accumulator rates tuned**: Budget-as-base model with activity fatigue. Tech investment stabilises accumulators. At N=4, only fatigue accumulates (~7.5/week). At N=12, all three accumulators build without tech.
- **Starting vibes**: ~29 ("Scrappy") at N=4 — within design target of 15–35.
- **Client monolithic**: App.jsx is 186K and needs decomposition (future task, not blocking balance work).
- **saved-defaults.json**: Persistence mechanism that overrides config.js with stale values. Delete the file when config changes aren't reflected in-game.

## Running the Game

```bash
npm install
npm run dev          # Starts server on :5000 and Vite client
```

Dev tools panel is built into the client UI for live parameter editing during play.
