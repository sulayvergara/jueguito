// preguntas/interface.js
const express = require('express')

const controller = require('./controller')
const response = require('../../network/response')
const routes = express.Router()

// preguntas/interface.js
// preguntas/interface.js
routes.get('/', function(req, res) {
  controller.obtenerPreguntas()
      .then(data => res.status(200).json(data))  // Enviar los datos directamente como JSON
      .catch(error => res.status(400).json({ message: error }));  // Enviar el error como JSON
});

// Crear una nueva pregunta
routes.post('/', function(req, res) {
  controller.ingresarPregunta(req.body)
      .then(data => res.status(201).json(data))
      .catch(error => res.status(400).json({ message: error }));
});

// Modificar una pregunta existente
routes.put('/:id', function(req, res) {
  controller.modificarPregunta(req.params.id, req.body)
      .then(data => res.status(200).json(data))
      .catch(error => res.status(400).json({ message: error }));
});

// Eliminar una pregunta
routes.delete('/:id', function(req, res) {
  controller.eliminarPregunta(req.params.id)
      .then(data => res.status(200).json(data))
      .catch(error => res.status(400).json({ message: error }));
});

// Exportar las funciones para que puedan ser usadas en otros archivos
module.exports = routes
