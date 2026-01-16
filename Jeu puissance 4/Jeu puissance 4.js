 const COLS = 7, ROWS = 6;
    let grid = [];
    let currentPlayer = 1;
    let mode = "2p";
    let gameOver = false;

    const gridDiv = document.getElementById("grid");
    const statusDiv = document.getElementById("status");
    const restartBtn = document.getElementById("restartBtn");
    const homeBtn = document.getElementById("homeBtn");
    const soundDrop = document.getElementById("soundDrop");
    const soundWin = document.getElementById("soundWin");

    function startGame(selectedMode) {
        mode = selectedMode;
        document.getElementById("menu").style.display = "none";
        document.getElementById("game").style.display = "block";
        restartGame();
    }

    function goHome() {
        document.getElementById("game").style.display = "none";
        document.getElementById("menu").style.display = "block";
    }

    function restartGame() {
        gameOver = false;
        currentPlayer = 1;
        restartBtn.style.display = "none";
        homeBtn.style.display = "none";
        initGrid();
    }

    function initGrid() {
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        gridDiv.innerHTML = "";

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.col = c;
                // Important : uniquement click, pas touchstart
                cell.addEventListener("click", () => play(c));
                gridDiv.appendChild(cell);
            }
        }

        updateStatus();
    }

    function play(col) {
        if (gameOver) return;

        let row = findRow(col);
        if (row === -1) return;

        grid[row][col] = currentPlayer;
        drawTokens();
        soundDrop.play();

        if (checkWin(currentPlayer)) {
            statusDiv.textContent = `Joueur ${currentPlayer} a gagné !`;
            soundWin.play();
            gameOver = true;
            restartBtn.style.display = "inline-block";
            homeBtn.style.display = "inline-block";
            return;
        }

        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateStatus();

        if (mode === "ia" && currentPlayer === 2) {
            setTimeout(aiPlay, 400);
        }
    }

    function findRow(col) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (grid[r][col] === 0) return r;
        }
        return -1;
    }

    function drawTokens() {
        document.querySelectorAll(".cell").forEach(cell => cell.innerHTML = "");

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c] !== 0) {
                    const token = document.createElement("div");
                    token.classList.add("token", grid[r][c] === 1 ? "p1" : "p2");

                    const index = r * COLS + c;
                    document.querySelectorAll(".cell")[index].appendChild(token);
                }
            }
        }
    }

    function updateStatus() {
        statusDiv.textContent = currentPlayer === 1
            ? "Tour du Joueur 1 (Rouge)"
            : "Tour du Joueur 2 (Jaune)";
    }

    /* IA améliorée */
    function aiPlay() {
        // IA gagne si possible
        for (let c = 0; c < COLS; c++) {
            let r = findRow(c);
            if (r !== -1) {
                grid[r][c] = 2;
                if (checkWin(2)) {
                    drawTokens();
                    soundDrop.play();
                    soundWin.play();
                    statusDiv.textContent = "L'IA a gagné !";
                    gameOver = true;
                    restartBtn.style.display = "inline-block";
                    homeBtn.style.display = "inline-block";
                    return;
                }
                grid[r][c] = 0;
            }
        }

        // IA bloque le joueur
        for (let c = 0; c < COLS; c++) {
            let r = findRow(c);
            if (r !== -1) {
                grid[r][c] = 1;
                if (checkWin(1)) {
                    grid[r][c] = 2;
                    drawTokens();
                    soundDrop.play();
                    currentPlayer = 1;
                    updateStatus();
                    return;
                }
                grid[r][c] = 0;
            }
        }

        // Coup aléatoire
        let col;
        do {
            col = Math.floor(Math.random() * COLS);
        } while (findRow(col) === -1);

        play(col);
    }

    function checkWin(player) {
        // Horizontal
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS - 3; c++)
                if (grid[r][c] === player && grid[r][c+1] === player && grid[r][c+2] === player && grid[r][c+3] === player)
                    return true;

        // Vertical
        for (let c = 0; c < COLS; c++)
            for (let r = 0; r < ROWS - 3; r++)
                if (grid[r][c] === player && grid[r+1][c] === player && grid[r+2][c] === player && grid[r+3][c] === player)
                    return true;

        // Diagonale /
        for (let r = 3; r < ROWS; r++)
            for (let c = 0; c < COLS - 3; c++)
                if (grid[r][c] === player && grid[r-1][c+1] === player && grid[r-2][c+2] === player && grid[r-3][c+3] === player)
                    return true;

        // Diagonale \
        for (let r = 0; r < ROWS - 3; r++)
            for (let c = 0; c < COLS - 3; c++)
                if (grid[r][c] === player && grid[r+1][c+1] === player && grid[r+2][c+2] === player && grid[r+3][c+3] === player)
                    return true;

        return false;
    }