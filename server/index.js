'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initializeGame } = require('./gameState');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(routes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

initializeGame();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fort Llama server running on port ${PORT}`);
});
