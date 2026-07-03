'use strict';

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initializeGame } = require('./gameState');
const { state, SAVED_GAME_FILE } = require('./state');
const { calculatePrimitives } = require('./primitives');
const { calculateHealthMetrics } = require('./healthMetrics');
const { calculateVibes, calculateWeeklyProjection } = require('./outcomes');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(routes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('/dev', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/dev.html'));
  });
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Restore saved game if one exists, otherwise start fresh
let loadedSave = false;
try {
  if (fs.existsSync(SAVED_GAME_FILE)) {
    const data = JSON.parse(fs.readFileSync(SAVED_GAME_FILE, 'utf8'));
    if (data.gameState && data.gameConfig) {
      state.gameState = data.gameState;
      state.gameConfig = data.gameConfig;
      if (data.llamaPool) state.llamaPool = data.llamaPool;
      state.gameState.isRunning = false;
      calculatePrimitives();
      calculateHealthMetrics();
      calculateVibes();
      calculateWeeklyProjection();
      loadedSave = true;
      console.log(`Restored saved game (week ${data.gameState.week}, saved ${data.savedAt})`);
    }
  }
} catch (err) {
  console.error('Failed to restore saved game, starting fresh:', err);
}

if (!loadedSave) {
  initializeGame();
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fort Llama server running on port ${PORT}`);
});
