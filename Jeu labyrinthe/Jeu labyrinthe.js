document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    
    // Variables d'état
    let maze = [], player = {x:0, y:0}, end = {x:0, y:0};
    let currentLevel = 1, currentDifficulty = 'normal', moves = 0;
    let cellSize = 0, gridWidth = 0, gridHeight = 0;

    const configs = {
        facile: { size: 11, step: 2 },
        normal: { size: 15, step: 2 },
        difficile: { size: 21, step: 2 }
    };

    function initGame(diff) {
        currentDifficulty = diff;
        currentLevel = 1;
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        loadLevel();
    }

    function loadLevel() {
        moves = 0;
        const size = configs[currentDifficulty].size + (currentLevel * configs[currentDifficulty].step);
        gridWidth = gridHeight = size;
        
        // Calculer la taille des cases selon l'écran
        const availableWidth = window.innerWidth * 0.85;
        cellSize = Math.floor(Math.min(availableWidth, 400) / size);
        
        canvas.width = size * cellSize;
        canvas.height = size * cellSize;
        
        generateMaze(size, size);
        draw();
        updateUI();
    }

    function generateMaze(w, h) {
        maze = Array(h).fill().map(() => Array(w).fill(1));
        const stack = [];
        const start = {x: 1, y: 1};
        maze[start.y][start.x] = 0;
        stack.push(start);

        while(stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            [[0,-2],[0,2],[-2,0],[2,0]].forEach(([dx, dy]) => {
                const nx = current.x + dx, ny = current.y + dy;
                if(nx > 0 && nx < w-1 && ny > 0 && ny < h-1 && maze[ny][nx] === 1) {
                    neighbors.push({x: nx, y: ny, dx: dx/2, dy: dy/2});
                }
            });

            if(neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[current.y + next.dy][current.x + next.dx] = 0;
                maze[next.y][next.x] = 0;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        player = {x: 1, y: 1};
        end = {x: w-2, y: h-2};
        maze[end.y][end.x] = 0;
    }

    function draw() {
        ctx.fillStyle = "#16213e";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        for(let y=0; y<gridHeight; y++) {
            for(let x=0; x<gridWidth; x++) {
                if(maze[y][x] === 0) {
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
                }
            }
        }
        // Joueur
        ctx.fillStyle = "#4ecca3";
        ctx.beginPath();
        ctx.arc(player.x*cellSize + cellSize/2, player.y*cellSize + cellSize/2, cellSize/3, 0, Math.PI*2);
        ctx.fill();
        // Fin
        ctx.fillStyle = "#e94560";
        ctx.fillRect(end.x*cellSize+2, end.y*cellSize+2, cellSize-4, cellSize-4);
    }

    function move(dx, dy) {
        if(maze[player.y + dy][player.x + dx] === 0) {
            player.x += dx; player.y += dy; moves++;
            updateUI(); draw();
            if(player.x === end.x && player.y === end.y) checkWin();
        }
    }

    function checkWin() {
        if(currentLevel < 10) {
            currentLevel++; loadLevel();
        } else {
            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('win-screen').classList.remove('hidden');
        }
    }

    function updateUI() {
        document.getElementById('level-display').innerText = `Niveau : ${currentLevel}/10`;
        document.getElementById('moves-display').innerText = `Pas : ${moves}`;
    }

    // Événements Tactiles & Clics
    const bindBtn = (id, dx, dy) => {
        const el = document.getElementById(id);
        const action = (e) => { e.preventDefault(); move(dx, dy); };
        el.addEventListener('touchstart', action, {passive: false});
        el.addEventListener('click', action);
    };

    bindBtn('up-btn', 0, -1); bindBtn('down-btn', 0, 1);
    bindBtn('left-btn', -1, 0); bindBtn('right-btn', 1, 0);

    // Difficultés
    document.querySelectorAll('.difficulty-buttons button').forEach(btn => {
        btn.onclick = () => initGame(btn.dataset.difficulty);
    });

    document.getElementById('restart-btn').onclick = () => location.reload();
});