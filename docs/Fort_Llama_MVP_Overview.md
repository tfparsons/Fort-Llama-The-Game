# Fort Llama â€” MVP Overview & Agent Orientation

*Start here. Read this before touching any code or other documentation.*
*February 2026 Â· Working Draft*

---

## What This Project Is

Fort Llama is a single-player management simulation where the player runs a communal living facility for anthropomorphic llamas. It plays like an arcade-style strategy game: no save/load, the commune drifts toward failure by default, and the player fights entropy through smart resource allocation. Games end in collapse or a high score.

**Repository:** https://github.com/tfparsons/Fort-Llama-The-Game

---

## Current State

A working prototype exists, built in Replit. It proves out the game mechanics but has structural problems:

- All game logic runs server-side with the client polling every 500ms â€” unnecessary for a single-player browser game.
- The entire engine, all config, and all data live in a single 1,800-line `server/index.js`. The entire UI lives in a single 3,400-line `App.jsx`.
- Config values are hardcoded in the server code, not loaded from data files.
- Several mechanical systems have architectural bugs (documented in detail â€” see doc map below).

The prototype is the reference implementation. The game logic is sound; the structure around it is not. The rebuild extracts the logic, fixes the structural issues, and assembles a clean codebase from scratch.

---

## What We're Building (MVP Scope)

A browser-based game that runs entirely client-side, with a clean modular codebase and config-driven balance.

### In scope

- **Game engine** running in the browser as pure JavaScript (no server required for gameplay)
- **Six structural formula fixes** addressing architectural bugs in the prototype (asymmetric recovery, budget outflow boost, dynamic fatigue, noise cleanup, overcrowding onset, LSâ†’rent tolerance)
- **Numerical rebalancing** of starting parameters (accumulator rates, coverage ratios, economy)
- **Config-driven architecture** â€” all balance parameters in JSON files, decoupled from engine code
- **Core game UI** â€” dashboard, weekly actions, primitives display, resident/building management, recruitment
- **Dev tools panel** â€” live config editing, apply-and-reset, JSON export for contributor PRs
- **Overall Score system** â€” arcade-style cumulative score for leaderboard (formula TBD)
- **Game over screen** with initials entry and local leaderboard

### Explicitly deferred (do not build)

- Server-backed leaderboard API
- Mobile responsiveness
- Party planning mechanic
- Disaster system
- MVP characters (special recruitable residents)
- House theming
- Research speed linked to Productivity
- Individual resident happiness scores
- Advanced stat aggregation (exclude-worst-50% tech)

---

## Documentation Map

Four companion documents contain all the design and technical detail. Read them in this order:

| Document | What it covers | When you need it |
|----------|---------------|-----------------|
| **Fort_Llama_Design_Principles.md** | The "why" â€” core design philosophy, what the game should feel like, balance principles, progression targets, system architecture principles. | Read first. This is the strategic anchor. If a technical decision contradicts something here, the decision is wrong. |
| **Fort_Llama_Causal_Chain.md** | The complete formula pipeline â€” every formula in the game, layer by layer, with worked examples. Also contains the prototype diagnosis (what's broken and why) and numerical tuning recommendations for the rebuild. | Reference constantly during engine development. This is where every formula lives. |
| **Fort_Llama_Structural_Changes.md** | Implementation instructions for the six structural formula fixes. Pseudocode, worked examples, config changes, implementation order. | Follow during Phase 2 (engine build). These changes are applied during the port, not after. |
| **Fort_Llama_Architecture.md** | Codebase structure, file layout, build phases, testing strategy, contribution workflows, dev/player mode split. | Reference for repo setup, module boundaries, and how pieces connect. |

**Important convention in the Causal Chain:** formulas describe the *rebuild target* (after structural changes). Where the prototype differs, this is flagged with a âš ï¸ **Prototype** note. If you see a formula without a prototype note, the prototype implements it correctly and it should be ported as-is.

---

## Build Sequence

The rebuild is structured in phases. Each phase produces a working, testable result before the next begins.

| Phase | What | Key inputs | Done when |
|-------|------|-----------|-----------|
| **1. Foundation** | New repo structure, Vite setup, extract all hardcoded data from prototype into JSON config files, write config loader. | Architecture doc (file structure), prototype code (data extraction) | `npm run dev` starts, config loads and validates |
| **2. Game Engine** | Port simulation logic into modular `engine/` files. Apply all six structural changes during the port. Write unit tests alongside each module. | Causal Chain (all formulas), Structural Changes (fixes), Architecture doc (module boundaries, test cases) | All engine modules pass tests, simulation runs N ticks from starting state without crashing |
| **3. Core UI** | React app with client-side game loop. Dashboard, weekly actions, primitives, residents, buildings. Playable end-to-end. | Architecture doc (component structure, game loop), prototype `App.jsx` (UI reference) | A human can play a full game in the browser |
| **4. Dev Tools** | Port dev tools panel. Live config editing, apply-and-reset, config export as JSON. | Prototype dev tools (reference), Architecture doc (dev tools flow) | A contributor can tune config values and export changes |
| **5. Scoring & Game Over** | Overall Score system, game over screen, initials entry, local leaderboard. | Design Principles (scoring intent â€” formula TBD) | Game ends with a score, local leaderboard works |

---

## Key Technical Decisions (Resolved)

These are settled. Don't revisit them.

- **Client-side engine.** No server for gameplay. The engine is a pure JavaScript module: `tick(state, config) â†’ newState`.
- **No persistence.** Arcade-style, no save/load. State lives in memory for the duration of a game.
- **Config in JSON files.** All balance parameters, data definitions, and mechanical settings live in `config/*.json`. The engine consumes config; it does not define it.
- **Dev/Player mode via build flag.** `VITE_DEV_MODE=true` shows dev tools. Same codebase, same build pipeline.
- **Vite + Vitest.** Build system and test runner. ES modules throughout.
- **Structural changes applied during port.** Don't port broken mechanics from the prototype and fix them later. Apply the six structural changes as you build each engine module.

---

## Open Design Work

| Item | Status | Blocking? |
|------|--------|-----------|
| **Overall Score formula** | TBD â€” not in prototype, not yet designed. Should reward performance, expansion, longevity, and scale. | Blocks Phase 5 only |
| **Deployment target** | Undecided (Netlify/Vercel/GitHub Pages for static; Fly/Railway for future leaderboard API) | Not blocking â€” Phase 6 concern |

---

*End of document*
