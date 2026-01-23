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

### Income
- Rent from residents: `residents × currentRent`

### Expenditure
- Ground Rent: `base × (1 + extraBedrooms × modifier)`
- Utilities: `base × (1 + extraBedrooms × modifier)`

### Churn
- `churnRate = baseChurn + (rent × churnMultiplier)`
- Higher rent = more churn

### Player Actions (per week)
1. Set rent (slider £50-500)
2. Recruit residents (max 2/week, arrive next week)
3. Build bedroom (instant, fixed cost)

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

- 2026-01-23: Updated defaults (residents=2, rent=100, groundRent=1000, utilities=200, capacity=2)
- 2026-01-23: Redesigned Dev Tools panel with 4-column grid layout (no scrolling)
- 2026-01-22: Initial project setup with Express + React/Vite
- Core simulation engine with weekly ticks
- Player dashboard with status, actions, finances
- Dev tools panel with all configurable parameters
- Building menu modal
