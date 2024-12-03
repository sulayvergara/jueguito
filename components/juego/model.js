const mongoose = require('mongoose');
const schema = mongoose.Schema;

// Define the schema for the juego collection


const gameSchema = new schema({
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  gameState: {
    type: String,
    enum: ['gameIsInitializing', 'gameInitialized', 'setShipsRound', 'gameRunning', 'gameOver'],
    default: 'gameIsInitializing'
  },
  isListed: { type: Boolean, default: true },
  playerGrids: { type: Map, of: [[Number]] },
  playerShipsPlaced: { type: Map, of: Number },
  playerShipsLost: { type: Map, of: Number },
  currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Create a model based on the schema
const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
