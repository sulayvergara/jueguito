
const usuario = require('../components/usuario/interface')
const Game = require('../components/juego/interface')
const preguntas = require ('../components/preguntas/interface')


const routes = function( server ) {
    server.use('/usuario', usuario)
    server.use('/Game', Game)
    server.use('/preguntas', preguntas)
}

module.exports = routes
