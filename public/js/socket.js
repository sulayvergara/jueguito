const userController = require('../../components/usuario/controller');

const registerHandler = (socket) => {
    socket.on('register', async (userData) => {
        console.log('Datos de registro recibidos:', userData);
        try {
            const newUser = await userController.addUsuario(userData);
            socket.emit('registerSuccess', { message: 'Usuario registrado con éxito', user: newUser });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            socket.emit('registerError', { message: 'Error al registrar usuario' });
        }
    });
};

const loginHandler = (socket) => {
    socket.on('login', async ({ email, password }) => {
        try {
            console.log('Datos de login recibidos en el servidor:', { email, password });
            const user = await userController.getUsuario(email);
            if (!user) {
                socket.emit('loginError', 'Usuario no encontrado');
                return;
            }
            
            const isPasswordValid = password === user.clave;
            console.log('Contraseña válida:', isPasswordValid);

            if (isPasswordValid) {
                socket.emit('loginSuccess', {
                    id: user._id,
                    nombre: user.nombre,
                    email: user.email,
                    apellido: user.apellido,
                    rol: user.rol
                });
            } else {
                socket.emit('loginError', 'Contraseña incorrecta');
            }
        } catch (error) {
            console.error('Error en login en el servidor:', error);
            socket.emit('loginError', 'Error al iniciar sesión');
        }
    });
};


module.exports = { registerHandler, loginHandler };
