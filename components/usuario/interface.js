const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/registro', async (req, res) => {
    try {
        const usuario = await controller.addUsuario(req.body);
        res.status(201).json({ message: 'Usuario creado con éxito', usuario });
    } catch (error) {
        res.status(400).json({ message: 'Error al crear usuario', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const usuario = await controller.login(req.body.email, req.body.clave);
        if (user && clave === user.clave) {
            res.json({ message: 'Login exitoso', usuario });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

router.get('/:email', async (req, res) => {
    try {
        const usuario = await controller.getUsuario(req.params.email);
        if (usuario) {
            res.json(usuario);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

router.put('/:email', async (req, res) => {
    try {
        const usuario = await controller.updateUsuario(req.params.email, req.body);
        if (usuario) {
            res.json({ message: 'Usuario actualizado con éxito', usuario });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar usuario', error: error.message });
    }
});

router.delete('/:email', async (req, res) => {
    try {
        const usuario = await controller.deleteUsuario(req.params.email);
        if (usuario) {
            res.json({ message: 'Usuario eliminado con éxito' });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
    }
});

module.exports = router;