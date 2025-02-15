const express = require("express");
const body_parser = require("body-parser");
const http = require("http");
const { Server: WebsocketServer } = require("socket.io");

const config = require("./network/config");
const routes = require("./network/routes");
const db = require("./network/db");
const { registerHandler, loginHandler, questionsHandler, addquestionHandler,
  deletequestionHandler, StudentsHandler, GameHandler } = require("./public/js/socket");

var app = express();
const server = http.createServer(app);
const httpServer = server.listen(config.PORT);
const io = new WebsocketServer(httpServer);

db(config.DB_URL);

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));

app.use("/", express.static("public"));

class Partida {
  constructor(id, jugador1) {
    this.id = id; // ID único para la partida
    this.jugador1 = jugador1; // Primer jugador en unirse
    this.jugador2 = null; // Segundo jugador
    this.turno = jugador1; // El turno inicial es del jugador 1
    this.tableros = {}; // Almacena los tableros de ambos jugadores
    this.estado = "esperando"; // Estado inicial de la partida
    this.currentQuestion = null;
    this.currentPlayerShots = null;
    this.questionTimer = null;
  }

  unirse(jugador2) {
    if (!this.jugador2) {
      this.jugador2 = jugador2;
      this.estado = "en curso";
      return true;
    }
    return false;
  }

  iniciarJuego() {
    if (this.jugador1 && this.jugador2) {
      this.estado = "en curso";
      return true;
    }
    return false;
  }
}


const path = require('path');
const generateUUID = require('./components/helpers/generateUUID');
const Game = require('./components/juego/game');
const Player = require('./components/usuario/player');
const gameService = require('./components/juego/gameservices');

// Games data - managed in-memory while server is running
let games = {};

// Configure API-Routes
app.get("/play.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "juego", "index.html"));
});
// Route gets called when list of available games is requested by client
app.get("/games", (req, res) => {
  console.log("Games data:", games); // Verifica el contenido de games
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: "Internal Server Error" });
  } else {
    // Filter out full games
    const availGames = Object.values(games).filter(
      (game) => !game.isGameFull() && game.isListed
    );
    console.log("Available games requested:", JSON.stringify(availGames));
    console.log("All games currently live: ", JSON.stringify(games));
    res.status(200).json(availGames);
  }
});

// Route gets called when a player joins an existing game
app.get("/games/join", async (req, res) => {
  const playerName = req.query["playerName"];
  const playerId = req.query["playerId"];
  const gameId = req.query.game;

  const player = new Player(playerId, playerName);

  if (!playerName || !gameId || !playerId) {
    res.status(404).redirect("/");
  } else if (games[gameId].isGameFull()) {
    res.status(404).redirect("/");
  } else if (games[gameId].isGameEmpty()) {
    delete games[gameId];
    res.status(404).redirect("/");
  }
  // Agregar validación para evitar que el mismo jugador se una a su propia partida
  else if (games[gameId].players[0].playerName === playerName) {
    res.status(400).json({ error: "No puedes unirte a tu propia partida" });
  }

  else {
    try {
      // Agregar el jugador al juego en memoria
      games[gameId].players.push(player);

      // Guardar el segundo jugador en MongoDB
      await gameService.addPlayerToGame(gameId, player);
      res.redirect(
        `/play.html?playerName=${playerName}&game=${gameId}&playerId=${playerId}`
      );
    } catch (error) {
      console.error("Error adding player to game:", error);
      res.status(500).redirect("/");
    }
  }
});

// Route gets called when a new game is being created
app.post("/games", async (req, res) => {
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: "Internal Server Error" });
  } else if (!req.body["playerName"] || !req.body["playerId"]) {
    res.status(500).json({
      statusCode: 404,
      msg: "Bad request! Please submit correct data!",
    });
  } else {
    try {
      const playerName = req.body["playerName"];
      const playerId = req.body["playerId"];
      const player = new Player(playerId, playerName);

      const gameId = generateUUID();
      const game = new Game(gameId, `${playerName}'s Game`, [player]);

      // Guardar en MongoDB
      await gameService.createGame(gameId, player);

      games = { ...games, [gameId]: game };
      console.log("All games currently live: ", JSON.stringify(games));

      res.status(301).redirect(
        `/play.html?playerName=${playerName}&game=${game.id}&playerId=${playerId}`
      );
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Error creating game" });
    }
  }
});

// Game helper functions
const getInitialGridData = require("./components/helpers/getInitialGridData");
const { log } = require("console");
const e = require("express");

// Game states for simple state machine
const gameStates = {
  gameIsInitializing: "gameIsInitializing",
  gameInitialized: "gameInitialized",
  setShipsRound: "setShipsRound",
  gameRunning: "gameRunning",
  gameOver: "gameOver",
  gameQuestion: "gameQuestion"
};

const SHIPS = {
  fragata: { size: 1, count: 1 },
  destructor: { size: 2, count: 1 },
  submarino: { size: 3, count: 1 },
  acorazado: { size: 4, count: 1 },
  portaviones: { size: 5, count: 1 }
};
// Letter for array-number lookup
const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

//almacen de preguntas usadas
let preguntasUsadas = [];
const gameQuestionStates = {};

//obtencion de preguntas de la base
async function obtenerPreguntaAleatoria() {
  try {
    const controller = require("./components/preguntas/controller");
    const preguntasData = await controller.obtenerPreguntas();

    if (!preguntasData || !preguntasData.length) {
      throw new Error('No se encontraron preguntas');
    }

    // Si ya usamos todas las preguntas, reiniciamos el array
    if (preguntasUsadas.length === preguntasData.length) {
      preguntasUsadas = [];
      console.log('Se han usado todas las preguntas. Reiniciando ciclo.');
    }

    // Filtramos las preguntas que aún no se han usado
    const preguntasDisponibles = preguntasData.filter(
      pregunta => !preguntasUsadas.includes(pregunta.id)
    );

    // Seleccionamos una pregunta aleatoria de las disponibles
    const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
    const preguntaSeleccionada = preguntasDisponibles[indiceAleatorio];

    // Agregamos el ID de la pregunta seleccionada al array de usadas
    preguntasUsadas.push(preguntaSeleccionada.id);

    return preguntaSeleccionada;

  } catch (error) {
    console.error('Error al obtener pregunta:', error);
    return null;
  }
}

function handleQuestionTimeout(gameId, io) {
  const game = games[gameId];
  if (!game || game.gameState === gameStates.gameOver) {
    if (gameQuestionStates[gameId]) {
      gameQuestionStates[gameId].isQuestionInProgress = false;
    }
    return;
  }

  clearTimeout(gameQuestionStates[gameId]?.timer);
  game.currentQuestion = null;
  gameQuestionStates[gameId].wrongAnswers.clear();
  gameQuestionStates[gameId].isQuestionInProgress = false;

  io.to(gameId).emit('timeExpired');
  
  // Iniciar nueva pregunta después de un breve retraso
  if (game.gameState !== gameStates.gameOver) {
    setTimeout(() => {
      if (!gameQuestionStates[gameId]?.isQuestionInProgress) {
        startNewQuestion(gameId, io);
      }
    }, 3000); // Aumentado a 3 segundos para dar más tiempo entre preguntas
  }
}

// Función para iniciar una nueva pregunta
async function startNewQuestion(gameId, io) {
  const game = games[gameId];
  if (!game || game.gameState === gameStates.gameOver) return;

  // Verificar si ya hay una pregunta en curso
  if (gameQuestionStates[gameId]?.isQuestionInProgress) {
    console.log(`Pregunta ya en curso para el juego ${gameId}`);
    return;
  }

  // Limpiar el temporizador anterior si existe
  if (gameQuestionStates[gameId]?.timer) {
    clearTimeout(gameQuestionStates[gameId].timer);
  }

  // Inicializar o resetear el estado de las preguntas para este juego
  gameQuestionStates[gameId] = {
    timer: null,
    wrongAnswers: new Set(),
    isQuestionInProgress: true,
    lastQuestionTime: Date.now()
  };

  try {
    // Verificar nuevamente el estado del juego antes de obtener una nueva pregunta
    if (game.gameState === gameStates.gameOver) {
      gameQuestionStates[gameId].isQuestionInProgress = false;
      return;
    }

    const question = await obtenerPreguntaAleatoria();
    if (!question) {
      throw new Error('No se pudo obtener una pregunta');
    }

    game.currentQuestion = question;
    io.to(gameId).emit('showQuestion', question);

    // Iniciar nuevo temporizador solo si el juego sigue activo
    if (game.gameState !== gameStates.gameOver) {
      gameQuestionStates[gameId].timer = setTimeout(() => {
        handleQuestionTimeout(gameId, io);
      }, 30000);
    }

  } catch (error) {
    console.error('Error al iniciar nueva pregunta:', error);
    gameQuestionStates[gameId].isQuestionInProgress = false;
    if (game.gameState !== gameStates.gameOver) {
      handleQuestionTimeout(gameId, io);
    }
  }
}


// Función para manejar la respuesta de un jugador
function handlePlayerAnswer(gameId, playerId, playerName, answer, io, socket) {
  const game = games[gameId];
  if (!game || !game.currentQuestion) return;

  const isCorrect = game.currentQuestion.answer === answer;

  if (isCorrect) {
    // Limpiar el temporizador y estado
    clearTimeout(gameQuestionStates[gameId]?.timer);
    gameQuestionStates[gameId].wrongAnswers.clear();
    gameQuestionStates[gameId].isQuestionInProgress = false;
    game.currentQuestion = null;

    // Configurar estado del juego y disparos
    game.gameState = gameStates.gameRunning;
    game.currentPlayerShots = 3;
    game.currentTurn = playerId;

    // Notificar a los jugadores
    socket.emit("message", `¡Respuesta correcta! Obtienes ${game.currentPlayerShots} disparos.`);
    socket.broadcast.to(gameId).emit("message", `${playerName} respondió correctamente. No es tu turno.`);
    io.to(gameId).emit('changeGameState', game.gameState);
    io.to(gameId).emit('correctAnswer', { playerName, playerId });
    socket.emit("yourTurn", true);
  } else {
    gameQuestionStates[gameId].wrongAnswers.add(playerId);

    if (gameQuestionStates[gameId].wrongAnswers.size >= 2) {
      // Ambos jugadores respondieron incorrectamente
      clearTimeout(gameQuestionStates[gameId].timer);
      gameQuestionStates[gameId].wrongAnswers.clear();
      gameQuestionStates[gameId].isQuestionInProgress = false;

      io.to(gameId).emit('message', '¡Ambos jugadores fallaron! Nueva pregunta...');

      setTimeout(() => {
        if (!gameQuestionStates[gameId]?.isQuestionInProgress) {
          startNewQuestion(gameId, io);
        }
      }, 1000);
    } else {
      socket.emit('message', 'Respuesta incorrecta, ¡espera a que el otro jugador responda!');
    }
  }
}
function isValidPlacement(grid, x, y, size, orientation) {
  const width = grid[0].length;
  const height = grid.length;

  // Check bounds
  if (orientation === 'horizontal') {
    if (x + size > width) return false;
    for (let i = 0; i < size; i++) {
      if (grid[y][x + i] === 1) return false;
    }
  } else {
    if (y + size > height) return false;
    for (let i = 0; i < size; i++) {
      if (grid[y + i][x] === 1) return false;
    }
  }
  return true;
}
io.on("connection", (socket) => {
  registerHandler(socket);
  loginHandler(socket);
  questionsHandler(socket);
  addquestionHandler(socket);
  deletequestionHandler(socket);
  StudentsHandler(socket);
  GameHandler(socket);

  // The state for this individual session = player
  const state = {
    gameId: null,
    playerId: null,
    playerName: "",
    otherPlayerGrid: getInitialGridData(),
  };

  let thisGame;

socket.on("joinGame", ({ gameId, playerId, playerName }) => {
    // Set state variables for this connection
    state.gameId = gameId;
    state.playerName = playerName;
    state.playerId = playerId;

    // Join game / room
    socket.join(state.gameId);

    thisGame = games[state.gameId];

    // Initialize grid data for this player
    thisGame[`${state.playerId}_grid`] = getInitialGridData();
    thisGame[`${state.playerId}_shipsPlaced`] = 0;
    thisGame[`${state.playerId}_shipsLost`] = 0;
    const shipTypes = ['fragata', 'destructor', 'submarino', 'acorazado', 'portaviones'];
    shipTypes.forEach(shipType => {
      thisGame[`${state.playerId}_${shipType}Count`] = 0;
    });
    // Change game state to "initialized"
    thisGame.gameState = gameStates.gameInitialized;
    socket.emit("changeGameState", thisGame.gameState);
    socket.emit("message", "Bienvenido al juego!");

    // Broadcast to other player that another player has joined
    socket.broadcast
      .to(state.gameId)
      .emit("message", `${state.playerName} se ha unido al juego.`);

    // Check number of players, as soon as both players are there => game can start
    if (thisGame.players.length <= 1) {
      socket.emit("message", "A la espera de que se una un jugador...");
    } else if (thisGame.players.length >= 2) {
      // Unlist game from lobby as soon as a second player joins
      thisGame.isListed = false;

      thisGame.gameState = gameStates.setShipsRound;
      io.to(state.gameId).emit("changeGameState", thisGame.gameState);
      io.to(state.gameId).emit(
        "message",
        "¡El juego ha comenzado! ¡Coloca tus barcos!"
      );
    }
  });

  socket.on("clickOnEnemyGrid", async ({ x, y }) => {
    try {
      // Asegurarse de que el juego esté en la etapa correcta
      if (thisGame.gameState !== gameStates.gameRunning) return;
      // Verificar si es el turno del jugador actual
      if (thisGame.currentTurn !== state.playerId) {
        socket.emit("message", "No es tu turno para disparar.");
        return;
      }
      // Verificar si aún tiene disparos disponibles
      if (thisGame.currentPlayerShots <= 0) {
        socket.emit("message", "¡Ya has usado todos tus disparos!");
        return;
      }
      // Convertir coordenada de letra (y) a índice numérico
      y = letters.indexOf(y);

      // Identificar al jugador enemigo
      const otherPlayerId = thisGame.players.filter((player) => {
        return player.id !== state.playerId;
      })[0].id;

      // Obtener el valor actual de la celda del tablero enemigo
      const currentCellValue = thisGame[`${otherPlayerId}_grid`][y][x];

      // Si la celda ya fue atacada, notificar al jugador
      if (currentCellValue === 2 || currentCellValue === 3) {
        socket.emit("message", `Ya has disparado a esa posición. Intenta otra.`);
        return;
      }
      // Reducir el número de disparos disponibles
      thisGame.currentPlayerShots--;

      // Manejar disparos en agua
      if (currentCellValue === 0) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 2; // Marcar como agua en el tablero enemigo
        state.otherPlayerGrid[y][x] = 2; // Actualizar la vista del jugador
        // Registrar el disparo fallido en MongoDB
        await gameService.recordShot(state.gameId, state.playerId, false);
        socket.emit("message", `¡Has dado en el agua!`);
        socket.broadcast
          .to(state.gameId)
          .emit("message", `El otro jugador falló el disparo.`);
      }
      // Manejar disparos en un barco
      else if (currentCellValue === 1) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 3; // Marcar como golpe en el tablero enemigo
        state.otherPlayerGrid[y][x] = 3; // Actualizar la vista del jugador
        thisGame[`${otherPlayerId}_shipsLost`]++; // Incrementar los barcos perdidos del enemigo
        // Registrar la pérdida de un barco en la base de datos
        await gameService.recordLostShip(state.gameId, otherPlayerId);
        // Registrar el disparo exitoso en MongoDB
        await gameService.recordShot(state.gameId, state.playerId, true);

        socket.emit(
          "message",
          `¡Has golpeado un barco enemigo! ¡Buen trabajo!`
        );
        socket.broadcast
          .to(state.gameId)
          .emit(
            "message",
            `¡Oh no! El otro jugador golpeó uno de tus barcos.`
          );
      }

      // Calcular el total de celdas de barcos requeridas
      const totalShipCells = Object.values(SHIPS).reduce((total, ship) => {
        return total + (ship.size * ship.count);
      }, 0);
      // Contar cuántas celdas de barcos han sido golpeadas
      let totalHitCells = 0;
      for (let i = 0; i < thisGame[`${otherPlayerId}_grid`].length; i++) {
        for (let j = 0; j < thisGame[`${otherPlayerId}_grid`][i].length; j++) {
          if (thisGame[`${otherPlayerId}_grid`][i][j] === 3) {
            totalHitCells++;
          }
        }
      }
      // Verificar si todos los barcos han sido destruidos
    if (totalHitCells >= totalShipCells) {
      if (gameQuestionStates[state.gameId]?.timer) {
        clearTimeout(gameQuestionStates[state.gameId].timer);
        delete gameQuestionStates[state.gameId];
      }
      await gameService.endGame(state.gameId, state.playerId, state.playerName);
      socket.emit("updateGrid", {
        gridToUpdate: "enemyGrid",
        data: state.otherPlayerGrid,
      });
      socket.broadcast.to(state.gameId).emit("updateGrid", {
        gridToUpdate: "friendlyGrid",
        data: thisGame[`${otherPlayerId}_grid`],
      });
      
      io.to(state.gameId).emit("partidaTerminada", {
        ganadorId: state.playerId,
      });  

      thisGame.gameState = gameStates.gameOver;
      io.to(state.gameId).emit("changeGameState", thisGame.gameState);
      io.to(state.gameId).emit(
        "message",
        `${state.playerName} ganó el juego. ¡Felicidades!`
      );
      return;
    }

      // Actualizar las cuadrículas de ambos jugadores
      socket.emit("updateGrid", {
        gridToUpdate: "enemyGrid",
        data: state.otherPlayerGrid,
      });
      socket.broadcast.to(state.gameId).emit("updateGrid", {
        gridToUpdate: "friendlyGrid",
        data: thisGame[`${otherPlayerId}_grid`],
      });


      if (thisGame.currentPlayerShots <= 0) {
        thisGame.gameState = gameStates.gameQuestion;
        io.to(state.gameId).emit("changeGameState", thisGame.gameState);
        io.to(state.gameId).emit("message", "¡Se acabaron los disparos! Hora de la pregunta.");


        // Reiniciar los disparos para el siguiente turno
        thisGame.currentPlayerShots = 3;
      } else {
        // Si aún quedan disparos, continuar el turno del jugador actual
        socket.emit("message", `Aún tienes ${thisGame.currentPlayerShots} disparos.`);
        return;
      }
      // Alternar el turno al otro jugador
      const nextPlayerId = thisGame.players.filter(
        (player) => player.id !== state.playerId
      )[0].id;
      thisGame.currentTurn = nextPlayerId; // Actualizar quién tiene el turno
    } catch (error) {
      console.error("Error processing shot:", error);
    }
  });

  socket.on("clickOnFriendlyGrid", async ({ x, y, shipType, orientation }) => {
    if (thisGame.gameState === gameStates.setShipsRound) {
      y = letters.indexOf(y);

      const shipConfig = SHIPS[shipType];

      if (!shipConfig) {
        socket.emit("message", "Tipo de barco inválido");
        return;
      }
      // Verificar si aún hay barcos de este tipo disponibles
      if (thisGame[`${state.playerId}_${shipType}Count`] >= shipConfig.count) {
        socket.emit("message", `Ya no quedan barcos de tipo ${shipType} disponibles`);
        return;
      }
      // Verificar si el barco cabe en la posición seleccionada
      const isValid = isValidPlacement(
        thisGame[`${state.playerId}_grid`],
        x,
        y,
        shipConfig.size,
        orientation
      );
      if (!isValid) {
        socket.emit("message", "Posición inválida para colocar el barco");
        return;
      }
      // Colocar el barco en el grid
      if (orientation === 'horizontal') {
        for (let i = 0; i < shipConfig.size; i++) {
          thisGame[`${state.playerId}_grid`][y][x + i] = 1;
        }
      } else {
        for (let i = 0; i < shipConfig.size; i++) {
          thisGame[`${state.playerId}_grid`][y + i][x] = 1;
        }
      }
      // Incrementar el contador de barcos colocados
      thisGame[`${state.playerId}_${shipType}Count`]++;
      thisGame[`${state.playerId}_shipsPlaced`]++;

      // Calculate total ships placed
      const totalShipsRequired = Object.values(SHIPS).reduce((total, ship) =>
        total + ship.count, 0);
      // Notify player of remaining ships
      socket.emit("message",
        `${shipType} colocado. Te quedan ${shipConfig.count - thisGame[`${state.playerId}_${shipType}Count`]
        } barcos de este tipo`
      );

      socket.emit("updateGrid", {
        gridToUpdate: "friendlyGrid",
        data: thisGame[`${state.playerId}_grid`],
      });
      if (thisGame[`${thisGame.players[0].id}_shipsPlaced`] >= totalShipsRequired &&
        thisGame[`${thisGame.players[1].id}_shipsPlaced`] >= totalShipsRequired) {

        let countdown = 5;
        io.to(state.gameId).emit('startCountdown', countdown);
        console.log("Inicio de contador");
        const countdownInterval = setInterval(() => {
          countdown--;
          io.to(state.gameId).emit('updateCountdown', countdown);

          if (countdown <= 0) {
            clearInterval(countdownInterval);
            thisGame.gameState = gameStates.gameQuestion;
            io.to(state.gameId).emit('changeGameState', thisGame.gameState);
            io.to(state.gameId).emit(
              "message",
              "¡Todos los barcos están colocados! Comienza la ronda de preguntas."
            );
          }
        }, 1000);
      }
    }
  });


  //socket de preguntas
  socket.on('gameQuestion', async () => {
    if (thisGame && thisGame.gameState === gameStates.gameQuestion) {
      await startNewQuestion(thisGame.id, io);
    }
  });

  socket.on('submitAnswer', async ({ respuesta, preguntaId }) => {
    if (!thisGame) return;

    handlePlayerAnswer(
      thisGame.id,
      state.playerId,
      state.playerName,
      respuesta,
      io,
      socket
    );
    await gameService.recordQuestion(thisGame.id, state.playerId, respuesta);
  });


  // Handle chat messages between players
  socket.on("chatMessage", ({ playerName, message }) => {
    io.to(state.gameId).emit("chatMessage", {
      playerName,
      message,
    });
  });

  socket.on('SaltoPreguntaServer', () => {
    if (thisGame) {
      startNewQuestion(thisGame.id, io);
    }
  });

  // Send messages when a player leaves the game
  socket.on("disconnect", () => {
    io.to(state.gameId).emit(
      "message",
      `${state.playerName} ha abandonado la partida.`
    );
    
      io.to(state.gameId).emit("abandonopartida", {
        ganadorId: state.playerId,
      });

    // Limpiar el estado de las preguntas
    if (gameQuestionStates[state.gameId]) {
      clearTimeout(gameQuestionStates[state.gameId].timer);
      delete gameQuestionStates[state.gameId];
    }
    if (thisGame && thisGame.players && thisGame.players.length === 0) {
      thisGame = null;
      delete games[state.gameId];
    }
    if (thisGame)
      thisGame.players = thisGame.players.filter(
        (player) => player.id !== state.playerId
      );
    socket.disconnect();
  });
});

console.log(
  `La aplicacion se encuentra arriba en http://localhost:${config.PORT}`
);

//npm i nodemon -D
//npm i -D nodemon @babel/core @babel/node @babel/preset-env
