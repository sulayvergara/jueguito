const gameinterface = require('./interface');
const generateUUID = require('../../components/helpers/generateUUID');

async function createNewGame(playerName, playerId) {
    const gameId = generateUUID();
    const gameData = {
      id: gameId,
      name: `${playerName}'s Game`,
      players: [playerId],
      playerGrids: new Map(),
      playerShipsPlaced: new Map(),
      playerShipsLost: new Map()
    };
    return gameinterface.createGame(gameData);
  }
  
  async function getGameById(id) {
    return gameinterface.findGameById(id);
  }
  
  // Add other controller methods as needed
  
  module.exports = {
    createNewGame,
    getGameById,
    // Export other methods
  }