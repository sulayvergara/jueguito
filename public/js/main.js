(function (_, d) {
    // Global State
    const state = {
      playerId: localStorage.getItem('playerId') || '',
      games: [],
    };
  
    d.addEventListener('DOMContentLoaded', () => {
      // UI References
      const tabTriggers = d.querySelectorAll('.tab-trigger');
      const secondaryButtons = d.querySelectorAll('.secondary-btn');
      const gamesList = d.querySelector('#games-list');
      const joinForm = d.querySelector('#join-form');
      const createForm = d.querySelector('#create-form');
  
      // Obtener el nombre del usuario del localStorage
      const userName = localStorage.getItem('userName');

      // Auto-completar campos de nombre si existe
      if (userName) {
        const joinNameInput = joinForm.querySelector('input[name="playerName"]');
        const createNameInput = createForm.querySelector('input[name="playerName"]');
        if (joinNameInput) {
          joinNameInput.value = userName;
          joinNameInput.readOnly = true; // Bloquear el campo
        }
        
        if (createNameInput) {
            createNameInput.value = userName;
            createNameInput.readOnly = true; // Bloquear el campo
        }
      }

      // Init function
      (async function init() {
        const hasPlayerNoId = state.playerId === '';
  
        if (hasPlayerNoId) {
          state.playerId = generateUUID();
          localStorage.setItem('playerId', state.playerId);
        }
  
        // Get list of available games from server
        state.games = await fetchGames();
        updateGamesList(state.games, gamesList);
  
        [joinForm, createForm].forEach((form) => {
          const hiddenInput = d.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.value = state.playerId;
          hiddenInput.name = 'playerId';
          form.appendChild(hiddenInput);
        });
  
        // Register UI Event Listeners
        tabTriggers.forEach((tabTrigger) => {
          tabTrigger.addEventListener('click', async (e) => {
            const elementId = e.target.closest('button').id;
  
            const allTabs = d.querySelectorAll('.tab');
            allTabs.forEach((tab) => tab.classList.add('hidden'));
            d.querySelector(`#${e.target.dataset.targets}`).classList.remove(
              'hidden',
            );
  
            if (elementId === 'join-btn') {
              state.games = await fetchGames();
              updateGamesList(state.games, gamesList);
            }
          });
        });
  
        secondaryButtons.forEach((button) => {
          button.addEventListener('click', async (e) => {
            const elementId = e.target.closest('button').id;
  
            switch (elementId) {
              case 'refresh-games-btn':
                e.preventDefault();
                state.games = await fetchGames();
                updateGamesList(state.games, gamesList);
                break;
              case 'toggle-music-btn':
                console.log('Toggle Music Btn Pressed!');
                alert('Coming Soon!');
                break;
              case 'toggle-sound-btn':
                console.log('Toggle Sound Btn Pressed!');
                alert('Coming Soon!');
                break;
              case 'toggle-fullscreen-btn':
                toggleFullScreen(d.body);
                break;
            }
          });
        });
      })();
    });
  
    // Update games list
    function updateGamesList(gamesData, gamesListElement) {
      gamesListElement.innerHTML = '';

      // Obtener el nombre del usuario actual
      const currentUserName = localStorage.getItem('userName');

      // Filtrar las partidas donde el usuario actual es el creador
      const availableGames = gamesData.filter(game => {
        return game.players[0].playerName !== currentUserName;
      });

      if (availableGames.length > 0) {
        availableGames.forEach((game) => {
          const hostName = game.players[0].playerName || 'Jugador desconocido';
          gamesListElement.innerHTML += `
            <option value="${game.id}">Partida de ${hostName} (${game.players.length}/2)</option>
          `;
        });
      } else {
        gamesListElement.innerHTML = '<option value="">No hay partidas disponibles</option>';
      }
    }
  
    // Fetch list of games from server
    async function fetchGames() {
      const games = await (await fetch('/games')).json();
      return games;
    }
  
    // Toggle Fullscreen
    function toggleFullScreen(elem) {
      if (
        (d.fullScreenElement !== undefined && d.fullScreenElement === null) ||
        (d.msFullscreenElement !== undefined && d.msFullscreenElement === null) ||
        (d.mozFullScreen !== undefined && !d.mozFullScreen) ||
        (d.webkitIsFullScreen !== undefined && !d.webkitIsFullScreen)
      ) {
        if (elem.requestFullScreen) {
          elem.requestFullScreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
          elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } else {
        if (d.cancelFullScreen) {
          d.cancelFullScreen();
        } else if (d.mozCancelFullScreen) {
          d.mozCancelFullScreen();
        } else if (d.webkitCancelFullScreen) {
          d.webkitCancelFullScreen();
        } else if (d.msExitFullscreen) {
          d.msExitFullscreen();
        }
      }
    }
  })(window, document);
  
  function playClickSound() {
    const sound = document.getElementById('clickSound');
    sound.currentTime = 0; // Reinicia el sonido si ya está reproduciéndose
    sound.play();
  }

  const generateUUID = () =>
    Math.random().toString(36).substring(2) + Date.now().toString(36);