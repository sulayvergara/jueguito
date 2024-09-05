const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the juego collection

const gameSchema = new Schema({
  players: [{
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
  }],
  winner: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
  },
  rounds: {
      type: Number,
      required: true,
      default: 0
  },
  startTime: {
      type: Date,
      default: Date.now
  },
  endTime: {
      type: Date
  },
  status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
  },
  moves: [{
      player: {
          type: Schema.Types.ObjectId,
          ref: 'Usuario'
      },
      position: {
          x: Number,
          y: Number
      },
      result: {
          type: String,
          enum: ['hit', 'miss']
      },
      round: Number
  }]
});

module.exports = mongoose.model('Game', gameSchema);