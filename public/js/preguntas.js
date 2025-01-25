const questionContainer = document.getElementById('question-container');
const socket = io(); 

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
                    optionText.style.color = 'green';
                }

                optionElement.appendChild(optionText);
                questionElement.appendChild(optionElement);
            });

            questionsContainer.appendChild(questionElement);
        });
    });


    // Escuchar errores
    socket.on('questionsError', (error) => {
        console.error('Error al obtener preguntas:', error.message);
        alert('Hubo un error al cargar las preguntas.');
    });
});

socket.on('error', (message) => {
    console.error('Error: ',message);
    alert(message);
});

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

