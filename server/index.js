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

const defaultConfig = {
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

function initializeGame(config = defaultConfig) {
  gameConfig = { ...config };
  gameState = {
    treasury: gameConfig.startingTreasury,
    bedrooms: gameConfig.startingBedrooms,
    residents: gameConfig.startingResidents,
    currentRent: gameConfig.defaultRent,
    week: 0,
    isRunning: false,
    isGameOver: false,
    lastWeekSummary: null,
    recruitQueue: 0,
    recruitsThisWeek: 0
  };
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

function processWeek() {
  if (gameState.isGameOver) return;

  const income = gameState.residents * gameState.currentRent;
  const groundRent = calculateGroundRent();
  const utilities = calculateUtilities();
  const totalExpenses = groundRent + utilities;
  const profit = income - totalExpenses;

  const churnedResidents = calculateChurn();
  gameState.residents = Math.max(0, gameState.residents - churnedResidents);

  const arrivingResidents = gameState.recruitQueue;
  gameState.recruitQueue = 0;
  gameState.residents += arrivingResidents;

  gameState.recruitsThisWeek = 0;

  gameState.treasury += profit;
  gameState.week += 1;

  gameState.lastWeekSummary = {
    week: gameState.week,
    income,
    groundRent,
    utilities,
    totalExpenses,
    profit,
    arrivingResidents,
    churnedResidents
  };

  if (gameState.treasury <= gameConfig.gameOverLimit) {
    gameState.isGameOver = true;
    stopSimulation();
  }
}

function startSimulation() {
  if (simulationInterval) return;
  gameState.isRunning = true;
  simulationInterval = setInterval(() => {
    processWeek();
  }, gameConfig.tickSpeed);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  gameState.isRunning = false;
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
  const newConfig = { ...defaultConfig, ...req.body };
  initializeGame(newConfig);
  res.json({ success: true, config: gameConfig, state: gameState });
});

app.post('/api/reset', (req, res) => {
  stopSimulation();
  initializeGame(gameConfig);
  res.json({ success: true, state: gameState });
});

app.post('/api/start', (req, res) => {
  startSimulation();
  res.json({ success: true, isRunning: true });
});

app.post('/api/pause', (req, res) => {
  stopSimulation();
  res.json({ success: true, isRunning: false });
});

app.post('/api/action/set-rent', (req, res) => {
  const { rent } = req.body;
  if (rent >= gameConfig.rentMin && rent <= gameConfig.rentMax) {
    gameState.currentRent = rent;
    res.json({ success: true, currentRent: gameState.currentRent });
  } else {
    res.status(400).json({ error: 'Rent out of range' });
  }
});

app.post('/api/action/recruit', (req, res) => {
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
  if (gameState.treasury < gameConfig.bedroomBuildCost) {
    res.status(400).json({ error: 'Not enough funds' });
    return;
  }
  
  gameState.treasury -= gameConfig.bedroomBuildCost;
  gameState.bedrooms += 1;
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
