
const usuario = require('../components/usuario/interface')



const routes = function( server ) {
    server.use('/usuario', usuario)
    server.use('/juego', juego)
}

module.exports = routes
