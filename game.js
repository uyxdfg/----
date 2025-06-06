class Game {
    constructor() {
        this.player = document.getElementById('player');
        this.teacher = document.getElementById('teacher');
        this.door = document.getElementById('door');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.timerDisplay = document.getElementById('timer');
        this.caughtMeter = document.getElementById('caught-meter');
        
        this.playerPos = { x: 100, y: 300 };
        this.teacherPos = { x: 400, y: 300 };
        this.timeLeft = 300;
        this.caughtValue = 0;
        this.gameLoop = null;
        this.keys = {};
          // 新增攻擊相關屬性
        this.hitCount = 0;                // 被攻擊次數
        this.attackRange = 80;            // 攻擊範圍（比視線範圍200更小）
        this.lastAttackTime = 0;          // 上次攻擊時間（用於控制攻擊頻率）
        this.attackCooldown = 3000;       // 攻擊冷卻時間（3秒）
        
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    startGame() {
        this.startScreen.style.display = 'none';
        this.resetGame();
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);
        this.startTimer();
    }

    resetGame() {
        this.playerPos = { x: 100, y: 300 };
        this.teacherPos = { x: 400, y: 300 };
        this.timeLeft = 300;
        this.caughtValue = 0;
        this.hitCount = 0;            // 重置攻擊次數
        this.lastAttackTime = 0;      // 重置上次攻擊時間
        this.updateUI();
    }

    update() {
        this.movePlayer();
        this.moveTeacher();
        this.checkCollision();
        this.updatePositions();
        this.checkWin();
    }

    movePlayer() {
        const speed = 5;
        if (this.keys['ArrowUp']) this.playerPos.y = Math.max(0, this.playerPos.y - speed);
        if (this.keys['ArrowDown']) this.playerPos.y = Math.min(570, this.playerPos.y + speed);
        if (this.keys['ArrowLeft']) this.playerPos.x = Math.max(0, this.playerPos.x - speed);
        if (this.keys['ArrowRight']) this.playerPos.x = Math.min(770, this.playerPos.x + speed);
    }    moveTeacher() {
        // 如果玩家處於無敵狀態，老師停止移動
        if (this.isInvincible()) {
            return;
        }

        const speed = 2;
        const dx = this.playerPos.x - this.teacherPos.x;
        const dy = this.playerPos.y - this.teacherPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
            this.teacherPos.x += (dx / distance) * speed;
            this.teacherPos.y += (dy / distance) * speed;
            this.increaseCaughtMeter();
        } else {
            // 老師巡邏
            this.teacherPatrol();
        }
    }

    teacherPatrol() {
        const time = Date.now() / 1000;
        this.teacherPos.x = 400 + Math.sin(time) * 200;
        this.teacherPos.y = 300 + Math.cos(time) * 100;
    }

    checkCollision() {
        const dx = this.playerPos.x - this.teacherPos.x;
        const dy = this.playerPos.y - this.teacherPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 檢查是否在攻擊範圍內
        if (distance < this.attackRange) {
            const currentTime = Date.now();
            // 檢查是否可以進行新的攻擊（冷卻時間已過）
            if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                this.hitCount++;
                this.lastAttackTime = currentTime;
                
                // 顯示被攻擊提示
                this.showAttackWarning();
                
                // 檢查是否達到淘汰條件
                if (this.hitCount >= 2) {
                    this.gameOver('被老師抓到兩次，遊戲結束！');
                }
            }
        }
    }    showAttackWarning() {
        // 使用 GSAP 創建老師攻擊的視覺效果
        gsap.to(this.teacher, {
            scale: 1.2,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });

        // 在無敵期間改變老師的顏色
        gsap.to(this.teacher, {
            backgroundColor: '#999999',  // 變灰色表示暫時停止
            duration: 0.2,
            yoyo: false
        }).then(() => {
            // 無敵時間結束後恢復顏色
            setTimeout(() => {
                gsap.to(this.teacher, {
                    backgroundColor: '#f44336',  // 恢復原本的紅色
                    duration: 0.2
                });
            }, this.attackCooldown - 200);  // 提前200ms開始恢復，使過渡更順暢
        });

        // 顯示攻擊警告
        Swal.fire({
            title: `被抓到了！還剩${2 - this.hitCount}次機會`,
            icon: 'warning',
            timer: 1000,
            showConfirmButton: false,
            position: 'top',
            toast: true
        });
    }

    updatePositions() {
        this.player.style.left = this.playerPos.x + 'px';
        this.player.style.top = this.playerPos.y + 'px';
        this.teacher.style.left = this.teacherPos.x + 'px';
        this.teacher.style.top = this.teacherPos.y + 'px';
    }

    checkWin() {
        const dx = this.playerPos.x - 740;
        const dy = this.playerPos.y - 300;
        const distanceToDoor = Math.sqrt(dx * dx + dy * dy);

        if (distanceToDoor < 30) {
            this.gameOver('成功逃出！');
        }
    }

    isInvincible() {
        return Date.now() - this.lastAttackTime < this.attackCooldown;
    }

    increaseCaughtMeter() {
        this.caughtValue = Math.min(100, this.caughtValue + 0.1);
        if (this.caughtValue >= 100) {
            this.gameOver('警戒值太高，被發現了！');
        }
        this.updateUI();
    }

    startTimer() {
        const timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                clearInterval(timer);
                this.gameOver('時間到！');
            }
            this.updateUI();
        }, 1000);
    }

    updateUI() {
        this.timerDisplay.textContent = `時間: ${this.timeLeft}秒`;
        this.caughtMeter.textContent = `警戒值: ${Math.floor(this.caughtValue)}% | 剩餘機會: ${2 - this.hitCount}`;
    }

    async gameOver(message) {
        clearInterval(this.gameLoop);
        const result = await Swal.fire({
            title: message,
            text: '要再玩一次嗎？',
            icon: message.includes('成功') ? 'success' : 'error',
            confirmButtonText: '重新開始',
            showCancelButton: true,
            cancelButtonText: '結束遊戲'
        });

        if (result.isConfirmed) {
            this.startGame();
        } else {
            this.startScreen.style.display = 'flex';
        }
    }
}

// 啟動遊戲
const game = new Game();
