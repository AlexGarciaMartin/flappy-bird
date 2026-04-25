const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('gameover-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const currentScoreEl = document.getElementById('current');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');

// Resize canvas
function resize() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}
resize();
window.addEventListener('resize', resize);

// Game state
let gameLoop = null;
let bird, pipes, score, bestScore, gameSpeed, isGameOver;

// Bird
const BIRD = {
    x: 0,
    y: 0,
    width: 34,
    height: 24,
    velocity: 0,
    gravity: 0.5,
    jump: -8,
    rotation: 0
};

// Pipes
const PIPE = {
    width: 60,
    gap: 160,
    spawnRate: 120
};

// Colors
const COLORS = {
    bird: '#FFD700',
    birdEye: '#FFF',
    birdPupil: '#000',
    birdBeak: '#FF8C00',
    pipe: '#4CAF50',
    pipeBorder: '#2E7D32',
    pipeCap: '#66BB6A',
    cloud: 'rgba(255,255,255,0.8)',
    ground: '#DEB887',
    groundTop: '#8B7355'
};

// Ground
const GROUND_HEIGHT = 50;

// Clouds
let clouds = [];

function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.4),
            width: 60 + Math.random() * 80,
            speed: 0.2 + Math.random() * 0.3
        });
    }
}

function resetGame() {
    bird = { ...BIRD };
    bird.x = canvas.width * 0.25;
    bird.y = canvas.height / 2;
    pipes = [];
    score = 0;
    gameSpeed = 2.5;
    isGameOver = false;
    currentScoreEl.textContent = '0';
    initClouds();
}

function jump() {
    if (isGameOver) return;
    bird.velocity = bird.jump;
}

function spawnPipe() {
    const minY = 60;
    const maxY = canvas.height - GROUND_HEIGHT - PIPE.gap - 60;
    const topHeight = minY + Math.random() * (maxY - minY);
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE.gap,
        passed: false
    });
}

function update() {
    if (isGameOver) return;
    
    // Bird physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);
    
    // Ground collision
    if (bird.y + bird.height >= canvas.height - GROUND_HEIGHT) {
        bird.y = canvas.height - GROUND_HEIGHT - bird.height;
        gameOver();
        return;
    }
    
    // Ceiling collision
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
    
    // Spawn pipes
    if (pipes.length === 0 || canvas.width - pipes[pipes.length - 1].x >= PIPE.spawnRate) {
        spawnPipe();
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= gameSpeed;
        
        // Score
        if (!pipes[i].passed && pipes[i].x + PIPE.width < bird.x) {
            pipes[i].passed = true;
            score++;
            currentScoreEl.textContent = score;
            gameSpeed += 0.02;
        }
        
        // Remove off-screen pipes
        if (pipes[i].x + PIPE.width < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Collision
        if (bird.x + bird.width > pipes[i].x && 
            bird.x < pipes[i].x + PIPE.width) {
            if (bird.y < pipes[i].topHeight || 
                bird.y + bird.height > pipes[i].bottomY) {
                gameOver();
                return;
            }
        }
    }
    
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + 20;
            cloud.y = Math.random() * (canvas.height * 0.4);
        }
    });
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);
    
    // Body
    ctx.fillStyle = COLORS.bird;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(6, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupil
    ctx.fillStyle = COLORS.birdPupil;
    ctx.beginPath();
    ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = COLORS.birdBeak;
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(22, 6);
    ctx.lineTo(12, 10);
    ctx.closePath();
    ctx.fill();
    
    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 10, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawPipe(pipe) {
    // Top pipe
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(pipe.x, 0, PIPE.width, pipe.topHeight);
    
    // Top pipe border
    ctx.fillStyle = COLORS.pipeBorder;
    ctx.fillRect(pipe.x, 0, 3, pipe.topHeight);
    ctx.fillRect(pipe.x + PIPE.width - 3, 0, 3, pipe.topHeight);
    
    // Top cap
    ctx.fillStyle = COLORS.pipeCap;
    ctx.fillRect(pipe.x - 3, pipe.topHeight - 24, PIPE.width + 6, 24);
    ctx.fillStyle = COLORS.pipeBorder;
    ctx.fillRect(pipe.x - 3, pipe.topHeight - 24, 3, 24);
    ctx.fillRect(pipe.x + PIPE.width, pipe.topHeight - 24, 3, 24);
    
    // Bottom pipe
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE.width, canvas.height - pipe.bottomY - GROUND_HEIGHT);
    
    // Bottom pipe border
    ctx.fillStyle = COLORS.pipeBorder;
    ctx.fillRect(pipe.x, pipe.bottomY, 3, canvas.height - pipe.bottomY - GROUND_HEIGHT);
    ctx.fillRect(pipe.x + PIPE.width - 3, pipe.bottomY, 3, canvas.height - pipe.bottomY - GROUND_HEIGHT);
    
    // Bottom cap
    ctx.fillStyle = COLORS.pipeCap;
    ctx.fillRect(pipe.x - 3, pipe.bottomY, PIPE.width + 6, 24);
    ctx.fillStyle = COLORS.pipeBorder;
    ctx.fillRect(pipe.x - 3, pipe.bottomY, 3, 24);
    ctx.fillRect(pipe.x + PIPE.width, pipe.bottomY, 3, 24);
}

function drawCloud(cloud) {
    ctx.fillStyle = COLORS.cloud;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.2, cloud.y - 10, cloud.width * 0.3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.5, cloud.y - 5, cloud.width * 0.35, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.75, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    // Sky is handled by CSS gradient
    
    // Clouds
    clouds.forEach(drawCloud);
    
    // Pipes
    pipes.forEach(drawPipe);
    
    // Bird
    drawBird();
    
    // Ground
    ctx.fillStyle = COLORS.groundTop;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 4);
    
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT + 4, canvas.width, GROUND_HEIGHT - 4);
    
    // Ground detail lines
    ctx.strokeStyle = '#C4A574';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i - (Date.now() / 10 % 30), canvas.height - GROUND_HEIGHT + 10);
        ctx.lineTo(i + 15 - (Date.now() / 10 % 30), canvas.height - GROUND_HEIGHT + 25);
        ctx.stroke();
    }
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoop);
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBest', bestScore);
    }
    
    finalScoreEl.textContent = score;
    finalBestEl.textContent = bestScore;
    gameOverScreen.classList.remove('hidden');
}

function loop() {
    update();
    draw();
    gameLoop = requestAnimationFrame(loop);
}

function start() {
    bestScore = parseInt(localStorage.getItem('flappyBest')) || 0;
    document.getElementById('best').textContent = '🏆 ' + bestScore;
    
    resetGame();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    loop();
}

// Controls
startBtn.addEventListener('click', start);
restartBtn.addEventListener('click', start);

canvas.addEventListener('click', () => {
    if (!startScreen.classList.contains('hidden')) return;
    if (!gameOverScreen.classList.contains('hidden')) return;
    jump();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!startScreen.classList.contains('hidden')) return;
    if (!gameOverScreen.classList.contains('hidden')) return;
    jump();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!startScreen.classList.contains('hidden')) {
            start();
            return;
        }
        if (!gameOverScreen.classList.contains('hidden')) {
            start();
            return;
        }
        jump();
    }
});
