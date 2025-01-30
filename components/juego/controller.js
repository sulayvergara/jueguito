const gameinterface = require('./interface');
const generateUUID = require('../../components/helpers/generateUUID');
const Game = require('./model');

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
  
async function getAllGames() {
  try {
    const games = await Game.find(); // Obtiene todas las partidas
      return games;
  } catch (error) {
      console.error("Error al obtener las partidas:", error);
    throw new Error("No se pudieron obtener las partidas.");
  }
}
 

  module.exports = {
    createNewGame,
    getGameById,
    getAllGames,
   
    // Export other methods
  }