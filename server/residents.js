'use strict';

const { state } = require('./state');
const { statTo01 } = require('./utils');
const { POLICY_DEFINITIONS } = require('./config');

function getAverageResidentStat(statKey) {
  const residents = state.gameState.communeResidents.filter(r => !r.churned);
  if (residents.length === 0) return 10;
  const sum = residents.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
  return sum / residents.length;
}

function getPolicyAdjustedAvgStat(statKey) {
  const residents = state.gameState.communeResidents.filter(r => !r.churned);
  if (residents.length === 0) return 10;
  const policy = POLICY_DEFINITIONS.find(p => p.stat === statKey && state.gameState.activePolicies.includes(p.id));
  if (!policy) {
    const sum = residents.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
    return sum / residents.length;
  }
  const excludePct = state.policyConfig.excludePercent || 0.25;
  const sorted = [...residents].sort((a, b) => (a.stats[statKey] || 10) - (b.stats[statKey] || 10));
  const excludeCount = Math.floor(sorted.length * excludePct);
  if (excludeCount <= 0 || sorted.length <= excludeCount) {
    const sum = residents.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
    return sum / residents.length;
  }
  const included = sorted.slice(excludeCount);
  const sum = included.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
  return sum / included.length;
}

function getAvailableLlamas() {
  const activeResidentIds = state.gameState.communeResidents.filter(r => !r.churned).map(r => r.id);
  const pendingIds = state.gameState.pendingArrivals.map(r => r.id);
  return state.llamaPool.filter(l => !activeResidentIds.includes(l.id) && !pendingIds.includes(l.id));
}

function getRandomArrivalDay() {
  const days = [2, 3, 4, 5, 6, 7];
  return days[Math.floor(Math.random() * days.length)];
}

module.exports = {
  getAverageResidentStat,
  getPolicyAdjustedAvgStat,
  getAvailableLlamas,
  getRandomArrivalDay
};
