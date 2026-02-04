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
    -   Primitives are visualized with distinct UI elements: circular gauges for "Pressure" (Crowding, Noise), horizontal bars for "Instant Metrics" (Nutrition, Cleanliness, Fun, Drive), and vertical tanks for "Stock Levels" (Maintenance, Fatigue). Tanks visually fill and change color based on debt accumulation.
-   **Game Mechanics:**
    -   **Time System:** Daily ticks (7 days per week) with an auto-pause at the end of each week for player decisions. The weekly action modal appears on Monday at 9 am.
    -   **Primitives System:** Eight core metrics with three types:
        -   **Pressure** (Crowding, Noise): Increase with population and decrease quality of life
        -   **Coverage** (Nutrition, Cleanliness, Fun, Drive): Supply/demand model with log2 scoring
            -   Supply = min(N, capacity) × outputRate × tierOutputMult × buildingQuality × (1 + skillMult × avgSkill)
            -   Demand = N × consumptionRate (or slackRate for Drive)
            -   Score = 25 × (log2(ratio) + 2), clamped 0-100
            -   Tier labels: Shortfall (<1x), Adequate (1-2x), Good (2-4x), Great (4-8x), Superb (8x+)
        -   **Stock** (Maintenance, Fatigue): Debt-based accumulation over time
    -   **Tier Progression System:** Population-based tiers scale the game's progression:
        -   Brackets: 1-6, 7-12, 13-20, 21-50, 51-100, 101+
        -   outputMults: [1.0, 1.15, 1.3, 1.5, 1.75, 2.0] - scales supply for coverage primitives
        -   healthMults: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7] - scales health metric reference values
        -   qualityCaps: [2, 3, 4, 5, 5, 5] - gates building upgrade levels by tier
    -   **Health Metrics:** Three aggregate metrics—Living Standards (LS), Productivity (PR), and Partytime (PT)—are derived from primitives. Uses a ratio-based scoring system for consistent 0-100 output across all game stages:
        -   Raw values are computed from primitives (unchanged formulas)
        -   Scoring: `M_ref = ref0 × (pop/pop0)^alpha × tierMult[tier]`, then `score = 100 × x^p / (1 + x^p)` where `x = raw/M_ref`
        -   At x=1 (raw equals reference), score = 50; higher p = steeper curve
        -   Tier brackets based on population: 1-6, 7-12, 13-20, 21-50, 51-100, 101+
        -   Each metric has symmetric mechanic effects:
            -   LS affects rent tolerance via diminishing returns curve
            -   PR reduces the churn rate (via churnReductionMult)
            -   PT increases recruitment slots (via ptSlotsThreshold)
    -   **Vibes System:** A headline status combining health metrics, calculated as a geometric mean. It features a 10-tier ladder (Omni-shambles to Utopia) with scale gating based on commune size and identity labels for imbalanced communes (e.g., "Party House," "Sweat Shop").
    -   **Resident System:** Features 20 unique llamas with individual stats (e.g., Sharing Tolerance, Cooking Skill). Residents are tracked individually, and churned residents remain visible but inactive, returning to the recruitable pool.
    -   **Buildings System:** Different building types (Bedrooms, Kitchen, Bathroom, Living Room, Utility Closet) contribute to capacity and primitive calculations. Each building has quality levels and specific primitive multipliers.
    -   **Player Actions:** Weekly actions include setting rent, recruiting llamas (one per week from three candidates), and building bedrooms.
    -   **Recruitment:** Candidates are presented with stats and bios; invited llamas arrive later in the week with pro-rata rent.
    -   **Game Over:** Occurs when the treasury reaches -£20,000.
-   **Development Tools:** A comprehensive admin panel (Dev Tools) allows tuning of all game parameters, including starting values, rent settings, overheads, building costs, churn settings, and health/primitive/vibes configurations. All changes trigger a simulation reset.
    -   **Primitive Calculations Section:** Features collapsible accordion UI for all 8 primitives (color-coded by type: pressure/instant/stock). Each accordion displays formulas, editable base parameters, linked buildings (read-only), and optional per-primitive penalty curve overrides (custom K/P values). Global penalty curve controls (penaltyK/penaltyP) apply to all primitives by default, with per-primitive toggles to use custom curves.
-   **Default Configuration:**
    -   Starting Treasury: £0, Bedrooms: 4, Residents: 2
    -   Default Rent: £100
    -   Ground Rent Base: £1,000/week, Utilities Base: £200/week
    -   Base Churn: 20%
    -   Bedroom Capacity: 2 residents each, Build Cost: £2,000

## External Dependencies

-   **Frontend Framework:** React
-   **Bundler/Development Server:** Vite
-   **Backend Framework:** Express.js
-   **Package Manager:** npm