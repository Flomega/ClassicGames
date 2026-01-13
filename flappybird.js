// flappy.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRAVITY = 0.35;       // Slower fall, floatier bird
const FLAP_STRENGTH = -7.5; // Gentler flap
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 3;

let frameCount = 0;
let score = 0;
let gameOver = false;

// Particle system for cool neon sparks when flap
const particles = [];

class Particle {
  constructor(x, y) {
    this.x = x + (Math.random() * 20 - 10);
    this.y = y + (Math.random() * 20 - 10);
    this.radius = Math.random() * 3 + 1;
    this.life = 30;
    this.dx = (Math.random() - 0.5) * 1.5;
    this.dy = (Math.random() - 0.5) * 1.5;
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.life--;
    this.radius *= 0.95;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 255, 255, ${this.life / 30})`;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 10;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// Bird properties
const bird = {
  x: 80,
  y: HEIGHT / 2,
  radius: 14,
  velocity: 0,
  rotation: 0,
  trail: [],

  draw() {
    // Draw neon trail behind bird
    for (let i = 0; i < this.trail.length; i++) {
      const pos = this.trail[i];
      ctx.beginPath();
      ctx.fillStyle = `rgba(0, 255, 255, ${(i + 1) / this.trail.length / 3})`;
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 12;
      ctx.arc(pos.x, pos.y, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Neon glowing retro pixel bird body
    const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 20);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#004466');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillRect(-14, -14, 28, 28);

    // Beak (triangle)
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  update() {
    this.velocity += GRAVITY;
    this.y += this.velocity;

    // Add position to trail (max 10)
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();

    // Rotation with smoother easing for cool effect
    this.rotation += ((Math.min((this.velocity / 15) * Math.PI / 4, Math.PI / 4)) - this.rotation) * 0.1;

    // Prevent bird from going above the canvas
    if (this.y < this.radius) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },

  flap() {
    this.velocity = FLAP_STRENGTH;

    // Spawn some particles for neon flap effect
    for (let i = 0; i < 10; i++) {
      particles.push(new Particle(this.x - 10, this.y));
    }
  }
};

// Pipes array
const pipes = [];

function createPipe() {
  // Randomize pipe gap position vertically with some margin
  const topPipeBottomY = Math.random() * (HEIGHT - PIPE_GAP - 140) + 70;

  pipes.push({
    x: WIDTH,
    topY: 0,
    topHeight: topPipeBottomY,
    bottomY: topPipeBottomY + PIPE_GAP,
    bottomHeight: HEIGHT - (topPipeBottomY + PIPE_GAP)
  });
}

function drawPipe(pipe) {
  // Neon blue gradient for pipes with rounded edges
  const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  grad.addColorStop(0, '#0044cc');
  grad.addColorStop(1, '#00ffff');

  ctx.fillStyle = grad;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;

// Draw top pipe with rounded bottom corners
roundRect(ctx, pipe.x, pipe.topY, PIPE_WIDTH, pipe.topHeight, [0, 0, 15, 15], true);

// Draw bottom pipe with rounded top corners
roundRect(ctx, pipe.x, pipe.bottomY, PIPE_WIDTH, pipe.bottomHeight, [15, 15, 0, 0], true);


  ctx.shadowBlur = 0;
}

// Helper to draw rounded rect with custom corners
// corners: array of 4 values for [top-left, top-right, bottom-right, bottom-left]
function roundRect(ctx, x, y, w, h, radii, fill) {
  const [tl, tr, br, bl] = radii;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  if (fill) ctx.fill();
  ctx.closePath();
}


function updatePipes() {
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= PIPE_SPEED;

    // Remove offscreen pipes
    if (pipes[i].x + PIPE_WIDTH < 0) {
      pipes.splice(i, 1);
      score++;
      i--;
    }
  }

  // Add new pipes every 100 frames (~1.6 seconds)
  if (frameCount % 100 === 0) {
    createPipe();
  }
}

function checkCollision() {
  // Floor and ceiling
  if (bird.y + bird.radius > HEIGHT || bird.y - bird.radius < 0) {
    return true;
  }

  // Pipes
  for (const pipe of pipes) {
    // Bird rectangle for collision (simplified)
    const birdRect = {
      x: bird.x - bird.radius,
      y: bird.y - bird.radius,
      width: bird.radius * 2,
      height: bird.radius * 2
    };

    // Top pipe rectangle
    const topPipeRect = {
      x: pipe.x,
      y: pipe.topY,
      width: PIPE_WIDTH,
      height: pipe.topHeight
    };

    // Bottom pipe rectangle
    const bottomPipeRect = {
      x: pipe.x,
      y: pipe.bottomY,
      width: PIPE_WIDTH,
      height: pipe.bottomHeight
    };

    if (rectIntersect(birdRect, topPipeRect) || rectIntersect(birdRect, bottomPipeRect)) {
      return true;
    }
  }

  return false;
}

function rectIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.width ||
           r2.x + r2.width < r1.x ||
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

function drawScore() {
  ctx.font = "32px 'Press Start 2P', cursive";
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.textAlign = 'center';
  ctx.fillText(score, WIDTH / 2, 50);

  // HIGHSCORE
  ctx.font = "20px 'Press Start 2P', cursive";
  ctx.fillStyle = '#ffaa00';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 10;
  ctx.fillText("HIGH SCORE: " + highScore, WIDTH / 2, 85);
  ctx.shadowBlur = 0;
}

let pulseTime = 0;
let scoreMessage = "";
let won = false;  

function gameLoop() {
  clear();

  if (!gameOver && !won) {
    frameCount++;
    bird.update();
    updatePipes();

    if (checkCollision()) {
      gameOver = true;
    }
  }

  pipes.forEach(drawPipe);
  bird.draw();
  updateParticles();
  drawScore();

  if (gameOver || won) {
    scoreMessage = won ? "YOU WIN" : "GAME OVER";
    drawScoreMessage();
  }

  requestAnimationFrame(gameLoop);
}


function clear() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0 || particles[i].radius <= 0.1) {
      particles.splice(i, 1);
    }
  }
}

canvas.addEventListener('click', () => {
  if (gameOver || won) {
    resetGame();
  } else {
    bird.flap();
  }
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (gameOver || won) {
      resetGame();
    } else {
      bird.flap();
    }
  }
});


let highScore = 0;

function loadHighScore() {
  const saved = localStorage.getItem('flappyHighScore');
  if (saved !== null) {
    highScore = parseInt(saved, 10);
  }
}
loadHighScore();

function drawScoreMessage() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, HEIGHT / 2 - 70, WIDTH, 140);

  ctx.font = "36px 'Press Start 2P', cursive"; 
  ctx.fillStyle = '#00FFFF';
  ctx.textAlign = "center";
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 30;
  ctx.fillText(scoreMessage, WIDTH / 2, HEIGHT / 2 - 10);
  ctx.shadowBlur = 0;

  pulseTime += 0.03;
  if (pulseTime > 1) pulseTime = 0;

  const scale = 0.7 + 0.1 * Math.abs(Math.sin(pulseTime * Math.PI * 2));
  const alpha = 0.4 + 0.6 * Math.abs(Math.sin(pulseTime * Math.PI * 2));

  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2 + 40);
  ctx.scale(scale, scale);

  ctx.font = "13px 'Press Start 2P', cursive";  
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha.toFixed(2)})`;
  ctx.shadowColor = `rgba(255, 0, 0, ${alpha.toFixed(2)})`;
  ctx.shadowBlur = 20;
  ctx.textAlign = "center";
  ctx.fillText(
    (gameOver || won) ? "Click anywhere or press SPACE to restart" : "",
    0, 0
  );

  ctx.restore();
}

function resetGame() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyHighScore', highScore);
  }
  score = 0;
  frameCount = 0;
  gameOver = false;
  won = false;
  pipes.length = 0;       
  particles.length = 0;  
  bird.y = HEIGHT / 2;    
  bird.velocity = 0;
  bird.rotation = 0;
  bird.trail.length = 0;  
}


loadHighScore();
resetGame();
gameLoop();
