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
- `churnRate = baseChurn + (rent × churnMultiplier)`
- Higher rent = more churn
- Churn calculated at end of week

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

- 2026-01-26: **Individual resident system**
  - 20 unique llamas loaded from CSV data with names, bios, 8 stats
  - "Find a Llama" recruitment modal with 3 random candidates
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
