const mongoose = require('mongoose');
const schema = mongoose.Schema;

const req_string = {
    type: String,
    required: true
};

const req_date = {
    type: Date,
    required: true
};

const uni_string = {
    type: String,
    required: true,
    unique: true
};

const usuario_schema = new schema({
    nombre: req_string,
    apellido: req_string,
    curso: {
        type: String,
        required: function () {
            return this.rol === 'estudiante'; // Curso requerido solo para estudiantes
        }
    },
    paralelo: {
        type: String,
        required: function () {
            return this.rol === 'estudiante'; // Paralelo requerido solo para estudiantes
        }
    },
    email: uni_string,
    fecha_nacimiento: req_date,
    clave: req_string,
    usuario: {
        type: String,
        required: false,
    },
    rol: {
        type: String,
        required: true,
        enum: ['estudiante', 'profesor'], // Solo permite 'estudiante' o 'profesor'
    },
    // Campos adicionales solo para profesores
    especialidad: {
        type: String,
        required: function () {
            return this.rol === 'profesor'; // Especialidad requerida solo para profesores
        }
    },
    años_experiencia: {
        type: Number,
        required: function () {
            return this.rol === 'profesor'; // Años de experiencia requeridos solo para profesores
        },
        min: 0 // Asegura que no sea un número negativo
    },
    fecha_registro: Date,
    fecha_actualizacion: Date
}, {
    timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' }
});

// Middleware para generar el campo 'usuario'
usuario_schema.pre('save', function (next) {
    if (!this.nombre || !this.apellido) {
        return next(new Error('Nombre y apellido son requeridos para generar el campo usuario.'));
    }

    // Generar el campo 'usuario'
    this.usuario = `${this.nombre} ${this.apellido}`.trim();

    next();
});

const model = mongoose.model('usuario', usuario_schema);
module.exports = model;
