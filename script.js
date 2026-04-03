const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const livesValue = document.getElementById("livesValue");
const scoreValue = document.getElementById("scoreValue");
const timerValue = document.getElementById("timerValue");
const phaseValue = document.getElementById("phaseValue");
const goalValue = document.getElementById("goalValue");

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const config = {
  targetScore: 12,
  totalTime: 45,
  playerSpeed: 220,
  enemyBaseSpeed: 120,
};

const state = {
  status: "ready",
  score: 0,
  lives: 3,
  timeLeft: config.totalTime,
  phase: 1,
  lastTime: 0,
  invulnerability: 0,
};

let player = createPlayer();
let fileItem = createFile();
let enemies = [];

function createPlayer() {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 14,
  };
}

function createFile() {
  return {
    x: random(40, canvas.width - 40),
    y: random(40, canvas.height - 40),
    size: 18,
  };
}

function createEnemy(speedMultiplier = 1) {
  const speed = random(config.enemyBaseSpeed, config.enemyBaseSpeed + 40) * speedMultiplier;
  const angle = random(0, Math.PI * 2);

  return {
    x: random(30, canvas.width - 30),
    y: random(30, canvas.height - 30),
    radius: 15,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function circleCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < a.radius + b.radius;
}

function rectCircleCollision(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.size);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.size);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function updateHud() {
  livesValue.textContent = state.lives;
  scoreValue.textContent = state.score;
  timerValue.textContent = Math.ceil(state.timeLeft);
  phaseValue.textContent = state.phase;
  goalValue.textContent = `${state.score}/${config.targetScore}`;
}

function setMessage(text) {
  message.textContent = text;
}

function getPhaseFromScore() {
  if (state.score >= 8) return 3;
  if (state.score >= 4) return 2;
  return 1;
}

function resetGame() {
  state.status = "running";
  state.score = 0;
  state.lives = 3;
  state.timeLeft = config.totalTime;
  state.phase = 1;
  state.lastTime = 0;
  state.invulnerability = 0;

  player = createPlayer();
  fileItem = createFile();
  enemies = [createEnemy(), createEnemy(), createEnemy()];

  updateHud();
  setMessage("Jogo em andamento. Colete 12 arquivos para vencer.");
  startButton.textContent = "Reiniciar jogo";
}

function finishGame(type) {
  state.status = type;

  if (type === "win") {
    setMessage("Você venceu. Todos os arquivos do projeto foram coletados.");
  } else {
    setMessage("Fim de jogo. Clique no botão para tentar novamente.");
  }
}

function movePlayer(deltaTime) {
  let dx = 0;
  let dy = 0;

  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
  }

  player.x += dx * config.playerSpeed * deltaTime;
  player.y += dy * config.playerSpeed * deltaTime;
  player.x = clamp(player.x, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y, player.radius, canvas.height - player.radius);
}

function moveEnemies(deltaTime) {
  for (const enemy of enemies) {
    enemy.x += enemy.vx * deltaTime;
    enemy.y += enemy.vy * deltaTime;

    if (enemy.x - enemy.radius <= 0 || enemy.x + enemy.radius >= canvas.width) {
      enemy.vx *= -1;
    }

    if (enemy.y - enemy.radius <= 0 || enemy.y + enemy.radius >= canvas.height) {
      enemy.vy *= -1;
    }
  }
}

function collectFile() {
  state.score += 1;
  fileItem = createFile();

  const newPhase = getPhaseFromScore();
  if (newPhase > state.phase) {
    state.phase = newPhase;
    enemies.push(createEnemy(1 + state.phase * 0.15));
    setMessage(`Fase ${state.phase} iniciada. Agora há mais bugs na tela.`);
  }

  if (state.score >= config.targetScore) {
    updateHud();
    finishGame("win");
  }
}

function loseLife() {
  if (state.invulnerability > 0) {
    return;
  }

  state.lives -= 1;
  state.invulnerability = 1;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if (state.lives <= 0) {
    finishGame("lose");
  }
}

function update(deltaTime) {
  if (state.status !== "running") {
    return;
  }

  state.timeLeft -= deltaTime;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    finishGame("lose");
    updateHud();
    return;
  }

  if (state.invulnerability > 0) {
    state.invulnerability -= deltaTime;
  }

  movePlayer(deltaTime);
  moveEnemies(deltaTime);

  if (rectCircleCollision(player, fileItem)) {
    collectFile();
  }

  for (const enemy of enemies) {
    if (circleCollision(player, enemy)) {
      loseLife();
      break;
    }
  }

  updateHud();
}

function drawBackground() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for (let x = 0; x <= canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  if (state.invulnerability > 0 && Math.floor(state.invulnerability * 10) % 2 === 0) {
    return;
  }

  ctx.fillStyle = "#60a5fa";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFile() {
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(fileItem.x, fileItem.y, fileItem.size, fileItem.size);

  ctx.fillStyle = "#dcfce7";
  ctx.fillRect(fileItem.x + 4, fileItem.y + 4, fileItem.size - 8, fileItem.size - 8);
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStatus() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px Arial";
  ctx.fillText("Azul: jogador", 16, 24);
  ctx.fillText("Verde: arquivo", 16, 46);
  ctx.fillText("Vermelho: bug", 16, 68);
}

function render() {
  drawBackground();
  drawFile();
  drawEnemies();
  drawPlayer();
  drawStatus();
}

function gameLoop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.03);
  state.lastTime = timestamp;

  update(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.key.includes("Arrow")) {
    event.preventDefault();
  }

  if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") keys.up = true;
  if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") keys.down = true;
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = true;
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") keys.up = false;
  if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") keys.down = false;
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = false;
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = false;
});

startButton.addEventListener("click", resetGame);

updateHud();
render();
requestAnimationFrame(gameLoop);
