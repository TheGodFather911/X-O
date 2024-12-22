const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const message = document.getElementById('message');
    const restartBtn = document.getElementById('restartBtn');
    const createGameBtn = document.getElementById('createGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    const gameCodeInput = document.getElementById('gameCodeInput');
    const gameCode = document.getElementById('gameCode');

    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = false;
    let socket;
    let gameId;

    function initSocket() {
      socket = io();

      socket.on('gameCreated', (id) => {
        gameId = id;
        gameCodeInput.style.display = 'none';
        message.textContent = `Share this code: ${gameId}`;
      });

      socket.on('gameJoined', (game) => {
        gameId = game.gameId;
        gameBoard = game.board;
        currentPlayer = game.currentPlayer;
        gameActive = game.gameActive;
        gameCodeInput.style.display = 'none';
        updateBoard();
        message.textContent = `Player ${currentPlayer}'s turn`;
      });

      socket.on('joinError', (error) => {
        message.textContent = error;
      });

      socket.on('moveMade', ({ board, currentPlayer: nextPlayer }) => {
        gameBoard = board;
        currentPlayer = nextPlayer;
        updateBoard();
        message.textContent = `Player ${currentPlayer}'s turn`;
      });

      socket.on('gameEnded', ({ winner, board }) => {
        gameBoard = board;
        gameActive = false;
        updateBoard();
        if (winner === 'draw') {
          message.textContent = "It's a draw!";
        } else {
          message.textContent = `Player ${winner} wins!`;
          cells.forEach(cell => {
            if (cell.dataset.index == board.indexOf(winner) || cell.dataset.index == board.lastIndexOf(winner)) {
              cell.classList.add(winner.toLowerCase());
            }
          });
        }
      });

      socket.on('gameRestarted', (game) => {
        gameBoard = game.board;
        currentPlayer = game.currentPlayer;
        gameActive = game.gameActive;
        updateBoard();
        message.textContent = `Player ${currentPlayer}'s turn`;
      });

      socket.on('playerLeft', (game) => {
        gameActive = false;
        message.textContent = 'Opponent left the game.';
      });
    }

    function updateBoard() {
      cells.forEach((cell, index) => {
        cell.textContent = gameBoard[index];
        cell.classList.remove('x', 'o');
        if (gameBoard[index] === 'X') {
          cell.classList.add('x');
        } else if (gameBoard[index] === 'O') {
          cell.classList.add('o');
        }
      });
    }

    function handleCellClick(e) {
      if (!gameActive) return;
      const cell = e.target;
      const index = cell.dataset.index;
      if (gameBoard[index] === '') {
        socket.emit('makeMove', { gameId, index });
      }
    }

    function restartGame() {
      if (gameId) {
        socket.emit('restartGame', gameId);
      }
    }

    createGameBtn.addEventListener('click', () => {
      initSocket();
      socket.emit('createGame');
    });

    joinGameBtn.addEventListener('click', () => {
      initSocket();
      const code = gameCode.value;
      if (code) {
        socket.emit('joinGame', code);
      }
    });

    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
    });

    restartBtn.addEventListener('click', restartGame);
