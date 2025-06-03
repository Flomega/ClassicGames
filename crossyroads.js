// crossyroad-upgraded.js

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width, HEIGHT = canvas.height;

const TILE_SIZE = 40;
const ROWS = 16;
const COLS = WIDTH / TILE_SIZE;

let score = 0;
let lives = 3;
let gameOver = false;
let won = false;

const COLORS = {
  bgGrass: "#144214",
  road: "#333333",
  laneMark: "#ff0",
  text: "#0ff",
  carBody: "#00ffcc",
  carWindow: "#99ddff",
  carWheel: "#222",
  playerBody: "#fffacd",
  playerBeak: "#ffb84d",
  playerEye: "#000",
};

const NEON_COLORS = [
  "#FF00FF", "#00FFFF", "#39FF14", "#FF3131", "#FFFF33",
  "#FF6EC7", "#00FF9F", "#FFA500", "#7DF9FF", "#CFFF04"
];

// Player (chicken)
const player = {
  x: Math.floor(COLS/2),
  y: ROWS - 1,
  size: TILE_SIZE,
  draw() {
    const px = this.x * TILE_SIZE + TILE_SIZE/2;
    const py = this.y * TILE_SIZE + TILE_SIZE/2;
    ctx.save();

    ctx.shadowColor = COLORS.text;
    ctx.shadowBlur = 10;

    ctx.fillStyle = COLORS.playerBody;
    ctx.beginPath();
    ctx.ellipse(px, py + 6, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.playerBeak;
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 2);
    ctx.lineTo(px + 25, py);
    ctx.lineTo(px + 15, py + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.playerEye;
    ctx.beginPath();
    ctx.arc(px - 5, py - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },
  move(dx, dy) {
    if (gameOver || won) return;
    let nx = this.x + dx;
    let ny = this.y + dy;
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
      this.x = nx;
      this.y = ny;
    }
  },
  reset() {
    this.x = Math.floor(COLS/2);
    this.y = ROWS - 1;
  }
};

const lanes = [];
const cars = [];

function initLanes() {
  lanes.length = 0;
  for(let i=0; i<ROWS; i++) {
    if(i === ROWS - 1 || i % 3 === 0) lanes.push("grass");
    else lanes.push("road");
  }
}

function spawnCars() {
  cars.length = 0;
  for(let i=0; i<lanes.length; i++) {
    if(lanes[i] === "road") {
      let speed = 1 + Math.random() * 1.5;
      if(i % 2 === 0) speed = -speed;
      for(let c=0; c<4; c++) {
        cars.push({
          x: Math.random() * WIDTH + c * 200,
          y: i,
          speed: speed,
          width: TILE_SIZE * (1 + Math.floor(Math.random() * 2)),
          color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
        });
      }
    }
  }
}

function drawLanes() {
  for(let i=0; i<lanes.length; i++) {
    let y = i * TILE_SIZE;
    if(lanes[i] === "grass") {
      ctx.fillStyle = COLORS.bgGrass;
      ctx.fillRect(0, y, WIDTH, TILE_SIZE);
    } else if(lanes[i] === "road") {
      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, y, WIDTH, TILE_SIZE);
      ctx.strokeStyle = COLORS.laneMark;
      ctx.lineWidth = 2;
      ctx.setLineDash([10,10]);
      ctx.beginPath();
      ctx.moveTo(0, y + TILE_SIZE/2);
      ctx.lineTo(WIDTH, y + TILE_SIZE/2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawCar(car) {
  const y = car.y * TILE_SIZE + TILE_SIZE/4;
  ctx.save();
  ctx.shadowColor = car.color;
  ctx.shadowBlur = 12;

  ctx.fillStyle = car.color;
  ctx.fillRect(car.x, y, car.width, TILE_SIZE/2);

  ctx.fillStyle = COLORS.carWindow;
  let winW = car.width / 3;
  let winH = TILE_SIZE/5;
  for(let i=0; i<3; i++) {
    ctx.fillRect(car.x + i*winW + 4, y + 6, winW - 8, winH);
  }

  ctx.fillStyle = COLORS.carWheel;
  const wheelRadius = 6;
  ctx.beginPath();
  ctx.ellipse(car.x + 12, y + TILE_SIZE/2, wheelRadius, wheelRadius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(car.x + car.width - 12, y + TILE_SIZE/2, wheelRadius, wheelRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCars() {
  cars.forEach(drawCar);
}

function updateCars() {
  cars.forEach(car => {
    car.x += car.speed;
    if (car.speed > 0 && car.x > WIDTH) car.x = -car.width;
    else if (car.speed < 0 && car.x + car.width < 0) car.x = WIDTH;
  });
}

function checkCollision() {
  if (lanes[player.y] === "road") {
    for (let car of cars) {
      if (car.y === player.y) {
        let px = player.x * TILE_SIZE + 8;
        let py = player.y * TILE_SIZE + 8;
        let pSize = TILE_SIZE - 16;
        let cx = car.x;
        let cy = car.y * TILE_SIZE + TILE_SIZE/4;
        let cWidth = car.width;
        let cHeight = TILE_SIZE/2;
        if (px < cx + cWidth && px + pSize > cx && py < cy + cHeight && py + pSize > cy) {
          return true;
        }
      }
    }
  }
  return false;
}

function updatePlayer() {
  // nothing needed here for now
}

function loseLife() {
  lives--;
  if (lives <= 0) {
    gameOver = true;
  }
  player.reset();
}

function checkWin() {
  if (player.y === 0) {
    won = true;
    score += 10;
  }
}

function drawHUD() {
  ctx.fillStyle = COLORS.text;
  ctx.font = "14px 'Press Start 2P'";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.textAlign = "right";
  ctx.fillText(`Lives: ${lives}`, WIDTH - 10, 20);
}

function drawGameOver() {
  ctx.fillStyle = "#ff0044";
  ctx.font = "32px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.shadowColor = "#ff0044";
  ctx.shadowBlur = 20;
  ctx.fillText("GAME OVER", WIDTH/2, HEIGHT/2 - 20);
  ctx.shadowBlur = 0;
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText("Press SPACE to restart", WIDTH/2, HEIGHT/2 + 20);
}

function drawWin() {
  ctx.fillStyle = "#00ffcc";
  ctx.font = "32px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 15;
  ctx.fillText("YOU WIN!", WIDTH/2, HEIGHT/2 - 20);
  ctx.shadowBlur = 0;
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText("Press SPACE to restart", WIDTH/2, HEIGHT/2 + 20);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return;
  }
  if (won) {
    drawWin();
    return;
  }

  updateCars();
  updatePlayer();

  if (checkCollision()) {
    loseLife();
  }

  checkWin();

  drawLanes();
  drawCars();
  player.draw();
  drawHUD();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", e => {
  if ((gameOver || won) && e.key === " ") {
    lives = 3;
    score = 0;
    gameOver = false;
    won = false;
    player.reset();
    initLanes();
    spawnCars();
    requestAnimationFrame(gameLoop);
  }
  if (gameOver || won) return;
  if (e.key === "ArrowUp") player.move(0, -1);
  else if (e.key === "ArrowDown") player.move(0, 1);
  else if (e.key === "ArrowLeft") player.move(-1, 0);
  else if (e.key === "ArrowRight") player.move(1, 0);
});

initLanes();
spawnCars();
requestAnimationFrame(gameLoop);
