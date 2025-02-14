const AudioManager = {
  backgroundMusic: new Audio('/assets/audios/Battleship.ogg'),
  sounds: {
    //click: new Audio('/assets/audios/click.wav'),
    explosion: new Audio('/assets/audios/Explosion.mp3'),
    splash: new Audio('/assets/audios/disparo_al_agua.wav'),
    victory: new Audio('/assets/audios/Fin del juego.wav'),
    defeat: new Audio('/assets/audios/Fin del juego.wav'),
    questionAppear: new Audio('/assets/audios/alarma.wav'),
    //correctAnswer: new Audio('/assets/audios/correct-answer.mp3'),
    //wrongAnswer: new Audio('/assets/audios/wrong-answer.mp3'),
    //countdown: new Audio('/assets/audios/.mp3')
  },
  settings: {
    musicEnabled: true,
    soundEnabled: true
  },

  init() {
    // Configure background music
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3;

    // Configure sound effects
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.5;
    });

    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('audioSettings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
      if (!this.settings.musicEnabled) this.backgroundMusic.pause();
    }
  },

  toggleMusic() {
    this.settings.musicEnabled = !this.settings.musicEnabled;
    if (!this.backgroundMusic) return;

    if (this.backgroundMusic.paused) {
      this.backgroundMusic.play();
      this.settings.musicEnabled = true;
      
    } else {
      this.backgroundMusic.pause();
      this.settings.musicEnabled = false;
      
    }
    this.saveSettings();
  },

  toggleSound() {
    this.settings.soundEnabled = !this.settings.soundEnabled;
    this.saveSettings();
  },

  playSound(soundName) {
    if (this.settings.soundEnabled && this.sounds[soundName]) {
      const sound = this.sounds[soundName];
      sound.currentTime = 0;
      sound.play();
    }
  },

  saveSettings() {
    localStorage.setItem('audioSettings', JSON.stringify(this.settings));
  },
  loadSettings() {
    const savedSettings = localStorage.getItem("audioSettings");
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
      if (!this.settings.musicEnabled) {
        this.backgroundMusic.pause();
      }
    }
  }
};

// Cargar configuración guardada
AudioManager.saveSettings();

(function (w, d) {
  // Get data from query string
  const { playerName, game, playerId } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
  });

  const redirectToHomePage = () => {
    w.location = "./menu.html";
  };

  // If any of the query-string params was not set => redirect to home-screen
  (!playerName || !game || !playerId) && redirectToHomePage();

  // Init socket.io
  const socket = io();
  // Disconnect socket when browser window is closed
  w.onclose = socket.disconnect;

  // Initial Grid Data
  const initialGridData = getInitialGridData();

  // Strings
  const strings = {
    getInitialGameConsoleString: () => `Por favor, espere. Inicializando el juego...`,
    getInitialCurrentTurnString: () => "Inicializando el juego...",
    getLeaveConfirmText: () => `¿Estás seguro de que quieres dejar el juego?`,
    getEnemyGridCaption: () => "Enemigo",
    getHomeGridCaption: () => "Tú",
    getGameHasNotStartedErrorMessage: () =>
      "Todavía no puedes atacar, porque el juego no ha comenzado. Por favor, coloque todas sus barcos para que el juego comience!",
    getWrongFieldClickedErrorMessage: () =>
      "¡No tiene sentido hacer clic aquí! Haz clic en el campo de juego de tu enemigo para atacar sus barcos.",
    getGameIsAlreadyOverErrorMessage: () =>
      "¡Se acabó el juego! Puede dejar de hacer clic!",
  };
  
  // Game states
  const gameStates = {
    gameIsInitializing: "gameIsInitializing",
    gameInitialized: "gameInitialized",
    setShipsRound: "setShipsRound",
    gameRunning: "gameRunning",
    gameOver: "gameOver",
    gameQuestion: "gameQuestion",
  };

  // Ship configurations
  const SHIPS = {
    fragata: { size: 1, count: 4 },
    destructor: { size: 2, count: 3 },
    submarino: { size: 3, count: 2 },
    acorazado: { size: 4, count: 1 },
    portaviones: { size: 5, count: 1 }
  };

  // Global state variables
  const state = {
    gameId: game,
    gameState: gameStates.gameIsInitializing,
    playerName: playerName,
    playerId: playerId,
    enemyPlayerGridData: initialGridData,
    PlayerGridData: initialGridData,
    currentRound: 0,
    yourTurn: false,
    selectedShip: null,
    orientation: 'horizontal', // or 'vertical'
    placedShips: {
      fragata: 0,
      destructor: 0,
      submarino: 0,
      acorazado: 0,
      portaviones: 0
    }
  };

  // Prohibit modification of state
  Object.freeze(gameStates);
  Object.seal(state);

  // Init game once DOM elements are fully loaded
  d.addEventListener("DOMContentLoaded", () => {
    // UI References
    const headerLogoLink = d.querySelector(".header .logo a");
    const currentRoundText = d.querySelector("#current-round-txt");
    const currentTurnText = d.querySelector("#current-turn-txt");
    const playerGrids = d.querySelectorAll(".grid");
    const enemyGrid = d.querySelector("#enemy-grid");
    const friendlyGrid = d.querySelector("#friendly-grid");
    const chatForm = d.querySelector("#console form");
    const chatMessagesList = d.querySelector("#chat-messages-list");
    const chatInput = d.querySelector("#chat-message-input");
    const showRulesBtn = d.querySelector("#show-rules-btn");
    const toggleMusicBtn = d.querySelector("#toogle-music-btn");
    const toggleSoundBtn = d.querySelector("#toogle-sound-btn");
    const toggleFullScreenBtn = d.querySelector("#toggle-fullscreen-btn");
    const leaveGameBtn = d.querySelector("#leave-game-btn");

    // Init Game functions
    (function init() {

      AudioManager.init();
      playerGrids.forEach((grid) => {
        grid.addEventListener("click", (e) => {
          const elementId = e.target.closest(".grid").id;
  
          if (e.target.classList.contains("cell")) {
            AudioManager.playSound('click');
          }
  
          // ... (rest of the click handler remains the same)
        });
      });

      // Join Game
      socket.emit("joinGame", {
        gameId: state.gameId,
        playerId: state.playerId,
        playerName: state.playerName,
      });
      
      // On receiving message
      socket.on("message", (message) =>
        addConsoleMessage(chatMessagesList, message)
      );

      // On receiving chatMessage
      socket.on("chatMessage", ({ playerName, message }) => {
        console.log(playerName, message);
        addConsoleMessage(chatMessagesList, message, playerName);
      });

      socket.on("nextRound", () => {
        state.currentRound++;
        currentRoundText.innerHTML = state.currentRound;
      });
      
      socket.on("yourTurn", (value) => {
        state.yourTurn = value;
        if (state.yourTurn) {
          currentTurnText.innerHTML = `Es tu turno!`;
        } else {
          currentTurnText.innerHTML = `Turno del otro jugador...`;
        }
      });
      socket.on('showQuestion', (preguntaData) => {
        if (state.gameState === gameStates.gameQuestion) {
          showQuizModal(preguntaData);
        }
      });
      
      socket.on('startCountdown', (count) => {
        const countdownDiv = document.createElement('div');
        countdownDiv.id = 'countdown';
        countdownDiv.className = 'countdown-overlay';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'countdown-content';
        
        contentDiv.innerHTML = `
          <h2>¡Comienza en!</h2>
          <span class="countdown-number">${count}</span>
        `;
        
        countdownDiv.appendChild(contentDiv);
        document.body.appendChild(countdownDiv);
      });

      socket.on('correctAnswer', (data) => {
        hideQuizModal();
      });
      
      socket.on('wrongAnswer', () => {
        // No ocultamos el modal, permitiendo más intentos dentro del tiempo límite
        addConsoleMessage(chatMessagesList, "Respuesta incorrecta, ¡inténtalo de nuevo!");
        //socket.emit('gameQuestion')
      });

      socket.on('SaltoPreguntaCliente', () => {
        socket.emit('gameQuestion')
      });

      socket.on('updateCountdown', (count) => {
        const countdownDiv = document.getElementById('countdown');
        const numberSpan = countdownDiv?.querySelector('.countdown-number');
        
        if (numberSpan) {
          numberSpan.textContent = count;
          
          if (count <= 0) {
            countdownDiv.classList.add('fade-out');
            setTimeout(() => {
              countdownDiv.remove();
            }, 500);
          }
        }
      });

      socket.on('timeExpired', () => {
        hideQuizModal();
      });

      socket.on('hideQuizModal', () => {
        hideQuizModal();
      });
      
      socket.on("updateGrid", ({ gridToUpdate, data }) => {
        switch (gridToUpdate) {
          case "enemyGrid":
            updateGrid(enemyGrid, "Enemy Waters", data);
            break;

          case "friendlyGrid":
            updateGrid(friendlyGrid, "Home Waters", data);
            break;
        }
      });

      socket.on("partidaTerminada", (data) => {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over-overlay';
        
        const mensaje = state.playerId === data.ganadorId ? 
            '¡Has Ganado!' : 
            '¡Has Perdido!';
        
        gameOverDiv.innerHTML = `
            <div class="game-over-content">
                <h2>${mensaje}</h2>
                <p>Volviendo al menú en 5 segundos...</p>
            </div>
        `;
        
        document.body.appendChild(gameOverDiv);
        
        // Iniciar cuenta regresiva y redireccionar
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            countdown--;
            const countdownText = gameOverDiv.querySelector('p');
            countdownText.textContent = `Volviendo al menú en ${countdown} segundos...`;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = './menu.html';
            }
        }, 1000);
      });
      socket.on("abandonopartida", (data) => {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over-overlay';
        
        const mensaje = state.playerId === data.ganadorId ? 
            '¡Has Perdido!' : 
            '¡Has Ganado!';
        
        gameOverDiv.innerHTML = `
            <div class="game-over-content">
                <h2>${mensaje}</h2>
                <p>Volviendo al menú en 5 segundos...</p>
            </div>
        `;
        
        document.body.appendChild(gameOverDiv);
        
        // Iniciar cuenta regresiva y redireccionar
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            countdown--;
            const countdownText = gameOverDiv.querySelector('p');
            countdownText.textContent = `Volviendo al menú en ${countdown} segundos...`;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = './menu.html';
            }
        }, 1000);
      });
      // Al inicializar
      toggleMusicBtn.textContent = "Música: ON";
      toggleMusicBtn.addEventListener("click", (e) => {
        AudioManager.toggleMusic();
        toggleMusicBtn.textContent = AudioManager.settings.musicEnabled ? "Música: ON" : "Música: OFF";
      });
  
      toggleSoundBtn.addEventListener("click", (e) => {
        AudioManager.toggleSound();
        toggleSoundBtn.textContent = AudioManager.settings.soundEnabled ? "Sonido: ON" : "Sonido: OFF";
      });

      // On receiving gameStateChange
      socket.on("changeGameState", (newGameState) => {
        switch (newGameState) {
          case gameStates.gameInitialized:
            AudioManager.backgroundMusic.play();
            AudioManager.saveSettings();
            state.gameState = gameStates.gameInitialized;
            currentTurnText.innerHTML = "Inicializando";
            console.log(state.gameState);
            break;
            
          case gameStates.setShipsRound:
            state.gameState = gameStates.setShipsRound;
            currentTurnText.innerHTML = "Coloca tus barcos!";
            console.log(state.gameState);
            break;
          case gameStates.gameQuestion:
            state.gameState = gameStates.gameQuestion;
            currentTurnText.innerHTML = "¡Responde la pregunta!";
            console.log("Cambiando a estado de preguntas");
            removeShipFollower();
            socket.emit('gameQuestion');
            break;    
          case gameStates.gameRunning: {
            state.gameState = gameStates.gameRunning;
            currentTurnText.innerHTML = "¡Que empiece la lucha!";
            console.log(state.gameState);
            break;
          }
          case gameStates.gameOver:
            state.gameState = gameStates.gameOver;
            currentTurnText.innerHTML = "Se acabó el juego!";
            setTimeout(() => redirectToHomePage(), 5000);
            console.log(state.gameState);
            break;          
        }
        console.log("Nuevo estado del juego:", newGameState);
      });

      // Clean up URL => remove query string
      w.history.replaceState({}, d.title, "/" + "play.html");

      addConsoleMessage(
        chatMessagesList,
        strings.getInitialGameConsoleString()
      );
      chatInput.focus();
      currentRoundText.innerHTML = "0";
      currentTurnText.innerHTML = strings.getInitialCurrentTurnString();

      // Initialize Player Grids
      initializePlayerGrids(
        [enemyGrid, friendlyGrid],
        [strings.getEnemyGridCaption(), strings.getHomeGridCaption()],
        initialGridData
      );

      // Register UI Event Listeners
      headerLogoLink.addEventListener("click", (e) => {
        e.preventDefault();
        leaveGame();
      });
      // click en barco

      const cursorFollower = document.createElement('div');
      cursorFollower.className = 'cursor-follower';
      document.body.appendChild(cursorFollower);

      document.querySelectorAll('.barco').forEach(shipElement => {
        shipElement.addEventListener('click', (e) => {
          if (!e.target.closest('.friendly-grid')) {
            removeShipFollower();
          }
          const shipType = e.target.id;
          if (state.gameState === gameStates.setShipsRound && 
              state.placedShips[shipType] < SHIPS[shipType].count) {
            state.selectedShip = shipType;
            highlightSelectedShip(shipType);
            createShipFollower(shipType);
            addConsoleMessage(chatMessagesList, 
              `Seleccionado ${shipType} (Tamaño: ${SHIPS[shipType].size}). Pulse 'R' para rotar.`);
          }
        });
      });
      

      function createShipFollower(shipType) {
        const shipImagePath = getShipImagePath(shipType);
        const cursorFollower = document.querySelector('.cursor-follower');
      
        if (!cursorFollower) return;
      
        cursorFollower.innerHTML = `
          <div class="ship-preview ${shipType} ${state.orientation}">
            <img src="${shipImagePath}" alt="${shipType}" />
          </div>
        `;
      
        cursorFollower.style.display = 'block';
        
        // Update scroll position to ensure ship is visible
        const shipElement = document.getElementById(shipType);
        if (shipElement) {
          const rect = shipElement.getBoundingClientRect();
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            shipElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      
        document.addEventListener('mousemove', moveFollower);
      }
        function moveFollower(e) {
          const cursorFollower = document.querySelector('.cursor-follower');
          if (!cursorFollower) return;
        
          // Get viewport dimensions
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // Get ship preview dimensions
          const shipPreview = cursorFollower.querySelector('.ship-preview');
          const shipHeight = shipPreview ? shipPreview.offsetHeight : 0;
          const shipWidth = shipPreview ? shipPreview.offsetWidth : 0;
        
          // Calculate position relative to scroll
          let x = e.clientX;
          let y = e.clientY;
        
          // Ensure the ship stays within viewport bounds
          x = Math.min(x, viewportWidth - shipWidth);
          y = Math.min(y, viewportHeight - shipHeight);
        
          // Apply position directly without transform
          cursorFollower.style.left = `${x}px`;
          cursorFollower.style.top = `${y}px`;
        }
      
        function removeShipFollower() {
          const cursorFollower = document.querySelector('.cursor-follower');
          if (!cursorFollower) return;
      
          cursorFollower.style.display = 'none';
          document.removeEventListener('mousemove', moveFollower);
        }

      function getShipImagePath(shipType) {
        return `/assets/img/ships/${shipType}.png`;
      }
      // Add keyboard listener for rotation
      document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r' && state.selectedShip) {
          state.orientation = state.orientation === 'horizontal' ? 'vertical' : 'horizontal';
          const shipPreview = document.querySelector('.ship-preview');
          if (shipPreview) {
            shipPreview.classList.remove('horizontal', 'vertical');
            shipPreview.classList.add(state.orientation);
          }
        }
      });
  

      playerGrids.forEach((grid) => {
        grid.addEventListener("click", (e) => {
          const elementId = e.target.closest(".grid").id;

          if (state.gameState === gameStates.gameOver) {
            addConsoleMessage(
              chatMessagesList,
              strings.getGameIsAlreadyOverErrorMessage()
            );
          } else if (
            state.gameState === gameStates.gameRunning &&
            state.yourTurn &&
            e.target.classList.contains("cell")
          ) {
            switch (elementId) {
              case "enemy-grid":
                socket.emit("clickOnEnemyGrid", {
                  x: e.target.dataset.x,
                  y: e.target.dataset.y,
                });
                console.log(
                  `Click on Enemy Grid ${e.target.dataset.y.toUpperCase()}${
                    e.target.dataset.x
                  }`
                );
                socket.emit('shotFired');
                break;

              case "friendly-grid":
                addConsoleMessage(
                  chatMessagesList,
                  strings.getWrongFieldClickedErrorMessage()
                );
                break;
            }
          } else if (
            state.gameState === gameStates.setShipsRound &&
            e.target.classList.contains("cell")
          ) {
            switch (elementId) {
              case "enemy-grid":
                addConsoleMessage(
                  chatMessagesList,
                  strings.getGameHasNotStartedErrorMessage()
                );
                break;

              case "friendly-grid":
                if (!state.selectedShip) {
                  addConsoleMessage(chatMessagesList, "Por favor selecciona un barco primero");
                  return;
                }
                socket.emit("clickOnFriendlyGrid", {
                  x: parseInt(e.target.dataset.x),
                  y: e.target.dataset.y,
                  shipType: state.selectedShip,
                  orientation: state.orientation
                });

                console.log(
                  `Click on Friendly Grid ${e.target.dataset.y.toUpperCase()}${
                    e.target.dataset.x
                  }`
                );
                break;
            }
          }
        });
      });

      showRulesBtn.addEventListener("click", (e) => {
        console.log("Show Rules Btn Pressed!");
        alert("Coming Soon!");
      });

      toggleSoundBtn.addEventListener("click", (e) => {
        console.log("Toggle Sound Btn Pressed!");
        alert("Coming Soon!");
      });

      toggleFullScreenBtn.addEventListener("click", (e) => {
        toggleFullScreen(d.body);
      });

      leaveGameBtn.addEventListener("click", (e) => {
        leaveGame();
      });

      d.addEventListener("keydown", (e) => {
        if (e.keyCode === 13) chatInput.focus();
      });

      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        socket.emit("chatMessage", {
          playerName: state.playerName,
          message: chatInput.value,
        });
        chatInput.value = "";
        chatInput.focus();
      });
    })();
  });
 
  // Init Player Grids
  function initializePlayerGrids(playerGridRoots, captions, data) {
    playerGridRoots.forEach((root, index) => {
      updateGrid(root, captions[index], data);
    });
  }

  // Add console message
  function addConsoleMessage(
    consoleElement,
    messageTxt,
    senderName = "[System]"
  ) {
    consoleElement.innerHTML += `<li><strong>${senderName}</strong>: ${messageTxt}</li>`;
    consoleElement.scrollTop = consoleElement.scrollHeight;
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

  // Update grid
  function updateGrid(rootElement, captionText, data) {
    const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    
    
    // Helper function to determine ship size at a position
  function getShipSizeAtPosition(data, x, y) {
    if (data[y][x] !== 1) return 0;
    
    // Check horizontal ship size
    let horizontalSize = 1;
    let i = x + 1;
    while (i < 10 && data[y][i] === 1) {
      horizontalSize++;
      i++;
    }
    i = x - 1;
    while (i >= 0 && data[y][i] === 1) {
      horizontalSize++;
      i--;
    }
    
    // Check vertical ship size
    let verticalSize = 1;
    let j = y + 1;
    while (j < 10 && data[j][x] === 1) {
      verticalSize++;
      j++;
    }
    j = y - 1;
    while (j >= 0 && data[j][x] === 1) {
      verticalSize++;
      j--;
    }
    
    return Math.max(horizontalSize, verticalSize);
    }

    // Helper function to determine ship orientation
    function isHorizontalShip(data, x, y) {
      return (x + 1 < 10 && data[y][x + 1] === 1) || (x - 1 >= 0 && data[y][x - 1] === 1);
    }

    // Helper function to check if this is the start of a ship
    function isShipStart(data, x, y) {
      if (data[y][x] !== 1) return false;
      const isHorizontal = isHorizontalShip(data, x, y);
      
      if (isHorizontal) {
        return x === 0 || data[y][x - 1] !== 1;
      } else {
        return y === 0 || data[y - 1][x] !== 1;
      }
    }
    function getShipImagePath(size) {
      switch(size) {
        case 1: return `/assets/img/ships/fragata.png`;
        case 2: return `/assets/img/ships/destructor.png`;
        case 3: return `/assets/img/ships/submarino.png`;
        case 4: return `/assets/img/ships/acorazado.png`;
        case 5: return `/assets/img/ships/portaviones.png`;
        default: return '';
      }
    }
    // Helper function to get ship class name based on size
    function getShipClassName(size) {
      switch(size) {
        case 1: return 'fragata';
        case 2: return 'destructor';
        case 3: return 'submarino';
        case 4: return 'acorazado';
        case 5: return 'portaviones';
        default: return '';
      }
    }
    const tableHeaderCells = new Array(10)
      .fill("", 0, 10)
      .map((_, i) => `<th>${i}</th>`)
      .join("");
    const tableContent = data
      .map((rowData, indexY) => {
        return `
      <tr>
      <th>${letters[indexY]}</th>
        ${rowData
          .map((cellData, indexX) => {
            switch (cellData) {
              case 3:
                return `<td class="cell ship-hit" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
              case 2:
                return `<td class="cell water-hit" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
              case 1:{
                if (isShipStart(data, indexX, indexY)) {
                  const shipSize = getShipSizeAtPosition(data, indexX, indexY);
                  const isHorizontal = isHorizontalShip(data, indexX, indexY);
                  const imgPath = getShipImagePath(shipSize);
                  const shipClass = getShipClassName(shipSize);
                  
                  return `<td class="cell ship ${shipClass} ${isHorizontal ? 'horizontal' : 'vertical'}" 
                  data-x="${indexX}" data-y="${letters[indexY]}" 
                  data-size="${shipSize}">
                  <img src="${imgPath}" alt="${shipClass}" class="ship-image"/>
                  </td>`;
              } else {
                return `<td class="cell ship-continuation" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
              }
              }
                
              case 0:
              default:
                return `<td class="cell" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
            }
          })
          .join("")}
      </tr>
      `;
      })
      .join("");

    rootElement.innerHTML = `
      <table>
        <caption>
          <h5><strong>${captionText}</strong></h5>
        </caption>
        <thead>
          <th></th>
          ${tableHeaderCells}
        </thead>
        <tbody>
          ${tableContent}
        </tbody>
      </table>
    `;
  }

  // Utility Functions

  // Initial grid data
  function getInitialGridData(width = 10, height = 10, initialCellValue = 0) {
    const gridArray = [];

    for (let i = 0; i < height; i++) {
      gridArray.push(new Array(width).fill(initialCellValue));
    }

    return gridArray;
  }

  // Estado global para el temporizador del cliente
  const quizState = {
    timer: null,
    timeLeft: 30
  };

   // Función para mostrar el modal de preguntas
   function showQuizModal(preguntaData) {
    if (!preguntaData) {
      console.error('No se recibieron datos de pregunta válidos');
      return;
    }
    
    const quizContainer = document.getElementById('quiz-container');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const timerElement = document.querySelector('.timer');
    
    if (!quizContainer || !questionText || !optionsContainer || !timerElement) {
      console.error('No se encontraron los elementos necesarios del DOM');
      return;
    }
  
    resetQuizState(timerElement, optionsContainer);
    
    try {
      renderQuestion(preguntaData, questionText, optionsContainer);
      showQuizContainer(quizContainer);
      startQuizTimer(timerElement);
    } catch (error) {
      console.error('Error al mostrar el modal de preguntas:', error);
    }
  }



  // Función para resetear el estado del quiz
  function resetQuizState(timerElement, optionsContainer) {
    clearQuizTimer();
    optionsContainer.innerHTML = '';
    timerElement.textContent = '30s';
    timerElement.classList.remove('warning');
    quizState.timeLeft = 30;
  }
  
  function renderQuestion(preguntaData, questionText, optionsContainer) {
    questionText.textContent = preguntaData.question;
    

    preguntaData.options.forEach((opcion) => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.dataset.respuesta = opcion.option;


      // Crear contenedor flex para el texto
      const textContainer = document.createElement('div');
      textContainer.style.display = 'flex';
      textContainer.style.alignItems = 'center';
      textContainer.style.width = '100%';
  
      // Agregar el texto de la opción con el formato correcto
      textContainer.innerHTML = `<span>${opcion.option}) ${opcion.text}</span>`;
      
      button.appendChild(textContainer);

      button.addEventListener('click', function() {
        if (!this.disabled) {
          handleOptionSelection(this, optionsContainer, preguntaData._id);
        }
      });
  
      optionsContainer.appendChild(button);
    });
  }
  function handleOptionSelection(selectedButton, optionsContainer, preguntaId) {
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);
    buttons.forEach(btn => btn.classList.remove('selected'));
    selectedButton.classList.add('selected');
  
    socket.emit('submitAnswer', {
      respuesta: selectedButton.dataset.respuesta,
      preguntaId: preguntaId
    });
  }
  function showQuizContainer(quizContainer) {
    quizContainer.style.display = 'flex';
    quizContainer.style.opacity = '0';
    setTimeout(() => {
      quizContainer.style.opacity = '1';
    }, 10);
  }
  function startQuizTimer(timerElement) {
    clearQuizTimer();
  
    quizState.timer = setInterval(() => {
      quizState.timeLeft--;
      
      if (timerElement) {
        timerElement.textContent = `${quizState.timeLeft}s`;
        
        if (quizState.timeLeft <= 10) {
          timerElement.classList.add('warning');
        }
      }
  
      if (quizState.timeLeft <= 0) {
        clearQuizTimer();
        hideQuizModal();
        socket.emit('timeExpired');
      }
    }, 1000);
  }

  function clearQuizTimer() {
    if (quizState.timer) {
      clearInterval(quizState.timer);
      quizState.timer = null;
    }
  }

  function hideQuizModal() {
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      quizContainer.style.opacity = '0';
      setTimeout(() => {
        quizContainer.style.display = 'none';
        
        clearQuizTimer();
        
        const timerElement = document.querySelector('.timer');
        if (timerElement) {
          timerElement.classList.remove('warning');
          timerElement.textContent = '30s';
        }
      }, 300);
    }
  }
  
  // FUNCIONES BARCOS
  function highlightSelectedShip(shipType) {
    document.querySelectorAll('.barco').forEach(el => el.classList.remove('selected'));
    document.getElementById(shipType).classList.add('selected');
    
  }
  
  // actualizacion tamaño barco tabla
    

// Modify the handleFriendlyGridClick function

  // Leave Game
  function leaveGame() {
    confirm(strings.getLeaveConfirmText()) && redirectToHomePage();
    socket.disconnect();
  }
})(window, document);

function playClickSound() {
  const sound = document.getElementById('clickSound');
  sound.currentTime = 0; // Reinicia el sonido si ya está reproduciéndose
  sound.play();
}
