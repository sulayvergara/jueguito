const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/registro', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            email, 
            clave, 
            curso, 
            paralelo, 
            fecha_nacimiento, 
            rol, 
            especialidad, 
            años_experiencia 
        } = req.body;

        // Agregar log para verificar los datos recibidos
        console.log('Datos recibidos para registro:', req.body);

        // Verificar que el rol esté presente y sea válido
        if (!rol || !['estudiante', 'profesor'].includes(rol)) {
            return res.status(400).json({ message: 'El campo rol es requerido y debe ser "estudiante" o "profesor"' });
        }

        // Verificar que los campos requeridos estén presentes según el rol
        if (!nombre || !apellido || !email || !clave) {
            return res.status(400).json({ message: 'Faltan datos requeridos: nombre, apellido, email o clave' });
        }

        if (rol === 'estudiante' && (!curso || !paralelo)) {
            return res.status(400).json({ message: 'Faltan datos requeridos: curso y paralelo son obligatorios para estudiantes' });
        }

        if (rol === 'profesor' && (!especialidad || años_experiencia == null)) {
            return res.status(400).json({ message: 'Faltan datos requeridos: especialidad y años de experiencia son obligatorios para profesores' });
        }

        // Crear el usuario utilizando el controlador
        const usuario = await controller.addUsuario({
            nombre,
            apellido,
            email,
            clave,
            curso,
            paralelo,
            fecha_nacimiento,
            rol,
            especialidad,
            años_experiencia
        });

        res.status(201).json({ message: 'Usuario creado con éxito', usuario });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
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