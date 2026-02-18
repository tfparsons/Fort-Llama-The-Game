# Fort Llama â€” Rebuild Architecture

*Technical architecture for the rebuilt codebase*
*February 2026 Â· Working Draft*
*Companion to: Fort_Llama_Design_Principles.md, Fort_Llama_Causal_Chain.md, Fort_Llama_Structural_Changes.md*

---

## What This Document Is

This document describes how the rebuilt Fort Llama codebase should be structured, how the pieces fit together, and how contributors should think about the repo. It does not cover game mechanics or balance â€” those are defined in the companion design documents listed above.

This is the plan for migrating from the Replit prototype (a client-server polling architecture) to a clean, open-source-ready codebase that runs primarily in the browser.

---

## Context: Why a Rebuild

The Replit prototype proved out the game mechanics but was shaped by its environment in ways that don't survive outside it:

- **All game logic lives on the server**, with the client polling every 500ms via HTTP â€” an artefact of Replit's agent defaulting to a client-server template. For a single-player browser game, this adds latency and complexity for no benefit.
- **No persistence layer.** Game state lives in server memory and disappears on restart. This is fine for the intended arcade-style experience (no save/load), but means the server does nothing that justifies its existence.
- **Monolith files.** The entire game engine, all config data, all 76 llama definitions, and all API routes live in a single 1,800-line `server/index.js`. The entire UI lives in a single 3,400-line `App.jsx`. This makes the codebase difficult to navigate, test, or contribute to.
- **Config is hardcoded.** Balance parameters, llama stats, building definitions, and tech trees are embedded directly in the server code rather than loaded from data files.

The game logic itself is sound â€” the simulation functions operate on a plain state object with no server-specific dependencies. The rebuild is primarily a restructuring exercise, not a rewrite.

---

## Design Decisions

### The game engine runs in the browser

The simulation loop, primitive calculations, health metrics, rent collection, churn, recruitment, building construction â€” all of it moves into the client. The engine is a pure JavaScript module that takes config + state in, produces new state out. React calls it directly on each tick via `setInterval` or `requestAnimationFrame`.

**Rationale:** Fort Llama is a single-player, no-save arcade experience. There is no gameplay reason for a server to be in the loop. Running client-side eliminates the 500ms polling overhead, removes a whole class of deployment complexity, and lets the dev version run as a simple `npm run dev` with no backend.

### Two modes, one codebase

The repo supports two modes that share all core code:

| | Dev Mode | Player Mode |
|---|---|---|
| **Purpose** | Balance tuning and contribution | Playing the game |
| **Dev Tools panel** | Visible â€” full config editing, live parameter adjustment, llama/building editors | Hidden |
| **Config source** | Editable locally; changes can be exported and submitted as PRs | Read-only; loaded from the committed config files |
| **Leaderboard** | Optional / local-only | Server-backed (future) |
| **Target audience** | Contributors and designers | Players |

The mode switch should be a build flag or environment variable, not a separate build pipeline. A contributor clones the repo and gets dev mode by default.

### Config files are the source of truth

All balance parameters, data definitions, and mechanical settings live in JSON files in a dedicated config directory. These files are:

- **Human-readable.** A contributor can open `config/primitives.json` and understand what the numbers mean without reading engine code.
- **Diffable.** A PR that changes cleanliness accumulation rates shows up as a clear, reviewable JSON diff.
- **Versioned.** The config that ships with each release is tracked in git. Leaderboard scores can reference a config version so scores are comparable within the same ruleset.
- **Decoupled from the engine.** The engine consumes config; it does not define it. New balance parameters can be added by editing data files, not by modifying simulation code.

### The server is minimal (and optional for dev)

For the dev version, no server is needed at all. The game runs entirely in the browser with config loaded from the bundled JSON files.

For the player version, a thin server handles exactly two responsibilities:

1. **Serve the static site** â€” the built React app and its assets.
2. **Leaderboard API** â€” accept score submissions (`POST /api/score`) and return the leaderboard (`GET /api/scores`). Basic validation to prevent trivially fake scores.

The leaderboard is a future concern and is not required for the initial rebuild.

---

## Proposed File Structure

```
fort-llama/
â”œâ”€â”€ config/                      # Source of truth for all game data
â”‚   â”œâ”€â”€ game.json                # Core settings: starting treasury, rent bounds, tick speed, game-over threshold
â”‚   â”œâ”€â”€ llamas.json              # Full llama pool: stats, bios, traits
â”‚   â”œâ”€â”€ buildings.json           # Building types, costs, capacities, upgrade paths
â”‚   â”œâ”€â”€ primitives.json          # Primitive definitions: types, rates, formulas, accumulator settings
â”‚   â”œâ”€â”€ health.json              # Health metric weights, scaling params, scoring curves
â”‚   â”œâ”€â”€ vibes.json               # Vibes tiers, identity labels, fame levels
â”‚   â”œâ”€â”€ tiers.json               # Population tier brackets, output/health multipliers, quality caps
â”‚   â”œâ”€â”€ budgets.json             # Budget categories, effectiveness curves, diminishing returns
â”‚   â”œâ”€â”€ policies.json            # Policy definitions, unlock requirements, effects
â”‚   â””â”€â”€ tech.json                # Tech tree: nodes, costs, durations, unlock chains
â”‚
â”œâ”€â”€ engine/                      # Pure game logic â€” no UI, no side effects
â”‚   â”œâ”€â”€ index.js                 # Main export: createGame(), tick(), applyAction()
â”‚   â”œâ”€â”€ simulation.js            # Daily tick loop: primitives, health, economics
â”‚   â”œâ”€â”€ simulation.test.js       # Integration: N ticks from starting state, sanity checks
â”‚   â”œâ”€â”€ primitives.js            # Coverage, pressure, and accumulator calculations
â”‚   â”œâ”€â”€ primitives.test.js
â”‚   â”œâ”€â”€ health.js                # Living Standards, Productivity, Partytime scoring
â”‚   â”œâ”€â”€ health.test.js
â”‚   â”œâ”€â”€ economics.js             # Rent collection, expenses, treasury, churn
â”‚   â”œâ”€â”€ economics.test.js
â”‚   â”œâ”€â”€ recruitment.js           # Candidate generation, invitation, slot calculation
â”‚   â”œâ”€â”€ recruitment.test.js
â”‚   â”œâ”€â”€ buildings.js             # Construction, upgrades, capacity effects
â”‚   â”œâ”€â”€ buildings.test.js
â”‚   â”œâ”€â”€ research.js              # Tech tree progression, unlock logic
â”‚   â”œâ”€â”€ research.test.js
â”‚   â”œâ”€â”€ policies.js              # Policy toggle effects, interaction penalties
â”‚   â”œâ”€â”€ policies.test.js
â”‚   â”œâ”€â”€ vibes.js                 # Vibes calculation, identity labels, fame
â”‚   â”œâ”€â”€ vibes.test.js
â”‚   â”œâ”€â”€ scoring.js               # Overall Score: accumulation, multipliers, final tally
â”‚   â”œâ”€â”€ scoring.test.js
â”‚   â””â”€â”€ utils.js                 # Shared helpers: clamping, scaling functions, stat conversions
â”‚
â”œâ”€â”€ client/                      # React UI
â”‚   â”œâ”€â”€ index.html
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ main.jsx             # Entry point
â”‚   â”‚   â”œâ”€â”€ App.jsx              # Top-level layout, game loop orchestration
â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â””â”€â”€ useGameLoop.js   # Manages tick interval, pause/resume, speed control
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ Dashboard.jsx    # Main game view: status cards, treasury, population
â”‚   â”‚   â”‚   â”œâ”€â”€ WeeklyPanel.jsx  # Floating weekly action panel: rent, budgets, build, research
â”‚   â”‚   â”‚   â”œâ”€â”€ Primitives.jsx   # Primitive visualisations: gauges, bars, tanks
â”‚   â”‚   â”‚   â”œâ”€â”€ Residents.jsx    # Resident list, recruitment UI
â”‚   â”‚   â”‚   â”œâ”€â”€ Buildings.jsx    # Building list, construction/upgrade UI
â”‚   â”‚   â”‚   â”œâ”€â”€ GameOver.jsx     # End screen: final score, initials entry
â”‚   â”‚   â”‚   â””â”€â”€ Leaderboard.jsx  # Score display (local for dev, server-backed for player)
â”‚   â”‚   â”œâ”€â”€ devtools/
â”‚   â”‚   â”‚   â”œâ”€â”€ DevPanel.jsx     # Main dev tools container (hidden in player mode)
â”‚   â”‚   â”‚   â”œâ”€â”€ ConfigEditor.jsx # Generic config section editors
â”‚   â”‚   â”‚   â”œâ”€â”€ LlamaEditor.jsx  # Llama pool management
â”‚   â”‚   â”‚   â”œâ”€â”€ BuildingEditor.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ PrimitiveEditor.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ HealthEditor.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ TechEditor.jsx
â”‚   â”‚   â”‚   â””â”€â”€ ExportButton.jsx # Export current config as JSON for PR submission
â”‚   â”‚   â””â”€â”€ styles/
â”‚   â”‚       â””â”€â”€ index.css        # All styles (or split per component as needed)
â”‚   â””â”€â”€ dist/                    # Built output (gitignored)
â”‚
â”œâ”€â”€ server/                      # Minimal â€” only needed for player version leaderboard
â”‚   â””â”€â”€ index.js                 # Static file serving + leaderboard API (future)
â”‚
â”œâ”€â”€ docs/                        # Design documentation
â”‚   â”œâ”€â”€ design-principles.md
â”‚   â”œâ”€â”€ causal-chain.md
â”‚   â”œâ”€â”€ structural-changes.md
â”‚   â””â”€â”€ architecture.md          # This document
â”‚
â”œâ”€â”€ package.json
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ vitest.config.js             # Test runner config
â”œâ”€â”€ README.md                    # Project overview, setup instructions, how to play
â”œâ”€â”€ CONTRIBUTING.md              # Contribution guide: balance tuning, feature dev, PR process
â””â”€â”€ .env.example                 # VITE_DEV_MODE=true
```

---

## How the Pieces Connect

### Game Loop (Client-Side)

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚  Config JSON â”‚  (loaded once at startup)
                    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                           â”‚
                           â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Player  â”‚â”€â”€â”€â”€â–¶â”‚   Game Engine    â”‚â”€â”€â”€â”€â–¶â”‚  React State â”‚â”€â”€â”€â”€â–¶ UI renders
â”‚  Action  â”‚     â”‚  tick(state,cfg) â”‚     â”‚  (gameState) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â–²                      â”‚
                           â”‚                      â”‚
                           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            setInterval @ tickSpeed
```

1. On startup, the app loads all config JSON and creates the initial game state via `createGame(config)`.
2. `useGameLoop` hook runs `tick(state, config)` at the configured tick speed and updates React state with the result.
3. Player actions (set rent, toggle policy, build, etc.) call engine functions that return a new state: `applyAction(state, config, action)`.
4. The engine is purely functional â€” same inputs, same outputs. No side effects, no global mutable state.
5. On game over, the final score is displayed and (in player mode) submitted to the leaderboard.

### Dev Tools Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Dev Panel â”‚â”€â”€â”€â”€â–¶â”‚ Edit config   â”‚â”€â”€â”€â”€â–¶â”‚  Apply &  â”‚
â”‚  (UI)      â”‚     â”‚ in memory     â”‚     â”‚  Reset    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
                                              â”‚
                                              â–¼
                                   createGame(newConfig)
                                   (fresh game with new params)

                   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                   â”‚   Export as  â”‚â”€â”€â”€â”€â–¶  JSON file download
                   â”‚   JSON       â”‚      (ready for PR)
                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Contributors edit config values in the dev tools panel, test them in real-time, then export the modified config as a JSON file. They commit the changed config file(s) and open a PR. The PR diff shows exactly which values changed and by how much.

---

## Build Sequence

This is a clean rebuild, not an incremental migration. The Replit prototype is the reference implementation â€” we're extracting the logic, fixing structural issues, and assembling a new codebase from scratch. The prototype remains available for reference but the new repo starts empty.

### Phase 1: Foundation
Set up the new repo structure, install dependencies, configure Vite and the dev environment. Create the `config/` directory and populate it by extracting all hardcoded data from the prototype's `server/index.js` â€” llama pool, buildings, primitives, health params, tier brackets, tech tree, etc. â€” into clean, well-structured JSON files. Write the config loader that validates and serves these to the engine.

### Phase 2: Game Engine
Build the `engine/` modules by porting simulation logic from the prototype. This is where the structural fixes documented in `Fort_Llama_Structural_Changes.md` get implemented â€” asymmetric accumulator recovery, budget outflow boost, fatigue rework, etc. No point porting broken mechanics just to fix them later. Write unit tests alongside each module (see Testing Strategy below).

### Phase 3: Core UI
Build the React app with the game loop running client-side. Start with the essential game UI: dashboard, weekly action panel, primitive visualisations, resident and building management. Get a playable game loop working end-to-end.

### Phase 4: Dev Tools
Port the existing dev tools panel into the new component structure. Wire up live config editing, apply-and-reset, and the config export flow. This is the point where balance tuning can begin on the new codebase.

### Phase 5: Scoring and Game Over
Implement the Overall Score system (as defined in Design Principles). Build the game-over screen with initials entry. Wire up local leaderboard storage for the dev version.

### Phase 6 (future): Player Deployment
Add the minimal server for static hosting and leaderboard API. Set up a deployment pipeline. Ship it.

---

## Contribution Workflows

### Balance Tuning

For contributors working on game balance â€” the lowest-barrier way to contribute:

1. Clone the repo and run `npm install && npm run dev`.
2. The game launches in dev mode with the full tuning panel visible.
3. Adjust parameters using the dev tools. Test by playing.
4. When satisfied, click **Export Config** to download the modified JSON.
5. Replace the relevant file(s) in `config/` with the exported version.
6. Commit and open a PR. The diff shows exactly what changed.
7. Discussion happens on the PR with concrete numbers to review.

### Feature Development

For contributors building new mechanics, UI features, or engine changes:

1. Fork the repo and create a feature branch from `main`.
2. Read the relevant design docs â€” `design-principles.md` defines the strategic intent, `causal-chain.md` maps how systems connect, and this architecture doc describes the codebase structure.
3. Implement the feature in the appropriate module(s). New engine mechanics go in `engine/`, new UI in `client/src/components/`, new data definitions in `config/`.
4. Write unit tests for any new engine logic. Tests should cover the expected behaviour and key boundary conditions.
5. If the feature introduces new config parameters, add them to the relevant JSON file(s) with sensible defaults, and expose them in the dev tools panel so they can be tuned.
6. Update documentation if the feature changes how systems connect (especially `causal-chain.md`).
7. Open a PR with a clear description of what the feature does, why it exists (reference to design principles or a discussed issue), and how it was tested.
8. Code review covers both implementation quality and design alignment â€” a well-built feature that contradicts the design principles will need discussion before merging.

### Bug Fixes and Refactoring

Standard fork-branch-PR workflow. Include a test that reproduces the bug (where applicable) so it doesn't regress. The modular structure means most fixes are scoped to a single file or module.

---

## Resolved Decisions

### Ruleset Naming and Leaderboard Integrity

Each published config version gets a **ruleset name** that is logged alongside every leaderboard score. This lets players and contributors understand which scores are comparable â€” a high score under ruleset "TP:0.5:1.0" isn't directly comparable to one under "TP:0.5:1.1" because the underlying balance may have changed.

**Naming convention:** `[contributor initials]:[app version]:[config version]`

Examples: `TP:0.5:1.0` (Tim's first config for app v0.5), `TP:0.5:1.1` (Tim's second iteration), `JD:0.5:1.0` (a different contributor's config for the same app version).

The ruleset name is stored in the config files and baked into the build. The leaderboard displays scores grouped by ruleset.

### Leaderboard Anti-Cheat

A client-side game can't fully prevent score manipulation. For MVP, basic server-side plausibility checks are sufficient â€” score within a possible range given weeks survived, population achieved, etc. The ruleset naming system means fraudulent scores only pollute their own leaderboard bracket. More sophisticated validation (e.g. server-side replay) is a future concern if the game reaches a scale where it matters.

### Mobile Support

Deferred. The current UI assumes a desktop viewport. Mobile responsiveness is a goal but not a rebuild priority. The component structure should use clean layout patterns that don't preclude responsive design later, but no mobile-specific work is in scope for the initial build.

---

## Testing Strategy

The engine's pure-function architecture is designed for testability. Every engine module takes state and config as inputs and returns new state â€” no side effects, no DOM, no timers. This means tests are fast, deterministic, and don't require a browser environment.

### What to Test

**Engine unit tests** â€” the core priority. Each engine module should have a corresponding test file:

| Module | Key test cases |
|--------|---------------|
| `primitives.js` | Coverage scoring at boundary ratios (0, 1, extreme); accumulator debt builds correctly; recovery damping applies only when debt is decreasing; budget boost amplifies outflow correctly |
| `health.js` | Health metric scores at reference values (should equal 50); scores at starting conditions (~35); individual metric effects (LSâ†’rent tolerance, PRâ†’churn, PTâ†’recruitment slots) |
| `economics.js` | Rent collection matches N Ã— rent; churn rate calculation at various Productivity levels; treasury correctly debits expenses; game-over triggers at threshold |
| `recruitment.js` | Correct number of candidate slots based on Partytime; candidates drawn from pool correctly; invited residents added to state |
| `buildings.js` | Construction costs deducted; capacity increases; upgrade paths respect tier quality caps |
| `research.js` | Tech costs deducted; research completes after correct duration; unlocks propagate (policies, buildings, fixed costs) |
| `scoring.js` | Score accumulates over ticks; rewards performance, expansion, longevity, and scale as designed |
| `simulation.js` | Integration test: run N ticks from starting state and verify the game doesn't crash, key metrics are within expected ranges, game-over triggers correctly |

**Regression tests for known issues** â€” the structural problems identified in the prototype (cleanliness death spiral, useless accumulator budgets, symmetric recovery) should each have a test that proves the fix works. These act as a safety net against reintroducing the same bugs.

**Config validation tests** â€” verify that the JSON config files are well-formed, contain all required fields, and have values within sane ranges. This catches typos and missing fields in balance PRs before they break the game.

### What Not to Test (Yet)

UI component tests and end-to-end browser tests are lower priority for the initial rebuild. The game's correctness lives in the engine; the UI is a presentation layer. If a primitive score is calculated wrong, the engine test catches it regardless of how the UI displays it. Component tests can be added later as the UI stabilises.

### Tooling

Vitest is the recommended test runner â€” it integrates natively with the Vite build system, runs fast, and supports ES modules out of the box. Test files sit alongside the modules they test: `engine/primitives.test.js` next to `engine/primitives.js`.

---

## Open Questions

- **Deployment target.** Where does the player version get hosted? Static site hosts (Netlify, Vercel, GitHub Pages) work for the game itself; the leaderboard API needs a lightweight server (Fly.io, Railway, or similar). No decision needed until Phase 6.

---

*End of document â€” awaiting feedback*
