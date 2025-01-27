const Usuario = require('./model');

async function addUsuario(usuarioData) {
    const usuario = new Usuario(usuarioData);
    return await usuario.save();
}

async function getUsuario(email) {
    return await Usuario.findOne({ email });
}

async function updateUsuario(email, updateData) {
    return await Usuario.findOneAndUpdate({ email }, updateData, { new: true });
}

async function deleteUsuario(email) {
    return await Usuario.findOneAndDelete({ email });
}

async function getEstudiantes() {
    try {
      // Busca usuarios cuyo rol sea 'estudiante'
      const estudiantes = await Usuario.find({ rol: 'estudiante' });
      return estudiantes; // Retorna todos los estudiantes encontrados
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      throw error;
    }
  }

module.exports = {
    add: addUsuario,
    get: getUsuario,
    update: updateUsuario,
    delete: deleteUsuario,
    getEstudiantes
};