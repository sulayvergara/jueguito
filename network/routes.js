const preguntas = require ('../components/preguntas/interface')

const routes = function( server ) {
    server.use('/preguntas', preguntas)
}
module.exports = routes
