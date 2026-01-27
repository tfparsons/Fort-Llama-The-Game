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

const STARTING_LLAMAS = [
  { id: 1, name: 'Tim', gender: 'm', age: 34, bio: 'Product and growth operator; likes systems that actually work; friendly, but protective of focus time; quietly keeps the place running.', stats: { sharingTolerance: 16, cookingSkill: 11, tidiness: 12, handiness: 16, consideration: 13, sociability: 12, partyStamina: 11, workEthic: 15 } },
  { id: 2, name: 'Celine', gender: 'f', age: 32, bio: 'Calm, competent, slightly intimidating in the best way; remembers birthdays; keeps conversations grounded; the person you want in any group decision.', stats: { sharingTolerance: 13, cookingSkill: 12, tidiness: 12, handiness: 11, consideration: 16, sociability: 13, partyStamina: 11, workEthic: 13 } },
  { id: 3, name: 'Alex', gender: 'm', age: 32, bio: 'Charming chaos with a big heart; alternates between hyper-focus and disappearing into hobbies; good at rallying people, less good at admin.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 10, handiness: 10, consideration: 12, sociability: 14, partyStamina: 18, workEthic: 10 } },
  { id: 4, name: 'Theo', gender: 'm', age: 30, bio: "Quiet builder type; doesn't say much, but always shows up; prefers practical solutions to big debates; steady energy, steady output.", stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 12, handiness: 13, consideration: 16, sociability: 10, partyStamina: 11, workEthic: 14 } },
  { id: 5, name: 'Rob', gender: 'm', age: 34, bio: 'Mild-mannered, dependable, quietly funny; does the boring tasks without making it a thing; low drama, high reliability.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 12, handiness: 12, consideration: 13, sociability: 11, partyStamina: 11, workEthic: 16 } },
  { id: 6, name: 'Cass', gender: 'f', age: 32, bio: 'Social glue with sharp opinions; will host dinner, mediate a spat, and then reorganise the pantry "because it was stressing me out".', stats: { sharingTolerance: 12, cookingSkill: 12, tidiness: 16, handiness: 11, consideration: 14, sociability: 15, partyStamina: 12, workEthic: 12 } },
  { id: 7, name: 'Niel', gender: 'm', age: 34, bio: 'Thoughtful introvert; reads, cooks simple meals, and notices problems early; prefers small groups; strong "quiet contribution" vibe.', stats: { sharingTolerance: 13, cookingSkill: 12, tidiness: 12, handiness: 11, consideration: 14, sociability: 10, partyStamina: 10, workEthic: 15 } },
  { id: 8, name: 'Lily', gender: 'f', age: 32, bio: 'Warm, upbeat, slightly chaotic in a harmless way; loves shared rituals like Sunday brunch; surprisingly firm about house rules.', stats: { sharingTolerance: 16, cookingSkill: 12, tidiness: 11, handiness: 10, consideration: 13, sociability: 16, partyStamina: 12, workEthic: 12 } },
  { id: 9, name: 'Scarlette', gender: 'f', age: 28, bio: "Fashion and nightlife adjacent; brings energy and connections; hates being told what to do; great when the vibe is good, prickly when it's not.", stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 10, handiness: 10, consideration: 11, sociability: 16, partyStamina: 14, workEthic: 10 } },
  { id: 10, name: 'Dan', gender: 'm', age: 29, bio: 'Friendly generalist; will help with anything if you ask; not a self-starter, but very solid once pointed at a job; hates conflict.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 11, handiness: 12, consideration: 13, sociability: 12, partyStamina: 12, workEthic: 13 } },
  { id: 11, name: 'Will', gender: 'm', age: 30, bio: 'Earnest, practical, a bit of a dad friend; likes schedules and early starts; will fix the thing, then write a checklist so it stays fixed.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 12, handiness: 12, consideration: 14, sociability: 11, partyStamina: 11, workEthic: 16 } },
  { id: 12, name: 'Georgia', gender: 'f', age: 27, bio: 'Brilliant but messy; lives on takeaways and inspiration; fun to be around, unreliable with shared chores; good intentions, bad follow-through.', stats: { sharingTolerance: 12, cookingSkill: 4, tidiness: 11, handiness: 2, consideration: 11, sociability: 14, partyStamina: 12, workEthic: 9 } },
  { id: 13, name: 'Jelena', gender: 'f', age: 30, bio: 'Former competitive athlete turned office worker; disciplined, direct, and weirdly soothing; treats communal life like a team sport.', stats: { sharingTolerance: 13, cookingSkill: 11, tidiness: 13, handiness: 12, consideration: 13, sociability: 11, partyStamina: 12, workEthic: 15 } },
  { id: 14, name: 'Hailey', gender: 'f', age: 29, bio: 'Sunny extrovert with a social calendar for her social calendar; hosts themed nights; decent at chores, but only when the mood is right.', stats: { sharingTolerance: 16, cookingSkill: 11, tidiness: 11, handiness: 10, consideration: 12, sociability: 14, partyStamina: 14, workEthic: 11 } },
  { id: 15, name: 'Katey', gender: 'f', age: 27, bio: 'Restless creative; allergic to routines; great company, but genuinely forgets chores exist; tries to make up for it with enthusiasm.', stats: { sharingTolerance: 12, cookingSkill: 4, tidiness: 4, handiness: 2, consideration: 11, sociability: 13, partyStamina: 12, workEthic: 9 } },
  { id: 16, name: 'Cli', gender: 'f', age: 28, bio: 'Soft-spoken, observant, and unexpectedly funny; likes order, but not control; quietly nudges the house toward harmony.', stats: { sharingTolerance: 12, cookingSkill: 12, tidiness: 13, handiness: 11, consideration: 14, sociability: 12, partyStamina: 11, workEthic: 13 } },
  { id: 17, name: 'Maria', gender: 'f', age: 29, bio: 'Competent, energetic, slightly competitive; wants the commune to "level up"; loves projects, hates dithering; will volunteer you by accident.', stats: { sharingTolerance: 13, cookingSkill: 12, tidiness: 12, handiness: 12, consideration: 12, sociability: 13, partyStamina: 12, workEthic: 14 } },
  { id: 18, name: 'Paula', gender: 'f', age: 28, bio: "Chill, friendly, and low-maintenance; joins in when invited; not especially ambitious; optimised for peace and snacks.", stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 11, handiness: 11, consideration: 12, sociability: 12, partyStamina: 12, workEthic: 12 } },
  { id: 19, name: 'Kat', gender: 'f', age: 27, bio: "Independent, blunt, and principled; doesn't love sharing; will absolutely call out slack behaviour; secretly very loyal once she trusts you.", stats: { sharingTolerance: 11, cookingSkill: 13, tidiness: 11, handiness: 4, consideration: 12, sociability: 12, partyStamina: 11, workEthic: 13 } },
  { id: 20, name: 'OBT', gender: 'm', age: 31, bio: 'Hard-working networker; always "just hopping out"; likes the commune for momentum and people; reliable when there\'s a clear goal.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 11, handiness: 11, consideration: 12, sociability: 15, partyStamina: 13, workEthic: 13 } }
];

function statToPercentage(stat) {
  return (stat - 10) * 10;
}

let llamaPool = [];

const DEFAULT_BUILDINGS = [
  { id: 'bedroom', name: 'Bedrooms', capacity: 2, atStart: 8, cost: 200, utilitiesMultiplier: 0.1, groundRentMultiplier: 0.1, buildable: true },
  { id: 'kitchen', name: 'Kitchen', capacity: 20, atStart: 1, cost: null, utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false },
  { id: 'bathroom', name: 'Bathroom', capacity: 4, atStart: 3, cost: 300, utilitiesMultiplier: 0.2, groundRentMultiplier: 0.1, buildable: true },
  { id: 'living_room', name: 'Living Room', capacity: 20, atStart: 1, cost: null, utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false },
  { id: 'utility_closet', name: 'Utility Closet', capacity: 40, atStart: 1, cost: null, utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false }
];

const INITIAL_DEFAULTS = {
  startingTreasury: 0,
  startingResidents: 2,
  rentMin: 50,
  rentMax: 500,
  defaultRent: 100,
  groundRentBase: 1000,
  utilitiesBase: 200,
  baseChurnRate: 0.20,
  churnRentMultiplier: 0.0003,
  gameOverLimit: -20000,
  tickSpeed: 1000
};

let savedDefaults = { ...INITIAL_DEFAULTS };
let savedLlamaPool = null;
let savedBuildingsConfig = null;

function initializeGame(config = savedDefaults) {
  gameConfig = { ...config };
  
  llamaPool = savedLlamaPool 
    ? JSON.parse(JSON.stringify(savedLlamaPool)) 
    : JSON.parse(JSON.stringify(STARTING_LLAMAS));
  
  const buildingsConfig = savedBuildingsConfig 
    ? JSON.parse(JSON.stringify(savedBuildingsConfig))
    : JSON.parse(JSON.stringify(DEFAULT_BUILDINGS));
  
  const shuffled = [...llamaPool].sort(() => Math.random() - 0.5);
  const startingResidentObjects = shuffled.slice(0, gameConfig.startingResidents).map(llama => ({
    ...llama,
    daysThisWeek: 7,
    arrivalDay: null
  }));
  
  const buildings = buildingsConfig.map(b => ({
    ...b,
    count: b.atStart
  }));
  
  gameState = {
    treasury: gameConfig.startingTreasury,
    buildings: buildings,
    communeResidents: startingResidentObjects,
    pendingArrivals: [],
    currentRent: gameConfig.defaultRent,
    week: 1,
    day: 0,
    dayName: 'Monday',
    isRunning: false,
    isPausedForWeeklyDecision: true,
    isGameOver: false,
    lastWeekSummary: null,
    hasRecruitedThisWeek: false,
    weekCandidates: [],
    weeklyDelta: 0,
    dailyDelta: 0,
    treasuryAtWeekStart: gameConfig.startingTreasury
  };
  calculateWeeklyProjection();
  generateWeekCandidates();
}

function generateWeekCandidates() {
  const available = getAvailableLlamas();
  const shuffled = available.sort(() => Math.random() - 0.5);
  gameState.weekCandidates = shuffled.slice(0, Math.min(3, shuffled.length));
}

function calculateWeeklyProjection() {
  const residentCount = gameState.communeResidents.length;
  const income = residentCount * gameState.currentRent;
  const groundRent = calculateGroundRent();
  const utilities = calculateUtilities();
  const weeklyDelta = income - groundRent - utilities;
  gameState.weeklyDelta = weeklyDelta;
  gameState.dailyDelta = weeklyDelta / 7;
  gameState.projectedIncome = income;
  gameState.projectedGroundRent = groundRent;
  gameState.projectedUtilities = utilities;
}

function calculateTotalCapacity() {
  return gameState.buildings.reduce((sum, b) => sum + (b.count * b.capacity), 0);
}

function calculateGroundRent() {
  let multiplier = 0;
  gameState.buildings.forEach(b => {
    if (b.groundRentMultiplier !== null) {
      const extraCount = Math.max(0, b.count - b.atStart);
      multiplier += extraCount * b.groundRentMultiplier;
    }
  });
  return Math.round(gameConfig.groundRentBase * (1 + multiplier));
}

function calculateUtilities() {
  let multiplier = 0;
  gameState.buildings.forEach(b => {
    if (b.utilitiesMultiplier !== null) {
      const extraCount = Math.max(0, b.count - b.atStart);
      multiplier += extraCount * b.utilitiesMultiplier;
    }
  });
  return Math.round(gameConfig.utilitiesBase * (1 + multiplier));
}

function calculateWeeklyChurnCount() {
  const rentFactor = gameState.currentRent * gameConfig.churnRentMultiplier;
  const totalChurnRate = Math.min(1, gameConfig.baseChurnRate + rentFactor);
  const residentCount = gameState.communeResidents.length;
  const residentsLeaving = Math.floor(residentCount * totalChurnRate);
  return Math.min(residentsLeaving, residentCount);
}

function getAvailableLlamas() {
  const inCommuneIds = gameState.communeResidents.map(r => r.id);
  const pendingIds = gameState.pendingArrivals.map(r => r.id);
  return llamaPool.filter(l => !inCommuneIds.includes(l.id) && !pendingIds.includes(l.id));
}

function getRandomArrivalDay() {
  const days = [2, 3, 4, 5, 6, 7];
  return days[Math.floor(Math.random() * days.length)];
}

function processDay() {
  if (gameState.isGameOver || gameState.isPausedForWeeklyDecision) return;

  gameState.day += 1;
  gameState.dayName = DAY_NAMES[gameState.day - 1] || 'Monday';
  
  const arrivingToday = gameState.pendingArrivals.filter(r => r.arrivalDay === gameState.day);
  arrivingToday.forEach(resident => {
    const daysRemaining = 8 - gameState.day;
    gameState.communeResidents.push({
      ...resident,
      daysThisWeek: daysRemaining,
      arrivalDay: null
    });
  });
  gameState.pendingArrivals = gameState.pendingArrivals.filter(r => r.arrivalDay !== gameState.day);
  
  let dailyIncome = 0;
  gameState.communeResidents.forEach(resident => {
    const proRataRent = Math.ceil((resident.daysThisWeek / 7) * gameState.currentRent);
    dailyIncome += proRataRent / resident.daysThisWeek;
  });
  
  const dailyExpenses = (calculateGroundRent() + calculateUtilities()) / 7;
  gameState.treasury += dailyIncome - dailyExpenses;

  if (gameState.day >= 7) {
    processWeekEnd();
  }

  if (gameState.treasury <= gameConfig.gameOverLimit) {
    gameState.isGameOver = true;
    stopSimulation();
  }
}

function processWeekEnd() {
  const churnCount = calculateWeeklyChurnCount();
  const churnedResidents = [];
  
  for (let i = 0; i < churnCount && gameState.communeResidents.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * gameState.communeResidents.length);
    const churned = gameState.communeResidents.splice(randomIndex, 1)[0];
    churnedResidents.push(churned);
  }

  const actualProfit = gameState.treasury - gameState.treasuryAtWeekStart;
  
  gameState.lastWeekSummary = {
    week: gameState.week,
    income: gameState.projectedIncome,
    groundRent: gameState.projectedGroundRent,
    utilities: gameState.projectedUtilities,
    totalExpenses: gameState.projectedGroundRent + gameState.projectedUtilities,
    profit: actualProfit,
    arrivedResidents: [],
    churnedResidents: churnedResidents.map(r => r.name)
  };

  gameState.communeResidents.forEach(r => r.daysThisWeek = 7);
  
  gameState.week += 1;
  gameState.day = 0;
  gameState.dayName = 'Monday';
  gameState.hasRecruitedThisWeek = false;
  gameState.treasuryAtWeekStart = gameState.treasury;
  gameState.isPausedForWeeklyDecision = true;
  stopSimulation();
  
  calculateWeeklyProjection();
  generateWeekCandidates();
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
  const capacity = calculateTotalCapacity();
  const residentCount = gameState.communeResidents.length;
  const pendingCount = gameState.pendingArrivals.length;
  res.json({
    ...gameState,
    residents: residentCount,
    pendingResidents: pendingCount,
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
  savedLlamaPool = JSON.parse(JSON.stringify(llamaPool));
  savedBuildingsConfig = gameState.buildings.map(b => ({
    id: b.id,
    name: b.name,
    capacity: b.capacity,
    atStart: b.atStart,
    cost: b.cost,
    utilitiesMultiplier: b.utilitiesMultiplier,
    groundRentMultiplier: b.groundRentMultiplier,
    buildable: b.buildable
  }));
  res.json({ success: true, defaults: savedDefaults });
});

app.get('/api/llama-pool', (req, res) => {
  res.json({ llamas: llamaPool });
});

app.post('/api/llama-pool', (req, res) => {
  const { llamas } = req.body;
  if (!llamas || !Array.isArray(llamas)) {
    res.status(400).json({ error: 'Invalid llama pool data' });
    return;
  }
  llamaPool = llamas;
  generateWeekCandidates();
  res.json({ success: true, llamas: llamaPool });
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

app.get('/api/recruitment-candidates', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }
  
  const residentIds = gameState.communeResidents.map(r => r.id);
  const pendingIds = gameState.pendingArrivals.map(r => r.id);
  const excludeIds = new Set([...residentIds, ...pendingIds]);
  const availableCandidates = gameState.weekCandidates.filter(c => !excludeIds.has(c.id));
  
  res.json({ candidates: availableCandidates });
});

app.post('/api/action/invite', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }
  
  if (gameState.hasRecruitedThisWeek) {
    res.status(400).json({ error: 'Already recruited this week' });
    return;
  }
  
  const capacity = calculateTotalCapacity();
  const futureResidents = gameState.communeResidents.length + gameState.pendingArrivals.length + 1;
  
  if (futureResidents > capacity) {
    res.status(400).json({ error: 'Not enough capacity' });
    return;
  }
  
  const { llamaId } = req.body;
  const llama = llamaPool.find(l => l.id === llamaId);
  
  if (!llama) {
    res.status(400).json({ error: 'Llama not found' });
    return;
  }
  
  const inCommune = gameState.communeResidents.some(r => r.id === llamaId);
  const isPending = gameState.pendingArrivals.some(r => r.id === llamaId);
  
  if (inCommune || isPending) {
    res.status(400).json({ error: 'Llama already in commune or pending' });
    return;
  }
  
  const arrivalDay = getRandomArrivalDay();
  gameState.pendingArrivals.push({
    ...llama,
    arrivalDay,
    daysThisWeek: 0
  });
  gameState.hasRecruitedThisWeek = true;
  
  res.json({ 
    success: true, 
    invited: llama.name, 
    arrivalDay,
    arrivalDayName: DAY_NAMES[arrivalDay - 1]
  });
});

app.post('/api/action/build', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only build during weekly planning' });
    return;
  }
  
  const { buildingId } = req.body;
  const building = gameState.buildings.find(b => b.id === buildingId);
  
  if (!building) {
    res.status(400).json({ error: 'Building type not found' });
    return;
  }
  
  if (!building.buildable || building.cost === null) {
    res.status(400).json({ error: 'This building type cannot be built' });
    return;
  }
  
  if (gameState.treasury < building.cost) {
    res.status(400).json({ error: 'Not enough funds' });
    return;
  }
  
  gameState.treasury -= building.cost;
  building.count += 1;
  calculateWeeklyProjection();
  res.json({ 
    success: true, 
    building: building.name,
    count: building.count,
    treasury: gameState.treasury,
    capacity: calculateTotalCapacity()
  });
});

app.post('/api/action/build-bedroom', (req, res) => {
  req.body = { buildingId: 'bedroom' };
  return app._router.handle({ ...req, url: '/api/action/build', method: 'POST' }, res, () => {});
});

app.get('/api/buildings', (req, res) => {
  res.json(gameState.buildings);
});

app.post('/api/buildings', (req, res) => {
  const { buildings } = req.body;
  if (!buildings || !Array.isArray(buildings)) {
    res.status(400).json({ error: 'Invalid buildings data' });
    return;
  }
  gameState.buildings = buildings.map(b => ({
    ...b,
    count: b.count !== undefined ? b.count : b.atStart
  }));
  calculateWeeklyProjection();
  res.json({ success: true, buildings: gameState.buildings });
});

app.get('/api/buildings-config', (req, res) => {
  res.json(savedBuildingsConfig || DEFAULT_BUILDINGS);
});

app.post('/api/buildings-config', (req, res) => {
  const { buildings } = req.body;
  if (!buildings || !Array.isArray(buildings)) {
    res.status(400).json({ error: 'Invalid buildings config' });
    return;
  }
  savedBuildingsConfig = buildings;
  res.json({ success: true, buildings: savedBuildingsConfig });
});

app.get('/api/llamas', (req, res) => {
  res.json({ llamas: llamaPool });
});

app.post('/api/llamas', (req, res) => {
  const { llamas } = req.body;
  if (!Array.isArray(llamas)) {
    res.status(400).json({ error: 'llamas must be an array' });
    return;
  }
  llamaPool = llamas;
  res.json({ success: true, count: llamaPool.length });
});

app.post('/api/llamas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  const index = llamaPool.findIndex(l => l.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Llama not found' });
    return;
  }
  
  llamaPool[index] = { ...llamaPool[index], ...updates };
  res.json({ success: true, llama: llamaPool[index] });
});

app.post('/api/llamas/add', (req, res) => {
  const newLlama = req.body;
  const maxId = Math.max(...llamaPool.map(l => l.id), 0);
  newLlama.id = maxId + 1;
  llamaPool.push(newLlama);
  res.json({ success: true, llama: newLlama });
});

app.delete('/api/llamas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = llamaPool.findIndex(l => l.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Llama not found' });
    return;
  }
  
  llamaPool.splice(index, 1);
  res.json({ success: true });
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
