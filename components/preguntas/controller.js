// controller.js
const storage = require('./storage');

function obtenerPreguntas() {
  return new Promise((resolve, reject) => {
    storage.obtenerPreguntas()
      .then(data => resolve(data))
      .catch(error => reject('No se pudieron obtener las preguntas.'));
  });
}

function ingresarPregunta(pregunta) {
  return new Promise((resolve, reject) => {
    storage.ingresarPregunta(pregunta)
      .then(data => resolve(data))
      .catch(error => reject('No se pudo crear la pregunta.'));
  });
}

function modificarPregunta(id, pregunta) {
  return new Promise((resolve, reject) => {
    storage.modificarPregunta(id, pregunta)
      .then(data => resolve(data))
      .catch(error => reject('No se pudo modificar la pregunta.'));
  });
}

function eliminarPregunta(id) {
  return new Promise((resolve, reject) => {
    storage.eliminarPregunta(id)
      .then(data => resolve(data))
      .catch(error => reject('No se pudo eliminar la pregunta.'));
  });
}

module.exports = {
  obtenerPreguntas,
  ingresarPregunta,
  modificarPregunta,
  eliminarPregunta
};
