
const Juego = require('./model');


async function createGame(gameData) {
  const game = new Juego(gameData);
  return await game.save();
}

async function findGameById(id) {
  return await Juego.findOne({ id });
}

// Add other CRUD operations as needed

module.exports = {
  createGame,
  findGameById,
  // Export other functions
};