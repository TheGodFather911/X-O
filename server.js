const express = require('express');
    const http = require('http');
    const { Server } = require('socket.io');
    const { v4: uuidv4 } = require('uuid');

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    const games = {};

    app.use(express.static('.'));

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('createGame', () => {
        const gameId = uuidv4();
        games[gameId] = {
          players: [socket.id],
          board: ['', '', '', '', '', '', '', '', ''],
          currentPlayer: 'X',
          gameActive: true
        };
        socket.join(gameId);
        socket.emit('gameCreated', { gameId, players: games[gameId].players });
        console.log('Game created:', gameId);
      });

      socket.on('joinGame', (gameId) => {
        if (games[gameId] && games[gameId].players.length < 2) {
          games[gameId].players.push(socket.id);
          socket.join(gameId);
          io.to(gameId).emit('gameJoined', { game: games[gameId], gameId });
          console.log('User joined game:', gameId);
        } else {
          socket.emit('joinError', 'Game is full or does not exist.');
        }
      });

      socket.on('makeMove', ({ gameId, index }) => {
        if (!games[gameId] || !games[gameId].gameActive) return;

        const game = games[gameId];
        if (game.players.indexOf(socket.id) === -1) return;

        if (game.board[index] === '') {
          game.board[index] = game.currentPlayer;
          const winner = checkWinner(game.board);
          if (winner) {
            game.gameActive = false;
            io.to(gameId).emit('gameEnded', { winner, board: game.board });
          } else if (!game.board.includes('')) {
            game.gameActive = false;
            io.to(gameId).emit('gameEnded', { winner: 'draw', board: game.board });
          } else {
            game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
            io.to(gameId).emit('moveMade', { board: game.board, currentPlayer: game.currentPlayer });
          }
        }
      });

      socket.on('restartGame', (gameId) => {
        if (!games[gameId]) return;
        games[gameId].board = ['', '', '', '', '', '', '', '', ''];
        games[gameId].currentPlayer = 'X';
        games[gameId].gameActive = true;
        io.to(gameId).emit('gameRestarted', games[gameId]);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const gameId in games) {
          const game = games[gameId];
          const playerIndex = game.players.indexOf(socket.id);
          if (playerIndex > -1) {
            game.players.splice(playerIndex, 1);
            if (game.players.length === 0) {
              delete games[gameId];
              console.log('Game deleted:', gameId);
            } else {
              io.to(gameId).emit('playerLeft', game);
            }
            break;
          }
        }
      });
    });

    function checkWinner(board) {
      const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }
      return null;
    }

    const PORT = 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
