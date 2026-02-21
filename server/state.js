'use strict';

const fs = require('fs');
const path = require('path');
const {
  INITIAL_DEFAULTS,
  DEFAULT_PRIMITIVE_CONFIG,
  DEFAULT_HEALTH_CONFIG,
  DEFAULT_VIBES_CONFIG,
  DEFAULT_TIER_CONFIG,
  DEFAULT_BUDGET_CONFIG,
  DEFAULT_POLICY_CONFIG,
  DEFAULT_TECH_CONFIG,
  DEFAULT_SCORE_CONFIG
} = require('./config');

const SAVED_DEFAULTS_FILE = path.join(__dirname, 'saved-defaults.json');

function loadSavedDefaults() {
  try {
    if (fs.existsSync(SAVED_DEFAULTS_FILE)) {
      console.log('Loading saved defaults from file:', SAVED_DEFAULTS_FILE);
      const data = JSON.parse(fs.readFileSync(SAVED_DEFAULTS_FILE, 'utf8'));
      console.log('Loaded defaults - tickSpeed:', data.defaults?.tickSpeed, 'startingResidents:', data.defaults?.startingResidents);
      return {
        defaults: data.defaults || { ...INITIAL_DEFAULTS },
        llamaPool: data.llamaPool || null,
        buildings: data.buildings || null
      };
    } else {
      console.log('No saved defaults file found, using INITIAL_DEFAULTS');
    }
  } catch (err) {
    console.error('Failed to load saved defaults:', err);
  }
  return { defaults: { ...INITIAL_DEFAULTS }, llamaPool: null, buildings: null };
}

const loadedData = loadSavedDefaults();
const savedDefaults = loadedData.defaults;

// All mutable server-level state lives on this single exported object.
// Every module that needs to read or write state imports this module and
// accesses properties via state.gameState, state.primitiveConfig, etc.
// Reassignments (state.gameState = newObj) are immediately visible to all
// importers because they all hold a reference to the same object.
const state = {
  gameState: null,
  gameConfig: null,
  simulationInterval: null,
  llamaPool: [],
  savedDefaults,
  savedLlamaPool: loadedData.llamaPool,
  savedBuildingsConfig: loadedData.buildings,
  // Balance parameters always come from config.js — never from saved-defaults.json.
  // Edit config.js to change game balance; saved-defaults.json only stores session settings.
  primitiveConfig: { ...DEFAULT_PRIMITIVE_CONFIG },
  healthConfig: { ...DEFAULT_HEALTH_CONFIG },
  vibesConfig: { ...DEFAULT_VIBES_CONFIG },
  tierConfig: { ...DEFAULT_TIER_CONFIG },
  budgetConfig: JSON.parse(JSON.stringify(DEFAULT_BUDGET_CONFIG)),
  policyConfig: JSON.parse(JSON.stringify(DEFAULT_POLICY_CONFIG)),
  techConfig: JSON.parse(JSON.stringify(DEFAULT_TECH_CONFIG)),
  scoreConfig: JSON.parse(JSON.stringify(DEFAULT_SCORE_CONFIG))
};

module.exports = { state, SAVED_DEFAULTS_FILE };
