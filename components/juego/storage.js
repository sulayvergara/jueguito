const Game = require('./model');

async function addGame(gameData) {
    const game = new Game(gameData);
    return await game.save();
}

async function getGame(id) {
    return await Game.findById(id).populate('players').populate('winner');
}

async function updateGame(id, gameData) {
    return await Game.findByIdAndUpdate(id, gameData, { new: true });
}

async function getAllGames() {
    return await Game.find().populate('players').populate('winner');
}

module.exports = {
    add: addGame,
    get: getGame,
    update: updateGame,
    getAll: getAllGames
};