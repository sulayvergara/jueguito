document.addEventListener('DOMContentLoaded', () => {
    console.log('Cargando partidas automáticamente...');

    // Emitir el evento para obtener las partidas al cargar la página
    socket.emit('getGames');

    // Escuchar el resultado exitoso
    socket.on('gamesSuccess', (data) => {
        console.log('Partidas recibidas:', data.games);
        
        // Renderizar las partidas en la tabla
        const gamesContainer = document.getElementById('games-container');
        gamesContainer.innerHTML = ''; // Limpiar contenido anterior

        // Crear la tabla y encabezados
        const table = document.createElement('table');
        table.classList.add('games-table');
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['ID del Juego', 'Estado', 'Ganador', 'Jugadores'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        data.games.forEach((game) => {
            const row = document.createElement('tr');

            // ID del Juego
            const gameIdCell = document.createElement('td');
            gameIdCell.textContent = game.gameId;
            row.appendChild(gameIdCell);

            // Estado del Juego
            const gameStateCell = document.createElement('td');
            gameStateCell.textContent = game.gameState;
            row.appendChild(gameStateCell);

            // Ganador
            const gameWinnerCell = document.createElement('td');
            gameWinnerCell.textContent = game.winner ? game.winner.playerName : 'Aún no hay ganador';
            row.appendChild(gameWinnerCell);

            // Lista de jugadores
            const playersCell = document.createElement('td');
            const playersList = document.createElement('ul');
            game.players.forEach(player => {
                const playerItem = document.createElement('li');
                playerItem.textContent = `${player.playerName} (Barcos colocados: ${player.shipsPlaced})`;
                playersList.appendChild(playerItem);
            });
            playersCell.appendChild(playersList);
            row.appendChild(playersCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        gamesContainer.appendChild(table);
    });
});


function mostrarGames() {
    // Ocultar el menú principal
    const mainTab = document.getElementById('main-tab');
    mainTab.classList.add('hidden');

    const gamesTab = document.getElementById('games-tab');
    gamesTab.classList.remove('hidden');
}