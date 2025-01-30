const express = require("express");
const body_parser = require("body-parser");
const http = require("http");
const { Server: WebsocketServer } = require("socket.io");

const config = require("./network/config");
const routes = require("./network/routes");
const db = require("./network/db");
const { registerHandler, loginHandler, questionsHandler , addquestionHandler,
   deletequestionHandler, StudentsHandler, GameHandler} = require("./public/js/socket");

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
app.get("/games/join", async(req, res) => {
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
app.post("/games", async(req, res) => {
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
    if (!game) return;

    clearTimeout(gameQuestionStates[gameId]?.timer);
    game.currentQuestion = null;
    gameQuestionStates[gameId].wrongAnswers.clear();
    
    io.to(gameId).emit('timeExpired');
    io.to(gameId).emit('message', 'Tiempo agotado, ¡siguiente pregunta!');
    
    // Iniciar nueva pregunta después de un breve retraso
    setTimeout(() => {
      startNewQuestion(gameId, io);
    }, 1000);
  }

  // Función para iniciar una nueva pregunta
  async function startNewQuestion(gameId, io) {
    const game = games[gameId];
    if (!game) return;
  
    // Limpiar el temporizador anterior si existe
    if (gameQuestionStates[gameId]?.timer) {
      clearTimeout(gameQuestionStates[gameId].timer);
    }
  
    // Inicializar o resetear el estado de las preguntas para este juego
    if (!gameQuestionStates[gameId]) {
      gameQuestionStates[gameId] = {
        timer: null,
        wrongAnswers: new Set()
      };
    }
    gameQuestionStates[gameId].wrongAnswers.clear();
  
    try {
      const question = await obtenerPreguntaAleatoria();
      if (!question) {
        throw new Error('No se pudo obtener una pregunta');
      }
  
      game.currentQuestion = question;
      io.to(gameId).emit('showQuestion', question);
      
      // Iniciar nuevo temporizador
      gameQuestionStates[gameId].timer = setTimeout(() => {
        handleQuestionTimeout(gameId, io);
      }, 30000);
  
    } catch (error) {
      console.error('Error al iniciar nueva pregunta:', error);
      handleQuestionTimeout(gameId, io);
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
      game.currentQuestion = null;
  
      // Configurar estado del juego y disparos
      game.gameState = gameStates.gameRunning;
      game.currentPlayerShots = 3;
      game.currentTurn = playerId;
  
      // Notificar a los jugadores
      socket.emit("message", `Obtienes ${game.currentPlayerShots} disparos.`);
      io.to(gameId).emit('changeGameState', game.gameState);
      io.to(gameId).emit('correctAnswer', { playerName, playerId });
      io.to(gameId).emit("message", "¡A disparar!");
      socket.emit("yourTurn", true);
    } else {
      gameQuestionStates[gameId].wrongAnswers.add(playerId);
  
      if (gameQuestionStates[gameId].wrongAnswers.size >= 2) {
        // Ambos jugadores respondieron incorrectamente
        clearTimeout(gameQuestionStates[gameId].timer);
        gameQuestionStates[gameId].wrongAnswers.clear();
  
        io.to(gameId).emit('message', '¡Ambos jugadores fallaron! Nueva pregunta...');
  
        setTimeout(() => {
          startNewQuestion(gameId, io);
        }, 1);
      } else {
        socket.emit('message', 'Respuesta incorrecta, ¡espera a que el otro jugador responda!');
      }
    }
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

  socket.on("clickOnEnemyGrid", async({ x, y }) => {
    try{
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

          // Verificar si el enemigo perdió todos sus barcos
          if (thisGame[`${otherPlayerId}_shipsLost`] >= 10) {
            await gameService.endGame(state.gameId, state.playerId, state.playerName);
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
    } catch (error) {
      console.error("Error processing shot:", error);
    } 
  });

  socket.on("clickOnFriendlyGrid", async({ x, y }) => {
    if (thisGame.gameState === gameStates.setShipsRound) {
      y = letters.indexOf(y);
      const currentCellValue = thisGame[`${state.playerId}_grid`][y][x];

      if (
        currentCellValue === 0 &&
        thisGame[`${state.playerId}_shipsPlaced`] < 10
      ) {
        thisGame[`${state.playerId}_grid`][y][x] = 1;
        thisGame[`${state.playerId}_shipsPlaced`]++;
        
        await gameService.recordShipsPlaced(thisGame.id, state.playerId);
          
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
