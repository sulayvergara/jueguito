const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/create', async (req, res) => {
    try {
        const { players } = req.body;
        const game = await controller.createGame(players);
        res.status(201).json({ message: 'Game created successfully', game });
    } catch (error) {
        res.status(400).json({ message: 'Error creating game', error: error.message });
    }
});

router.put('/:id/end', async (req, res) => {
    try {
        const { winner } = req.body;
        const game = await controller.endGame(req.params.id, winner);
        res.json({ message: 'Game ended successfully', game });
    } catch (error) {
        res.status(400).json({ message: 'Error ending game', error: error.message });
    }
});

router.post('/:id/move', async (req, res) => {
    try {
        const { player, position, result } = req.body;
        const game = await controller.addMove(req.params.id, player, position, result);
        res.json({ message: 'Move added successfully', game });
    } catch (error) {
        res.status(400).json({ message: 'Error adding move', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const game = await controller.getGameDetails(req.params.id);
        res.json(game);
    } catch (error) {
        res.status(404).json({ message: 'Game not found', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const games = await controller.getAllGames();
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching games', error: error.message });
    }
});

module.exports = router;