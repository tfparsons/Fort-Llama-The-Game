'use strict';

const { state } = require('./state');
const { getPopulationTier } = require('./primitives');

function calculateTotalCapacity() {
  const bedroomBuilding = state.gameState.buildings.find(b => b.id === 'bedroom');
  return bedroomBuilding ? bedroomBuilding.count * bedroomBuilding.capacity : 0;
}

function calculateGroundRent() {
  let multiplier = 0;
  state.gameState.buildings.forEach(b => {
    if (b.groundRentMultiplier !== null) {
      const extraCount = Math.max(0, b.count - b.atStart);
      multiplier += extraCount * b.groundRentMultiplier;
    }
  });
  return Math.round(state.gameConfig.groundRentBase * (1 + multiplier));
}

function calculateUtilities() {
  let multiplier = 0;
  state.gameState.buildings.forEach(b => {
    if (b.utilitiesMultiplier !== null) {
      const extraCount = Math.max(0, b.count - b.atStart);
      multiplier += extraCount * b.utilitiesMultiplier;
    }
  });
  return Math.round(state.gameConfig.utilitiesBase * (1 + multiplier));
}

function calculateWeeklyChurnCount() {
  const pr = state.gameState.healthMetrics.productivity * 100;
  const baseline = state.healthConfig.churnBaselinePR || 35;
  const scale = state.healthConfig.churnScalePerPoint || 0.01;

  const ls = state.gameState.healthMetrics.livingStandards * 100;
  const rentCurve = state.healthConfig.livingStandards.rentCurve;
  const rentToleranceMult = 1 + rentCurve * (50 - ls) / 50;
  const rentFactor = state.gameState.currentRent * state.gameConfig.churnRentMultiplier * rentToleranceMult;
  // PR above baseline reduces churn, below baseline increases it
  const prModifier = (baseline - pr) * scale;
  const totalChurnRate = Math.min(1, Math.max(0, state.gameConfig.baseChurnRate + rentFactor + prModifier));

  const activeResidents = state.gameState.communeResidents.filter(r => !r.churned);
  const residentCount = activeResidents.length;
  const residentsLeaving = Math.floor(residentCount * totalChurnRate);
  return Math.min(residentsLeaving, residentCount);
}

function calculateWeeklyProjection() {
  const residentCount = state.gameState.communeResidents.length;
  const income = residentCount * state.gameState.currentRent;
  const groundRent = calculateGroundRent();
  const utilities = calculateUtilities();
  const totalBudget = Object.values(state.gameState.budgets).reduce((sum, v) => sum + v, 0);
  let totalFixedCosts = 0;
  (state.gameState.activeFixedCosts || []).forEach(fcId => {
    const cfg = state.techConfig[fcId];
    if (cfg && cfg.weeklyCost) {
      totalFixedCosts += cfg.weeklyCost;
    }
  });
  const weeklyDelta = income - groundRent - utilities - totalBudget - totalFixedCosts;
  state.gameState.weeklyDelta = weeklyDelta;
  state.gameState.dailyDelta = weeklyDelta / 7;
  state.gameState.projectedIncome = income;
  state.gameState.projectedGroundRent = groundRent;
  state.gameState.projectedUtilities = utilities;
  state.gameState.projectedBudget = totalBudget;
  state.gameState.projectedFixedCosts = totalFixedCosts;
}

function calculateVibes() {
  const hm = state.gameState.healthMetrics;
  const N = state.gameState.communeResidents.length;
  const cfg = state.vibesConfig;

  const ls = hm.livingStandards;
  const pr = hm.productivity;
  const pt = hm.partytime;

  const overallLevel = Math.pow(ls * pr * pt, 1 / 3);
  const sorted = [ls, pr, pt].sort((a, b) => a - b);
  const spread = sorted[2] - sorted[0];
  const median = sorted[1];

  const isBalanced = spread <= cfg.balancedThreshold;
  const isStrongImbalance = spread > cfg.strongImbalanceThreshold;

  let baseTierIndex = 0;
  for (let i = 0; i < cfg.tierThresholds.length; i++) {
    if (overallLevel >= cfg.tierThresholds[i].min && overallLevel < cfg.tierThresholds[i].max) {
      baseTierIndex = i;
      break;
    }
  }
  if (overallLevel >= cfg.tierThresholds[cfg.tierThresholds.length - 1].min) {
    baseTierIndex = cfg.tierThresholds.length - 1;
  }

  let scaleTier = 1;
  for (const s of cfg.scaleBreakpoints) {
    if (N >= s.min && N <= s.max) {
      scaleTier = cfg.scaleBreakpoints.indexOf(s) + 1;
      baseTierIndex = Math.max(s.tierMin, Math.min(s.tierMax, baseTierIndex));
      break;
    }
  }

  const tierName = cfg.tierThresholds[baseTierIndex].name;

  const vibesScore = overallLevel * 100;
  const popTier = getPopulationTier(N);
  const fameThresholds = [
    { min: 0, max: 20, name: 'Obscure', minTier: 0 },
    { min: 20, max: 40, name: 'Reputable', minTier: 1 },
    { min: 40, max: 60, name: 'Aspirational', minTier: 2 },
    { min: 60, max: 80, name: 'Famous', minTier: 3 },
    { min: 80, max: 101, name: 'Mythical', minTier: 4 }
  ];
  let reputation = 'Obscure';
  for (const f of fameThresholds) {
    if (vibesScore >= f.min && popTier >= f.minTier) {
      reputation = f.name;
    }
  }

  let branchLabel = null;
  if (!isBalanced) {
    const highDelta = sorted[2] - median;
    const lowDelta = median - sorted[0];
    const isHighDriver = highDelta >= lowDelta;

    let driverMetric;
    let branchKey;
    if (isHighDriver) {
      if (sorted[2] === pt) { driverMetric = 'Partytime'; branchKey = 'highPartytime'; }
      else if (sorted[2] === pr) { driverMetric = 'Productivity'; branchKey = 'highProductivity'; }
      else { driverMetric = 'LivingStandards'; branchKey = 'highLivingStandards'; }
    } else {
      if (sorted[0] === ls) { driverMetric = 'LivingStandards'; branchKey = 'lowLivingStandards'; }
      else if (sorted[0] === pr) { driverMetric = 'Productivity'; branchKey = 'lowProductivity'; }
      else { driverMetric = 'Partytime'; branchKey = 'lowPartytime'; }
    }

    const severity = isStrongImbalance ? 'strong' : 'mild';
    branchLabel = cfg.branchLabels[branchKey]?.[severity] || null;
  }

  state.gameState.vibes = { overallLevel, spread, tierName, branchLabel, isBalanced, scaleTier, reputation };
}

function calculateRecruitmentSlots() {
  const pt = state.gameState.healthMetrics.partytime * 100;
  const baseline = state.healthConfig.recruitBaselinePT || 35;
  const scale = state.healthConfig.recruitScalePerSlot || 15;
  const extraSlots = Math.max(0, Math.floor((pt - baseline) / scale));
  return state.healthConfig.baseRecruitSlots + extraSlots;
}

function calculateRentTier(rent) {
  const ls = Math.max(0, Math.min(1, state.gameState.healthMetrics?.livingStandards || 0.5));
  const rentMin = state.gameConfig.rentMin || 50;
  const rentMax = state.gameConfig.rentMax || 500;
  const rentTierCurvature = Math.max(0.1, state.healthConfig.livingStandards?.rentTierCurvature ?? 2);

  const curvedLS = Math.pow(ls, 1 / rentTierCurvature);
  const maxTolerantRent = rentMin + (rentMax - rentMin) * curvedLS;

  const tierRatio = rent / maxTolerantRent;

  if (tierRatio <= 0.3) return 'Bargain';
  if (tierRatio <= 0.5) return 'Cheap';
  if (tierRatio <= 0.7) return 'Fair';
  if (tierRatio <= 0.9) return 'Pricey';
  return 'Extortionate';
}

module.exports = {
  calculateTotalCapacity,
  calculateGroundRent,
  calculateUtilities,
  calculateWeeklyChurnCount,
  calculateWeeklyProjection,
  calculateVibes,
  calculateRecruitmentSlots,
  calculateRentTier
};
