const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Ball properties
let ball = {
  x: WIDTH / 2,
  y: HEIGHT - 60,
  radius: 14,
  speed: 5,
  dx: 4,
  dy: -4,
  trail: []
};

// Paddle properties
let paddleWidth = 120;
let paddleHeight = 16;
let paddleX = (WIDTH - paddleWidth) / 2;
const paddleSpeed = 8;

// Brick properties
const brickRowCount = 6;
const brickColumnCount = 8;
const brickWidth = 42;
const brickHeight = 18;
const brickPadding = 9;
const brickOffsetTop = 50;
const brickOffsetLeft = 35;

const brickColors = [
  "#FF3F8E", // bright pink
  "#04C2C9", // teal
  "#F5D300", // neon yellow
  "#FF4E50", // neon red
  "#1CFFCE", // neon aqua
];

// Bricks 2D array
let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

// Controls
let rightPressed = false;
let leftPressed = false;

// Score & lives
let score = 0;
let lives = 3;
let gameOver = false;
let showContinueText = false;

// Implosion animations array
let implosions = [];

// Event listeners
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  } else if (e.key === " " || e.key === "Spacebar") {
    if (gameOver) {
      resetGame();
    } else if (showContinueText) {
      showContinueText = false;
      resetBallAndPaddle();
    }
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

function resetBallAndPaddle() {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT - 60;
  ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -4;
  ball.trail = [];

  paddleX = (WIDTH - paddleWidth) / 2;
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  showContinueText = false;

  // Reset bricks
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
    }
  }

  resetBallAndPaddle();
}

// Draw neon paddle
function drawPaddle() {
  // Neon gradient fill
  const gradient = ctx.createLinearGradient(paddleX, HEIGHT - paddleHeight, paddleX + paddleWidth, HEIGHT);
  gradient.addColorStop(0, "#ff3f8e");   // pink
  gradient.addColorStop(0.5, "#04c2c9"); // teal
  gradient.addColorStop(1, "#f5d300");   // yellow

  ctx.fillStyle = gradient;
  ctx.shadowColor = "#ff3f8e";
  ctx.shadowBlur = 15;
  ctx.fillRect(paddleX, HEIGHT - paddleHeight, paddleWidth, paddleHeight);

  // Neon glowing outline
  ctx.strokeStyle = "#ff3f8e";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 20;
  ctx.strokeRect(paddleX, HEIGHT - paddleHeight, paddleWidth, paddleHeight);

  // Highlight line (shine effect)
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddleX + 5, HEIGHT - paddleHeight + 4);
  ctx.lineTo(paddleX + paddleWidth - 5, HEIGHT - paddleHeight + 4);
  ctx.stroke();
}

// Draw neon ball with trail and glow
function drawBall() {
  // Add to trail
  ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.25 });
  if (ball.trail.length > 25) ball.trail.shift();

  // Draw trail
  for (let i = 0; i < ball.trail.length; i++) {
    const t = ball.trail[i];
    ctx.beginPath();
    ctx.arc(t.x, t.y, ball.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(4, 194, 201, ${t.alpha.toFixed(2)})`; // neon teal
    ctx.fill();
    ctx.closePath();
    t.alpha -= 0.01;
  }

  // Draw glowing ball
  const gradient = ctx.createRadialGradient(
    ball.x,
    ball.y,
    ball.radius / 3,
    ball.x,
    ball.y,
    ball.radius * 1.5
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.7, "rgba(4, 194, 201, 0.9)");
  gradient.addColorStop(1, "rgba(4, 194, 201, 0)");

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowColor = "#04C2C9";
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}

// Draw bricks with neon pattern and glow
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        // Color pattern: alternating colors for an 80s neon vibe
        const colorIndex = (c + r * 2) % brickColors.length;
        const baseColor = brickColors[colorIndex];

        // Neon gradient fill with glowing effect
        const grad = ctx.createLinearGradient(brickX, brickY, brickX + brickWidth, brickY + brickHeight);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, "#111");

        ctx.fillStyle = grad;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}

// Implosion animation on brick break
function drawImplosions() {
  for (let i = implosions.length - 1; i >= 0; i--) {
    const imp = implosions[i];
    imp.radius += 1.8;
    imp.alpha -= 0.07;

    if (imp.alpha <= 0) {
      implosions.splice(i, 1);
      continue;
    }

    const grad = ctx.createRadialGradient(imp.x, imp.y, 0, imp.x, imp.y, imp.radius);
    grad.addColorStop(0, `rgba(4,194,201,${imp.alpha.toFixed(2)})`);
    grad.addColorStop(1, "rgba(4,194,201,0)");

    ctx.beginPath();
    ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// Draw score and lives HUD
function drawHUD() {
  ctx.fillStyle = "#00fff7";
  ctx.font = "16px 'Press Start 2P'";
  ctx.shadowColor = "#00fff7";
  ctx.shadowBlur = 10;
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Lives: " + lives, WIDTH - 140, 30);
  ctx.shadowBlur = 0;
}

// Draw "Press SPACE to continue" text with neon pulse
function drawContinueText() {
  const t = Date.now() / 600;
  const scale = 0.8 + 0.2 * Math.sin(t * 6);
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "20px 'Press Start 2P'";
  ctx.shadowColor = "#ff2e2e";
  ctx.shadowBlur = 15;
  ctx.fillText("PRESS SPACE TO CONTINUE", 0, 0);
  ctx.restore();
}

// Draw "GAME OVER" text big and glowing
function drawGameOver() {
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff0000";
  ctx.font = "36px 'Press Start 2P'";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 30;
  ctx.fillText("GAME OVER", 0, 0);
  ctx.restore();
}

// Ball and paddle movement and collision logic
function update() {
  if (gameOver || showContinueText) return;

  // Move paddle
  if (rightPressed && paddleX < WIDTH - paddleWidth) {
    paddleX += paddleSpeed;
  }
  if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collisions
  if (ball.x + ball.radius > WIDTH) {
    ball.x = WIDTH - ball.radius;
    ball.dx = -ball.dx;
  } else if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
  }

  // Paddle collision
  if (
    ball.y + ball.radius > HEIGHT - paddleHeight &&
    ball.x > paddleX &&
    ball.x < paddleX + paddleWidth
  ) {
    ball.dy = -ball.dy;

    // Add paddle hit effect: tweak dx by hit position on paddle for angle control
    const hitPos = ball.x - (paddleX + paddleWidth / 2);
    ball.dx = hitPos * 0.2;
  }

  // Bottom collision — lose life
  if (ball.y + ball.radius > HEIGHT) {
    lives--;
    if (lives <= 0) {
      gameOver = true;
    } else {
      showContinueText = true;
    }
  }

  // Brick collisions
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          ball.x > b.x &&
          ball.x < b.x + brickWidth &&
          ball.y - ball.radius < b.y + brickHeight &&
          ball.y + ball.radius > b.y
        ) {
          ball.dy = -ball.dy;
          b.status = 0;
          score += 10;

          // Implosion animation at brick center
          implosions.push({
            x: b.x + brickWidth / 2,
            y: b.y + brickHeight / 2,
            radius: 0,
            alpha: 1,
          });

          // Win check
          if (checkWin()) {
            alert("🎉 YOU WIN! 🎉");
            resetGame();
          }
        }
      }
    }
  }
}

function checkWin() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        return false;
      }
    }
  }
  return true;
}

// Main draw loop
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  drawBricks();
  drawImplosions();
  drawBall();
  drawPaddle();
  drawHUD();

  if (showContinueText) {
    drawContinueText();
  }

  if (gameOver) {
    drawGameOver();
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetBallAndPaddle();
loop();
