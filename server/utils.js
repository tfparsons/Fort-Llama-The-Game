'use strict';


function statTo01(stat) {
  return Math.max(0, Math.min(1, (stat - 1) / 19));
}

function deepMergePrimitives(defaults, overrides) {
  const result = { ...defaults };
  if (!overrides) return result;
  for (const key of Object.keys(defaults)) {
    if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
      result[key] = { ...defaults[key], ...(overrides[key] || {}) };
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  for (const key of Object.keys(overrides)) {
    if (!(key in defaults)) {
      result[key] = overrides[key];
    }
  }
  return result;
}

function log2CoverageScore(ratio) {
  if (ratio <= 0) return 0;
  const log2Ratio = Math.log2(ratio);
  const score = 25 * (log2Ratio + 2);
  return Math.max(0, Math.min(100, score));
}

function getCoverageTierLabel(score) {
  if (score < 25) return 'Shortfall';
  if (score < 45) return 'Tight';
  if (score < 60) return 'Adequate';
  if (score < 75) return 'Good';
  if (score < 90) return 'Great';
  return 'Superb';
}

function getPrimitiveTierLabel(labelDef, score) {
  for (let i = 0; i < labelDef.thresholds.length; i++) {
    if (score < labelDef.thresholds[i]) return labelDef.labels[i];
  }
  return labelDef.labels[labelDef.labels.length - 1];
}

function dampener(value, weight) {
  const norm = value / 100;
  return Math.pow(1 - norm, weight);
}

function baseline(value, weight) {
  const norm = value / 100;
  return Math.pow(norm, weight);
}

module.exports = {
  statTo01,
  deepMergePrimitives,
  log2CoverageScore,
  getCoverageTierLabel,
  getPrimitiveTierLabel,
  dampener,
  baseline
};
