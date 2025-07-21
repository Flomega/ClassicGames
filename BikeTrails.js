// All setup and constants are the same
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 800;

const GRID_SIZE = 32;
const CELL_SIZE = canvas.width / GRID_SIZE;
const BLOCK_SIZE = CELL_SIZE * 0.4;

const colors = {
  background: '#111',
  player: '#099',
  enemy: '#990099',
  trail: '#0ff',
  enemyTrail: '#f0f',
  text: '#0ff',
  explosion: '#0ff',
  enemyExplosion: '#f0f',
};

const directions = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

let player, enemies = [];
let gameOver = false;
let gameWon = false;
let scoreMessage = "";
let pulseTime = 0;
let explosions = [];

function createEnemy(x, y, dx, dy) {
  return {
    x, y, dx, dy,
    trail: [],
    tick: 0,
  };
}

function resetGame() {
  player = {
    x: Math.floor(GRID_SIZE / 2),
    y: Math.floor(GRID_SIZE / 2),
    dx: 0,
    dy: -1,
    trail: [],
  };

  enemies = [
    createEnemy(2, 2, 1, 0),
    createEnemy(GRID_SIZE - 3, 2, -1, 0),
    createEnemy(Math.floor(GRID_SIZE / 2), GRID_SIZE - 3, 0, -1),
  ];

  gameOver = false;
  gameWon = false;
  pulseTime = 0;
  explosions = [];
}

function wrapPosition(pos) {
  if (pos < 0 || pos >= GRID_SIZE) return null;
  return pos;
}

function drawCell(x, y, color, size = CELL_SIZE) {
  const offset = (CELL_SIZE - size) / 2;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE + offset, y * CELL_SIZE + offset, size, size);
}

function drawPlayerHead(x, y, color) {
  const size = BLOCK_SIZE * 1.2;
  const offset = (CELL_SIZE - size) / 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE + offset, y * CELL_SIZE + offset, size, size);
  ctx.shadowBlur = 0;
}

function drawEnemyHead(x, y, color) {
  const size = BLOCK_SIZE * 1.6;
  const offset = (CELL_SIZE - size) / 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE + offset, y * CELL_SIZE + offset, size, size);
  ctx.shadowBlur = 0;
}

function drawTrail(trail, baseColor) {
  if (trail.length < 2) return;

  ctx.fillStyle = baseColor;

  for (let i = 0; i < trail.length - 1; i++) {
    const curr = trail[i];
    const next = trail[i + 1];

    const cx = curr.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = curr.y * CELL_SIZE + CELL_SIZE / 2;
    const nx = next.x * CELL_SIZE + CELL_SIZE / 2;
    const ny = next.y * CELL_SIZE + CELL_SIZE / 2;

    const dx = nx - cx;
    const dy = ny - cy;

    let rectX = Math.min(cx, nx);
    let rectY = Math.min(cy, ny);
    let rectW = Math.abs(dx);
    let rectH = Math.abs(dy);

    // For corners, only draw half the length in both directions
    if (dx !== 0 && dy !== 0) {
      rectW = CELL_SIZE / 2;
      rectH = CELL_SIZE / 2;
    }

    // Adjust rect to be centered on the path
    if (dx === 0) {
      rectX = cx - CELL_SIZE / 8;
      rectW = CELL_SIZE / 4;
    }

    if (dy === 0) {
      rectY = cy - CELL_SIZE / 8;
      rectH = CELL_SIZE / 4;
    }

    ctx.fillRect(rectX, rectY, rectW, rectH);
  }
}

function drawGrid() {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateTrail(entity) {
  entity.trail.push({ x: entity.x, y: entity.y });
}

function moveEntity(entity) {
  const newX = wrapPosition(entity.x + entity.dx);
  const newY = wrapPosition(entity.y + entity.dy);
  if (newX === null || newY === null) {
    if (entity === player) {
      triggerExplosion(entity.x, entity.y, colors.explosion);
      gameOver = true;
    }
    return false;
  }
  entity.x = newX;
  entity.y = newY;
  return true;
}

function checkCollision(pos, trails) {
  return trails.some(trail => trail.x === pos.x && trail.y === pos.y);
}

function drawScoreMessage() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, canvas.height / 2 - 100, canvas.width, 200);

  ctx.font = "48px 'Orbitron', sans-serif";
  ctx.fillStyle = '#00FFFF';
  ctx.textAlign = "center";
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 30;
  ctx.fillText(scoreMessage, canvas.width / 2, canvas.height / 2);
  ctx.shadowBlur = 0;

  pulseTime += 0.03;
  const scale = 0.9 + 0.2 * Math.abs(Math.sin(pulseTime * Math.PI * 2));
  const alpha = 0.4 + 0.6 * Math.abs(Math.sin(pulseTime * Math.PI * 2));

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2 + 60);
  ctx.scale(scale, scale);
  ctx.font = "28px 'Orbitron', sans-serif";
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha.toFixed(2)})`;
  ctx.shadowColor = `rgba(255, 0, 0, ${alpha.toFixed(2)})`;
  ctx.shadowBlur = 20;
  ctx.fillText("Press SPACE to continue", 0, 0);
  ctx.restore();
}

function triggerExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) {
    explosions.push({
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1,
      size: Math.random() * 4 + 2,
      color,
    });
  }
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;
    if (p.alpha <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function drawExplosions() {
  for (const p of explosions) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(${hexToRgb(p.color)},${p.alpha.toFixed(2)})`;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

function gameLoop() {
  drawGrid();

  if (gameOver || gameWon) {
    scoreMessage = gameWon ? "YOU WIN" : "GAME OVER";
    drawScoreMessage();
    drawExplosions();
    updateExplosions();
    return;
  }

  const allEnemyTrails = enemies.flatMap(e => e.trail);
  const allTrails = [...player.trail, ...allEnemyTrails];

  if (!moveEntity(player)) return;
  if (checkCollision(player, allTrails)) {
    triggerExplosion(player.x, player.y, colors.explosion);
    gameOver = true;
    return;
  }
  updateTrail(player);

  for (let e of enemies) {
    e.tick++;
    if (e.tick % 2 === 0) {
      const possibleMoves = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];

      const safeMoves = possibleMoves.filter(move => {
        const nextX = wrapPosition(e.x + move.dx);
        const nextY = wrapPosition(e.y + move.dy);
        if (nextX === null || nextY === null) return false;
        const nextPos = { x: nextX, y: nextY };
        const allTrailsExceptSelf = [
          ...player.trail,
          ...enemies.flatMap(en => en !== e ? en.trail : []),
          ...e.trail,
        ];
        return !checkCollision(nextPos, allTrailsExceptSelf);
      });

      const currentSafe = safeMoves.find(m => m.dx === e.dx && m.dy === e.dy);
      if (currentSafe) {
        e.dx = currentSafe.dx;
        e.dy = currentSafe.dy;
      } else if (safeMoves.length > 0) {
        const chosen = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        e.dx = chosen.dx;
        e.dy = chosen.dy;
      } else {
        e.dx = 0;
        e.dy = 0;
      }
    }

    if (e.dx !== 0 || e.dy !== 0) {
      const moved = moveEntity(e);
      if (moved) {
        const allTrailsExceptSelf = [
          ...player.trail,
          ...enemies.flatMap(en => en !== e ? en.trail : []),
          ...e.trail,
        ];
        if (checkCollision(e, allTrailsExceptSelf)) {
          triggerExplosion(e.x, e.y, colors.enemyExplosion);
          enemies = enemies.filter(en => en !== e);
        } else {
          updateTrail(e);
        }
      }
    }
  }

  if (enemies.length === 0 || enemies.every(e => e.dx === 0 && e.dy === 0)) {
    gameWon = true;
  }

  drawTrail(player.trail, colors.trail);
  enemies.forEach(e => drawTrail(e.trail, colors.enemyTrail));

  drawPlayerHead(player.x, player.y, colors.player);
  enemies.forEach(e => drawEnemyHead(e.x, e.y, colors.enemy));

  drawExplosions();
  updateExplosions();
}

window.addEventListener('keydown', (e) => {
  if ((gameOver || gameWon) && e.code === 'Space') {
    resetGame();
    return;
  }

  if (directions[e.key]) {
    const [newDx, newDy] = directions[e.key];
    if (player.dx === 0 && player.dy === 0 || !(newDx === -player.dx && newDy === -player.dy)) {
      player.dx = newDx;
      player.dy = newDy;
    }
    if (!gameOver && !gameWon) {
      gameLoop();
    }
  }
});

resetGame();
setInterval(gameLoop, 100);
