const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const gameOverDisplay = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let direction = { x: 0, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let gameLoopTimeout;
let gameOver = false;
let highScore = localStorage.getItem('snakeHighScore') || 0;

function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    score = 0;
    scoreDisplay.innerText = `Score: ${score}`;
    food = getRandomFoodPosition();
    gameOver = false;
    gameOverDisplay.classList.add('hidden');
    updateHighScoreDisplay();
    clearTimeout(gameLoopTimeout);
    gameLoop();
}

function gameLoop() {
    if (gameOver) return;

    update();
    draw();
    gameLoopTimeout = setTimeout(gameLoop, 100);
}

function update() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.innerText = `Score: ${score}`;
        food = getRandomFoodPosition();
    } else {
        snake.pop();
    }
}

function draw() {
    // Background
    ctx.fillStyle = '#111'; // Slightly lighter black for background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = 'darkgreen'; // Darker green for the head
        } else {
            // Body
            ctx.fillStyle = 'lime';
        }
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);

        // Add a border to each segment for definition
        ctx.strokeStyle = '#333'; // Dark border
        ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // Food (draw as a circle)
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2, // center x
        food.y * gridSize + gridSize / 2, // center y
        gridSize / 2,                     // radius
        0,                                // start angle
        2 * Math.PI                       // end angle
    );
    ctx.fill();

    // Optional: add a little highlight to the food
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2 - gridSize / 4, // offset highlight center x
        food.y * gridSize + gridSize / 2 - gridSize / 4, // offset highlight center y
        gridSize / 4,                     // highlight radius
        0, 2 * Math.PI
    );
    ctx.fill();
}

function getRandomFoodPosition() {
    let newFood;
    do {
        newFood = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

function endGame() {
    gameOver = true;
    clearTimeout(gameLoopTimeout);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        updateHighScoreDisplay();
    }
    finalScoreDisplay.innerText = score;
    gameOverDisplay.classList.remove('hidden');
}

function updateHighScoreDisplay() {
    highScoreDisplay.innerText = `High Score: ${highScore}`;
}

window.addEventListener('keydown', e => {
    if (gameOver) {
        if (e.key === 'Enter') {
            startGame();
        }
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

startGame();