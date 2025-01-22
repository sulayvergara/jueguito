const express = require("express");
const body_parser = require("body-parser");
const http = require("http");
const { Server: WebsocketServer } = require("socket.io");

const config = require("./network/config");
const routes = require("./network/routes");
const db = require("./network/db");
const { registerHandler, loginHandler } = require("./public/js/socket");

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
    this.currentPlayerShots = 0;
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

//obtencion de preguntas de la base
async function obtenerPreguntaAleatoria() {
  try {
    console.log("llamando funcion obtenerpregunta server.js");
    // Importamos directamente el controlador en lugar de las rutas
    const controller = require("./components/preguntas/controller");
    
    console.log('Ejecutando consulta de preguntas...');
    // Llamamos directamente a la función del controlador
    const preguntasData = await controller.obtenerPreguntas();
    
    console.log("finalizando funcion obtenerpregunta");
    
    if (preguntasData && preguntasData.length > 0) {
      console.log('Total de preguntas disponibles:', preguntasData.length);
      const randomIndex = Math.floor(Math.random() * preguntasData.length);
      console.log('Pregunta seleccionada:', preguntasData[randomIndex]);
      return preguntasData[randomIndex];
    }
    
    throw new Error('No se encontraron preguntas');
  } catch (error) {
    console.error('Error al obtener pregunta:', error);
    return null;
  }
}

// Update the startQuestionRound function to handle the response properly
// async function startQuestionRound(game, io) {
//   console.log("llamando funcion startquestionround server.js");
//   try {
//     console.log('Iniciando ronda de preguntas para el juego:', game.id);
//     const question = await obtenerPreguntaAleatoria();
//     console.log('Pregunta obtenida para mostrar:', question);
//     if (question) {
//       game.currentQuestion = question;
//       console.log('Emitiendo pregunta al cliente...');
//       io.to(game.id).emit('showQuestion', question);
      
//       console.log('Iniciando temporizador de 30 segundos');
//       // Start 30 second timer
//       game.questionTimer = setTimeout(() => {
//         console.log('Tiempo agotado para la pregunta. Obteniendo nueva pregunta...');
//         game.currentQuestion = null;
//         startQuestionRound(game, io); // Start new question if no one answers
//       }, 30000);
//     } else {
//       console.error('No se pudo obtener una pregunta');
//     }
//   } catch (error) {
//     console.error('Error en startQuestionRound:', error);
//   }
//   console.log("finalizando starquestionround");
// }

io.on("connection", (socket) => {
  registerHandler(socket);
  loginHandler(socket);
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
    if (thisGame.gameState === gameStates.gameRunning) {
      y = letters.indexOf(y);

      const otherPlayerId = thisGame.players.filter((player) => {
        return player.id !== state.playerId;
      })[0].id;
      const currentCellValue = thisGame[`${otherPlayerId}_grid`][y][x];

      if (currentCellValue === 2 || currentCellValue === 3) {
        socket.emit(
          "message",
          `You already hit that spot! Click on another one`
        );
        return;
      }

      if (currentCellValue === 0) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 2;
        state.otherPlayerGrid[y][x] = 2;
        socket.emit("message", `You hit water!`);
        socket.broadcast
          .to(state.gameId)
          .emit("message", `The other player hit nothing!`);
      } else if (currentCellValue === 1) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 3;
        state.otherPlayerGrid[y][x] = 3;
        thisGame[`${otherPlayerId}_shipsLost`]++;
        socket.emit(
          "message",
          `You hit one of the other players' battleships! Nice!`
        );
        socket.broadcast
          .to(state.gameId)
          .emit(
            "message",
            `Oh noes! The other player hit one of your battleships!`
          );

        if (thisGame[`${otherPlayerId}_shipsLost`] >= 10) {
          socket.emit("updateGrid", {
            gridToUpdate: "enemyGrid",
            data: state.otherPlayerGrid,
          });
          socket.broadcast.to(state.gameId).emit("updateGrid", {
            gridToUpdate: "friendlyGrid",
            data: thisGame[`${otherPlayerId}_grid`],
          });

          thisGame.gameState = gameStates.gameOver;
          io.to(state.gameId).emit("changeGameState", thisGame.gameState);
          io.to(state.gameId).emit(
            "message",
            `${state.playerName} won! Congratulations! You will be automatically loaded to the main menu in 10 seconds...`
          );
          return;
        }
      }
      socket.emit("updateGrid", {
        gridToUpdate: "enemyGrid",
        data: state.otherPlayerGrid,
      });
      socket.broadcast.to(state.gameId).emit("updateGrid", {
        gridToUpdate: "friendlyGrid",
        data: thisGame[`${otherPlayerId}_grid`],
      });

      io.to(state.gameId).emit("nextRound");
      socket.emit("yourTurn", false);
      socket.broadcast.to(state.gameId).emit("yourTurn", true);
    }
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
    console.log("socket.on gameQuestion de server.js ");
    if (thisGame.gameState === gameStates.gameQuestion) {
        console.log("se activa socket de gamequestion de server");
        try {
          const question = await obtenerPreguntaAleatoria();
          console.log('Pregunta obtenida para mostrar:', question);
          if (question) {
            console.log('Emitiendo pregunta al cliente...');
            socket.emit('showQuestion', question);
            
            console.log('Iniciando temporizador de 30 segundos');
            // Start 30 second timer
            thisGame.questionTimer = setTimeout(() => {
              console.log('Tiempo agotado para la pregunta. Obteniendo nueva pregunta...');
              socket.emit("changeGameState",thisGame.gameState);
            }, 30000);
          } else {
            console.error('No se pudo obtener una pregunta');
          }
        } catch (error) {
          console.error('Error en startQuestionRound:', error);
        }
        console.log("finalizando starquestionround");
      }
        // if (pregunta) {

        //     //io.to(state.gameId).emit('showQuestion', pregunta);
        //     // Iniciar temporizador de 30 segundos para la pregunta
        //     thisGame.questionTimer = setTimeout(async () => {
        //         if (thisGame.gameState === gameStates.gameQuestion) {
        //             const nuevaPregunta = await obtenerPreguntaAleatoria();
        //             io.to(state.gameId).emit('showQuestion', nuevaPregunta);
        //         }
        //     }, 30000);
        // }
    });
//});

socket.on('submitAnswer', async ({ respuesta, preguntaId }) => {
  if (thisGame.gameState === gameStates.gameQuestion && thisGame.currentQuestion) {
      try {
          console.log('Respuesta recibida:', respuesta);
          console.log('Pregunta actual:', thisGame.currentQuestion);
          // Verificar si la respuesta es correcta (comparando con el campo 'answer' de la pregunta)
          if (thisGame.currentQuestion._id.toString() === preguntaId && 
              thisGame.currentQuestion.answer === respuesta) {
              
              // Detener el temporizador de la pregunta
              clearTimeout(thisGame.questionTimer);
              console.log("respuesta correcta");
              // Cambiar el estado del juego a gameRunning
              // thisGame.gameState = gameStates.gameRunning;
              // console.log("cambio de juegorunning");
              // Establecer 3 disparos para el jugador que respondió correctamente
              // thisGame.currentPlayerShots = 3;
              
              // Dar el turno al jugador que respondió correctamente
              socket.emit('yourTurn', true);
              socket.broadcast.to(state.gameId).emit('yourTurn', false);
              
              // Ocultar el modal de preguntas
              io.to(state.gameId).emit('hideQuizModal');
              // Notificar el cambio de estado del juego
              io.to(state.gameId).emit('changeGameState', thisGame.gameState);
              io.to(state.gameId).emit('message', 
                  `${state.playerName} respondió correctamente y obtiene 3 disparos!`);
              }else{
                socket.emit("wrongAnser")
                io.to(state.gameId).emit('message',
                  `${state.playerName} respondió incorrectamente. ¡Sigue intentando!`);
              }
            } catch (error) {
              console.error('Error validando respuesta:', error);
            }
          } else{
              console.log("No hay pregunta actual o el estado no es correcto")  
          }
              thisGame.gameState = gameStates.gameRunning;
              socket.emit("changeGameState", thisGame.gameState);
              io.to(state.gameId).emit(
                "message",
                `${state.playerName} Hora de disparar!`
              );
              // Configurar el manejador para contar los disparos
          //     const shotHandler = () => {
          //         thisGame.currentPlayerShots--;
          //         if (thisGame.currentPlayerShots === 0) {
          //             // Cuando se acaban los disparos, volver al estado de preguntas
          //             thisGame.gameState = gameStates.gameQuestion;
          //             io.to(state.gameId).emit('changeGameState', thisGame.gameState);
          //             startQuestionRound(thisGame, io);
          //         }
          //     };
              
          //     // Escuchar los disparos del jugador
          //     socket.on('shotFired', shotHandler);
          // } else {
          //     // Si la respuesta es incorrecta
          //     socket.emit('wrongAnswer');
          //     io.to(state.gameId).emit('message', 
          //         `${state.playerName} respondió incorrectamente. ¡Sigue intentando!`);
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
