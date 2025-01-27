const storage = require('./storage');

async function addUsuario(usuarioData) {
    usuarioData.fecha_registro = new Date();
    usuarioData.fecha_actualizacion = new Date();
    return await storage.add(usuarioData);
}

async function getUsuario(email) {
    return await storage.get(email);
}

async function updateUsuario(email, updateData) {
    if (updateData.clave) {
        updateData.clave =updateData.clave;
    }
    updateData.fecha_actualizacion = new Date();
    return await storage.update(email, updateData);
}

async function deleteUsuario(email) {
    return await storage.delete(email);
}

async function login(email, clave) {
    try {
        console.log('Intentando iniciar sesión con:', email);
        const user = await getUsuario(email);
        console.log('Usuario encontrado:', user);

        if (user && clave === user.clave.trim) {
            return {
                id: user._id,
                nombre: user.nombre,
                email: user.email,
                usuario: user.usuario,
                rol: user.rol,
            };
        }else {
            console.log('Credenciales inválidas o usuario no encontrado');
        }
        return null;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

async function getEstudiantes() {
    return await storage.getEstudiantes();
}

module.exports = {
    addUsuario,
    getUsuario,
    updateUsuario,
    deleteUsuario,
    login,
    getEstudiantes
};