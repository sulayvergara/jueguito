const questionContainer = document.getElementById('question-container');
const studentsContainer = document.getElementById('students-container');
const formulario = document.getElementById('formulario')
const socket = io(); 

document.getElementById('ingresar-pregunta').addEventListener('click', () => {
    // Obtener los valores del formulario
    const preguntaTexto = document.getElementById('questionText').value;
    const opcion1 = document.getElementById('option1').value;
    const opcion2 = document.getElementById('option2').value;
    const opcion3 = document.getElementById('option3').value;

    // Determinar cuál es la respuesta correcta basada en el radio button seleccionado
    let respuestaCorrecta = '';
    if (document.getElementById('correct1').checked) respuestaCorrecta = 'A';
    if (document.getElementById('correct2').checked) respuestaCorrecta = 'B';
    if (document.getElementById('correct3').checked) respuestaCorrecta = 'C';

    // Crear el objeto con el formato correcto
    const pregunta = {
        question: preguntaTexto,
        options: [
            {
                option: "A",
                text: opcion1
            },
            {
                option: "B",
                text: opcion2
            },
            {
                option: "C",
                text: opcion3
            }
        ],
        answer: respuestaCorrecta
    };

    // Validar que todos los campos estén llenos
    if (!preguntaTexto || !opcion1 || !opcion2 || !opcion3 || !respuestaCorrecta) {
        mostrarError('Por favor completa todos los campos y selecciona una respuesta correcta');
        return;
    }
    // Emitir evento de registro a través de socket
    socket.emit('addQuestion', pregunta);
    limpiarFormulario();
    socket.emit('getQuestions');
});
// Función auxiliar para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('questionText').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    document.getElementById('option3').value = '';
    document.getElementById('correct1').checked = false;
    document.getElementById('correct2').checked = false;
    document.getElementById('correct3').checked = false;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cargando preguntas automáticamente...');
    
    // Emitir el evento para obtener preguntas al cargar la página
    socket.emit('getQuestions');

    // Escuchar el resultado exitoso
    socket.on('questionsSuccess', (data) => {
        console.log('Preguntas recibidas:', data.questions);
        // Renderizar las preguntas en la página
        const questionsContainer = document.getElementById('question-container');
        questionsContainer.innerHTML = ''; // Limpiar contenido anterior
        data.questions.forEach((question) => {
            const questionElement = document.createElement('div');
            questionElement.classList.add('question');

            // Mostrar la pregunta
            const questionText = document.createElement('h3');
            questionText.textContent = question.question;
            questionElement.appendChild(questionText);

            // Mostrar las opciones
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');

                // Crear el texto de la opción
                const optionText = document.createElement('span');
                optionText.textContent = `${String.fromCharCode(65 + index)}: ${option.text}`;

                // Resaltar la opción correcta
                if (String.fromCharCode(65 + index) === question.answer) {
                    optionText.style.fontWeight = 'bold';
                    optionText.style.color = 'blue';
                }

                optionElement.appendChild(optionText);
                questionElement.appendChild(optionElement);
            });

            // Agregar botón de eliminar debajo de cada pregunta
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                const userConfirmed = confirm('¿Estás seguro de que deseas eliminar esta pregunta?');
                if (userConfirmed) {
                    // Emitir evento para eliminar la pregunta si el usuario confirma
                    socket.emit('deleteQuestion', question._id);
                    socket.emit('getQuestions');
                    // Eliminar la pregunta del DOM
                    questionElement.remove();
                } else {
                    // Si el usuario cancela, no hacer nada
                    console.log('Eliminación cancelada por el usuario.');
                }
            });
            questionElement.appendChild(deleteButton);
            questionsContainer.appendChild(questionElement);
        });
    });

    // Escuchar errores
    socket.on('questionsError', (error) => {
        console.error('Error al obtener preguntas:', error.message);
        alert('Hubo un error al cargar las preguntas.');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cargando estudiantes automáticamente...');

    // Emitir el evento para obtener estudiantes al cargar la página
    socket.emit('getStudents');

    // Escuchar el resultado exitoso
    socket.on('studentsSuccess', (data) => {
        console.log('Estudiantes recibidos:', data.estudiantes);
        // Renderizar los estudiantes en la página
        const studentsContainer = document.getElementById('students-container');
        studentsContainer.innerHTML = ''; // Limpiar contenido anterior
        data.estudiantes.forEach((estudiantes) => {
            const studentElement = document.createElement('div');
            studentElement.classList.add('student');

            // Mostrar el nombre del estudiante
            const studentName = document.createElement('h3');
            studentName.textContent = `Nombre: ${estudiantes.nombre}`;
            studentElement.appendChild(studentName);

            // Mostrar el correo electrónico
            const studentEmail = document.createElement('p');
            studentEmail.textContent = `Correo: ${estudiantes.correo}`;
            studentElement.appendChild(studentEmail);
            });
            studentElement.appendChild(deleteButton);
            studentsContainer.appendChild(studentElement);
        });
    });
    // Escuchar errores
    socket.on('studentsError', (error) => {
        console.error('Error al obtener estudiantes:', error.message);
        alert('Hubo un error al cargar los estudiantes.');
});

socket.on('error', (message) => {
    console.error('Error: ',message);
    alert(message);
});

function mostrarError(mensaje) {
    document.getElementById('error').textContent = mensaje;
    setTimeout(() => {
        document.getElementById('error').textContent = '';
    }, 3000);
}

function mostrarFormulario() {
    // Ocultar el menú principal
    const mainTab = document.getElementById('main-tab');
    mainTab.classList.add('hidden');

    // Mostrar la pestaña de gestionar preguntas
    const preguntasTab = document.getElementById('preguntas-tab');
    preguntasTab.classList.remove('hidden');
}

function mostrarMenu() {
    // Mostrar el menú principal
    const mainTab = document.getElementById('main-tab');
    mainTab.classList.remove('hidden');

    // Ocultar la pestaña de gestionar preguntas
    const preguntasTab = document.getElementById('preguntas-tab');
    preguntasTab.classList.add('hidden');
}

function FormularioNuevaPregunta() {
    // Obtener el botón y el formulario
    const btnNew = document.getElementById('btn-new');
    const formulario = document.getElementById('formulario');

    // Mostrar el formulario
    formulario.style.display = 'block';
    btnNew.style.display = 'none'
}

function playClickSound() {
    const sound = document.getElementById('clickSound');
    sound.currentTime = 0; // Reinicia el sonido si ya está reproduciéndose
    sound.play();
}
