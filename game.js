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
    }

    moveTeacher() {
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

        if (distance < 40) {
            this.gameOver('被抓到了！');
        }
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
        this.caughtMeter.textContent = `警戒值: ${Math.floor(this.caughtValue)}%`;
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
