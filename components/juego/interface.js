const express = require('express');
const storage = require('./storage');


function createGame(gameData) {
  return storage.createGame(gameData);
}

function findGameById(id) {
  return storage.findGameById(id);
}

// Add other interface methods as needed

module.exports = {
  createGame,
  findGameById,
  // Export other methods
};