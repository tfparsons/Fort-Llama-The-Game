'use strict';

const { state } = require('./state');
const { statTo01, log2CoverageScore, getPrimitiveTierLabel, budgetEffectiveness } = require('./utils');
const { DEFAULT_PRIMITIVE_LABELS } = require('./config');
const { getAverageResidentStat, getPolicyAdjustedAvgStat } = require('./residents');

// Neutral point: statTo01(10) = 9/19. All stat multipliers are centred here so that
// a group of average residents (stat=10) has zero effect on any primitive.
// Above-average groups get a bonus; below-average groups get a genuine penalty.
const STAT_NEUTRAL = 9 / 19;

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

  const effectiveN = N * (1 - (state.primitiveConfig.crowding?.shareTolCoeff ?? 0.4) * (shareTol - STAT_NEUTRAL));
  const rBed = effectiveN / capBed;
  const rBath = effectiveN / capBath;
  const rKitch = effectiveN / capKitch;
  const rLiv = effectiveN / effectiveCapLiv;
  const maxRatio = Math.max(rBed, rBath, rKitch, rLiv);
  const crowdBaseMult = state.primitiveConfig.crowding?.baseMult ?? 50;
  const crowding = Math.min(100, maxRatio * crowdBaseMult * overcrowdingPenalty(maxRatio, 'crowding'));

  const cfg = state.primitiveConfig.noise;
  const socialNoise = N * cfg.baseSocial * (1 + cfg.socioMult * (sociability - STAT_NEUTRAL)) * (1 - cfg.considMult * (consideration - STAT_NEUTRAL));
  const ambientNoise = cfg.baseAmbient * overcrowdingPenalty(N / effectiveCapLiv, 'noise');
  const noise = Math.min(100, (socialNoise + ambientNoise) * (1 / effectiveLivQuality));

  const tier = getPopulationTier(N);
  const tierOutputMult = getTierOutputMult(tier);

  const sharedCurve = state.budgetConfig.curve || { basePerCapita: 2.0, scaleExp: 0.7, floor: 0.5, ceiling: 1.5 };
  const catCurve = (cat) => {
    const catBPC = state.budgetConfig[cat]?.basePerCapita;
    return catBPC != null ? { ...sharedCurve, basePerCapita: catBPC } : sharedCurve;
  };

  const nCfg = state.primitiveConfig.nutrition;
  const nutritionServed = Math.min(N, capKitch);
  const nutrBudgetMult = budgetEffectiveness(state.gameState.budgets.nutrition || 0, N, catCurve('nutrition'));
  let nutritionSupply = nutritionServed * nCfg.outputRate * tierOutputMult * kQ * getBuildingMult('kitchen', 'foodMult') * (1 + nCfg.skillMult * (cookSkill - STAT_NEUTRAL)) * nutrBudgetMult;
  if (state.gameState.activePolicies.includes('ocado')) {
    const ocadoBoost = (state.techConfig.ocado?.effectPercent || 15) / 100;
    nutritionSupply *= (1 + ocadoBoost);
  }
  const totalNutritionSupply = nutritionSupply;
  const nutritionDemand = N * nCfg.consumptionRate;
  const nutritionRatio = nutritionDemand > 0 ? totalNutritionSupply / nutritionDemand : 1;
  const nutrition = log2CoverageScore(nutritionRatio);

  const recoveryDamping = state.primitiveConfig.recoveryDamping ?? 1.0;

  const cCfg = state.primitiveConfig.cleanliness;
  const messIn = cCfg.messPerResident * N * overcrowdingPenalty(N / capBath, 'cleanliness');
  const cleanBudgetMult = budgetEffectiveness(state.gameState.budgets.cleanliness || 0, N, catCurve('cleanliness'));
  let cleanOut = cCfg.cleanBase * bathQ * getBuildingMult('bathroom', 'cleanMult') * (1 + cCfg.skillMult * (tidiness - STAT_NEUTRAL)) * cleanBudgetMult;
  if (state.gameState.researchedTechs.includes('chores_rota')) {
    const choresBoost = (state.techConfig.chores_rota?.effectPercent || 15) / 100;
    cleanOut *= (1 + choresBoost);
  }
  if (state.gameState.activeFixedCosts.includes('cleaner')) {
    const cleanerBoost = (state.techConfig.cleaner?.effectPercent || 40) / 100;
    cleanOut *= (1 + cleanerBoost);
  }
  const netMess = messIn - cleanOut;
  const dampedMess = netMess < 0 ? netMess * recoveryDamping : netMess;
  const oldClean = state.gameState.primitives.cleanliness || 0;
  const cleanliness = Math.min(100, Math.max(0, oldClean + dampedMess * 0.5));

  const mCfg = state.primitiveConfig.maintenance;
  const wearIn = mCfg.wearPerResident * N * overcrowdingPenalty(N / capUtil, 'maintenance');
  const maintBudgetMult = budgetEffectiveness(state.gameState.budgets.maintenance || 0, N, catCurve('maintenance'));
  let repairOut = mCfg.repairBase * uQ * getBuildingMult('utility_closet', 'repairMult') * (1 + mCfg.handinessCoeff * (handiness - STAT_NEUTRAL) + mCfg.tidinessCoeff * (tidiness - STAT_NEUTRAL)) * maintBudgetMult;
  if (state.gameState.researchedTechs.includes('chores_rota')) {
    const choresBoost = (state.techConfig.chores_rota?.effectPercent || 15) / 100;
    repairOut *= (1 + choresBoost);
  }
  const netWear = wearIn - repairOut;
  const dampedWear = netWear < 0 ? netWear * recoveryDamping : netWear;
  const oldMaint = state.gameState.primitives.maintenance || 0;
  const maintenance = Math.min(100, Math.max(0, oldMaint + dampedWear * 0.5));

  // --- Fun & Drive supply (computed before fatigue — activity level drives exertion) ---

  const fpCfg = state.policyConfig.funPenalty;
  const activePoliciesCount = state.gameState.activePolicies.length;
  const policyMult = activePoliciesCount > fpCfg.threshold
    ? Math.max(0, 1 - fpCfg.K * Math.pow(activePoliciesCount - fpCfg.threshold, fpCfg.P))
    : 1;

  const funCfg = state.primitiveConfig.fun;
  const funServed = Math.min(N, effectiveCapLiv);
  const funBudgetMult = budgetEffectiveness(state.gameState.budgets.fun || 0, N, catCurve('fun'));
  let funSupply = funServed * funCfg.outputRate * tierOutputMult * effectiveLivQuality * getBuildingMult('living_room', 'funMult') * (1 + funCfg.skillMult * (((sociability + partyStamina) / 2) - STAT_NEUTRAL)) * policyMult * (1 - (funCfg.considerationPenalty ?? 0.05) * (consideration - STAT_NEUTRAL)) * funBudgetMult;
  const heavenBuilding = state.gameState.buildings.find(b => b.id === 'heaven');
  if (heavenBuilding && heavenBuilding.count > 0) {
    funSupply += heavenBuilding.count * (heavenBuilding.funOutput || 3) * Math.min(N, heavenBuilding.count * heavenBuilding.capacity);
  }
  const hotTubBuilding = state.gameState.buildings.find(b => b.id === 'hot_tub');
  if (hotTubBuilding && hotTubBuilding.count > 0) {
    funSupply += hotTubBuilding.count * (hotTubBuilding.funOutput || 2) * Math.min(N, hotTubBuilding.count * hotTubBuilding.capacity);
  }
  const totalFunWithBuildings = funSupply;

  const dCfg = state.primitiveConfig.drive;
  const driveServed = Math.min(N, effectiveCapLiv);
  const driveBudgetMult = budgetEffectiveness(state.gameState.budgets.drive || 0, N, catCurve('drive'));
  let driveSupply = driveServed * dCfg.outputRate * tierOutputMult * effectiveLivQuality * (1 + dCfg.skillMult * (workEthic - STAT_NEUTRAL)) * driveBudgetMult;
  if (state.gameState.researchedTechs.includes('starlink')) {
    const starlinkBoost = (state.techConfig.starlink?.effectPercent || 15) / 100;
    driveSupply *= (1 + starlinkBoost);
  }
  const totalDriveSupply = driveSupply;

  // --- Fatigue (exertion includes activity from fun/drive production) ---

  const fCfg = state.primitiveConfig.fatigue;
  const activityFatigue = (fCfg.funFatigueCoeff ?? 0.01) * (totalFunWithBuildings / N)
                        + (fCfg.driveFatigueCoeff ?? 0.01) * (totalDriveSupply / N);
  const exertion = fCfg.exertBase * (1 + fCfg.workMult * (workEthic - STAT_NEUTRAL) + fCfg.socioMult * (sociability - STAT_NEUTRAL)) + activityFatigue;
  const fatigueBudgetMult = budgetEffectiveness(state.gameState.budgets.fatigue || 0, N, catCurve('fatigue'));
  const recoveryOCDamp = 1 / overcrowdingPenalty(rBed, 'fatigue');
  let recovery = fCfg.recoverBase * (1 + (fCfg.partyCoeff ?? 0.25) * (partyStamina - STAT_NEUTRAL)) * getBuildingMult('bedroom', 'recoveryMult') * bQ * fatigueBudgetMult * recoveryOCDamp;
  if (state.gameState.researchedTechs.includes('wellness')) {
    const wellnessBoost = (state.techConfig.wellness?.effectPercent || 20) / 100;
    recovery *= (1 + wellnessBoost);
  }
  const netFatigue = exertion - recovery;
  const dampedFatigue = netFatigue < 0 ? netFatigue * recoveryDamping : netFatigue;
  const oldFatigue = state.gameState.primitives.fatigue || 0;
  const fatigue = Math.min(100, Math.max(0, oldFatigue + dampedFatigue));

  // --- Fun & Drive scores ---

  const funDemand = N * funCfg.consumptionRate;
  const funRatio = funDemand > 0 ? totalFunWithBuildings / funDemand : 1;
  const fun = log2CoverageScore(funRatio);

  const driveDemand = N * dCfg.slackRate;
  const driveRatio = driveDemand > 0 ? totalDriveSupply / driveDemand : 1;
  const drive = log2CoverageScore(driveRatio);

  state.gameState.primitives = { crowding, noise, nutrition, cleanliness, maintenance, fatigue, fun, drive };

  const pl = DEFAULT_PRIMITIVE_LABELS;
  state.gameState.coverageData = {
    tier,
    tierOutputMult,
    nutrition: { supply: totalNutritionSupply, demand: nutritionDemand, ratio: nutritionRatio, label: getPrimitiveTierLabel(pl.coverage.nutrition, nutrition), budgetMult: nutrBudgetMult },
    fun: { supply: totalFunWithBuildings, demand: funDemand, ratio: funRatio, label: getPrimitiveTierLabel(pl.coverage.fun, fun), budgetMult: funBudgetMult },
    drive: { supply: totalDriveSupply, demand: driveDemand, ratio: driveRatio, label: getPrimitiveTierLabel(pl.coverage.drive, drive), budgetMult: driveBudgetMult },
    cleanliness: { label: getPrimitiveTierLabel(pl.accumulator.cleanliness, cleanliness) },
    maintenance: { label: getPrimitiveTierLabel(pl.accumulator.maintenance, maintenance) },
    fatigue: { label: getPrimitiveTierLabel(pl.accumulator.fatigue, fatigue) }
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
