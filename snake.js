const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRID_SIZE = 20;
const GRID_WIDTH = WIDTH / GRID_SIZE;
const GRID_HEIGHT = HEIGHT / GRID_SIZE;

let snake = [
  { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }
];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };

let apple = spawnApple();

let score = 0;
let gameOver = false;

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
  }
});

function spawnApple() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_WIDTH),
      y: Math.floor(Math.random() * GRID_HEIGHT),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function update() {
  if (gameOver) return;

  direction = nextDirection;

  if (direction.x === 0 && direction.y === 0) return; // don't move before first direction input

  // Move snake
  const head = {
    x: (snake[0].x + direction.x + GRID_WIDTH) % GRID_WIDTH,
    y: (snake[0].y + direction.y + GRID_HEIGHT) % GRID_HEIGHT,
  };

  // Check collisions with body
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver = true;
    return;
  }

  snake.unshift(head);

  // Eat apple?
  if (head.x === apple.x && head.y === apple.y) {
    score++;
    apple = spawnApple();
  } else {
    snake.pop();
  }
}

function drawGrid() {
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, WIDTH, HEIGHT);
}

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    const x = segment.x * GRID_SIZE;
    const y = segment.y * GRID_SIZE;

    // Gradient fill for snake segment
    const grad = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#006666');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    // Highlight: small lighter rectangle top-left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 2, y + 2, GRID_SIZE / 2, GRID_SIZE / 2);

    // Optional: darker border around each segment for clarity
    ctx.strokeStyle = '#003333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
  }
}

function drawApple() {
  const x = apple.x * GRID_SIZE;
  const y = apple.y * GRID_SIZE;
  const centerX = x + GRID_SIZE / 2;
  const centerY = y + GRID_SIZE / 2;
  const radius = GRID_SIZE / 2 - 3;

  // Red gradient apple with shine
  const grad = ctx.createRadialGradient(centerX, centerY, radius / 4, centerX, centerY, radius);
  grad.addColorStop(0, '#f0f');
  grad.addColorStop(1, '#900070');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Shine highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(centerX - 5, centerY - 5, radius / 3, radius / 2, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawScore() {
  ctx.fillStyle = '#0ff';
  ctx.font = "20px 'Press Start 2P', cursive";
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = '#f0f';
  ctx.font = "40px 'Press Start 2P', cursive";
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2);
  ctx.font = "20px 'Press Start 2P', cursive";
  ctx.fillText('Refresh to play again', WIDTH / 2, HEIGHT / 2 + 40);
}

function draw() {
  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGrid();
  drawSnake();
  drawApple();
  drawScore();

  if (gameOver) {
    drawGameOver();
  }
}

function gameLoop() {
  update();
  draw();
}

setInterval(gameLoop, 100);
