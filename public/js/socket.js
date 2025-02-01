const userController = require('../../components/usuario/controller');
const questionsController = require('../../components/preguntas/controller');
const gamesController = require('../../components/juego/controller');

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
                socket.emit('loginError', 'El correo o la contraseña es incorrecta. Vuelve a intentarlo.');
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

const addquestionHandler = (socket) => {
    socket.on('addQuestion', async (question) => {
        console.log('Datos de registro recibidos:', question);
        try {
            const newQuestions = await questionsController.ingresarPregunta(question);
            socket.emit('registerSuccess', { message: 'Pregunta agregada con éxito', pregunta: newQuestions });
        } catch (error) {
            console.error('Error al registrar pregunta:', error);
            socket.emit('registerError', { message: 'Error al registrar pregunta' });
        }
    });
};

const questionsHandler = (socket) => {
    socket.on('getQuestions', async () => {
        console.log('Solicitud de obtener preguntas recibida');
        try {
            const questions = await questionsController.obtenerPreguntas(); // Método para obtener preguntas
            socket.emit('questionsSuccess', { message: 'Preguntas obtenidas con éxito', questions });
        } catch (error) {
            console.error('Error al obtener preguntas:', error);
            socket.emit('questionsError', { message: 'Error al obtener preguntas' });
        }
    });
};

const deletequestionHandler = (socket) => {
    socket.on('deleteQuestion', async (id) => {
        console.log('Datos de Eliminacion recibidos:', id);
        try {
            const delQuestions = await questionsController.eliminarPregunta(id);
            socket.emit('deleteSuccess', { message: 'Pregunta eliminada con éxito', id : delQuestions});
        } catch (error) {
            console.error('Error al eliminar pregunta:', error);
            socket.emit('deleteError', { message: 'Error al eliminar pregunta' });
        }
    });
};

const StudentsHandler = (socket) => {
    socket.on('getStudents', async () => {
        console.log('Solicitud de obtener estudiantes recibida');
        try {
            const estudiantes = await userController.getEstudiantes(); // Método para obtener preguntas
            socket.emit('studentsSuccess', { message: 'Estudiantes obtenidos con éxito', estudiantes });
        } catch (error) {
            console.error('Error al obtener preguntas:', error);
            socket.emit('studentsError', { message: 'Error al obtener preguntas' });
        }
    });
};

const GameHandler = (socket) => {
    socket.on('getGames', async () => {
        console.log('Solicitud de obtener partidas recibida');
        try {
            const games = await gamesController.getAllGames(); // Método para obtener preguntas
            socket.emit('gamesSuccess', { message: 'partidas obtenidas con éxito', games});
        } catch (error) {
            console.error('Error al obtener partidas:', error);
            socket.emit('gamesError', { message: 'Error al obtener partidas' });
        }
    });
};

module.exports = { registerHandler, loginHandler , questionsHandler, addquestionHandler, 
    deletequestionHandler, StudentsHandler, GameHandler,
};
