'use strict';

const { state } = require('./state');
const { dampener, baseline } = require('./utils');

function getTierFromPop(pop) {
  const brackets = state.healthConfig.tierBrackets || [6, 12, 20, 50, 100];
  for (let i = 0; i < brackets.length; i++) {
    if (pop <= brackets[i]) return i;
  }
  return brackets.length;
}

function calculateMetricScore(rawValue, metricConfig, pop) {
  const pop0 = Math.max(1, state.healthConfig.pop0 || 2);
  const globalScaling = state.healthConfig.globalScaling || { ref0: 0.5, alpha: 0.15, p: 2 };
  const useCustom = metricConfig.useCustomScaling === true;
  const ref0 = Math.max(0.01, useCustom ? (metricConfig.ref0 || 0.5) : (globalScaling.ref0 || 0.5));
  const alpha = useCustom ? (metricConfig.alpha || 0.15) : (globalScaling.alpha || 0.15);
  const p = Math.max(0.1, useCustom ? (metricConfig.p || 2) : (globalScaling.p || 2));
  const tierMult = metricConfig.tierMult || [1.0, 1.1, 1.2, 1.35, 1.5, 1.7];
  const brackets = state.healthConfig.tierBrackets || [6, 12, 20, 50, 100];

  const tier = getTierFromPop(pop);
  const safeTierIndex = Math.min(tier, tierMult.length - 1, brackets.length);
  const tierMultiplier = tierMult[safeTierIndex] || 1.0;

  const mRef = Math.max(0.001, ref0 * Math.pow(pop / pop0, alpha) * tierMultiplier);
  const x = rawValue / mRef;

  const xp = Math.pow(x, p);
  const score = 100 * xp / (1 + xp);

  return Math.max(0, Math.min(100, score));
}

function calculateHealthMetrics() {
  const p = state.gameState.primitives;
  const ls = state.healthConfig.livingStandards;
  const pr = state.healthConfig.productivity;
  const pt = state.healthConfig.partytime;
  const pop = state.gameState.communeResidents.filter(r => !r.churned).length || 1;

  const lsRaw = Math.max(0.001,
    baseline(p.nutrition, ls.nutritionWeight) *
    dampener(p.cleanliness, ls.cleanlinessDampen) *
    dampener(p.crowding, ls.crowdingDampen) *
    dampener(p.maintenance, ls.maintenanceDampen)
  );

  const prPreFatigue = Math.max(0.001,
    baseline(p.drive, pr.driveWeight) *
    dampener(p.noise, pr.noiseWeight) *
    dampener(p.crowding, pr.crowdingWeight)
  );

  const ptPreFatigue = Math.max(0.001,
    baseline(p.fun, pt.funWeight)
  );

  const prShare = prPreFatigue / (prPreFatigue + ptPreFatigue);
  const ptShare = 1 - prShare;
  const baseFatigueWeight = state.healthConfig.baseFatigueWeight ?? 0.5;
  const fatigueWeightSwing = state.healthConfig.fatigueWeightSwing ?? 0.5;
  const fatigueWeightPR = baseFatigueWeight + (prShare - 0.5) * fatigueWeightSwing;
  const fatigueWeightPT = baseFatigueWeight + (ptShare - 0.5) * fatigueWeightSwing;

  const prRaw = Math.max(0.001, prPreFatigue * dampener(p.fatigue, fatigueWeightPR));
  const ptRaw = Math.max(0.001, ptPreFatigue * dampener(p.fatigue, fatigueWeightPT));

  const livingStandards = calculateMetricScore(lsRaw, ls, pop) / 100;
  const productivity = calculateMetricScore(prRaw, pr, pop) / 100;
  const partytime = calculateMetricScore(ptRaw, pt, pop) / 100;

  state.gameState.healthMetrics = { livingStandards, productivity, partytime };
  state.gameState.healthMetricsRaw = { livingStandards: lsRaw, productivity: prRaw, partytime: ptRaw };
}

module.exports = {
  getTierFromPop,
  calculateMetricScore,
  calculateHealthMetrics
};
