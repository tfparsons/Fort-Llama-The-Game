'use strict';

const fs = require('fs');
const express = require('express');
const router = express.Router();

const { state, SAVED_DEFAULTS_FILE } = require('./state');
const { POLICY_DEFINITIONS, TECH_TREE, DEFAULT_BUILDINGS } = require('./config');
const {
  initializeGame,
  generateWeekCandidates,
  startSimulation,
  stopSimulation,
  dismissWeeklyPause
} = require('./gameState');
const { calculatePrimitives } = require('./primitives');
const { calculateHealthMetrics } = require('./healthMetrics');
const {
  calculateTotalCapacity,
  calculateWeeklyProjection,
  calculateVibes,
  calculateRecruitmentSlots,
  calculateRentTier
} = require('./outcomes');
const { getRandomArrivalDay } = require('./residents');
const { DAY_NAMES } = require('./config');

// ---------------------------------------------------------------------------
// State & config
// ---------------------------------------------------------------------------

router.get('/api/state', (req, res) => {
  const capacity = calculateTotalCapacity();
  const residentCount = state.gameState.communeResidents.length;
  const pendingCount = state.gameState.pendingArrivals.length;
  res.json({
    ...state.gameState,
    residents: residentCount,
    pendingResidents: pendingCount,
    capacity,
    config: state.gameConfig,
    recruitmentSlots: calculateRecruitmentSlots(),
    rentTier: calculateRentTier(state.gameState.currentRent),
    rentTierThresholds: state.gameConfig.rentTierThresholds,
    primitiveConfig: state.primitiveConfig,
    healthConfig: state.healthConfig,
    vibesConfig: state.vibesConfig,
    tierConfig: state.tierConfig,
    budgetConfig: state.budgetConfig,
    policyConfig: state.policyConfig,
    policyDefinitions: POLICY_DEFINITIONS,
    techConfig: state.techConfig,
    techTree: TECH_TREE
  });
});

router.get('/api/config', (req, res) => {
  res.json(state.gameConfig);
});

router.post('/api/config', (req, res) => {
  stopSimulation();
  const newConfig = { ...state.savedDefaults, ...req.body };
  initializeGame(newConfig);
  res.json({ success: true, config: state.gameConfig, state: state.gameState });
});

router.post('/api/save-defaults', (req, res) => {
  state.savedDefaults = {
    ...state.gameConfig,
    primitives: { ...state.primitiveConfig },
    health: { ...state.healthConfig },
    vibes: { ...state.vibesConfig },
    tierConfig: { ...state.tierConfig },
    budgetConfig: JSON.parse(JSON.stringify(state.budgetConfig)),
    policyConfig: JSON.parse(JSON.stringify(state.policyConfig)),
    techConfig: JSON.parse(JSON.stringify(state.techConfig))
  };
  state.savedLlamaPool = JSON.parse(JSON.stringify(state.llamaPool));
  state.savedBuildingsConfig = state.gameState.buildings.map(b => ({ ...b }));

  try {
    const dataToSave = {
      defaults: state.savedDefaults,
      llamaPool: state.savedLlamaPool,
      buildings: state.savedBuildingsConfig
    };
    fs.writeFileSync(SAVED_DEFAULTS_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('Saved defaults to file');
  } catch (err) {
    console.error('Failed to save defaults to file:', err);
  }

  res.json({ success: true, defaults: state.savedDefaults });
});

// ---------------------------------------------------------------------------
// Primitive config
// ---------------------------------------------------------------------------

router.get('/api/primitive-config', (req, res) => {
  res.json(state.primitiveConfig);
});

router.post('/api/primitive-config', (req, res) => {
  state.primitiveConfig = { ...state.primitiveConfig, ...req.body };
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: state.primitiveConfig });
});

// ---------------------------------------------------------------------------
// Health config
// ---------------------------------------------------------------------------

router.get('/api/health-config', (req, res) => {
  res.json(state.healthConfig);
});

router.post('/api/health-config', (req, res) => {
  state.healthConfig = { ...state.healthConfig, ...req.body };
  if (req.body.livingStandards) state.healthConfig.livingStandards = { ...state.healthConfig.livingStandards, ...req.body.livingStandards };
  if (req.body.productivity) state.healthConfig.productivity = { ...state.healthConfig.productivity, ...req.body.productivity };
  if (req.body.partytime) state.healthConfig.partytime = { ...state.healthConfig.partytime, ...req.body.partytime };
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: state.healthConfig });
});

// ---------------------------------------------------------------------------
// Vibes config
// ---------------------------------------------------------------------------

router.get('/api/vibes-config', (req, res) => {
  res.json(state.vibesConfig);
});

router.post('/api/vibes-config', (req, res) => {
  state.vibesConfig = { ...state.vibesConfig, ...req.body };
  calculateVibes();
  res.json({ success: true, config: state.vibesConfig });
});

// ---------------------------------------------------------------------------
// Tier config
// ---------------------------------------------------------------------------

router.get('/api/tier-config', (req, res) => {
  res.json(state.tierConfig);
});

router.post('/api/tier-config', (req, res) => {
  state.tierConfig = { ...state.tierConfig, ...req.body };
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: state.tierConfig });
});

// ---------------------------------------------------------------------------
// Budget config
// ---------------------------------------------------------------------------

router.get('/api/budget-config', (req, res) => {
  res.json(state.budgetConfig);
});

router.post('/api/budget-config', (req, res) => {
  const updates = req.body;
  for (const key of Object.keys(state.budgetConfig)) {
    if (updates[key]) {
      state.budgetConfig[key] = { ...state.budgetConfig[key], ...updates[key] };
    }
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: state.budgetConfig });
});

// ---------------------------------------------------------------------------
// Policy config & actions
// ---------------------------------------------------------------------------

router.get('/api/policy-config', (req, res) => {
  res.json(state.policyConfig);
});

router.post('/api/policy-config', (req, res) => {
  const updates = req.body;
  if (updates.excludePercent !== undefined) {
    state.policyConfig.excludePercent = Math.max(0, Math.min(1, Number(updates.excludePercent) || 0.25));
  }
  if (updates.funPenalty) {
    state.policyConfig.funPenalty = { ...state.policyConfig.funPenalty, ...updates.funPenalty };
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: state.policyConfig });
});

router.post('/api/action/toggle-policy', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    return res.status(400).json({ error: 'Can only change policies during weekly planning' });
  }
  const { policyId } = req.body;
  const policy = POLICY_DEFINITIONS.find(p => p.id === policyId);
  if (!policy) {
    return res.status(400).json({ error: 'Unknown policy' });
  }
  if (policy.techRequired && !state.gameState.researchedTechs.includes(policy.techRequired)) {
    return res.status(400).json({ error: 'Technology not yet researched' });
  }

  const maxChanges = state.gameConfig.policyChangesPerWeek ?? 1;
  const policyLimitActive = state.gameState.policiesStableWeeks >= 1 && state.gameState.previousPolicies.length >= 3;
  if (policyLimitActive && state.gameState.policyChangesThisWeek >= maxChanges) {
    return res.status(400).json({ error: `Policy change limit reached (${maxChanges}/week)` });
  }

  const idx = state.gameState.activePolicies.indexOf(policyId);
  const action = idx >= 0 ? 'deactivated' : 'activated';
  if (idx >= 0) {
    state.gameState.activePolicies.splice(idx, 1);
  } else {
    state.gameState.activePolicies.push(policyId);
  }

  if (policyLimitActive) {
    state.gameState.policyChangesThisWeek += 1;
  }

  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, activePolicies: state.gameState.activePolicies, action, policyId });
});

// ---------------------------------------------------------------------------
// Tech config & research actions
// ---------------------------------------------------------------------------

router.get('/api/tech-config', (req, res) => {
  res.json(state.techConfig);
});

router.post('/api/tech-config', (req, res) => {
  const updates = req.body;
  for (const key of Object.keys(updates)) {
    if (state.techConfig[key]) {
      state.techConfig[key] = { ...state.techConfig[key], ...updates[key] };
    }
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  calculateWeeklyProjection();
  res.json({ success: true, config: state.techConfig });
});

router.post('/api/action/research', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    return res.status(400).json({ error: 'Can only research during weekly planning' });
  }
  if (state.gameState.hasResearchedThisWeek || state.gameState.researchingTech) {
    return res.status(400).json({ error: 'Already researching this week' });
  }
  const { techId } = req.body;
  const tech = TECH_TREE.find(t => t.id === techId);
  if (!tech) {
    return res.status(400).json({ error: 'Unknown technology' });
  }
  if (!tech.available) {
    return res.status(400).json({ error: 'Technology not yet available' });
  }
  if (state.gameState.researchedTechs.includes(techId)) {
    return res.status(400).json({ error: 'Already researched' });
  }
  if (tech.parent && !state.gameState.researchedTechs.includes(tech.parent)) {
    return res.status(400).json({ error: 'Must research prerequisite first' });
  }
  const cost = state.techConfig[techId]?.cost || 500;
  if (state.gameState.treasury < cost) {
    return res.status(400).json({ error: 'Not enough funds' });
  }

  state.gameState.treasury -= cost;
  state.gameState.researchingTech = techId;
  state.gameState.hasResearchedThisWeek = true;

  calculateWeeklyProjection();

  res.json({
    success: true,
    researching: techId,
    treasury: state.gameState.treasury
  });
});

router.post('/api/action/cancel-research', (req, res) => {
  if (!state.gameState.researchingTech) {
    return res.status(400).json({ error: 'No research in progress' });
  }
  const cost = state.techConfig[state.gameState.researchingTech]?.cost || 500;
  state.gameState.treasury += cost;
  state.gameState.researchingTech = null;
  state.gameState.hasResearchedThisWeek = false;
  calculateWeeklyProjection();
  res.json({ success: true, treasury: state.gameState.treasury });
});

router.post('/api/action/toggle-fixed-cost', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    return res.status(400).json({ error: 'Can only toggle fixed costs during weekly planning' });
  }
  const { fixedCostId } = req.body;
  if (!state.gameState.researchedTechs.includes(fixedCostId)) {
    return res.status(400).json({ error: 'Technology not yet researched' });
  }
  const tech = TECH_TREE.find(t => t.id === fixedCostId && t.type === 'fixed_expense');
  if (!tech) {
    return res.status(400).json({ error: 'Not a valid fixed cost item' });
  }
  const idx = state.gameState.activeFixedCosts.indexOf(fixedCostId);
  if (idx >= 0) {
    state.gameState.activeFixedCosts.splice(idx, 1);
  } else {
    state.gameState.activeFixedCosts.push(fixedCostId);
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  calculateWeeklyProjection();
  res.json({ success: true, activeFixedCosts: state.gameState.activeFixedCosts });
});

// ---------------------------------------------------------------------------
// Llama pool
// ---------------------------------------------------------------------------

router.get('/api/llama-pool', (req, res) => {
  res.json({ llamas: state.llamaPool });
});

router.post('/api/llama-pool', (req, res) => {
  const { llamas } = req.body;
  if (!llamas || !Array.isArray(llamas)) {
    res.status(400).json({ error: 'Invalid llama pool data' });
    return;
  }
  state.llamaPool = llamas;
  generateWeekCandidates();
  res.json({ success: true, llamas: state.llamaPool });
});

router.get('/api/llamas', (req, res) => {
  res.json({ llamas: state.llamaPool });
});

router.post('/api/llamas', (req, res) => {
  const { llamas } = req.body;
  if (!Array.isArray(llamas)) {
    res.status(400).json({ error: 'llamas must be an array' });
    return;
  }
  state.llamaPool = llamas;
  res.json({ success: true, count: state.llamaPool.length });
});

// Note: /api/llamas/add must be registered before /api/llamas/:id to avoid
// Express matching "add" as a numeric id parameter.
router.post('/api/llamas/add', (req, res) => {
  const newLlama = req.body;
  const maxId = Math.max(...state.llamaPool.map(l => l.id), 0);
  newLlama.id = maxId + 1;
  state.llamaPool.push(newLlama);
  res.json({ success: true, llama: newLlama });
});

router.post('/api/llamas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  const index = state.llamaPool.findIndex(l => l.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Llama not found' });
    return;
  }

  state.llamaPool[index] = { ...state.llamaPool[index], ...updates };
  res.json({ success: true, llama: state.llamaPool[index] });
});

router.delete('/api/llamas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = state.llamaPool.findIndex(l => l.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Llama not found' });
    return;
  }

  state.llamaPool.splice(index, 1);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

router.get('/api/buildings', (req, res) => {
  res.json(state.gameState.buildings);
});

router.post('/api/buildings', (req, res) => {
  const { buildings } = req.body;
  if (!buildings || !Array.isArray(buildings)) {
    res.status(400).json({ error: 'Invalid buildings data' });
    return;
  }
  state.gameState.buildings = buildings.map(b => ({
    ...b,
    count: b.count !== undefined ? b.count : b.atStart
  }));
  calculateWeeklyProjection();
  res.json({ success: true, buildings: state.gameState.buildings });
});

router.get('/api/buildings-config', (req, res) => {
  const config = state.savedBuildingsConfig ? [...state.savedBuildingsConfig] : JSON.parse(JSON.stringify(DEFAULT_BUILDINGS));
  if (state.savedBuildingsConfig) {
    DEFAULT_BUILDINGS.forEach(def => {
      if (!config.find(b => b.id === def.id)) {
        config.push(JSON.parse(JSON.stringify(def)));
      }
    });
  }
  res.json(config);
});

router.post('/api/buildings-config', (req, res) => {
  const { buildings } = req.body;
  if (!buildings || !Array.isArray(buildings)) {
    res.status(400).json({ error: 'Invalid buildings config' });
    return;
  }
  state.savedBuildingsConfig = buildings;
  res.json({ success: true, buildings: state.savedBuildingsConfig });
});

// ---------------------------------------------------------------------------
// Recruitment
// ---------------------------------------------------------------------------

router.get('/api/recruitment-candidates', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }

  const residentIds = state.gameState.communeResidents.map(r => r.id);
  const pendingIds = state.gameState.pendingArrivals.map(r => r.id);
  const excludeIds = new Set([...residentIds, ...pendingIds]);
  const availableCandidates = state.gameState.weekCandidates.filter(c => !excludeIds.has(c.id));

  res.json({ candidates: availableCandidates });
});

router.post('/api/action/invite', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }

  if (state.gameState.hasRecruitedThisWeek) {
    res.status(400).json({ error: 'Already recruited this week' });
    return;
  }

  const capacity = calculateTotalCapacity();
  const activeResidents = state.gameState.communeResidents.filter(r => !r.churned).length;
  const futureResidents = activeResidents + state.gameState.pendingArrivals.length + 1;

  if (futureResidents > capacity) {
    res.status(400).json({ error: 'Not enough capacity' });
    return;
  }

  const { llamaId } = req.body;
  const llama = state.llamaPool.find(l => l.id === llamaId);

  if (!llama) {
    res.status(400).json({ error: 'Llama not found' });
    return;
  }

  const inCommune = state.gameState.communeResidents.some(r => r.id === llamaId && !r.churned);
  const isPending = state.gameState.pendingArrivals.some(r => r.id === llamaId);

  if (inCommune || isPending) {
    res.status(400).json({ error: 'Llama already in commune or pending' });
    return;
  }

  const arrivalDay = getRandomArrivalDay();
  state.gameState.pendingArrivals.push({
    ...llama,
    arrivalDay,
    daysThisWeek: 0
  });
  state.gameState.hasRecruitedThisWeek = true;

  res.json({
    success: true,
    invited: llama.name,
    arrivalDay,
    arrivalDayName: DAY_NAMES[arrivalDay - 1]
  });
});

// ---------------------------------------------------------------------------
// Build actions
// ---------------------------------------------------------------------------

function handleBuildAction(req, res) {
  if (!state.gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only build during weekly planning' });
    return;
  }

  const { buildingId } = req.body;
  const building = state.gameState.buildings.find(b => b.id === buildingId);

  if (!building) {
    res.status(400).json({ error: 'Building type not found' });
    return;
  }

  if (!building.buildable || building.cost === null) {
    res.status(400).json({ error: 'This building type cannot be built' });
    return;
  }

  if (building.techRequired && !state.gameState.researchedTechs.includes(building.techRequired)) {
    res.status(400).json({ error: 'Required technology not yet researched' });
    return;
  }

  const maxBuilds = state.gameConfig.buildsPerWeek ?? 1;
  if ((state.gameState.buildsThisWeek || 0) >= maxBuilds) {
    res.status(400).json({ error: `Build limit reached (${maxBuilds} per week)` });
    return;
  }

  if (state.gameState.treasury < building.cost) {
    res.status(400).json({ error: 'Not enough funds' });
    return;
  }

  state.gameState.treasury -= building.cost;
  building.count += 1;
  state.gameState.buildsThisWeek = (state.gameState.buildsThisWeek || 0) + 1;
  calculateWeeklyProjection();
  res.json({
    success: true,
    building: building.name,
    count: building.count,
    treasury: state.gameState.treasury,
    capacity: calculateTotalCapacity()
  });
}

router.post('/api/action/build', handleBuildAction);

router.post('/api/action/build-bedroom', (req, res) => {
  req.body = { buildingId: 'bedroom' };
  handleBuildAction(req, res);
});

// ---------------------------------------------------------------------------
// Player actions: rent, budget
// ---------------------------------------------------------------------------

router.post('/api/action/set-rent', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only change rent during weekly planning' });
    return;
  }
  const { rent } = req.body;
  if (rent >= state.gameConfig.rentMin && rent <= state.gameConfig.rentMax) {
    state.gameState.currentRent = rent;
    calculateWeeklyProjection();
    res.json({ success: true, currentRent: state.gameState.currentRent });
  } else {
    res.status(400).json({ error: `Rent must be between £${state.gameConfig.rentMin} and £${state.gameConfig.rentMax}` });
  }
});

router.post('/api/action/set-budget', (req, res) => {
  if (!state.gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only set budgets during weekly planning' });
    return;
  }
  const { budgets } = req.body;
  if (budgets && typeof budgets === 'object') {
    for (const key of Object.keys(state.gameState.budgets)) {
      if (budgets[key] !== undefined) {
        state.gameState.budgets[key] = Math.max(0, Number(budgets[key]) || 0);
      }
    }
    calculateWeeklyProjection();
    res.json({ success: true, budgets: state.gameState.budgets });
  } else {
    res.status(400).json({ error: 'Invalid budget data' });
  }
});

// ---------------------------------------------------------------------------
// Simulation control
// ---------------------------------------------------------------------------

router.post('/api/reset', (req, res) => {
  stopSimulation();
  initializeGame(state.savedDefaults);
  res.json({ success: true, state: state.gameState });
});

router.post('/api/start', (req, res) => {
  if (state.gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Dismiss weekly decision modal first' });
    return;
  }
  startSimulation();
  res.json({ success: true, isRunning: true });
});

router.post('/api/pause', (req, res) => {
  stopSimulation();
  res.json({ success: true, isRunning: false });
});

router.post('/api/dismiss-weekly', (req, res) => {
  dismissWeeklyPause();
  res.json({ success: true, isRunning: state.gameState.isRunning, isPausedForWeeklyDecision: false });
});

module.exports = router;
