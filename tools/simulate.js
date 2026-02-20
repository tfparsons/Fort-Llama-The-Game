'use strict';

/**
 * Fort Llama Headless Simulator
 *
 * Runs the game engine without the browser and logs all state to stdout.
 * Usage: node tools/simulate.js [options]
 *
 * Options:
 *   --weeks=N        Number of weeks to simulate (default: 8)
 *   --strategy=X     Player strategy: 'passive' (no actions), 'balanced' (spread budgets),
 *                    'ls-focus' (living standards), 'pt-focus' (partytime), 'pr-focus' (productivity)
 *   --budget=N       Total weekly budget for non-passive strategies (default: 200)
 *   --rent=N         Rent to charge (default: 100)
 *   --log=X          Log level: 'tick', 'day', 'week' (default: day)
 *   --csv            Output as CSV (default: table)
 *   --overrides=JSON JSON string of config overrides, e.g. '{"primitives":{"fatigue":{"exertBase":0.5}}}'
 *   --techs=X        Comma-separated tech IDs to pre-research, e.g. 'chores_rota,wellness,cleaner'
 */

// Parse CLI args
const args = {};
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    args[key] = val === undefined ? true : val;
  }
});

const WEEKS = parseInt(args.weeks) || 8;
const STRATEGY = args.strategy || 'passive';
const BUDGET = parseInt(args.budget) || 215;
const RENT = parseInt(args.rent) || 150;
const LOG_LEVEL = args.log || 'day';
const AS_CSV = !!args.csv;
const TECHS = args.techs ? args.techs.split(',').map(t => t.trim()) : [];

// Parse config overrides
let overrides = {};
if (args.overrides) {
  try {
    overrides = JSON.parse(args.overrides);
  } catch (e) {
    console.error('Invalid JSON for --overrides:', e.message);
    process.exit(1);
  }
}

// Suppress noisy console.log from state.js during module load (would pollute table output)
const _origLog = console.log;
console.log = (...a) => process.stderr.write(a.join(' ') + '\n');

const { state } = require('../server/state');
const { initializeGame, processTick } = require('../server/gameState');
const { calculateRecruitmentSlots, calculateRentTier } = require('../server/outcomes');

console.log = _origLog;

// Strategy definitions: how budgets are allocated
const STRATEGIES = {
  passive: {},  // No budgets
  balanced: {
    nutrition: 0.36, cleanliness: 0.08, maintenance: 0.15,
    fatigue: 0.08, fun: 0.21, drive: 0.12
  },
  'ls-focus': {
    nutrition: 0.40, cleanliness: 0.20, maintenance: 0.25,
    fatigue: 0.05, fun: 0.05, drive: 0.05
  },
  'pt-focus': {
    nutrition: 0.10, cleanliness: 0.05, maintenance: 0.05,
    fatigue: 0.10, fun: 0.55, drive: 0.15
  },
  'pr-focus': {
    nutrition: 0.10, cleanliness: 0.05, maintenance: 0.05,
    fatigue: 0.20, fun: 0.10, drive: 0.50
  }
};

// Collect simulation data
const rows = [];

function snapshot(label) {
  const gs = state.gameState;
  const p = gs.primitives;
  const hm = gs.healthMetrics;
  const v = gs.vibes;
  const cd = gs.coverageData;
  const pop = gs.communeResidents.filter(r => !r.churned).length;

  return {
    label,
    week: gs.week,
    day: gs.day,
    hour: gs.hour,
    pop,
    treasury: Math.round(gs.treasury),
    // Primitives
    crowding: round2(p.crowding),
    noise: round2(p.noise),
    nutrition: round2(p.nutrition),
    cleanliness: round2(p.cleanliness),
    maintenance: round2(p.maintenance),
    fatigue: round2(p.fatigue),
    fun: round2(p.fun),
    drive: round2(p.drive),
    // Coverage ratios
    nutrRatio: round3(cd?.nutrition?.ratio),
    funRatio: round3(cd?.fun?.ratio),
    driveRatio: round3(cd?.drive?.ratio),
    // Health metrics (0-100 scale)
    LS: round1(hm.livingStandards * 100),
    PR: round1(hm.productivity * 100),
    PT: round1(hm.partytime * 100),
    // Vibes
    vibes: round1(v.overallLevel * 100),
    vTier: v.tierName,
    branch: v.branchLabel || '-',
    reputation: v.reputation || '-'
  };
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return n != null ? Math.round(n * 1000) / 1000 : '-'; }

function applyStrategy(strategy, budget) {
  const alloc = STRATEGIES[strategy];
  if (!alloc) return;
  // Reset all to zero first, then apply allocation
  Object.keys(state.gameState.budgets).forEach(k => { state.gameState.budgets[k] = 0; });
  for (const [key, pct] of Object.entries(alloc)) {
    state.gameState.budgets[key] = Math.round(budget * pct);
  }
}

// ── Run simulation ───────────────────────────────────────────────────────────

console.error(`\nFort Llama Headless Simulator`);
console.error(`  Weeks: ${WEEKS} | Strategy: ${STRATEGY} | Budget: £${BUDGET} | Rent: £${RENT} | Log: ${LOG_LEVEL}`);
if (TECHS.length > 0) {
  console.error(`  Pre-researched techs: ${TECHS.join(', ')}`);
}
if (Object.keys(overrides).length > 0) {
  console.error(`  Overrides: ${JSON.stringify(overrides)}`);
}
console.error('');

// Force fresh state — bypass any saved-defaults.json or in-progress game data
state.savedLlamaPool = null;
state.savedBuildingsConfig = null;

// Initialize with clean defaults, deep-merged with any CLI overrides
initializeGame(overrides);
state.gameState.currentRent = RENT;

// Pre-research techs if specified via --techs flag
if (TECHS.length > 0) {
  // Techs with type 'fixed_cost' need to go into activeFixedCosts as well
  for (const techId of TECHS) {
    if (!state.gameState.researchedTechs.includes(techId)) {
      state.gameState.researchedTechs.push(techId);
    }
    const techDef = state.techConfig[techId];
    if (techDef && techDef.type === 'fixed_cost' && !state.gameState.activeFixedCosts.includes(techId)) {
      state.gameState.activeFixedCosts.push(techId);
    }
  }
}

// Apply budget strategy
applyStrategy(STRATEGY, BUDGET);

// Take initial snapshot
rows.push(snapshot('init'));

// Simulate
const ticksPerDay = 24 / state.gameConfig.hoursPerTick;

for (let week = 1; week <= WEEKS; week++) {
  // Dismiss the weekly pause to start the week
  state.gameState.isPausedForWeeklyDecision = false;

  // Re-apply budgets and rent each week
  state.gameState.currentRent = RENT;
  applyStrategy(STRATEGY, BUDGET);

  for (let day = 1; day <= 7; day++) {
    for (let tick = 0; tick < ticksPerDay; tick++) {
      processTick();

      if (state.gameState.isGameOver) break;
      if (state.gameState.isPausedForWeeklyDecision) break;

      if (LOG_LEVEL === 'tick') {
        rows.push(snapshot(`W${week}D${day}T${tick}`));
      }
    }

    if (state.gameState.isGameOver) break;
    if (state.gameState.isPausedForWeeklyDecision) break;

    if (LOG_LEVEL === 'day') {
      rows.push(snapshot(`W${week}D${day}`));
    }
  }

  if (state.gameState.isGameOver) {
    rows.push(snapshot('GAME_OVER'));
    console.error(`Game over at Week ${week}`);
    break;
  }

  if (LOG_LEVEL === 'week') {
    rows.push(snapshot(`W${week}_end`));
  }

  // Per-week summary to stderr
  const churnCount = state.gameState.lastWeekSummary?.churnedResidents?.length || 0;
  const recruitSlots = calculateRecruitmentSlots();
  const rentTier = calculateRentTier(RENT);
  console.error(`  Week ${week}: pop=${state.gameState.communeResidents.filter(r => !r.churned).length} churn=${churnCount} recruit_slots=${recruitSlots} rent_tier=${rentTier} treasury=£${Math.round(state.gameState.treasury)}`);
}

// ── Output ───────────────────────────────────────────────────────────────────

if (rows.length === 0) {
  console.error('No data collected.');
  process.exit(1);
}

const keys = Object.keys(rows[0]);

if (AS_CSV) {
  console.log(keys.join(','));
  rows.forEach(r => console.log(keys.map(k => r[k]).join(',')));
} else {
  // Pretty table output
  const widths = {};
  keys.forEach(k => {
    widths[k] = Math.max(k.length, ...rows.map(r => String(r[k]).length));
  });

  const header = keys.map(k => k.padEnd(widths[k])).join(' | ');
  const separator = keys.map(k => '-'.repeat(widths[k])).join('-+-');

  console.log(header);
  console.log(separator);
  rows.forEach(r => {
    console.log(keys.map(k => String(r[k]).padEnd(widths[k])).join(' | '));
  });
}

console.error(`\nSimulation complete. ${rows.length} data points.`);
