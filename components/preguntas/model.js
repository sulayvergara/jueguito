// preguntas/model.js
const mongoose = require('mongoose');

// Definir el esquema para las preguntas
const questionSchema = new mongoose.Schema({
    question: { 
        type: String, 
        required: true 
    },
    options: { 
        type: [{
            option: { 
                type: String, 
                required: true, 
                enum: ['A', 'B', 'C'] // Solo permite las opciones A, B, C
            },
            text: { 
                type: String, 
                required: true 
            }
        }], 
        validate: {
            validator: function(options) {
                return options.length === 3; // Valida que siempre haya 3 opciones
            },
            message: 'La pregunta debe tener exactamente 3 opciones'
        },
        required: true
    },
    answer: { 
        type: String, 
        required: true, 
        enum: ['A', 'B', 'C'], // La respuesta correcta debe ser A, B o C
        validate: {
            validator: function(value) {
                return this.options.some(option => option.option === value); // Verifica que la respuesta exista en las opciones
            },
            message: 'La respuesta debe coincidir con una de las opciones proporcionadas'
        }
    }
});

// Validación adicional para asegurar que solo una opción sea correcta
//questionSchema.pre('save', function(next) {
 // const correctOptions = this.options.filter(option => option.isCorrect);
//  if (correctOptions.length !== 1) {
//      next(new Error('Debe haber exactamente una opción correcta'));
//  }
//  next();
//});

// Crear el modelo a partir del esquema
const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
