
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        let gameMode = 'ai';
        let difficulty = 'medium';
        let maxScore = 5;
        let gameStarted = false;
        let isPaused = false;
        let player1Score = 0;
        let player2Score = 0;
        let countdownActive = false;

        // Audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        function playTone(freq, duration) {
            try {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                osc.start();
                osc.stop(audioContext.currentTime + duration);
            } catch(e) {}
        }

        function playHit() { playTone(800, 0.1); }
        function playScore() { playTone(400, 0.3); setTimeout(() => playTone(500, 0.3), 100); }
        function playVictory() {
            [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.4), i * 150));
        }

        function resizeCanvas() {
            const container = document.querySelector('.game-wrapper');
            const maxWidth = Math.min(800, container.clientWidth - 40);
            const scale = maxWidth / 800;
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = (500 * scale) + 'px';
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const difficultySettings = {
            easy: { speed: 3, reaction: 0.05 },
            medium: { speed: 4, reaction: 0.1 },
            hard: { speed: 5, reaction: 0.15 },
            expert: { speed: 6, reaction: 0.2 }
        };

        const ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 8,
            baseSpeed: 5,
            speed: 5,
            velocityX: 0,
            velocityY: 0,
            color: '#fff'
        };

        const player1 = {
            x: 20,
            y: canvas.height / 2 - 50,
            width: 12,
            height: 100,
            speed: 8,
            dy: 0,
            color: '#00d9ff'
        };

        const player2 = {
            x: canvas.width - 32,
            y: canvas.height / 2 - 50,
            width: 12,
            height: 100,
            speed: 8,
            dy: 0,
            color: '#ff006e'
        };

        const net = {
            x: canvas.width / 2 - 1,
            y: 0,
            width: 2,
            height: 10,
            color: 'rgba(255, 255, 255, 0.3)'
        };

        // Menu
        document.getElementById('aiMode').addEventListener('click', function() {
            gameMode = 'ai';
            this.classList.add('selected');
            document.getElementById('friendMode').classList.remove('selected');
            document.getElementById('difficultySection').style.display = 'block';
        });

        document.getElementById('friendMode').addEventListener('click', function() {
            gameMode = 'friend';
            this.classList.add('selected');
            document.getElementById('aiMode').classList.remove('selected');
            document.getElementById('difficultySection').style.display = 'none';
        });

        document.getElementById('startGameBtn').addEventListener('click', function() {
            difficulty = document.getElementById('difficulty').value;
            maxScore = parseInt(document.getElementById('maxScoreSelect').value);
            
            document.getElementById('maxScore').textContent = maxScore;
            document.getElementById('player2Label').textContent = gameMode === 'ai' ? 'IA' : 'J2';
            
            if (gameMode === 'friend') {
                document.getElementById('controlsContent').innerHTML = `
                    <div class="control-row">
                        <span>Joueur 1: <span class="key">W</span> <span class="key">S</span></span>
                        <span>Joueur 2: <span class="key">↑</span> <span class="key">↓</span></span>
                    </div>
                `;
                document.getElementById('p2Controls').style.display = 'flex';
            } else {
                document.getElementById('controlsContent').innerHTML = `
                    <div class="control-row">
                        <span>Joueur 1: <span class="key">W</span> <span class="key">S</span></span>
                    </div>
                `;
                document.getElementById('p2Controls').style.display = 'none';
            }
            
            document.getElementById('startMenu').classList.add('hidden');
            gameStarted = true;
            isPaused = false;
            resetGame();
            startCountdown();
        });

        document.getElementById('pauseBtn').addEventListener('click', togglePause);
        document.getElementById('pauseScreen').addEventListener('click', togglePause);

        document.getElementById('playAgainBtn').addEventListener('click', function() {
            document.getElementById('victoryScreen').classList.add('hidden');
            document.getElementById('startMenu').classList.remove('hidden');
            gameStarted = false;
            isPaused = false;
        });

        const keys = {};
        
        document.addEventListener('keydown', function(e) {
            keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (gameStarted && document.getElementById('startMenu').classList.contains('hidden') && document.getElementById('victoryScreen').classList.contains('hidden')) {
                    togglePause();
                }
            }
        });

        document.addEventListener('keyup', function(e) {
            keys[e.key.toLowerCase()] = false;
        });

        // Contrôles mobiles
        let p1TouchUp = false, p1TouchDown = false;
        let p2TouchUp = false, p2TouchDown = false;

        document.getElementById('p1Up').addEventListener('mousedown', () => p1TouchUp = true);
        document.getElementById('p1Up').addEventListener('mouseup', () => p1TouchUp = false);
        document.getElementById('p1Up').addEventListener('touchstart', (e) => { e.preventDefault(); p1TouchUp = true; });
        document.getElementById('p1Up').addEventListener('touchend', (e) => { e.preventDefault(); p1TouchUp = false; });

        document.getElementById('p1Down').addEventListener('mousedown', () => p1TouchDown = true);
        document.getElementById('p1Down').addEventListener('mouseup', () => p1TouchDown = false);
        document.getElementById('p1Down').addEventListener('touchstart', (e) => { e.preventDefault(); p1TouchDown = true; });
        document.getElementById('p1Down').addEventListener('touchend', (e) => { e.preventDefault(); p1TouchDown = false; });

        document.getElementById('p2Up').addEventListener('mousedown', () => p2TouchUp = true);
        document.getElementById('p2Up').addEventListener('mouseup', () => p2TouchUp = false);
        document.getElementById('p2Up').addEventListener('touchstart', (e) => { e.preventDefault(); p2TouchUp = true; });
        document.getElementById('p2Up').addEventListener('touchend', (e) => { e.preventDefault(); p2TouchUp = false; });

        document.getElementById('p2Down').addEventListener('mousedown', () => p2TouchDown = true);
        document.getElementById('p2Down').addEventListener('mouseup', () => p2TouchDown = false);
        document.getElementById('p2Down').addEventListener('touchstart', (e) => { e.preventDefault(); p2TouchDown = true; });
        document.getElementById('p2Down').addEventListener('touchend', (e) => { e.preventDefault(); p2TouchDown = false; });

        function togglePause() {
            if (!gameStarted || !document.getElementById('victoryScreen').classList.contains('hidden')) return;
            
            isPaused = !isPaused;
            if (isPaused) {
                document.getElementById('pauseScreen').classList.remove('hidden');
                document.getElementById('pauseBtn').textContent = '▶ REPRENDRE';
            } else {
                document.getElementById('pauseScreen').classList.add('hidden');
                document.getElementById('pauseBtn').textContent = '⏸ PAUSE';
            }
        }

        function startCountdown() {
            countdownActive = true;
            let count = 3;
            const countdownEl = document.getElementById('countdown');
            
            countdownEl.textContent = count;
            countdownEl.classList.remove('hidden');
            playTone(600, 0.15);
            
            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownEl.textContent = count;
                    countdownEl.style.animation = 'none';
                    setTimeout(() => countdownEl.style.animation = 'pulse 1s ease-in-out', 10);
                    playTone(600, 0.15);
                } else {
                    countdownEl.classList.add('hidden');
                    countdownActive = false;
                    // Lancer la balle à vitesse réduite
                    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    ball.velocityX = dir * 3 * Math.cos(angle);
                    ball.velocityY = 3 * Math.sin(angle);
                    ball.speed = 3;
                    playTone(800, 0.2);
                    clearInterval(interval);
                }
            }, 1000);
        }

        function updatePlayers() {
            if (isPaused || countdownActive) return;

            // Joueur 1
            if (keys['w'] || p1TouchUp) {
                player1.dy = -player1.speed;
            } else if (keys['s'] || p1TouchDown) {
                player1.dy = player1.speed;
            } else {
                player1.dy = 0;
            }

            player1.y += player1.dy;
            if (player1.y < 0) player1.y = 0;
            if (player1.y + player1.height > canvas.height) player1.y = canvas.height - player1.height;

            // Joueur 2 ou IA
            if (gameMode === 'friend') {
                if (keys['arrowup'] || p2TouchUp) {
                    player2.dy = -player2.speed;
                } else if (keys['arrowdown'] || p2TouchDown) {
                    player2.dy = player2.speed;
                } else {
                    player2.dy = 0;
                }

                player2.y += player2.dy;
            } else {
                const aiSettings = difficultySettings[difficulty];
                const targetY = ball.y - (player2.height / 2);
                const diff = targetY - player2.y;
                player2.y += diff * aiSettings.reaction;
            }

            if (player2.y < 0) player2.y = 0;
            if (player2.y + player2.height > canvas.height) player2.y = canvas.height - player2.height;
        }

        function drawRect(x, y, w, h, color) {
            ctx.fillStyle = color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.fillRect(x, y, w, h);
            ctx.shadowBlur = 0;
        }

        function drawCircle(x, y, r, color) {
            ctx.fillStyle = color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function drawNet() {
            for (let i = 0; i < canvas.height; i += 20) {
                drawRect(net.x, net.y + i, net.width, net.height, net.color);
            }
        }

        function collision(b, p) {
            return b.x + b.radius > p.x && 
                   b.x - b.radius < p.x + p.width && 
                   b.y + b.radius > p.y && 
                   b.y - b.radius < p.y + p.height;
        }

        function resetBall() {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.velocityX = 0;
            ball.velocityY = 0;
            ball.speed = 5;
        }

        function resetGame() {
            player1Score = 0;
            player2Score = 0;
            document.getElementById('player1Score').textContent = player1Score;
            document.getElementById('player2Score').textContent = player2Score;
            document.getElementById('ballSpeed').textContent = '5';
            resetBall();
        }

        function showVictory(winner) {
            gameStarted = false;
            isPaused = false;
            
            let winnerName;
            if (gameMode === 'ai') {
                winnerName = winner === 1 ? 'Joueur' : 'IA';
            } else {
                winnerName = winner === 1 ? 'Joueur 1' : 'Joueur 2';
            }
            
            document.getElementById('winnerText').textContent = 'Bravo ' + winnerName + '!';
            document.getElementById('finalScore').textContent = player1Score + ' - ' + player2Score;
            document.getElementById('victoryScreen').classList.remove('hidden');
            playVictory();
        }

        function checkWinner() {
            if (player1Score >= maxScore) {
                showVictory(1);
            } else if (player2Score >= maxScore) {
                showVictory(2);
            }
        }

        function update() {
            if (!gameStarted || isPaused || countdownActive) return;

            updatePlayers();

            ball.x += ball.velocityX;
            ball.y += ball.velocityY;

            if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
                ball.velocityY = -ball.velocityY;
                playHit();
            }

            let paddle = (ball.x < canvas.width / 2) ? player1 : player2;

            if (collision(ball, paddle)) {
                let collidePoint = ball.y - (paddle.y + paddle.height / 2);
                collidePoint = collidePoint / (paddle.height / 2);
                
                let angleRad = collidePoint * Math.PI / 4;
                let direction = (ball.x < canvas.width / 2) ? 1 : -1;
                
                ball.velocityX = direction * ball.speed * Math.cos(angleRad);
                ball.velocityY = ball.speed * Math.sin(angleRad);
                
                ball.speed += 0.2;
                document.getElementById('ballSpeed').textContent = Math.round(ball.speed);
                playHit();
            }

            if (ball.x - ball.radius < 0) {
                player2Score++;
                document.getElementById('player2Score').textContent = player2Score;
                playScore();
                if (player2Score >= maxScore) {
                    showVictory(2);
                } else {
                    resetBall();
                    startCountdown();
                }
            } else if (ball.x + ball.radius > canvas.width) {
                player1Score++;
                document.getElementById('player1Score').textContent = player1Score;
                playScore();
                if (player1Score >= maxScore) {
                    showVictory(1);
                } else {
                    resetBall();
                    startCountdown();
                }
            }
        }

        function render() {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawNet();
            drawRect(player1.x, player1.y, player1.width, player1.height, player1.color);
            drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);
        }

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
