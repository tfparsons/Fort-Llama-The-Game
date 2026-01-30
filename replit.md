# Fort Llama: The Game

A realtime management strategy simulation where players run a commune, trying to advance and expand without tipping the house into dysfunction and bankruptcy.

## Overview

Players manage a commune with the core loop being:
- Weekly cycles of income (rent from residents) vs expenditure (ground rent, utilities)
- Recruit residents to increase income
- Build bedrooms to increase capacity (but also increases overheads)
- Balance rent levels vs churn rate

## Project Structure

```
/
├── server/
│   └── index.js          # Express API server with simulation engine
├── client/
│   ├── index.html
│   └── src/
│       ├── main.jsx      # React entry point
│       ├── App.jsx       # Main application component
│       └── index.css     # Styles
├── vite.config.js        # Vite configuration with proxy
└── package.json
```

## Running the Project

- `npm run dev` - Runs both server (port 5000) and Vite dev server (port 5173) with proxy

## Game Mechanics

### Time System
- Daily ticks (7 days per week)
- Auto-pause at end of each week for player decisions
- Weekly action modal appears on Monday 9am
- Treasury animates daily (1/7 of weekly change per tick)

### Income
- Rent from residents: `residents × currentRent`

### Expenditure
- Ground Rent: `base × (1 + extraBedrooms × modifier)`
- Utilities: `base × (1 + extraBedrooms × modifier)`

### Churn
- `churnRate = baseChurn + (rent × churnMultiplier) - (productivity × churnReduction)`
- Higher rent = more churn, higher Productivity = less churn
- Churn calculated at end of week

### Primitives System
8 core metrics calculated daily from buildings + resident stats:

**Instant Primitives** (recalculated each tick):
- **Crowding** (0-100, lower is better): Overcrowding pressure from all room types
- **Noise** (0-100, lower is better): Social + ambient noise from Living Room activity
- **Nutrition** (0-100, higher is better): Food quality from Kitchen throughput × cooking skill
- **Fun** (0-100, higher is better): Party energy from Living Room × sociability
- **Drive** (0-100, higher is better): Motivation from workspace quality × work ethic

**Stock Primitives** (accumulate/recover over time):
- **Cleanliness debt** (0-100, lower is better): Mess accumulates, cleaning removes it
- **Maintenance debt** (0-100, lower is better): Wear accumulates, repairs remove it
- **Fatigue debt** (0-100, lower is better): Exertion accumulates, rest removes it

**Overcrowding Penalty**: `penalty = 1 + k × max(0, ratio - 1)^p` (default k=2, p=2)

### Health Metrics
3 aggregate metrics derived from primitives:

- **Living Standards** (LS): Nutrition baseline × Cleanliness/Crowding/Maintenance dampeners
  - Effect: Higher LS = better vibes score
- **Productivity** (PR): Drive baseline × Fatigue/Noise/Crowding dampeners × Nutrition boost
  - Effect: Higher PR = lower churn rate
- **Partytime** (PT): Fun baseline × Fatigue/Nutrition dampeners × Noise boost
  - Effect: Higher PT = more recruitment slots per week

### Vibes System
Headline status combining health metrics:

**OverallLevel** = (LS × PR × PT)^(1/3) - geometric mean punishes imbalance

**10 Tier Ladder**:
- Omni-shambles (<0.12) → Mega-shambles → Shambles → Bad → Decent → Good → Great → Superb → Worldclass → Utopia (≥0.93)

**Scale Gating**: Small communes (1-5 residents) capped at Bad-Good tier range; larger communes unlock extremes

**Identity Labels** (when imbalanced):
- High Partytime: Party House / Party Mansion
- High Productivity: Grind House / Sweat Shop
- High Living Standards: Showhome / Luxury Bubble
- Low Living Standards: Shanty Town / Slum Spiral
- Low Productivity: Chaos House / Dysfunctional Commune
- Low Partytime: Dead Vibes / Funeral Parlour

### Resident System
- 20 unique llamas, each with name, gender, age, bio, and 8 stats
- Stats: Sharing Tolerance, Cooking Skill, Tidiness, Handiness, Consideration, Sociability, Party Stamina, Work Ethic (1-20 scale)
- Residents tracked individually in `communeResidents` array
- Dashboard shows residents with hover tooltips for full bio/stats

### Player Actions (weekly panel)
1. Set rent (slider + text input, £50-500 with validation)
2. "Find a Llama" recruitment: view 3 random candidates, invite 1 per week
3. Build bedroom (instant, fixed cost)

### Recruitment Flow
- Click "Find a Llama" to see 3 random candidates from available pool
- Each candidate shows name, age, bio, and full 8-stat radar
- Invite one or pass to see next candidate
- Limit: 1 recruitment per week
- Invited llamas arrive Tuesday-Sunday of next week (random day)
- Pro-rata rent: `ceil((daysThisWeek / 7) * weeklyRent)`

### Game Over
Treasury reaches -£20,000

## Dev Tools

Separate admin panel to tune all parameters:
- Starting values (treasury, bedrooms, residents)
- Rent settings (min, max, default)
- Overhead settings (base costs, modifiers)
- Building costs and capacity
- Churn settings
- Game settings (tick speed, game over limit)

All parameter changes trigger simulation reset.

## Default Configuration

- Starting Treasury: £0
- Starting Bedrooms: 4
- Starting Residents: 2
- Default Rent: £100
- Ground Rent Base: £1,000/week
- Utilities Base: £200/week
- Base Churn: 20%
- Bedroom Capacity: 2 residents each
- Bedroom Build Cost: £2,000

## Recent Changes

- 2026-01-30: **Continuous Clock Animation**
  - Clock runs purely client-side using requestAnimationFrame (no flickering)
  - Time interpolates based on tick speed - smooth, continuous advancement
  - Day display derived from clock time, changes exactly at midnight
  - Only syncs with server on pause/unpause transitions (not every poll)
  - Clock pauses when game is paused for weekly planning
  - Added "Time" header label for consistency, white text styling

- 2026-01-30: **24-Hour Clock System**
  - Added 24-hour clock display in header (top-right, monospace)
  - Time advances by hoursPerTick (default 4) each tick
  - Day changes happen at midnight (hour 0)
  - Weekly Planner pause triggers at midnight Sunday→Monday (start of new week at 09:00)

- 2026-01-30: **UI Layout Improvements**
  - Restart button moved to header bar (next to Dashboard/Dev Tools) with confirmation dialog
  - Weekly Planner minimized state now anchors to top-right of vibes banner (not free-floating)
  - Minimized planner shows "Week N Planning" with expand button

- 2026-01-30: **Primitives UI Redesign**
  - Split primitives into three visual sections: Pressure, Instant Metrics, Stock Levels
  - **Pressure** (circular gauges with needle + tier labels):
    - Crowding (👥): Comfortable → Tight → Crowded → Unliveable
    - Noise (🔊): Quiet → Buzzing → Loud → Chaos
  - **Instant Metrics** (horizontal bars): Nutrition (🍽️), Fun (🎉), Drive (💪)
  - **Stock Levels** (vertical tanks): Cleanliness (🧹), Maintenance (🔧), Fatigue (😴)
  - Tanks fill from bottom-up as debt accumulates, color shifts green→orange→red
  - Gauges have animated needles, colored tier labels based on current state

- 2026-01-30: **Churn-Based Rent Tiers**
  - Rent tier labels now based on actual churn impact (rent × churnMultiplier)
  - Removed ceiling display from Weekly Planner UI
  - Tier thresholds (configurable in Dev Tools):
    - Bargain: ≤2% churn contribution (player could charge more)
    - Cheap: ≤5% churn contribution (still undercharging)
    - Fair: ≤8% churn contribution (minimal impact)
    - Pricey: ≤12% churn contribution (churn becoming noticeable)
    - Extortionate: >12% churn contribution (severe impact)
  - Rent slider still uses £10 increments

- 2026-01-30: **Churned Residents Feature**
  - Churned residents stay on the residents panel with red strikethrough styling
  - Churned residents return to the recruitable pool (can be re-recruited)
  - Re-recruited churned residents rejoin with normal UI styling
  - Only active (non-churned) residents count for rent income, capacity, and stat calculations
  - All aggregated stats and counts exclude churned residents

- 2026-01-29: **Primitives, Health Metrics & Vibes System**
  - Full primitives system: 8 metrics (5 instant, 3 stock) calculated from buildings + resident stats
  - Overcrowding penalty curve with tunable k/p parameters
  - Health Metrics: Living Standards, Productivity, Partytime - each affects game mechanics
  - LS affects rent ceiling, PR reduces churn, PT increases recruitment slots
  - Vibes system: 10-tier ladder from Omni-shambles to Utopia
  - Scale gating: commune size limits tier extremes
  - Identity labels for imbalanced houses (Party Mansion, Sweat Shop, etc.)
  - Dashboard shows Vibes headline, triangle balance glyph, health metric bars, primitive bars
  - Dev Tools shows all primitive/health/vibes config values
  - Buildings now have quality (1-3) and per-type multipliers (recoveryMult, foodMult, etc.)

- 2026-01-27: **Buildings System**
  - Full buildings system with 5 types: Bedrooms (2 cap), Kitchen (20), Bathroom (4), Living Room (20), Utility Closet (40)
  - Player starts with: 8 Bedrooms, 1 Kitchen, 3 Bathrooms, 1 Living Room, 1 Utility Closet (108 total capacity)
  - Only Bedrooms (£200) and Bathrooms (£300) are buildable by player
  - Each building type has its own utilities/ground rent multipliers
  - "Manage Buildings" button in Dev Tools opens editor for all building properties
  - Buildings panel in player dashboard shows all buildings with counts and capacity
  - Build menu now shows only buildable options (Bedrooms, Bathrooms)
  - Total capacity calculated from sum of all building capacities
  - Ground rent/utilities increase based on extra buildings beyond starting count

- 2026-01-27: **Llama Pool Editor & UI polish**
  - "Manage Llamas" button in Dev Tools opens full pool editor table
  - Edit all 20 llamas: name, gender, age, bio, and all 8 stats
  - Pool edits persist via "Save as Defaults" in Dev Tools
  - Recruitment candidates now locked at week start (no re-rolling)
  - Button labels simplified: Restart, Llama Recruitment, Build
  - "Llamas in Residence" section with aggregated stats as % (green/red coloring)
- 2026-01-26: **Individual resident system**
  - 20 unique llamas loaded from CSV data with names, bios, 8 stats
  - Recruitment modal with 3 random candidates (locked per week)
  - Invite/pass mechanic, 1 recruitment per week limit
  - Daily arrival system with pro-rata rent calculation
  - Residents section on dashboard with hover tooltips for bio/stats
  - Dev Tools shows llama pool status
- 2026-01-23: **Major UI redesign (Option B layout)**
  - Fixed top bar with key stats (Treasury, Residents/Capacity, Week/Day)
  - Main content area with cards for Commune Status, Weekly Projection, Game Status
  - Weekly actions now in draggable/minimizable floating panel (Finder-style)
  - Panel can be moved anywhere and minimized to title bar
  - No overlay - dashboard visible while making weekly decisions
- 2026-01-23: Changed to daily ticks with weekly pause and action modal
- 2026-01-23: Added rent text input with validation (must be within range)
- 2026-01-23: Treasury now animates daily (split weekly change by 7)
- 2026-01-23: Updated defaults (residents=2, rent=100, groundRent=1000, utilities=200, capacity=2)
- 2026-01-23: Redesigned Dev Tools panel with 4-column grid layout (no scrolling)
- 2026-01-22: Initial project setup with Express + React/Vite
- Core simulation engine with weekly ticks
- Player dashboard with status, actions, finances
- Dev tools panel with all configurable parameters
- Building menu modal
