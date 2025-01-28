// models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  winner: {
    playerId: String,
    playerName: String
  },
  players: [{
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    shipsPlaced: { type: Number, default: 0 },
    shipsLost: { type: Number, default: 0 },
    shotsHit: { type: Number, default: 0 },
    shotsMissed: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 }
  }],
  gameState: { 
    type: String, 
    required: true 
  },
  totalTurns: { 
    type: Number, 
    default: 0 
  },
  totalQuestions: { 
    type: Number, 
    default: 0 
  }
});

module.exports = mongoose.model('Game', gameSchema);