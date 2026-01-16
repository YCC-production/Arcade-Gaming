 /**
         * --- ÉTAT DU HUB ---
         */
        const STORAGE_KEY = 'arcade_master_profile_v3';
        let hubState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            pseudo: "Pilote_7",
            avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Lucky",
            xp: 0,
            level: 1,
            gamesPlayedCount: 0,
            playTimeMinutes: 0,
            favorites: [],
            theme: "original"
        };

        // --- CANVAS DYNAMIQUE ---
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function initCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            const count = hubState.theme === 'retro' ? 50 : 100;
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1,
                    speedX: (Math.random() - 0.5) * 0.6,
                    speedY: (Math.random() - 0.5) * 0.6,
                    color: hubState.theme === 'retro' ? '#00ff00' : 
                           hubState.theme === 'modern' ? '#00f2ff' : '#ffffff'
                });
            }
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, idx) => {
                p.x += p.speedX; p.y += p.speedY;
                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                
                ctx.fillStyle = p.color;
                if (hubState.theme === 'retro') {
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(p.x, p.y, 6, 6);
                } else if (hubState.theme === 'modern') {
                    ctx.globalAlpha = 0.7;
                    particles.forEach((p2, idx2) => {
                        if (idx === idx2) return;
                        const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                        if (d < 100) {
                            ctx.strokeStyle = `rgba(0, 242, 255, ${1 - d/100})`;
                            ctx.lineWidth = 0.4;
                            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                    });
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
            });
            requestAnimationFrame(animateCanvas);
        }

        /**
         * --- SYSTÈME DE PROFIL & IMAGE ---
         */
        function toggleProfileModal() {
            const modal = document.getElementById('profile-modal');
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
            document.getElementById('input-pseudo').value = hubState.pseudo;
        }

        function selectAvatar(seed) {
            hubState.avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;
            updateAvatarVisuals();
        }

        function uploadAvatar(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    hubState.avatar = e.target.result;
                    updateAvatarVisuals();
                };
                reader.readAsDataURL(file);
            }
        }

        function updateAvatarVisuals() {
            document.querySelectorAll('.avatar-choice').forEach(img => {
                const isSelected = img.src === hubState.avatar || img.src.includes(hubState.avatar.split('=')[1]);
                img.style.borderColor = isSelected ? 'var(--primary)' : 'transparent';
                img.style.background = isSelected ? 'rgba(239, 71, 111, 0.2)' : 'rgba(255,255,255,0.05)';
            });
        }

        function saveProfile() {
            const pseudo = document.getElementById('input-pseudo').value.trim();
            if (pseudo) hubState.pseudo = pseudo;
            saveState(); updateUI(); toggleProfileModal();
        }

        function toggleFavorite(id) {
            const idx = hubState.favorites.indexOf(id);
            if (idx > -1) hubState.favorites.splice(idx, 1);
            else { hubState.favorites.push(id); addXP(5); }
            saveState(); updateUI();
        }

        function addXP(amount) {
            hubState.xp += amount;
            const newLevel = Math.floor(hubState.xp / 100) + 1;
            if (newLevel > hubState.level) hubState.level = newLevel;
            saveState(); updateUI();
        }

        function launchGame(id, url) {
            hubState.gamesPlayedCount++;
            addXP(20);
            saveState();
            window.location.href = url;
        }

        /**
         * --- MISE À JOUR UI & THÈMES ---
         */
        function changeTheme(themeName) {
            hubState.theme = themeName;
            const body = document.getElementById('main-body');
            body.className = 'theme-' + themeName;
            
            // Mise à jour des boutons de thème
            ['original', 'retro', 'modern'].forEach(t => {
                const btn = document.getElementById('btn-t-' + t);
                btn.style.opacity = themeName === t ? "1" : "0.5";
                btn.style.background = themeName === t ? "var(--primary)" : "transparent";
            });

            saveState(); initCanvas();
        }

        function saveState() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hubState));
        }

        function updateUI() {
            document.getElementById('header-avatar').src = hubState.avatar;
            document.getElementById('stat-avatar').src = hubState.avatar;
            document.getElementById('header-pseudo').textContent = hubState.pseudo;
            document.getElementById('header-level').textContent = hubState.level;
            document.getElementById('stat-level').textContent = hubState.level;
            document.getElementById('stat-games').textContent = hubState.gamesPlayedCount;
            document.getElementById('stat-time').textContent = hubState.playTimeMinutes + 'm';
            document.getElementById('stat-favs').textContent = hubState.favorites.length;
            
            const xpInLevel = hubState.xp % 100;
            document.getElementById('xp-bar-fill').style.width = xpInLevel + '%';
            document.getElementById('xp-text').textContent = `${xpInLevel} / 100`;

            const ranks = ["Recrue", "Pilote", "As", "Chasseur", "Vétéran", "Légende"];
            const rIdx = Math.min(Math.floor(hubState.level / 3), ranks.length - 1);
            document.getElementById('rank-title').textContent = ranks[rIdx];

            // Favoris
            const favSection = document.getElementById('fav-section');
            const favGrid = document.getElementById('fav-grid');
            favGrid.innerHTML = '';

            document.querySelectorAll('#main-grid .game-card').forEach(card => {
                const id = card.dataset.id;
                const isFav = hubState.favorites.includes(id);
                card.querySelector('.fav-star').classList.toggle('active', isFav);
                card.classList.toggle('is-favorite', isFav);

                if (isFav) {
                    const clone = card.cloneNode(true);
                    clone.querySelector('.fav-star').onclick = () => toggleFavorite(id);
                    const btn = clone.querySelector('.btn-play');
                    if(btn) {
                        const originalUrl = card.querySelector('.btn-play').getAttribute('onclick').match(/'([^']+)'/g)[1].replace(/'/g, "");
                        btn.onclick = () => launchGame(id, originalUrl);
                    }
                    favGrid.appendChild(clone);
                }
            });
            favSection.classList.toggle('hidden', hubState.favorites.length === 0);
        }

        // Timer XP passif
        setInterval(() => { hubState.playTimeMinutes += 1; addXP(2); }, 60000);

        window.addEventListener('resize', initCanvas);
        window.onload = () => {
            changeTheme(hubState.theme);
            initCanvas(); animateCanvas(); updateUI();
        };