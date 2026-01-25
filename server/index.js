const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let gameState = null;
let gameConfig = null;
let simulationInterval = null;

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const INITIAL_DEFAULTS = {
  startingTreasury: 0,
  startingBedrooms: 4,
  startingResidents: 2,
  rentMin: 50,
  rentMax: 500,
  defaultRent: 100,
  groundRentBase: 1000,
  groundRentBedroomModifier: 0.10,
  utilitiesBase: 200,
  utilitiesBedroomModifier: 0.15,
  bedroomBuildCost: 2000,
  bedroomCapacity: 2,
  baseChurnRate: 0.20,
  churnRentMultiplier: 0.0003,
  maxRecruitPerWeek: 2,
  gameOverLimit: -20000,
  tickSpeed: 1000
};

let savedDefaults = { ...INITIAL_DEFAULTS };

function initializeGame(config = savedDefaults) {
  gameConfig = { ...config };
  gameState = {
    treasury: gameConfig.startingTreasury,
    bedrooms: gameConfig.startingBedrooms,
    residents: gameConfig.startingResidents,
    currentRent: gameConfig.defaultRent,
    week: 1,
    day: 0,
    dayName: 'Monday',
    isRunning: false,
    isPausedForWeeklyDecision: true,
    isGameOver: false,
    lastWeekSummary: null,
    recruitQueue: 0,
    recruitsThisWeek: 0,
    weeklyDelta: 0,
    dailyDelta: 0,
    treasuryAtWeekStart: gameConfig.startingTreasury
  };
  calculateWeeklyProjection();
}

function calculateWeeklyProjection() {
  const income = gameState.residents * gameState.currentRent;
  const groundRent = calculateGroundRent();
  const utilities = calculateUtilities();
  const weeklyDelta = income - groundRent - utilities;
  gameState.weeklyDelta = weeklyDelta;
  gameState.dailyDelta = weeklyDelta / 7;
  gameState.projectedIncome = income;
  gameState.projectedGroundRent = groundRent;
  gameState.projectedUtilities = utilities;
}

function calculateGroundRent() {
  const extraBedrooms = Math.max(0, gameState.bedrooms - 1);
  return Math.round(gameConfig.groundRentBase * (1 + extraBedrooms * gameConfig.groundRentBedroomModifier));
}

function calculateUtilities() {
  const extraBedrooms = Math.max(0, gameState.bedrooms - 1);
  return Math.round(gameConfig.utilitiesBase * (1 + extraBedrooms * gameConfig.utilitiesBedroomModifier));
}

function calculateChurn() {
  const rentFactor = gameState.currentRent * gameConfig.churnRentMultiplier;
  const totalChurnRate = Math.min(1, gameConfig.baseChurnRate + rentFactor);
  const residentsLeaving = Math.floor(gameState.residents * totalChurnRate);
  return Math.min(residentsLeaving, gameState.residents);
}

function processDay() {
  if (gameState.isGameOver || gameState.isPausedForWeeklyDecision) return;

  gameState.day += 1;
  gameState.dayName = DAY_NAMES[gameState.day - 1] || 'Monday';
  
  gameState.treasury += gameState.dailyDelta;

  if (gameState.day >= 7) {
    processWeekEnd();
  }

  if (gameState.treasury <= gameConfig.gameOverLimit) {
    gameState.isGameOver = true;
    stopSimulation();
  }
}

function processWeekEnd() {
  const churnedResidents = calculateChurn();
  gameState.residents = Math.max(0, gameState.residents - churnedResidents);

  const arrivingResidents = gameState.recruitQueue;
  gameState.recruitQueue = 0;
  gameState.residents += arrivingResidents;

  const actualProfit = gameState.treasury - gameState.treasuryAtWeekStart;
  
  gameState.lastWeekSummary = {
    week: gameState.week,
    income: gameState.projectedIncome,
    groundRent: gameState.projectedGroundRent,
    utilities: gameState.projectedUtilities,
    totalExpenses: gameState.projectedGroundRent + gameState.projectedUtilities,
    profit: actualProfit,
    arrivingResidents,
    churnedResidents
  };

  gameState.week += 1;
  gameState.day = 0;
  gameState.dayName = 'Monday';
  gameState.recruitsThisWeek = 0;
  gameState.treasuryAtWeekStart = gameState.treasury;
  gameState.isPausedForWeeklyDecision = true;
  stopSimulation();
  
  calculateWeeklyProjection();
}

function startSimulation() {
  if (simulationInterval) return;
  if (gameState.isPausedForWeeklyDecision) return;
  gameState.isRunning = true;
  simulationInterval = setInterval(() => {
    processDay();
  }, gameConfig.tickSpeed);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  gameState.isRunning = false;
}

function dismissWeeklyPause() {
  if (!gameState.isPausedForWeeklyDecision) return;
  gameState.isPausedForWeeklyDecision = false;
  calculateWeeklyProjection();
  startSimulation();
}

initializeGame();

app.get('/api/state', (req, res) => {
  const capacity = gameState.bedrooms * gameConfig.bedroomCapacity;
  res.json({
    ...gameState,
    capacity,
    config: gameConfig
  });
});

app.get('/api/config', (req, res) => {
  res.json(gameConfig);
});

app.post('/api/config', (req, res) => {
  stopSimulation();
  const newConfig = { ...savedDefaults, ...req.body };
  initializeGame(newConfig);
  res.json({ success: true, config: gameConfig, state: gameState });
});

app.post('/api/save-defaults', (req, res) => {
  savedDefaults = { ...gameConfig };
  res.json({ success: true, defaults: savedDefaults });
});

app.post('/api/reset', (req, res) => {
  stopSimulation();
  initializeGame(savedDefaults);
  res.json({ success: true, state: gameState });
});

app.post('/api/start', (req, res) => {
  if (gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Dismiss weekly decision modal first' });
    return;
  }
  startSimulation();
  res.json({ success: true, isRunning: true });
});

app.post('/api/pause', (req, res) => {
  stopSimulation();
  res.json({ success: true, isRunning: false });
});

app.post('/api/dismiss-weekly', (req, res) => {
  dismissWeeklyPause();
  res.json({ success: true, isRunning: gameState.isRunning, isPausedForWeeklyDecision: false });
});

app.post('/api/action/set-rent', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only change rent during weekly planning' });
    return;
  }
  const { rent } = req.body;
  if (rent >= gameConfig.rentMin && rent <= gameConfig.rentMax) {
    gameState.currentRent = rent;
    calculateWeeklyProjection();
    res.json({ success: true, currentRent: gameState.currentRent });
  } else {
    res.status(400).json({ error: `Rent must be between £${gameConfig.rentMin} and £${gameConfig.rentMax}` });
  }
});

app.post('/api/action/recruit', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }
  const { count = 1 } = req.body;
  const capacity = gameState.bedrooms * gameConfig.bedroomCapacity;
  const futureResidents = gameState.residents + gameState.recruitQueue + count;
  
  if (futureResidents > capacity) {
    res.status(400).json({ error: 'Not enough capacity' });
    return;
  }
  
  if (gameState.recruitsThisWeek + count > gameConfig.maxRecruitPerWeek) {
    const remaining = gameConfig.maxRecruitPerWeek - gameState.recruitsThisWeek;
    res.status(400).json({ error: `Max ${gameConfig.maxRecruitPerWeek} recruits per week. ${remaining} remaining.` });
    return;
  }
  
  gameState.recruitQueue += count;
  gameState.recruitsThisWeek += count;
  res.json({ success: true, recruitQueue: gameState.recruitQueue, recruitsThisWeek: gameState.recruitsThisWeek });
});

app.post('/api/action/build-bedroom', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only build during weekly planning' });
    return;
  }
  if (gameState.treasury < gameConfig.bedroomBuildCost) {
    res.status(400).json({ error: 'Not enough funds' });
    return;
  }
  
  gameState.treasury -= gameConfig.bedroomBuildCost;
  gameState.bedrooms += 1;
  calculateWeeklyProjection();
  res.json({ 
    success: true, 
    bedrooms: gameState.bedrooms, 
    treasury: gameState.treasury 
  });
});

app.get('/api/buildings', (req, res) => {
  res.json([
    {
      id: 'bedroom',
      name: 'Bedroom',
      cost: gameConfig.bedroomBuildCost,
      capacity: gameConfig.bedroomCapacity,
      groundRentIncrease: `+${gameConfig.groundRentBedroomModifier * 100}%`,
      utilitiesIncrease: `+${gameConfig.utilitiesBedroomModifier * 100}%`
    }
  ]);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fort Llama server running on port ${PORT}`);
});
