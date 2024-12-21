const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const message = document.getElementById('message');
    const restartBtn = document.getElementById('restartBtn');
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;

    function checkWinner() {
      const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
          message.textContent = `Player ${currentPlayer} wins!`;
          gameActive = false;
          cells.forEach(cell => {
            if (cell.dataset.index == a || cell.dataset.index == b || cell.dataset.index == c) {
              cell.classList.add(currentPlayer.toLowerCase());
            }
          });
          return;
        }
      }

      if (!gameBoard.includes('')) {
        message.textContent = "It's a draw!";
        gameActive = false;
      }
    }

    function handleCellClick(e) {
      if (!gameActive) return;

      const cell = e.target;
      const index = cell.dataset.index;

      if (gameBoard[index] === '') {
        gameBoard[index] = currentPlayer;
        cell.textContent = currentPlayer;
        checkWinner();
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (gameActive) {
          message.textContent = `Player ${currentPlayer}'s turn`;
        }
      }
    }

    function restartGame() {
      gameBoard = ['', '', '', '', '', '', '', '', ''];
      currentPlayer = 'X';
      gameActive = true;
      message.textContent = `Player ${currentPlayer}'s turn`;
      cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
      });
    }

    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
    });

    restartBtn.addEventListener('click', restartGame);
    message.textContent = `Player ${currentPlayer}'s turn`;
