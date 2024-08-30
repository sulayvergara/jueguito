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

module.exports = {
    add: addUsuario,
    get: getUsuario,
    update: updateUsuario,
    delete: deleteUsuario
};