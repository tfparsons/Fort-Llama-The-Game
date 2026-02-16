# Fort Llama: The Game

## Overview

Fort Llama is a real-time management strategy simulation where players manage a commune. The core objective is to advance and expand the commune without leading it into dysfunction and bankruptcy. Players are responsible for balancing income (rent from residents) against expenditures (ground rent, utilities), recruiting residents, and constructing bedrooms to increase capacity. The game features a dynamic system where decisions impact resident churn rates and overall commune "Vibes". The business vision is to create an engaging simulation game that offers a challenging and rewarding experience in resource and community management, with potential for expansion into broader simulation genres.

## User Preferences

No specific user preferences were provided in the original `replit.md` file. The agent should assume standard development practices and clear communication.

## System Architecture

The project follows a client-server architecture:
-   **Server:** An Express.js API server (`server/index.js`) hosts the core simulation engine and handles game logic.
-   **Client:** A React application (`client/src/main.jsx`) built with Vite provides the user interface.
-   **UI/UX:**
    -   A fixed top bar displays key statistics (Treasury, Residents/Capacity, Week/Day).
    -   The main content area uses cards for Commune Status, Weekly Projection, and Game Status.
    -   Weekly actions are managed via a draggable, minimizable floating panel, allowing dashboard visibility during decision-making.
    -   A continuous, client-side 24-hour clock system uses `requestAnimationFrame` for smooth animation.
    -   Primitives are visualized with distinct UI elements: circular gauges for "Pressure" (Crowding, Noise), horizontal bars for "Instant Metrics" (Nutrition, Fun, Drive), and vertical tanks for "Stock Levels" (Cleanliness, Maintenance, Fatigue). Tanks visually fill and change color based on debt accumulation.
-   **Game Mechanics:**
    -   **Time System:** Daily ticks (7 days per week) with an auto-pause at the end of each week for player decisions. The weekly action modal appears on Monday at 9 am.
    -   **Primitives System:** Eight core metrics with three types:
        -   **Pressure** (Crowding, Noise): Increase with population and decrease quality of life
        -   **Coverage** (Nutrition, Fun, Drive): Supply/demand model with log2 scoring
            -   Supply = min(N, capacity) × outputRate × tierOutputMult × buildingQuality × (1 + skillMult × avgSkill)
            -   Demand = N × consumptionRate (or slackRate for Drive)
            -   Score = 25 × (log2(ratio) + 2), clamped 0-100
            -   Tier labels (score-based): Shortfall (0-24), Tight (25-44), Adequate (45-59), Good (60-74), Great (75-89), Superb (90-100)
            -   Default rates tuned for ~35 score at game start: Nutrition 5/9, Fun 6/12, Drive 4/8
            -   skillMult: 0.1 (reduced to limit resident modifier impact)
        -   **Stock** (Cleanliness, Maintenance, Fatigue): Debt-based accumulation over time
            -   Cleanliness: messIn = messPerResident × N × overcrowdingPenalty, cleanOut = cleanBase × bathQuality × cleanMult × (1 + skillMult × tidiness). No tier scaling on cleaning — intentionally punishing at high populations, forcing tech/budget investment
            -   Cleanliness starts at 0 (clean), higher = worse. Uses dampener in Living Standards formula
    -   **Tier Progression System:** Population-based tiers scale the game's progression:
        -   Brackets: 1-6, 7-12, 13-20, 21-50, 51-100, 101+
        -   outputMults: [1.0, 1.15, 1.3, 1.5, 1.75, 2.0] - scales supply for coverage primitives
        -   healthMults: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7] - scales health metric reference values
        -   qualityCaps: [2, 3, 4, 5, 5, 5] - gates building upgrade levels by tier
    -   **Health Metrics:** Three aggregate metrics—Living Standards (LS), Productivity (PR), and Partytime (PT)—are derived from primitives. Uses a ratio-based scoring system for consistent 0-100 output across all game stages:
        -   Raw values are computed from primitives (unchanged formulas)
        -   Scoring: `M_ref = ref0 × (pop/pop0)^alpha × tierMult[tier]`, then `score = 100 × x^p / (1 + x^p)` where `x = raw/M_ref`
        -   ref0: 0.3 (tuned to produce ~35 scores at game start)
        -   At x=1 (raw equals reference), score = 50; higher p = steeper curve
        -   Tier brackets based on population: 1-6, 7-12, 13-20, 21-50, 51-100, 101+
        -   Each metric has symmetric mechanic effects around baseline 35:
            -   LS affects rent tolerance (£100 = 'Fair' at LS=35, scales to £500 at LS=100)
            -   PR affects churn (neutral at PR=35, ±1% per point deviation)
            -   PT affects recruitment slots (base slots at PT=35, +1 slot per +15 PT)
    -   **Vibes System:** A headline status combining health metrics, calculated as a geometric mean. It features a 10-tier ladder with scale gating based on commune size and identity labels for imbalanced communes (e.g., "Party House," "Sweat Shop").
        -   Tier progression: Shambles → Rough → Scrappy → Fine → Good → Lovely → Thriving → Wonderful → Glorious → Utopia
        -   Thresholds: 0-15, 15-25, 25-35, 35-45, 45-55, 55-65, 65-75, 75-85, 85-95, 95+
        -   Early game starts at "Fine" (health metrics ~35-45)
        -   **Reputation System:** 5-level fame scale always displayed in Vibes banner. Based on both Vibes score AND population tier:
            -   Obscure (0-20, any tier), Reputable (20-40, Tier 2+), Aspirational (40-60, Tier 3+), Famous (60-80, Tier 4+), Mythical (80-100, Tier 5+)
            -   Fame is capped by population tier — high vibes alone won't make a small commune famous
            -   When commune is imbalanced, special identity labels (e.g. "Party House") override the fame label
    -   **Resident System:** Features 20 unique llamas with individual stats (e.g., Sharing Tolerance, Cooking Skill). Residents are tracked individually, and churned residents remain visible but inactive, returning to the recruitable pool.
    -   **Buildings System:** Different building types (Bedrooms, Kitchen, Bathroom, Living Room, Utility Closet) contribute to capacity and primitive calculations. Each building has quality levels and specific primitive multipliers.
    -   **Budgets System:** Weekly mechanic allowing players to dedicate money towards "Budget Items" that boost specific primitives. Each item has a configurable efficiency/reductionRate (tunable in Dev Tools):
        -   **Coverage items** (add to supply): Ingredients→Nutrition, Cleaning materials→Cleanliness, Party supplies→Fun, Internet→Drive
        -   **Stock items** (reduce debt per tick): Handiman→Maintenance, Wellness→Fatigue
        -   Coverage formula: `totalSupply = baseSupply + (investment × efficiency)`
        -   Stock formula: `debtReduction = investment × reductionRate / ticksPerWeek` (applied per tick)
        -   Budget costs are deducted from treasury as weekly expenses alongside ground rent and utilities
        -   Default efficiency: 0.5 (coverage), default reductionRate: 0.02 (stock)
        -   Slider range: £0-£500 per item, step £10
        -   API: POST `/api/action/set-budget`, GET/POST `/api/budget-config`
    -   **Policies System:** Toggleable policies that affect primitives via multiplier modifiers. Players activate/deactivate policies during weekly planning. Designed for extensibility (scrollable list).
        -   **Starting policies:** Cooking Rota (excludes worst X% cooking stats from Nutrition multiplier), Cleaning Rota (excludes worst X% tidiness stats from Cleanliness multiplier)
        -   **Mechanism:** `getPolicyAdjustedAvgStat()` sorts residents by stat, removes bottom excludePercent (default 25%), recalculates average from remaining residents
        -   **Fun penalty:** When active policies exceed threshold (default 3), Fun supply is multiplied by `1 / (1 + K × excess^P)` where K=0.15, P=1.5
        -   **Dashboard:** Active policies shown in a card with hover tooltips explaining effects
        -   **Dev Tools:** Policy Settings in Mechanics section - tunable excludePercent, Fun penalty threshold/K/P
        -   **API:** POST `/api/action/toggle-policy`, GET/POST `/api/policy-config`
    -   **Technology System:** Three research trees (Quality of Life, Productivity, Fun) with 21 technologies across 3 levels, 5 tech types. 1 research per week limit.
        -   **Tech Types:** Policy (unlocks toggleable policies), Fixed Expense (weekly cost for primitive multiplier boost), Building (unlocks new constructible buildings), Culture (unlocks next-tier techs, shown as dashboard badges), Upgrade (modifies existing buildings)
        -   **Research Trees:** Quality of Life (Chores Rota→Cleaner/Ocado→L3), Productivity (Starlink→Wellness/Great Hall→L3), Fun (Blanket Fort→Always Be Escalating/Outdoor Plumbing→L3)
        -   **Tech Effects:** Chores Rota unlocks Cooking/Cleaning Rota policies; Cleaner/Starlink are fixed expenses with primitive multiplier boosts; Ocado boosts ingredient budget efficiency; Great Hall upgrades Living Room (capacity +10, fun/drive mult boosts); Blanket Fort unlocks Heaven building; Outdoor Plumbing unlocks Hot Tub building
        -   **Fixed Costs:** Toggle on/off during weekly planning, deducted as weekly expenses. Cleaner: +20% cleanliness, £150/wk. Starlink: +15% drive, £100/wk
        -   **Level 3 techs:** Visible but marked "Coming Soon" (available: false), cost £2000 placeholder
        -   **Dev Tools:** Technology section with configurable cost, effect %, and weekly cost for all 21 techs
        -   **API:** POST `/api/action/research`, POST `/api/action/toggle-fixed-cost`, GET/POST `/api/tech-config`
    -   **Player Actions:** Weekly actions include setting rent, setting budgets, managing policies, researching technology, recruiting llamas (one per week from three candidates), and building bedrooms.
    -   **Recruitment:** Candidates are presented with stats and bios; invited llamas arrive later in the week with pro-rata rent.
    -   **Game Over:** Occurs when the treasury reaches -£20,000.
-   **Development Tools:** A comprehensive admin panel (Dev Tools) allows tuning of all game parameters, including starting values, rent settings, overheads, building costs, churn settings, health/primitive/vibes configurations, and budget efficiency/reductionRate settings. All changes trigger a simulation reset.
    -   **Primitive Calculations Section:** Features collapsible accordion UI for all 8 primitives (color-coded by type: pressure/instant/stock). Each accordion displays formulas, editable base parameters, linked buildings (read-only), and optional per-primitive penalty curve overrides (custom K/P values). Global penalty curve controls (penaltyK/penaltyP) apply to all primitives by default, with per-primitive toggles to use custom curves.
    -   **Budget Settings Section:** Editable efficiency (coverage) and reductionRate (stock) parameters for each of the 6 budget items.
-   **Default Configuration:**
    -   Starting Treasury: £0, Bedrooms: 4, Residents: 10
    -   Default Rent: £100
    -   Ground Rent Base: £1,000/week, Utilities Base: £200/week
    -   Base Churn: 20%
    -   Bedroom Capacity: 2 residents each, Build Cost: £2,000

## External Dependencies

-   **Frontend Framework:** React
-   **Bundler/Development Server:** Vite
-   **Backend Framework:** Express.js
-   **Package Manager:** npm