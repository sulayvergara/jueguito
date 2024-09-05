const mongoose = require('mongoose')
const schema = mongoose.Schema



const req_string = {
    type: String,
    required: true
}

const req_date = {
    type: Date,
    required: true
}

const uni_string = {
    type: String,
    required: true,
    unique: true
}

const usuario_schema = new schema({
    nombre: req_string,
    apellido: req_string,
    curso: req_string,
    paralelo: req_string,
    email: uni_string,
    fecha_nacimiento: req_date,
    clave: req_string,
    usuario: {
        type: String,
        required: false,
    },
    fecha_registro: Date,
    fecha_actualizacion: Date
}, {
    timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' }
})

usuario_schema.pre('save', function(next) {


    if (!this.nombre || !this.apellido) {
        return next(new Error('Nombre y apellido son requeridos para generar el campo usuario.'));
      }
    this.usuario = `${this.nombre} ${this.apellido}`.trim();
    next();
  });

const model = mongoose.model('usuario', usuario_schema)
module.exports = model