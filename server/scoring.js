'use strict';

const { state } = require('./state');
const { MILESTONE_DEFINITIONS } = require('./config');

function getPopScale(n) {
  const brackets = state.scoreConfig.weeklyFormula.popScaleBrackets;
  for (const b of brackets) {
    if (n <= b.maxN) return b.mult;
  }
  return brackets[brackets.length - 1].mult;
}

function calculateHarmony() {
  const hm = state.gameState.healthMetrics;
  const ls = hm.livingStandards;
  const pr = hm.productivity;
  const pt = hm.partytime;
  const maxVal = Math.max(ls, pr, pt);
  const minVal = Math.min(ls, pr, pt);
  if (maxVal === 0) return state.scoreConfig.weeklyFormula.harmonyFloor;
  const cfg = state.scoreConfig.weeklyFormula;
  return cfg.harmonyFloor + cfg.harmonyWeight * (minVal / maxVal);
}

function calculateWeeklyScore() {
  const scoring = state.gameState.scoring;
  const vibesScore = (state.gameState.vibes.overallLevel || 0) * 100;
  const N = state.gameState.communeResidents.filter(r => !r.churned).length;
  const popScale = getPopScale(N);
  const harmony = calculateHarmony();
  const scale = state.scoreConfig.weeklyFormula.scale;
  const points = Math.floor(vibesScore * popScale * harmony * scale);

  scoring.weeklyScores.push({
    week: state.gameState.week,
    points,
    vibes: Math.round(vibesScore * 10) / 10,
    popScale,
    harmony: Math.round(harmony * 1000) / 1000,
    population: N
  });
  scoring.weeklyTotal += points;
  scoring.totalScore = scoring.weeklyTotal + scoring.milestoneTotal;
}

function checkCondition(condition, gs) {
  switch (condition.type) {
    case 'population':
      return gs.communeResidents.filter(r => !r.churned).length >= condition.min;
    case 'vibes':
      return (gs.vibes.overallLevel * 100) >= condition.min;
    case 'tech':
      return gs.researchedTechs.includes(condition.techId);
    case 'treasury':
      return gs.treasury >= condition.min;
    case 'weeklyDelta':
      return gs.weeklyDelta >= condition.min;
    case 'branch':
      return gs.vibes.branchLabel === condition.label;
    case 'reputation':
      return gs.vibes.reputation === condition.name;
    case 'week':
      return gs.week >= condition.min;
    case 'building': {
      if (condition.any) {
        return gs.buildings.some(b => b.count > (b.atStart || 0));
      }
      return gs.buildings.some(b => b.id === condition.id && b.count > 0);
    }
    case 'zeroChurnStreak':
      return gs.scoring.zeroChurnStreak >= condition.min;
    default:
      return false;
  }
}

function checkMilestones() {
  const gs = state.gameState;
  const scoring = gs.scoring;
  const earnedIds = new Set(scoring.earnedMilestones.map(m => m.id));
  const newlyEarned = [];

  for (const def of MILESTONE_DEFINITIONS) {
    if (earnedIds.has(def.id)) continue;
    if (checkCondition(def.condition, gs)) {
      const earned = {
        id: def.id,
        category: def.category,
        badgeName: def.badgeName,
        points: def.points,
        flavour: def.flavour,
        week: gs.week
      };
      scoring.earnedMilestones.push(earned);
      scoring.milestoneTotal += def.points;
      newlyEarned.push(earned);
    }
  }

  scoring.totalScore = scoring.weeklyTotal + scoring.milestoneTotal;
  return newlyEarned;
}

function updateScoringTrackers(churnCount) {
  const gs = state.gameState;
  const scoring = gs.scoring;
  const N = gs.communeResidents.filter(r => !r.churned).length;

  if (churnCount === 0) {
    scoring.zeroChurnStreak += 1;
  } else {
    scoring.zeroChurnStreak = 0;
  }

  scoring.peakPopulation = Math.max(scoring.peakPopulation, N);
  scoring.peakVibes = Math.max(scoring.peakVibes, Math.round((gs.vibes.overallLevel || 0) * 100));
}

module.exports = {
  getPopScale,
  calculateHarmony,
  calculateWeeklyScore,
  checkMilestones,
  updateScoringTrackers
};
