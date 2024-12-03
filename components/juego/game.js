const UserController = require('../usuario/controller');
const GameController = require('./controller');

class Game {
  constructor(id, name, players) {
    this.id = id;
    this.name = name;
    this.players = players;
    this.isListed = true;
  }

  static async createGame(playerName, playerId) {
    const game = await GameController.createNewGame(playerName, playerId);
    const user = await UserController.getUserById(playerId);
    user.games.push(game._id);
    await user.save();
    return new Game(game.id, game.name, game.players);
  }

  static async getGame(gameId) {
    const game = await GameController.getGameById(gameId);
    if (game) {
      return new Game(game.id, game.name, game.players);
    }
    return null;
  }

  async addPlayer(playerId) {
    const game = await GameController.getGameById(this.id);
    const user = await UserController.getUserById(playerId);
    game.players.push(user._id);
    user.games.push(game._id);
    await Promise.all([game.save(), user.save()]);
    this.players = game.players;
  }

  isGameFull() {
    return this.players.length >= 2;
  }

  isGameEmpty() {
    return this.players.length === 0;
  }

  // Add other game methods as needed
}

module.exports = Game;