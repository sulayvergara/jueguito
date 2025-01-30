// services/gameService.js
const Game = require('./model');

const gameService = {
  async createGame(gameId, player) {
    const game = new Game({
      gameId,
      players: [{
        playerId: player.id,
        playerName: player.name || player.playerName
      }],
      gameState: 'gameIsInitializing'
    });
    return await game.save();
  },

  async updateGame(gameId, updateData) {
    return await Game.findOneAndUpdate(
      { gameId },
      updateData,
      { new: true }
    );
  },

  async addPlayerToGame(gameId, player) {
    return await Game.findOneAndUpdate(
      { gameId },
      { 
        $push: { 
          players: {
            playerId: player.id,
            playerName: player.name || player.playerName
            
          }
        }
      },
      { new: true }
    );
  },
  async recordShipsPlaced(gameId, playerId) {
    return await Game.findOneAndUpdate(
      { 
        gameId,
        'players.playerId': playerId 
      },
      { 
        $inc: { 
          'players.$.shipsPlaced': 1
        }
      },
      { new: true }
    );
  },
  
  async recordLostShip(gameId, playerId) {
    return await Game.findOneAndUpdate(
      { 
        gameId,
        'players.playerId': playerId 
      },
      { 
        $inc: { 
          'players.$.shipsLost': 1 // Incrementamos el contador de barcos perdidos
        }
      },
      { new: true }
    );
  },
  

  async recordShot(gameId, playerId, isHit) {
    const updateField = isHit ? 'shotsHit' : 'shotsMissed';
    return await Game.findOneAndUpdate(
      { 
        gameId,
        'players.playerId': playerId 
      },
      { 
        $inc: { 
          [`players.$.${updateField}`]: 1,
          totalTurns: 1
        }
      },
      { new: true }
    );
  },

  async recordQuestion(gameId, playerId, isCorrect) {
    return await Game.findOneAndUpdate(
      { 
        gameId,
        'players.playerId': playerId 
      },
      { 
        $inc: { 
          [`players.$.questionsAnswered`]: 1,
          [`players.$.questionsCorrect`]: isCorrect ? 1 : 0,
          totalQuestions: 1
        }
      },
      { new: true }
    );
  },

  async endGame(gameId, winnerId, winnerName) {
    return await Game.findOneAndUpdate(
      { gameId },
      { 
        endTime: new Date(),
        winner: {
          playerId: winnerId,
          playerName: winnerName || player.playerName
        },
        gameState: 'gameOver'
      },
      { new: true }
    );
  }
};

module.exports = gameService;