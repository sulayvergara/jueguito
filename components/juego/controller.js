const storage = require('./storage');

async function createGame(players) {
    const gameData = {
        players: players,
        rounds: 0,
        status: 'in_progress'
    };
    return await storage.add(gameData);
}

async function endGame(id, winner) {
    const gameData = {
        winner: winner,
        endTime: new Date(),
        status: 'completed'
    };
    return await storage.update(id, gameData);
}

async function addMove(id, player, position, result) {
    const game = await storage.get(id);
    game.moves.push({
        player: player,
        position: position,
        result: result,
        round: game.rounds + 1
    });
    game.rounds += 1;
    return await storage.update(id, game);
}

async function getGameDetails(id) {
    return await storage.get(id);
}

async function getAllGames() {
    return await storage.getAll();
}

module.exports = {
    createGame,
    endGame,
    addMove,
    getGameDetails,
    getAllGames
};