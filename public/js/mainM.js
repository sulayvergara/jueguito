function cargarPreguntas() {
  fetch('/preguntas')
      .then(response => response.json())
      .then(preguntas => {
          const lista = document.getElementById('questionList');
          lista.innerHTML = '';

          preguntas.forEach(pregunta => {
              const div = document.createElement('div');
              div.className = 'question-item';
              div.innerHTML = `
                          <p><strong>${pregunta.question}</strong></p>
                          <ul>
                              ${pregunta.options.map(opt =>
                  `<li>${opt.option}. ${opt.text} ${opt.option === pregunta.answer ? '✓' : ''}</li>`
              ).join('')}
                          </ul>
                          <button onclick="eliminarPregunta('${pregunta._id}')">Eliminar</button>
                      `;
              lista.appendChild(div);
          });
      })
      .catch(error => mostrarError('Error al cargar preguntas'));
};

function crearPregunta() {
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

  // Enviar al servidor
  fetch('/preguntas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pregunta)
  })
      .then(response => response.json())
      .then(data => {
          limpiarFormulario();
          cargarPreguntas();
          mostrarError('Pregunta creada con éxito');
      })
      .catch(error => mostrarError('Error al crear la pregunta'));
}

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
function eliminarPregunta(id) {
  if (confirm('¿Eliminar esta pregunta?')) {
      fetch(`/preguntas/${id}`, {
          method: 'DELETE'
      })
          .then(response => {
              cargarPreguntas();
              mostrarError('Pregunta eliminada');
          })
          .catch(error => mostrarError('Error al eliminar'));
  }
}

function limpiarFormulario() {
  document.getElementById('questionText').value = '';
  document.getElementById('option1').value = '';
  document.getElementById('option2').value = '';
  document.getElementById('option3').value = '';
  document.getElementById('correct1').checked = false;
  document.getElementById('correct2').checked = false;
  document.getElementById('correct3').checked = false;
}

function mostrarError(mensaje) {
  document.getElementById('error').textContent = mensaje;
  setTimeout(() => {
      document.getElementById('error').textContent = '';
  }, 3000);
}

function mostrarFormulario() {
  // Oculta el botón y muestra el formulario
  document.getElementById('btn-new').style.display = 'none';
  document.getElementById('formulario').style.display = 'block';
}
