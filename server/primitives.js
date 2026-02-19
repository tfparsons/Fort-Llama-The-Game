'use strict';

const { state } = require('./state');
const { statTo01, log2CoverageScore, getCoverageTierLabel } = require('./utils');
const { getAverageResidentStat, getPolicyAdjustedAvgStat } = require('./residents');

function getPopulationTier(pop) {
  const brackets = state.tierConfig.brackets || [6, 12, 20, 50, 100];
  for (let i = 0; i < brackets.length; i++) {
    if (pop <= brackets[i]) return i;
  }
  return brackets.length;
}

function getTierOutputMult(tier) {
  const mults = state.tierConfig.outputMults || [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
  return mults[Math.min(tier, mults.length - 1)];
}


function getBuildingCapacity(buildingId) {
  const b = state.gameState.buildings.find(bld => bld.id === buildingId);
  return b ? b.count * b.capacity : 1;
}

function getBuildingQuality(buildingId) {
  const b = state.gameState.buildings.find(bld => bld.id === buildingId);
  return b ? (b.quality || 1) : 1;
}

function getBuildingMult(buildingId, multKey) {
  const b = state.gameState.buildings.find(bld => bld.id === buildingId);
  return b && b[multKey] !== undefined ? b[multKey] : 1;
}

function overcrowdingPenalty(ratio, primitiveName = null) {
  let k = state.primitiveConfig.penaltyK;
  let p = state.primitiveConfig.penaltyP;
  let onset = state.primitiveConfig.penaltyOnset ?? 0.75;
  if (primitiveName && state.primitiveConfig[primitiveName]?.useCustomPenalty) {
    k = state.primitiveConfig[primitiveName].penaltyK ?? k;
    p = state.primitiveConfig[primitiveName].penaltyP ?? p;
  }
  const over = Math.max(0, ratio - onset);
  return 1 + k * Math.pow(over, p);
}

function calculatePrimitives() {
  const N = state.gameState.communeResidents.length;
  if (N === 0) {
    state.gameState.primitives = { crowding: 0, noise: 0, nutrition: 50, cleanliness: 0, maintenance: 0, fatigue: 0, fun: 50, drive: 50 };
    return;
  }

  const ticksPerDay = 24 / state.gameConfig.hoursPerTick;
  const ticksPerWeek = ticksPerDay * 7;

  const capBed = getBuildingCapacity('bedroom');
  const capBath = getBuildingCapacity('bathroom');
  const capKitch = getBuildingCapacity('kitchen');
  const capLiv = getBuildingCapacity('living_room');
  const capUtil = getBuildingCapacity('utility_closet');

  let effectiveCapLiv = capLiv;
  let effectiveLivQuality = getBuildingQuality('living_room');
  if (state.gameState.researchedTechs.includes('great_hall')) {
    const ghBuilding = state.gameState.buildings.find(b => b.id === 'great_hall');
    if (ghBuilding) {
      effectiveCapLiv = ghBuilding.capacity || capLiv;
      effectiveLivQuality = ghBuilding.quality || effectiveLivQuality;
    }
  }

  const shareTol = statTo01(getAverageResidentStat('sharingTolerance'));
  const cookSkill = statTo01(getPolicyAdjustedAvgStat('cookingSkill'));
  const tidiness = statTo01(getPolicyAdjustedAvgStat('tidiness'));
  const handiness = statTo01(getAverageResidentStat('handiness'));
  const consideration = statTo01(getAverageResidentStat('consideration'));
  const sociability = statTo01(getAverageResidentStat('sociability'));
  const partyStamina = statTo01(getAverageResidentStat('partyStamina'));
  const workEthic = statTo01(getAverageResidentStat('workEthic'));

  const kQ = getBuildingQuality('kitchen');
  const lQ = getBuildingQuality('living_room');
  const bQ = getBuildingQuality('bedroom');
  const bathQ = getBuildingQuality('bathroom');
  const uQ = getBuildingQuality('utility_closet');

  const effectiveN = N * (1 - 0.3 * shareTol);
  const rBed = effectiveN / capBed;
  const rBath = effectiveN / capBath;
  const rKitch = effectiveN / capKitch;
  const rLiv = effectiveN / effectiveCapLiv;
  const maxRatio = Math.max(rBed, rBath, rKitch, rLiv);
  const crowdBaseMult = state.primitiveConfig.crowding?.baseMult ?? 50;
  const crowding = Math.min(100, maxRatio * crowdBaseMult * overcrowdingPenalty(maxRatio, 'crowding'));

  const cfg = state.primitiveConfig.noise;
  const socialNoise = N * cfg.baseSocial * (1 + cfg.socioMult * sociability) * (1 - cfg.considMult * consideration);
  const ambientNoise = cfg.baseAmbient * overcrowdingPenalty(N / effectiveCapLiv, 'noise');
  const noise = Math.min(100, (socialNoise + ambientNoise) * (1 / effectiveLivQuality));

  const tier = getPopulationTier(N);
  const tierOutputMult = getTierOutputMult(tier);

  const nCfg = state.primitiveConfig.nutrition;
  const nutritionServed = Math.min(N, capKitch);
  const nutritionSupply = nutritionServed * nCfg.outputRate * tierOutputMult * kQ * getBuildingMult('kitchen', 'foodMult') * (1 + nCfg.skillMult * cookSkill);
  let nutritionEfficiency = state.budgetConfig.nutrition.supplyPerPound || 0;
  if (state.gameState.activePolicies.includes('ocado')) {
    const ocadoBoost = (state.techConfig.ocado?.effectPercent || 15) / 100;
    nutritionEfficiency *= (1 + ocadoBoost);
  }
  const nutritionBudgetBoost = (state.gameState.budgets.nutrition || 0) * nutritionEfficiency;
  const totalNutritionSupply = nutritionSupply + nutritionBudgetBoost;
  const nutritionDemand = N * nCfg.consumptionRate;
  const nutritionRatio = nutritionDemand > 0 ? totalNutritionSupply / nutritionDemand : 1;
  const nutrition = log2CoverageScore(nutritionRatio);

  const recoveryDamping = state.primitiveConfig.recoveryDamping ?? 1.0;

  const cCfg = state.primitiveConfig.cleanliness;
  const messIn = cCfg.messPerResident * N * overcrowdingPenalty(N / capBath, 'cleanliness');
  const cleanBudgetBoost = 1 + (state.gameState.budgets.cleanliness || 0) * (state.budgetConfig.cleanliness.outflowBoostPerPound || 0);
  let cleanOut = cCfg.cleanBase * bathQ * getBuildingMult('bathroom', 'cleanMult') * (1 + cCfg.skillMult * tidiness) * cleanBudgetBoost;
  if (state.gameState.activeFixedCosts.includes('cleaner')) {
    const cleanerBoost = (state.techConfig.cleaner?.effectPercent || 20) / 100;
    cleanOut *= (1 + cleanerBoost);
  }
  const netMess = messIn - cleanOut;
  const dampedMess = netMess < 0 ? netMess * recoveryDamping : netMess;
  const oldClean = state.gameState.primitives.cleanliness || 0;
  const cleanliness = Math.min(100, Math.max(0, oldClean + dampedMess * 0.5));

  const mCfg = state.primitiveConfig.maintenance;
  const wearIn = mCfg.wearPerResident * N * overcrowdingPenalty(N / capUtil, 'maintenance');
  const maintBudgetBoost = 1 + (state.gameState.budgets.maintenance || 0) * (state.budgetConfig.maintenance.outflowBoostPerPound || 0);
  let repairOut = mCfg.repairBase * uQ * getBuildingMult('utility_closet', 'repairMult') * (1 + mCfg.handinessCoeff * handiness + mCfg.tidinessCoeff * tidiness) * maintBudgetBoost;
  const netWear = wearIn - repairOut;
  const dampedWear = netWear < 0 ? netWear * recoveryDamping : netWear;
  const oldMaint = state.gameState.primitives.maintenance || 0;
  const maintenance = Math.min(100, Math.max(0, oldMaint + dampedWear * 0.5));

  const fCfg = state.primitiveConfig.fatigue;
  const exertion = fCfg.exertBase * (1 + fCfg.workMult * workEthic + fCfg.socioMult * sociability);
  const fatigueBudgetBoost = 1 + (state.gameState.budgets.fatigue || 0) * (state.budgetConfig.fatigue.outflowBoostPerPound || 0);
  const recoveryOCDamp = 1 / overcrowdingPenalty(rBed, 'fatigue');
  const recovery = fCfg.recoverBase * (1 + 0.3 * partyStamina) * getBuildingMult('bedroom', 'recoveryMult') * bQ * fatigueBudgetBoost * recoveryOCDamp;
  const netFatigue = exertion - recovery;
  const dampedFatigue = netFatigue < 0 ? netFatigue * recoveryDamping : netFatigue;
  const oldFatigue = state.gameState.primitives.fatigue || 0;
  const fatigue = Math.min(100, Math.max(0, oldFatigue + dampedFatigue));

  const fpCfg = state.policyConfig.funPenalty;
  const activePoliciesCount = state.gameState.activePolicies.length;
  const policyMult = activePoliciesCount > fpCfg.threshold
    ? Math.max(0, 1 - fpCfg.K * Math.pow(activePoliciesCount - fpCfg.threshold, fpCfg.P))
    : 1;

  const funCfg = state.primitiveConfig.fun;
  const funServed = Math.min(N, effectiveCapLiv);
  let funSupply = funServed * funCfg.outputRate * tierOutputMult * effectiveLivQuality * getBuildingMult('living_room', 'funMult') * (1 + funCfg.skillMult * ((sociability + partyStamina) / 2)) * policyMult * (1 - (funCfg.considerationPenalty ?? 0.05) * consideration);
  const heavenBuilding = state.gameState.buildings.find(b => b.id === 'heaven');
  if (heavenBuilding && heavenBuilding.count > 0) {
    funSupply += heavenBuilding.count * (heavenBuilding.funOutput || 3) * Math.min(N, heavenBuilding.count * heavenBuilding.capacity);
  }
  const hotTubBuilding = state.gameState.buildings.find(b => b.id === 'hot_tub');
  if (hotTubBuilding && hotTubBuilding.count > 0) {
    funSupply += hotTubBuilding.count * (hotTubBuilding.funOutput || 2) * Math.min(N, hotTubBuilding.count * hotTubBuilding.capacity);
  }
  const funEfficiency = state.budgetConfig.fun.supplyPerPound || 0;
  const funBudgetBoost = (state.gameState.budgets.fun || 0) * funEfficiency;
  const totalFunWithBuildings = funSupply + funBudgetBoost;
  const funDemand = N * funCfg.consumptionRate;
  const funRatio = funDemand > 0 ? totalFunWithBuildings / funDemand : 1;
  const fun = log2CoverageScore(funRatio);

  const dCfg = state.primitiveConfig.drive;
  const driveServed = Math.min(N, effectiveCapLiv);
  let driveSupply = driveServed * dCfg.outputRate * tierOutputMult * effectiveLivQuality * (1 + dCfg.skillMult * workEthic);
  if (state.gameState.researchedTechs.includes('starlink')) {
    const starlinkBoost = (state.techConfig.starlink?.effectPercent || 15) / 100;
    driveSupply *= (1 + starlinkBoost);
  }
  const driveEfficiency = state.budgetConfig.drive.supplyPerPound || 0;
  const driveBudgetBoost = (state.gameState.budgets.drive || 0) * driveEfficiency;
  const totalDriveSupply = driveSupply + driveBudgetBoost;
  const driveDemand = N * dCfg.slackRate;
  const driveRatio = driveDemand > 0 ? totalDriveSupply / driveDemand : 1;
  const drive = log2CoverageScore(driveRatio);

  state.gameState.primitives = { crowding, noise, nutrition, cleanliness, maintenance, fatigue, fun, drive };

  state.gameState.coverageData = {
    tier,
    tierOutputMult,
    nutrition: { supply: totalNutritionSupply, demand: nutritionDemand, ratio: nutritionRatio, label: getCoverageTierLabel(nutrition), budgetBoost: nutritionBudgetBoost },
    fun: { supply: totalFunWithBuildings, demand: funDemand, ratio: funRatio, label: getCoverageTierLabel(fun), budgetBoost: funBudgetBoost },
    drive: { supply: totalDriveSupply, demand: driveDemand, ratio: driveRatio, label: getCoverageTierLabel(drive), budgetBoost: driveBudgetBoost }
  };
}

module.exports = {
  getPopulationTier,
  getTierOutputMult,
  getBuildingCapacity,
  getBuildingQuality,
  getBuildingMult,
  overcrowdingPenalty,
  calculatePrimitives
};
