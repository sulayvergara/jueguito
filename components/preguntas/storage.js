const Question = require('./model');


// Función para obtener todas las preguntas de la base de datos
async function obtenerPreguntas() {
    try {
        return await Question.find({});
    } catch (error) {
        throw new Error('Error al obtener preguntas:', error);
    }
}

async function ingresarPregunta(pregunta) {
    try {
        // Validar que haya exactamente 3 opciones
        if (!pregunta.options || pregunta.options.length !== 3) {
            throw new Error('La pregunta debe tener exactamente 3 opciones');
        }

        // Validar que las opciones incluyan los campos necesarios
        pregunta.options.forEach(option => {
            if (!option.option || !option.text) {
                throw new Error('Cada opción debe incluir "option" y "text"');
            }
            if (!['A', 'B', 'C'].includes(option.option)) {
                throw new Error('Las opciones deben ser "A", "B" o "C"');
            }
        });

        // Validar que la respuesta correcta exista en las opciones
        const isValidAnswer = pregunta.options.some(option => option.option === pregunta.answer);
        if (!isValidAnswer) {
            throw new Error('La respuesta correcta debe coincidir con una de las opciones proporcionadas');
        }

        // Crear la nueva pregunta basada en el modelo actualizado
        const nuevaPregunta = new Question(pregunta);
        return await nuevaPregunta.save();
    } catch (error) {
        throw new Error('Error al crear pregunta: ' + error.message);
    }
}


async function modificarPregunta(id, pregunta) {
    try {
        if (!pregunta.options || pregunta.options.length !== 3) {
            throw new Error('La pregunta debe tener exactamente 3 opciones');
        }

        const correctOptions = pregunta.options.filter(option => option.isCorrect);
        if (correctOptions.length !== 1) {
            throw new Error('Debe haber exactamente una opción correcta');
        }

        const preguntaActualizada = await Question.findByIdAndUpdate(
            id,
            pregunta,
            { 
                new: true,
                runValidators: true  // Esto asegura que se ejecuten las validaciones del esquema
            }
        );
        if (!preguntaActualizada) {
            throw new Error('Pregunta no encontrada');
        }
        return preguntaActualizada;
    } catch (error) {
        throw new Error('Error al modificar pregunta: ' + error.message);
    }
}

async function eliminarPregunta(id) {
    try {
        const preguntaEliminada = await Question.findByIdAndDelete(id);
        if (!preguntaEliminada) {
            throw new Error('Pregunta no encontrada');
        }
        return preguntaEliminada;
    } catch (error) {
        throw new Error('Error al eliminar pregunta: ' + error.message);
    }
}

module.exports = {
    obtenerPreguntas,
    ingresarPregunta,
    modificarPregunta,
    eliminarPregunta
};