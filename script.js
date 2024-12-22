const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const message = document.getElementById('message');
    const restartBtn = document.getElementById('restartBtn');
    const createGameBtn = document.getElementById('createGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    const gameCodeInput = document.getElementById('gameCodeInput');
    const gameCode = document.getElementById('gameCode');
    const playersDiv = document.getElementById('players');
    const ngrokInput = document.getElementById('ngrokInput');
    const ngrokUrlInput = document.getElementById('ngrokUrlInput');
    const connectBtn = document.getElementById('connectBtn');

    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = false;
    let socket;
    let gameId;
    let isHost = false;
    let ngrokUrl = '';
    let fetchAttempts = 0;
    const maxFetchAttempts = 3;

    async function fetchNgrokUrl() {
      try {
        const response = await fetch('http://localhost:4040/api/tunnels');
        const data = await response.json();
        if (data.tunnels && data.tunnels.length > 0) {
          ngrokUrl = data.tunnels[0].public_url;
          console.log('ngrok URL:', ngrokUrl);
          return true;
        } else {
          console.error('No ngrok tunnels found.');
          return false;
        }
      } catch (error) {
        console.error('Error fetching ngrok URL:', error);
        return false;
      }
    }

    async function initSocket() {
      message.textContent = 'Fetching ngrok URL...';
      await new Promise(resolve => setTimeout(resolve, 1000));

      const fetchSuccess = await fetchNgrokUrl();
      if (fetchSuccess) {
        socket = io(ngrokUrl);
        setupSocketEvents();
      } else if (fetchAttempts < maxFetchAttempts) {
        fetchAttempts++;
        message.textContent = `Failed to fetch ngrok URL. Retrying... (${fetchAttempts}/${maxFetchAttempts})`;
        await new Promise(resolve => setTimeout(resolve, 2000));
        initSocket();
      } else {
        message.textContent = 'Failed to fetch ngrok URL. Please enter it manually.';
        ngrokInput.style.display = 'flex';
      }
    }

    function setupSocketEvents() {
      socket.on('gameCreated', ({ gameId: id, players }) => {
        gameId = id;
        isHost = true;
        gameCodeInput.style.display = 'none';
        ngrokInput.style.display = 'none';
        message.textContent = `Share this code: ${gameId}`;
        updatePlayersDisplay(players);
      });

      socket.on('gameJoined', ({ game, gameId: id }) => {
        gameId = id;
        gameBoard = game.board;
        currentPlayer = game.currentPlayer;
        gameActive = game.gameActive;
        gameCodeInput.style.display = 'none';
        ngrokInput.style.display = 'none';
        updateBoard();
        updatePlayersDisplay(game.players);
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
        updatePlayersDisplay(game.players);
        message.textContent = 'Opponent left the game.';
      });
    }

    function updatePlayersDisplay(players) {
      playersDiv.innerHTML = '';
      players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.textContent = `Player ${player.slice(0, 5)} ${isHost ? '(Host)' : ''}`;
        playersDiv.appendChild(playerElement);
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

    connectBtn.addEventListener('click', () => {
      ngrokUrl = ngrokUrlInput.value;
      if (ngrokUrl) {
        socket = io(ngrokUrl);
        setupSocketEvents();
        ngrokInput.style.display = 'none';
        message.textContent = 'Connecting...';
      }
    });

    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
    });

    restartBtn.addEventListener('click', restartGame);
