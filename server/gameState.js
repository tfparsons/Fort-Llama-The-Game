'use strict';

const { state, saveGame } = require('./state');
const {
  DAY_NAMES,
  STARTING_LLAMAS,
  DEFAULT_BUILDINGS,
  DEFAULT_PRIMITIVE_CONFIG,
  DEFAULT_HEALTH_CONFIG,
  DEFAULT_VIBES_CONFIG,
  DEFAULT_TIER_CONFIG,
  DEFAULT_BUDGET_CONFIG,
  DEFAULT_POLICY_CONFIG,
  DEFAULT_TECH_CONFIG,
  DEFAULT_NOTICEBOARD_CONFIG,
  INITIAL_DEFAULTS,
  TECH_TREE
} = require('./config');
const { deepMergePrimitives } = require('./utils');
const { getAvailableLlamas } = require('./residents');
const { calculatePrimitives } = require('./primitives');
const { calculateHealthMetrics } = require('./healthMetrics');
const {
  calculateVibes,
  calculateWeeklyProjection,
  calculateWeeklyChurnCount,
  calculateGroundRent,
  calculateUtilities
} = require('./outcomes');
const {
  calculateWeeklyScore,
  checkMilestones,
  updateScoringTrackers
} = require('./scoring');

let ticksSinceLastSave = 0;

function initializeGame(config = state.savedDefaults) {
  ticksSinceLastSave = 0;
  state.gameConfig = { ...INITIAL_DEFAULTS, ...config };
  state.primitiveConfig = deepMergePrimitives(DEFAULT_PRIMITIVE_CONFIG, config.primitives);
  state.healthConfig = deepMergePrimitives(DEFAULT_HEALTH_CONFIG, config.health);
  state.vibesConfig = config.vibes ? { ...config.vibes } : { ...DEFAULT_VIBES_CONFIG };
  state.tierConfig = config.tierConfig ? { ...config.tierConfig } : { ...DEFAULT_TIER_CONFIG };
  if (config.budgetConfig) {
    state.budgetConfig = JSON.parse(JSON.stringify(config.budgetConfig));
  }
  if (config.policyConfig) {
    state.policyConfig = JSON.parse(JSON.stringify(config.policyConfig));
  }
  if (config.techConfig) {
    state.techConfig = JSON.parse(JSON.stringify(config.techConfig));
  }

  state.llamaPool = state.savedLlamaPool
    ? JSON.parse(JSON.stringify(state.savedLlamaPool))
    : JSON.parse(JSON.stringify(STARTING_LLAMAS));

  let buildingsConfig;
  if (state.savedBuildingsConfig) {
    buildingsConfig = JSON.parse(JSON.stringify(state.savedBuildingsConfig));
    DEFAULT_BUILDINGS.forEach(def => {
      if (!buildingsConfig.find(b => b.id === def.id)) {
        buildingsConfig.push(JSON.parse(JSON.stringify(def)));
      }
    });
  } else {
    buildingsConfig = JSON.parse(JSON.stringify(DEFAULT_BUILDINGS));
  }

  const shuffled = [...state.llamaPool].sort(() => Math.random() - 0.5);
  const startingResidentObjects = shuffled.slice(0, state.gameConfig.startingResidents).map(llama => ({
    ...llama,
    daysThisWeek: 7,
    arrivalDay: null
  }));

  const buildings = buildingsConfig.map(b => ({
    ...b,
    count: b.atStart
  }));

  state.gameState = {
    treasury: state.gameConfig.startingTreasury,
    buildings: buildings,
    communeResidents: startingResidentObjects,
    pendingArrivals: [],
    currentRent: state.gameConfig.defaultRent,
    week: 1,
    day: 1,
    hour: 9,
    dayName: 'Monday',
    isRunning: false,
    isPausedForWeeklyDecision: true,
    isGameOver: false,
    lastWeekSummary: null,
    hasRecruitedThisWeek: false,
    buildsThisWeek: 0,
    weekCandidates: [],
    weeklyDelta: 0,
    dailyDelta: 0,
    treasuryAtWeekStart: state.gameConfig.startingTreasury,
    primitives: {
      crowding: 0,
      noise: 0,
      nutrition: 50,
      cleanliness: 0,
      maintenance: 0,
      fatigue: 0,
      fun: 50,
      drive: 50
    },
    healthMetrics: {
      livingStandards: 0.5,
      productivity: 0.5,
      partytime: 0.5
    },
    metricHistory: [],
    vibes: {
      overallLevel: 0.5,
      spread: 0,
      tierName: 'Decent',
      branchLabel: null,
      isBalanced: true,
      scaleTier: 1
    },
    scoring: {
      totalScore: 0,
      weeklyTotal: 0,
      milestoneTotal: 0,
      weeklyScores: [],
      earnedMilestones: [],
      peakPopulation: state.gameConfig.startingResidents,
      peakVibes: 0,
      zeroChurnStreak: 0
    },
    coverageData: {
      tier: 0,
      tierOutputMult: 1.0,
      nutrition: { supply: 0, demand: 0, ratio: 1, label: 'Starving' },
      fun: { supply: 0, demand: 0, ratio: 1, label: 'Boring' },
      drive: { supply: 0, demand: 0, ratio: 1, label: 'Idle' },
      cleanliness: { label: 'Sparkling' },
      maintenance: { label: 'Shipshape' },
      fatigue: { label: 'Fresh' }
    },
    budgets: {
      nutrition: state.gameConfig.startingBudgets?.nutrition || 0,
      cleanliness: state.gameConfig.startingBudgets?.cleanliness || 0,
      maintenance: state.gameConfig.startingBudgets?.maintenance || 0,
      fatigue: state.gameConfig.startingBudgets?.fatigue || 0,
      fun: state.gameConfig.startingBudgets?.fun || 0,
      drive: state.gameConfig.startingBudgets?.drive || 0
    },
    activePolicies: [],
    researchedTechs: [],
    activeFixedCosts: [],
    hasResearchedThisWeek: false,
    researchingTech: null,
    policyChangesThisWeek: 0,
    policiesStableWeeks: 0,
    previousPolicies: [],
    events: [],
    nextEventId: 1,
    previousWeekSnapshot: null,
    populationMilestonesHit: []
  };
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  state.gameState.metricHistory.push({
    week: state.gameState.week,
    day: state.gameState.day,
    ls: Math.round((state.gameState.healthMetrics.livingStandards || 0) * 100),
    pr: Math.round((state.gameState.healthMetrics.productivity || 0) * 100),
    pt: Math.round((state.gameState.healthMetrics.partytime || 0) * 100)
  });
  calculateWeeklyProjection();
  generateWeekCandidates();
  addEvent('good', 'Welcome to Fort Llama. The most fun you can have while totally naked.');
}

function addEvent(type, text, priority = 'normal') {
  const gs = state.gameState;
  const nbConfig = DEFAULT_NOTICEBOARD_CONFIG;
  const event = {
    id: gs.nextEventId++,
    week: gs.week,
    day: gs.day,
    type,
    text,
    priority,
  };
  gs.events.push(event);
  while (gs.events.length > (nbConfig.maxEvents || 100)) {
    gs.events.shift();
  }
}

function generateWeekCandidates() {
  const available = getAvailableLlamas();
  const shuffled = available.sort(() => Math.random() - 0.5);
  state.gameState.weekCandidates = shuffled.slice(0, Math.min(3, shuffled.length));
}

function processTick() {
  if (state.gameState.isGameOver || state.gameState.isPausedForWeeklyDecision) return;

  const previousDay = state.gameState.day;
  state.gameState.hour += state.gameConfig.hoursPerTick;

  if (state.gameState.hour >= 24) {
    state.gameState.hour = state.gameState.hour % 24;
    state.gameState.day += 1;

    if (state.gameState.day > 7) {
      processWeekEnd();
      return;
    }

    state.gameState.dayName = DAY_NAMES[state.gameState.day - 1] || 'Monday';

    const arrivingToday = state.gameState.pendingArrivals.filter(r => r.arrivalDay === state.gameState.day);
    arrivingToday.forEach(resident => {
      const daysRemaining = 8 - state.gameState.day;
      const existingChurned = state.gameState.communeResidents.find(r => r.id === resident.id && r.churned);
      if (existingChurned) {
        existingChurned.churned = false;
        existingChurned.daysThisWeek = daysRemaining;
        existingChurned.arrivalDay = null;
      } else {
        state.gameState.communeResidents.push({
          ...resident,
          daysThisWeek: daysRemaining,
          arrivalDay: null
        });
      }
    });
    state.gameState.pendingArrivals = state.gameState.pendingArrivals.filter(r => r.arrivalDay !== state.gameState.day);
  }

  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();

  if (state.gameState.day !== previousDay || state.gameState.metricHistory.length === 0) {
    state.gameState.metricHistory.push({
      week: state.gameState.week,
      day: state.gameState.day,
      ls: Math.round((state.gameState.healthMetrics.livingStandards || 0) * 100),
      pr: Math.round((state.gameState.healthMetrics.productivity || 0) * 100),
      pt: Math.round((state.gameState.healthMetrics.partytime || 0) * 100)
    });
  }

  const ticksPerDay = 24 / state.gameConfig.hoursPerTick;
  const ticksPerWeek = ticksPerDay * 7;

  let weeklyIncome = 0;
  state.gameState.communeResidents.filter(r => !r.churned).forEach(resident => {
    const proRataRent = Math.ceil((resident.daysThisWeek / 7) * state.gameState.currentRent);
    weeklyIncome += proRataRent;
  });

  const totalBudget = Object.values(state.gameState.budgets).reduce((sum, v) => sum + v, 0);
  const totalFixedCosts = (state.gameState.activeFixedCosts || []).reduce((sum, fcId) => {
    const cfg = state.techConfig[fcId];
    return sum + (cfg?.weeklyCost || 0);
  }, 0);
  const weeklyExpenses = calculateGroundRent() + calculateUtilities() + totalBudget + totalFixedCosts;
  const tickIncome = weeklyIncome / ticksPerWeek;
  const tickExpenses = weeklyExpenses / ticksPerWeek;
  state.gameState.treasury += tickIncome - tickExpenses;

  if (state.gameState.treasury <= state.gameConfig.gameOverLimit) {
    state.gameState.isGameOver = true;
    stopSimulation();
    saveGame();
  }

  ticksSinceLastSave++;
  if (ticksSinceLastSave >= 10) {
    ticksSinceLastSave = 0;
    saveGame();
  }
}

function processWeekEnd() {
  const gs = state.gameState;
  const nbConfig = DEFAULT_NOTICEBOARD_CONFIG;

  // Snapshot health metrics and treasury BEFORE processing for deduplication
  const prevSnapshot = gs.previousWeekSnapshot;

  const churnCount = calculateWeeklyChurnCount();
  const churnedResidents = [];

  const activeResidents = gs.communeResidents.filter(r => !r.churned);
  for (let i = 0; i < churnCount && activeResidents.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * activeResidents.length);
    const churned = activeResidents.splice(randomIndex, 1)[0];
    churned.churned = true;
    churnedResidents.push(churned);
  }

  // Noticeboard: churn departures
  for (const r of churnedResidents) {
    addEvent('departure', `${r.name} has left the building.`);
  }

  const actualProfit = gs.treasury - gs.treasuryAtWeekStart;

  gs.lastWeekSummary = {
    week: gs.week,
    income: gs.projectedIncome,
    groundRent: gs.projectedGroundRent,
    utilities: gs.projectedUtilities,
    budget: gs.projectedBudget || 0,
    fixedCosts: gs.projectedFixedCosts || 0,
    totalExpenses: gs.projectedGroundRent + gs.projectedUtilities + (gs.projectedBudget || 0) + (gs.projectedFixedCosts || 0),
    profit: actualProfit,
    arrivedResidents: [],
    churnedResidents: churnedResidents.map(r => r.name)
  };

  gs.communeResidents.forEach(r => r.daysThisWeek = 7);

  if (gs.researchingTech) {
    const completedTechId = gs.researchingTech;
    gs.researchedTechs.push(completedTechId);
    gs.researchCompletedThisWeek = completedTechId;
    gs.researchingTech = null;
    calculatePrimitives();
    calculateHealthMetrics();
    calculateVibes();

    // Noticeboard: research completion
    const tech = TECH_TREE.find(t => t.id === completedTechId);
    addEvent('good', `Research complete: ${tech ? tech.name : completedTechId}.`);
  } else {
    gs.researchCompletedThisWeek = null;
  }

  // Scoring runs after tech completion so new techs count this week
  updateScoringTrackers(churnCount);
  calculateWeeklyScore();
  checkMilestones();

  // Noticeboard: health metric warnings and recoveries
  const healthNames = { livingStandards: 'Living Standards', productivity: 'Productivity', partytime: 'Leisure' };
  for (const [key, label] of Object.entries(healthNames)) {
    const val = Math.round((gs.healthMetrics[key] || 0) * 100);
    const prevVal = prevSnapshot ? prevSnapshot.health[key] : 100;

    // Critical threshold (downward crossing)
    if (val < nbConfig.healthCriticalThreshold && prevVal >= nbConfig.healthCriticalThreshold) {
      addEvent('warning', `⚠ ${label} is critical (${val}%).`, 'high');
    }
    // Low threshold (downward crossing) — only if not also crossing critical
    else if (val < nbConfig.healthWarningThreshold && prevVal >= nbConfig.healthWarningThreshold) {
      addEvent('warning', `${label} is struggling (${val}%).`);
    }

    // Recovery (upward crossing from below warning)
    if (prevSnapshot) {
      if (prevVal < nbConfig.healthWarningThreshold && val >= nbConfig.healthWarningThreshold) {
        addEvent('good', `${label} is recovering (${val}%).`);
      } else if (prevVal < nbConfig.healthCriticalThreshold && val >= nbConfig.healthCriticalThreshold && val < nbConfig.healthWarningThreshold) {
        addEvent('good', `${label} is recovering (${val}%).`);
      }
    }
  }

  // Noticeboard: treasury warnings (downward crossing)
  const treasuryVal = Math.round(gs.treasury);
  const prevTreasury = prevSnapshot ? prevSnapshot.treasury : Infinity;
  if (treasuryVal < nbConfig.treasuryCriticalThreshold && prevTreasury >= nbConfig.treasuryCriticalThreshold) {
    addEvent('warning', `⚠ The commune is nearly broke (£${treasuryVal}).`, 'high');
  } else if (treasuryVal < nbConfig.treasuryLowThreshold && prevTreasury >= nbConfig.treasuryLowThreshold) {
    addEvent('warning', `Funds are running low (£${treasuryVal}).`);
  }

  // Noticeboard: population milestones
  const activeCount = gs.communeResidents.filter(r => !r.churned).length;
  for (const milestone of nbConfig.populationMilestones) {
    if (activeCount >= milestone && !gs.populationMilestonesHit.includes(milestone)) {
      gs.populationMilestonesHit.push(milestone);
      addEvent('good', `The commune has grown to ${milestone} residents!`);
    }
  }

  // Save snapshot for next week's deduplication
  gs.previousWeekSnapshot = {
    health: {
      livingStandards: Math.round((gs.healthMetrics.livingStandards || 0) * 100),
      productivity: Math.round((gs.healthMetrics.productivity || 0) * 100),
      partytime: Math.round((gs.healthMetrics.partytime || 0) * 100),
    },
    treasury: Math.round(gs.treasury),
  };

  const prevPolicies = [...(gs.previousPolicies || [])];
  const currPolicies = [...(gs.activePolicies || [])];
  const policiesUnchanged = prevPolicies.length === currPolicies.length &&
    prevPolicies.every(p => currPolicies.includes(p));
  if (currPolicies.length >= 3 && policiesUnchanged) {
    gs.policiesStableWeeks = (gs.policiesStableWeeks || 0) + 1;
  } else if (currPolicies.length >= 3) {
    gs.policiesStableWeeks = 1;
  } else {
    gs.policiesStableWeeks = 0;
  }
  gs.previousPolicies = [...currPolicies];
  gs.policyChangesThisWeek = 0;

  gs.week += 1;
  gs.day = 1;
  gs.hour = 9;
  gs.dayName = 'Monday';
  gs.hasRecruitedThisWeek = false;
  gs.hasResearchedThisWeek = false;
  gs.buildsThisWeek = 0;
  gs.treasuryAtWeekStart = gs.treasury;
  gs.isPausedForWeeklyDecision = true;
  stopSimulation();

  calculateWeeklyProjection();
  generateWeekCandidates();
  saveGame();
}

function startSimulation() {
  if (state.simulationInterval) return;
  if (state.gameState.isPausedForWeeklyDecision) return;
  state.gameState.isRunning = true;
  state.simulationInterval = setInterval(() => {
    processTick();
  }, state.gameConfig.tickSpeed);
}

function stopSimulation() {
  if (state.simulationInterval) {
    clearInterval(state.simulationInterval);
    state.simulationInterval = null;
  }
  state.gameState.isRunning = false;
}

function dismissWeeklyPause() {
  if (!state.gameState.isPausedForWeeklyDecision) return;
  state.gameState.isPausedForWeeklyDecision = false;
  calculateWeeklyProjection();
  saveGame();
  startSimulation();
}

module.exports = {
  initializeGame,
  generateWeekCandidates,
  processTick,
  processWeekEnd,
  startSimulation,
  stopSimulation,
  dismissWeeklyPause,
  addEvent
};
