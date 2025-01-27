const express = require("express");
const body_parser = require("body-parser");
const http = require("http");
const { Server: WebsocketServer } = require("socket.io");

const config = require("./network/config");
const routes = require("./network/routes");
const db = require("./network/db");
const { registerHandler, loginHandler, questionsHandler , addquestionHandler, deletequestionHandler} = require("./public/js/socket");

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
    this.countdown = 5; // 5 seconds countdown to start
    this.questionTimer = null;
    this.currentQuestion = null;
    this.currentPlayerShots = null;
    this.questionAnswered = false;
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
app.get("/games/join", (req, res) => {
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
  } else {
    games[gameId].players.push(player);
    res.redirect(
      `/play.html?playerName=${playerName}&game=${gameId}&playerId=${playerId}`
    );
  }
});

// Route gets called when a new game is being created
app.post("/games", (req, res) => {
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: "Internal Server Error" });
  } else if (!req.body["playerName"] || !req.body["playerId"]) {
    res.status(500).json({
      statusCode: 404,
      msg: "Bad request! Please submit correct data!",
    });
  } else {
    const playerName = req.body["playerName"];
    const playerId = req.body["playerId"];
    const player = new Player(playerId, playerName);

    const gameId = generateUUID();
    const game = new Game(gameId, `${playerName}'s Game`, [player]);
    console.log("Created new game: ", JSON.stringify(game));

    games = { ...games, [gameId]: game };
    console.log("All games currently live: ", JSON.stringify(games));

    res
      .status(301)
      .redirect(
        `/play.html?playerName=${playerName}&game=${game.id}&playerId=${playerId}`
      );
  }
});

// Game helper functions
const getInitialGridData = require("./components/helpers/getInitialGridData");
const { log } = require("console");

// Game states for simple state machine
const gameStates = {
  gameIsInitializing: "gameIsInitializing",
  gameInitialized: "gameInitialized",
  setShipsRound: "setShipsRound",
  gameRunning: "gameRunning",
  gameOver: "gameOver",
  gameQuestion: "gameQuestion"
};

// Letter for array-number lookup
const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

//almacen de preguntas usadas
let preguntasUsadas = [];

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

io.on("connection", (socket) => {
  registerHandler(socket);
  loginHandler(socket);
  questionsHandler(socket);
  addquestionHandler(socket);
  deletequestionHandler(socket);

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

    // Change game state to "initialized"
    thisGame.gameState = gameStates.gameInitialized;
    socket.emit("changeGameState", thisGame.gameState);
    socket.emit("message", "Welcome to the game!");

    // Broadcast to other player that another player has joined
    socket.broadcast
      .to(state.gameId)
      .emit("message", `${state.playerName} has joined the game.`);

    // Check number of players, as soon as both players are there => game can start
    if (thisGame.players.length <= 1) {
      socket.emit("message", "Waiting for other players to join...");
    } else if (thisGame.players.length >= 2) {
      // Unlist game from lobby as soon as a second player joins
      thisGame.isListed = false;

      thisGame.gameState = gameStates.setShipsRound;
      io.to(state.gameId).emit("changeGameState", thisGame.gameState);
      io.to(state.gameId).emit(
        "message",
        "The game has started! Place your ships!"
      );
    }
  });

  socket.on("clickOnEnemyGrid", ({ x, y }) => {
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
    socket.emit("message", `Te quedan ${thisGame.currentPlayerShots} disparos.`);

    // Manejar disparos en agua
    if (currentCellValue === 0) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 2; // Marcar como agua en el tablero enemigo
        state.otherPlayerGrid[y][x] = 2; // Actualizar la vista del jugador
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

        // Verificar si el enemigo perdió todos sus barcos
        if (thisGame[`${otherPlayerId}_shipsLost`] >= 10) {
            socket.emit("updateGrid", {
                gridToUpdate: "enemyGrid",
                data: state.otherPlayerGrid,
            });
            socket.broadcast.to(state.gameId).emit("updateGrid", {
                gridToUpdate: "friendlyGrid",
                data: thisGame[`${otherPlayerId}_grid`],
            });

            thisGame.gameState = gameStates.gameOver; // Cambiar el estado del juego a terminado
            io.to(state.gameId).emit("changeGameState", thisGame.gameState);
            io.to(state.gameId).emit(
                "message",
                `${state.playerName} ganó el juego. ¡Felicidades!`
            );
            return;
        }
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
    io.to(state.gameId).emit(
        "message",
        `Es el turno de ${thisGame.players.find(player => player.id === nextPlayerId).name}`
    );
    
    // Notificar a los clientes sobre el turno
    // socket.emit("yourTurn", false); // Jugador actual termina su turno
    // socket.broadcast.to(state.gameId).emit("yourTurn", true); // Turno para el siguiente jugador
  });

  socket.on("clickOnFriendlyGrid", ({ x, y }) => {
    if (thisGame.gameState === gameStates.setShipsRound) {
      y = letters.indexOf(y);
      const currentCellValue = thisGame[`${state.playerId}_grid`][y][x];

      if (
        currentCellValue === 0 &&
        thisGame[`${state.playerId}_shipsPlaced`] < 10
      ) {
        thisGame[`${state.playerId}_grid`][y][x] = 1;
        thisGame[`${state.playerId}_shipsPlaced`]++;
        socket.emit(
          "message",
          `Battleship placed! ${
            10 - thisGame[`${state.playerId}_shipsPlaced`]
          } to go.`
        );
        socket.emit("updateGrid", {
          gridToUpdate: "friendlyGrid",
          data: thisGame[`${state.playerId}_grid`],
        });
        if (
          thisGame[`${thisGame.players[0].id}_shipsPlaced`] === 10 &&
          thisGame[`${thisGame.players[1].id}_shipsPlaced`] === 10
        ) {
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
      } else if (
        currentCellValue === 1 &&
        thisGame[`${state.playerId}_shipsPlaced`] < 10
      ) {
        socket.emit(
          "message",
          `You're not allowed to place ships on top of each other! Place your ship in another cell...`
        );
      } else if (thisGame[`${state.playerId}_shipsPlaced`] >= 10) {
        socket.emit(
          "message",
          `You've already placed the maximum number of ships available`
        );
      }
    }
  });


  //socket de preguntas
  socket.on('gameQuestion', async () => {
    if (thisGame.gameState === gameStates.gameQuestion) {
      try {
        const question = await obtenerPreguntaAleatoria();
        
        if (question) {
          // Explicitly set the current question in the game
          thisGame.currentQuestion = question;
          
          socket.emit('showQuestion', thisGame.currentQuestion);
          
          // Start 30 second timer
          thisGame.questionTimer = setTimeout(() => {
            // If no answer within 30 seconds, move to next question
            thisGame.currentQuestion = null;
            socket.emit('message', '30 SEGUNDOS ACABADOS');
            socket.emit('timeExpired');
          }, 30000);
        } else {
          console.error('No se pudo obtener una pregunta');
        }
      } catch (error) {
        console.error('Error en gameQuestion:', error);
      }
    }
  });

  socket.on('submitAnswer', async ({ respuesta, preguntaId }) => {
    console.log('Datos recibidos:', { respuesta, preguntaId });
    thisGame.currentTurn = null;
  
    if (thisGame.gameState === gameStates.gameQuestion) {
      const currentQuestion = thisGame.currentQuestion;
      
      console.log('Pregunta actual:', {
        question: currentQuestion,
        id: currentQuestion._id,
        correctAnswer: currentQuestion.answer
      });
      console.log('Comparación:', {
        idsMatch: currentQuestion._id === preguntaId,
        answerMatch: currentQuestion.answer === respuesta
      });
  
      // Modificación: Simplificar la comparación
      if (currentQuestion && currentQuestion.answer === respuesta) {
        console.log('¡Respuesta correcta!');
        thisGame.currentPlayerShots = 3;
        socket.emit("message", `Obtienes ${thisGame.currentPlayerShots} disparos.`);
        // Limpiar temporizador
        if (thisGame.questionTimer) {
          clearTimeout(thisGame.questionTimer);
        }
        
        // Cambiar estado del juego
        thisGame.gameState = gameStates.gameRunning;
        
        // Notificar a los jugadores
        io.to(state.gameId).emit('changeGameState', thisGame.gameState);
        io.to(state.gameId).emit('correctAnswer', { 
          playerName: state.playerName,
          playerId: state.playerId 
        });
        io.to(state.gameId).emit(
          "message",
          "Disparense"
        );
        // Asignar turno al jugador que respondió correctamente
        thisGame.currentTurn = state.playerId;
        console.log('Turno asignado a:', {
          playerId: state.playerId,
          playerName: state.playerName
        });
        socket.emit("yourTurn", true);
      
      } else {
        console.log('Respuesta incorrecta o pregunta no válida', {
          receivedAnswer: respuesta,
          expectedAnswer: currentQuestion?.answer
        });
        socket.emit('wrongAnswer');
      }
    } else {
      console.log('Estado de juego incorrecto:', thisGame.gameState);
    }
  });
  
  // Handle chat messages between players
  socket.on("chatMessage", ({ playerName, message }) => {
    io.to(state.gameId).emit("chatMessage", {
      playerName,
      message,
    });
  });

  // Send messages when a player leaves the game
  socket.on("disconnect", () => {
    io.to(state.gameId).emit(
      "message",
      `${state.playerName} has left the game.`
    );

    // Cleanup when one or both players leave => delete game from memory when both left
    if (thisGame)
      thisGame.players = thisGame.players.filter(
        (player) => player.id !== state.playerId
      );

    // Change game-state to gameover - inform player about his win
    if (thisGame) {
      thisGame.gameState = gameStates.gameOver;
      io.to(state.gameId).emit("changeGameState", thisGame.gameState);

      io.to(state.gameId).emit(
        "message",
        "Congrats! You won as the other player has left the game! You will be automatically loaded to the main menu in 10 seconds..."
      );
    }

    if (thisGame && thisGame.players && thisGame.players.length === 0) {
      thisGame = null;
      delete games[state.gameId];
    }

    socket.disconnect();
  });
});

console.log(
  `La aplicacion se encuentra arriba en http://localhost:${config.PORT}`
);

//npm i nodemon -D
//npm i -D nodemon @babel/core @babel/node @babel/preset-env
