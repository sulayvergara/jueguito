const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const gameContainer = document.getElementById('game-container');
const questionContainer = document.getElementById('question-container');
const socket = io(); 

// Login function
document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Intentando iniciar sesion con: ', email);
    console.log('contraseña ', password);
    socket.emit('login', { email, password });
});

// Register function
document.getElementById('register-btn').addEventListener('click', () => {
    // Obtener el valor del rol seleccionado
    const rol = document.getElementById('reg-rol').value;

    // Construir el objeto usuario con los campos comunes
    const usuario = {
        nombre: document.getElementById('reg-nombre').value,
        apellido: document.getElementById('reg-apellido').value,
        email: document.getElementById('reg-email').value,
        fecha_nacimiento: document.getElementById('reg-fecha-nacimiento').value,
        clave: document.getElementById('reg-clave').value,
        rol: rol
    };

    // Agregar campos adicionales dependiendo del rol
    if (rol === 'estudiante') {
        usuario.curso = document.getElementById('reg-curso').value;
        usuario.paralelo = document.getElementById('reg-paralelo').value;
    } else if (rol === 'profesor') {
        usuario.especialidad = document.getElementById('reg-especialidad').value;
        usuario.años_experiencia = parseInt(document.getElementById('reg-experiencia').value, 10);
    }

    // Emitir evento de registro a través de socket
    socket.emit('register', usuario);

    // Log para depuración
    console.log('Botón de registro clickeado, datos enviados:', usuario);
});

document.getElementById('reg-rol').addEventListener('change', function () {
    const rol = this.value; // Obtener el rol seleccionado
    const estudianteFields = document.getElementById('estudiante-fields');
    const profesorFields = document.getElementById('profesor-fields');

    if (rol === 'estudiante') {
        estudianteFields.style.display = 'block';
        profesorFields.style.display = 'none';
    } else if (rol === 'profesor') {
        profesorFields.style.display = 'block';
        estudianteFields.style.display = 'none';
    } else {
        // Ocultar ambos si no se selecciona un rol válido
        estudianteFields.style.display = 'none';
        profesorFields.style.display = 'none';
    }
});


// Toggle between login and register forms
document.getElementById('show-register').addEventListener('click', () => {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', () => {
    registerContainer.style.display = 'none';
    loginContainer.style.display = 'block';
});

// Socket.IO event handlers for authentication

socket.on('loginSuccess', (usuario) => {
    console.log('Datos del usuario:', usuario);

    // Mostrar mensaje de bienvenida
    document.getElementById('game-status').textContent = `Bienvenido, ${usuario.nombre} ${usuario.apellido}!`;

    // Validar el rol y redirigir según corresponda
    if (usuario.rol === 'profesor') {
        window.location.href = './menuMaestro.html'; // Redirige al menú del profesor
    } else if (usuario.rol === 'estudiante') {
        window.location.href = './menu.html'; // Redirige al menú del estudiante
    } else {
        alert('Rol desconocido. Por favor, contacte al administrador.');
    }
});

socket.on('registerSuccess', () => {
    registerContainer.style.display = 'none';
    loginContainer.style.display = 'block';
    alert('Registro exitoso. Por favor, inicia sesión.');
});

socket.on('error', (message) => {
    console.error('Error: ',message);
    alert(message);
});


