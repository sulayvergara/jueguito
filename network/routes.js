
const usuario = require('../components/usuario/interface')
const Game = require('../components/juego/interface')



const routes = function( server ) {
    server.use('/usuario', usuario)
    server.use('/Game', Game)
}

module.exports = routes
