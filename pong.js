const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

const paddleWidth = 15;
const paddleHeight = 100;
const ballRadius = 12;

let leftScore = 0;
let rightScore = 0;

const leftPaddle = {
  x: 30,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 8,
  dy: 0
};

const rightPaddle = {
  x: canvas.width - 30 - paddleWidth,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 8,
  dy: 0
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: ballRadius,
  speed: 7,
  dx: 7 * (Math.random() > 0.5 ? 1 : -1),
  dy: 7 * (Math.random() > 0.5 ? 1 : -1),
  trail: []
};

// Game pause and message state
let gamePaused = false;
let scoreMessage = "";

// Variables for pulsating animation (0 to 1)
let pulseTime = 0;

// Utility for linear interpolation (easing)
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Draw neon glowing rounded rectangle for paddles
function drawPaddle(paddle) {
  const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y + paddle.height);
  gradient.addColorStop(0, '#00FFE7');
  gradient.addColorStop(1, '#0077FF');

  ctx.fillStyle = gradient;
  ctx.shadowColor = '#00FFF7';
  ctx.shadowBlur = 20;

  const radius = 10;
  ctx.beginPath();
  ctx.moveTo(paddle.x + radius, paddle.y);
  ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
  ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
  ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
  ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
  ctx.lineTo(paddle.x, paddle.y + radius);
  ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Draw ball with glow and trailing effect
function drawBall() {
  for (let i = 0; i < ball.trail.length; i++) {
    const pos = ball.trail[i];
    const alpha = (i + 1) / ball.trail.length / 2;
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.4)';
    ctx.shadowBlur = 10;
    ctx.arc(pos.x, pos.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const gradient = ctx.createRadialGradient(ball.x, ball.y, ball.radius * 0.3, ball.x, ball.y, ball.radius);
  gradient.addColorStop(0, '#00FFF7');
  gradient.addColorStop(1, '#004466');

  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 20;
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Draw center dashed line with glow
function drawNet() {
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 15;
  ctx.setLineDash([15, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
}

// Draw scores with neon effect
function drawScores() {
  ctx.font = "72px 'Orbitron', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 30;

  ctx.fillText(leftScore, canvas.width / 4, 100);
  ctx.fillText(rightScore, (canvas.width / 4) * 3, 100);

  ctx.shadowBlur = 0;
}

// Draw the scoring message overlay with pulsating "Press SPACE to continue"
function drawScoreMessage() {
  // Background dark overlay behind message
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, canvas.height / 2 - 70, canvas.width, 140);

  // Main score message, smaller font
  ctx.font = "48px 'Orbitron', sans-serif";
  ctx.fillStyle = '#00FFFF';
  ctx.textAlign = "center";
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 30;
  ctx.fillText(scoreMessage, canvas.width / 2, canvas.height / 2 - 10);
  ctx.shadowBlur = 0;

  // Pulsate "Press SPACE to continue" below main message
  // Calculate pulse: pulseTime cycles from 0 to 1, repeat
  pulseTime += 0.03;
  if (pulseTime > 1) pulseTime = 0;

  // Interpolate scale (0.9 to 1.1)
  const scale = 0.9 + 0.2 * Math.abs(Math.sin(pulseTime * Math.PI * 2));
  // Interpolate alpha (0.4 to 1)
  const alpha = 0.4 + 0.6 * Math.abs(Math.sin(pulseTime * Math.PI * 2));

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2 + 40);
  ctx.scale(scale, scale);

  ctx.font = "28px 'Orbitron', sans-serif";
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha.toFixed(2)})`;
  ctx.shadowColor = `rgba(255, 0, 0, ${alpha.toFixed(2)})`;
  ctx.shadowBlur = 20;
  ctx.textAlign = "center";
  ctx.fillText("Press SPACE to continue", 0, 0);

  ctx.restore();
}

// Update paddles based on their dy velocity
function updatePaddles() {
  leftPaddle.y += leftPaddle.dy;
  leftPaddle.y = Math.max(0, Math.min(canvas.height - leftPaddle.height, leftPaddle.y));

  const targetY = ball.y - rightPaddle.height / 2;
  rightPaddle.y = lerp(rightPaddle.y, targetY, 0.12);
  rightPaddle.y = Math.max(0, Math.min(canvas.height - rightPaddle.height, rightPaddle.y));
}

// Reset ball position and speed
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speed = 7;
  ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.trail = [];
}

// Update ball position and handle collisions
function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 15) ball.trail.shift();

  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  }

  if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
      ball.y > leftPaddle.y &&
      ball.y < leftPaddle.y + leftPaddle.height) {
    ball.dx = -ball.dx;
    const collidePoint = ball.y - (leftPaddle.y + leftPaddle.height / 2);
    const normalized = collidePoint / (leftPaddle.height / 2);
    ball.dy = ball.speed * normalized;
    ball.speed = Math.min(12, ball.speed + 0.5);
    ball.dx = (ball.dx > 0 ? 1 : -1) * ball.speed;
  }

  if (ball.x + ball.radius > rightPaddle.x &&
      ball.y > rightPaddle.y &&
      ball.y < rightPaddle.y + rightPaddle.height) {
    ball.dx = -ball.dx;
    const collidePoint = ball.y - (rightPaddle.y + rightPaddle.height / 2);
    const normalized = collidePoint / (rightPaddle.height / 2);
    ball.dy = ball.speed * normalized;
    ball.speed = Math.min(12, ball.speed + 0.5);
    ball.dx = (ball.dx > 0 ? 1 : -1) * ball.speed;
  }

  if (ball.x - ball.radius < 0) {
    rightScore++;
    scoreMessage = "Corbob scored!";
    gamePaused = true;
  }

  if (ball.x + ball.radius > canvas.width) {
    leftScore++;
    scoreMessage = "You scored!";
    gamePaused = true;
  }
}

// Clear canvas and draw background gradient
function drawBackground() {
  const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width / 6, canvas.width / 2, canvas.height / 2, canvas.width);
  grad.addColorStop(0, '#001122');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Main draw function
function draw() {
  drawBackground();
  drawNet();
  drawPaddle(leftPaddle);
  drawPaddle(rightPaddle);
  drawBall();
  drawScores();
}

// Key handling for left paddle control
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space" && gamePaused) {
    resetBall();
    gamePaused = false;
    scoreMessage = "";
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function handleInput() {
  if (keys['arrowup']) {
    leftPaddle.dy = -leftPaddle.speed;
  } else if (keys['arrowdown']) {
    leftPaddle.dy = leftPaddle.speed;
  } else {
    leftPaddle.dy = 0;
  }
}

// Main game loop
function loop() {
  handleInput();
  if (!gamePaused) {
    updatePaddles();
    updateBall();
  }
  draw();
  if (gamePaused) {
    drawScoreMessage();
  }
  requestAnimationFrame(loop);
}

// Start game
resetBall();
loop();
 