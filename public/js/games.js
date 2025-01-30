document.addEventListener('DOMContentLoaded', () => {
    console.log('Cargando partidas automáticamente...');
    
    socket.emit('getGames');
    
    socket.on('gamesSuccess', (data) => {
        console.log('Partidas recibidas:', data.games);
        
        const gamesContainer = document.getElementById('games-container');
        gamesContainer.innerHTML = '';
        
        const table = document.createElement('table');
        table.classList.add('games-table');
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Nuevos encabezados
        ['ID Partida', 'Jugadores', 'Preguntas Correctas', 'Precisión Disparos', 'Estado', 'Ganador', 'Duración'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        data.games.forEach((game) => {
            const row = document.createElement('tr');
            
            // ID Partida
            const gameIdCell = document.createElement('td');
            gameIdCell.textContent = game.gameId;
            row.appendChild(gameIdCell);
            
            // Jugadores
            const playersCell = document.createElement('td');
            game.players.forEach(player => {
                const playerDiv = document.createElement('div');
                playerDiv.textContent = player.playerName;
                playersCell.appendChild(playerDiv);
            });
            row.appendChild(playersCell);
            
            // Preguntas Correctas
            const questionsCell = document.createElement('td');
            game.players.forEach(player => {
                const playerStats = document.createElement('div');
                playerStats.textContent = `${player.questionsCorrect}/${player.questionsAnswered}`;
                questionsCell.appendChild(playerStats);
            });
            row.appendChild(questionsCell);
            
            // Precisión de Disparos
            const accuracyCell = document.createElement('td');
            game.players.forEach(player => {
                const accuracyStats = document.createElement('div');
                const totalShots = player.shotsHit + player.shotsMissed;
                accuracyStats.textContent = `${player.shotsHit}/${totalShots}`;
                accuracyCell.appendChild(accuracyStats);
            });
            row.appendChild(accuracyCell);
            
            // Estado
            const gameStateCell = document.createElement('td');
            gameStateCell.textContent = game.gameState;
            row.appendChild(gameStateCell);
            
            // Ganador
            const gameWinnerCell = document.createElement('td');
            gameWinnerCell.textContent = game.winner ? game.winner.playerName : 'Aún no hay ganador';
            row.appendChild(gameWinnerCell);
            
            // Duración
            const durationCell = document.createElement('td');
            if (game.startTime && game.endTime) {
                const start = new Date(game.startTime);
                const end = new Date(game.endTime);
                const duration = Math.floor((end - start) / 1000 / 60); // duración en minutos
                durationCell.textContent = `${duration} min`;
            } else {
                durationCell.textContent = 'En progreso';
            }
            row.appendChild(durationCell);
            
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