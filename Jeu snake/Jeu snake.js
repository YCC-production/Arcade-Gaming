const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const menu = document.getElementById('menu');
const playBtn = document.getElementById('play-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseMessage = document.getElementById('pause-message');
const gameOverMessage = document.getElementById('game-over-message');
const finalScoreDisplay = document.getElementById('final-score');
const scoreDisplay = document.getElementById('score-display');
const recordDisplay = document.getElementById('record-display');
const levelDisplay = document.getElementById('level-display');
const backgroundMusic = document.getElementById('background-music');
const eatSound = document.getElementById('eat-sound');
const gameOverSound = document.getElementById('game-over-sound');

// Commandes tactiles
const touchControls = {
    up: document.getElementById('touch-up'),
    down: document.getElementById('touch-down'),
    left: document.getElementById('touch-left'),
    right: document.getElementById('touch-right'),
    pause: document.getElementById('touch-pause'),
};

// Constantes du jeu
const GRID_SIZE = 25;
const TILE_SIZE = 20;

let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameLoop;
let score = 0;
let highScore = 0;
let level = 1;
let gameSpeed = 150;
let isPaused = false;
let isGameOver = true;

function updateScoreDisplays() {
    scoreDisplay.textContent = `Score: ${score}`;
    recordDisplay.textContent = `Record: ${highScore}`;
    levelDisplay.textContent = `Niveau: ${level}`;
}

function initGame() {
    highScore = parseInt(localStorage.getItem('snakeHighScore') || 0);

    const startX = Math.floor(GRID_SIZE / 2) * TILE_SIZE;
    const startY = Math.floor(GRID_SIZE / 2) * TILE_SIZE;

    snake = [
        { x: startX, y: startY },
        { x: startX - TILE_SIZE, y: startY },
        { x: startX - 2 * TILE_SIZE, y: startY }
    ];

    generateFood();
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    level = 1;
    
    updateScoreDisplays();

    isPaused = false;
    isGameOver = false;
    pauseMessage.style.display = 'none';
    gameOverMessage.style.display = 'none';

    const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    switch (difficulty) {
        case 'easy': gameSpeed = 200; break;
        case 'medium': gameSpeed = 150; break;
        case 'hard': gameSpeed = 100; break;
    }
}

function generateFood() {
    let newFood = {};
    let isOverlapping = true;

    while (isOverlapping) {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE) * TILE_SIZE,
            y: Math.floor(Math.random() * GRID_SIZE) * TILE_SIZE
        };
        isOverlapping = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    food = newFood;
}

function drawGrid() {
    ctx.strokeStyle = '#3a0ca3';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= canvas.width; i += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x;
        const y = segment.y;

        ctx.fillStyle = index === 0 ? '#4cc9f0' : '#7209b7';
        ctx.strokeStyle = '#0a0a12';
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, 3);
        } else {
            ctx.rect(x, y, TILE_SIZE, TILE_SIZE);
        }
        ctx.fill();
        ctx.stroke();

        if (index === 0) {
            const eyeSize = 3;
            ctx.fillStyle = 'white';

            let e1x, e1y, e2x, e2y;
            if (direction === 'right') { e1x = x + 12; e1y = y + 5; e2x = x + 12; e2y = y + 12; }
            else if (direction === 'left') { e1x = x + 3; e1y = y + 5; e2x = x + 3; e2y = y + 12; }
            else if (direction === 'up') { e1x = x + 5; e1y = y + 3; e2x = x + 12; e2y = y + 3; }
            else if (direction === 'down') { e1x = x + 5; e1y = y + 12; e2x = x + 12; e2y = y + 12; }
            
            ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
            ctx.fillRect(e2x, e2y, eyeSize, eyeSize);
        }
    });
}

function drawFood() {
    ctx.fillStyle = '#f72585';
    ctx.shadowColor = '#f72585';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(food.x + TILE_SIZE / 2, food.y + TILE_SIZE / 2, TILE_SIZE / 2 * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function updateGame() {
    if (isPaused || isGameOver) return;

    direction = nextDirection;
    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y -= TILE_SIZE; break;
        case 'down': head.y += TILE_SIZE; break;
        case 'left': head.x -= TILE_SIZE; break;
        case 'right': head.x += TILE_SIZE; break;
    }

    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameOver();
        return;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        eatSound.currentTime = 0;
        eatSound.play();
        score += 10;

        if (score >= level * 50) {
            level++;
            const newSpeed = gameSpeed * 0.9;
            gameSpeed = Math.max(50, newSpeed);
            clearInterval(gameLoop);
            gameLoop = setInterval(gameLoopFn, gameSpeed);
        }

        updateScoreDisplays();
        generateFood();
    } else {
        snake.pop();
    }
}

function gameLoopFn() {
    updateGame();
    drawGame();
}

function drawGame() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    pauseMessage.style.display = isPaused ? 'flex' : 'none';
    if (isPaused) {
        backgroundMusic.pause();
        clearInterval(gameLoop);
    } else {
        backgroundMusic.play().catch(e => console.log('Music play blocked:', e));
        gameLoop = setInterval(gameLoopFn, gameSpeed);
    }
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    backgroundMusic.pause();
    gameOverSound.currentTime = 0;
    gameOverSound.play();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    
    finalScoreDisplay.textContent = `Score final: ${score} (Record: ${highScore})`;
    gameOverMessage.style.display = 'flex';
    updateScoreDisplays();
}

function setDirection(dir) {
    if (isGameOver || isPaused) return;
    let newDirection = nextDirection;
    if (dir === 'up' && direction !== 'down') newDirection = 'up';
    else if (dir === 'down' && direction !== 'up') newDirection = 'down';
    else if (dir === 'left' && direction !== 'right') newDirection = 'left';
    else if (dir === 'right' && direction !== 'left') newDirection = 'right';
    if (newDirection !== direction) { nextDirection = newDirection; }
}

document.addEventListener('keydown', (e) => {
    if (isGameOver && e.code !== 'Space') return;
    if (e.code === 'Space') { togglePause(); }
    else if (!isPaused) {
        switch (e.key) {
            case 'ArrowUp': setDirection('up'); break;
            case 'ArrowDown': setDirection('down'); break;
            case 'ArrowLeft': setDirection('left'); break;
            case 'ArrowRight': setDirection('right'); break;
        }
    }
});

playBtn.addEventListener('click', () => {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    initGame();
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0.3;
    backgroundMusic.play().catch(e => console.log('Music play blocked.'));
    gameLoop = setInterval(gameLoopFn, gameSpeed);
    drawGame();
    resizeCanvas();
});

restartBtn.addEventListener('click', () => {
    initGame();
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(e => console.log('Music play blocked.'));
    gameLoop = setInterval(gameLoopFn, gameSpeed);
});

touchControls.up.addEventListener('click', () => setDirection('up'));
touchControls.down.addEventListener('click', () => setDirection('down'));
touchControls.left.addEventListener('click', () => setDirection('left'));
touchControls.right.addEventListener('click', () => setDirection('right'));
touchControls.pause.addEventListener('click', togglePause);

function resizeCanvas() {
    if (canvas.style.display === 'block') {
        const containerWidth = gameContainer.offsetWidth;
        const size = Math.min(containerWidth, 500);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
    }
}

window.addEventListener('resize', resizeCanvas);
window.onload = () => {
    resizeCanvas(); 
    highScore = parseInt(localStorage.getItem('snakeHighScore') || 0);
    updateScoreDisplays();
    drawGame();
};

window.addEventListener("keydown", (e) => {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        if (canvas.style.display === 'block') { e.preventDefault(); }
    }
}, false);