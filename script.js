const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageButton = document.getElementById("messageButton");

const levelValue = document.getElementById("levelValue");
const livesValue = document.getElementById("livesValue");
const scoreValue = document.getElementById("scoreValue");
const timerValue = document.getElementById("timerValue");
const bestScoreValue = document.getElementById("bestScoreValue");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");

const touchButtons = document.querySelectorAll(".control-button");

const STORAGE_KEY = "sprint-final-best-score";
const LEVELS = [
  { name: "Laboratório 1", goal: 8, enemyCount: 3, enemySpeed: [120, 170], time: 28 },
  { name: "Servidor Central", goal: 11, enemyCount: 5, enemySpeed: [145, 195], time: 30 },
  { name: "Defesa Final", goal: 14, enemyCount: 7, enemySpeed: [170, 220], time: 34 },
];

const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const game = {
  status: "idle",
  currentLevel: 0,
  lives: 3,
  score: 0,
  bestScore: loadBestScore(),
  collectedInLevel: 0,
  timeLeft: LEVELS[0].time,
  lastFrameTime: 0,
  nextAction: null,
};

let player = createPlayer();
let packages = [];
let bugs = [];

function loadBestScore() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(game.bestScore));
  } catch (error) {
    // localStorage pode estar indisponível em alguns navegadores.
  }
}

function createPlayer() {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 16,
    speed: 250,
    invulnerableTimer: 0,
    trailAngle: 0,
  };
}

function showMessage(title, text, buttonLabel, action) {
  messageTitle.textContent = title;
  messageText.textContent = text;
  messageButton.textContent = buttonLabel;
  game.nextAction = action;
  overlay.classList.remove("is-hidden");
}

function hideMessage() {
  game.nextAction = null;
  overlay.classList.add("is-hidden");
}

function resetInput() {
  inputState.up = false;
  inputState.down = false;
  inputState.left = false;
  inputState.right = false;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function circlesCollide(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  return distance < a.radius + b.radius;
}

function spawnPackage() {
  const radius = 12;
  let nextPackage = null;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = {
      x: randomBetween(48, canvas.width - 48),
      y: randomBetween(48, canvas.height - 48),
      radius,
      pulse: randomBetween(0, Math.PI * 2),
    };

    const collidesWithBug = bugs.some((bug) => circlesCollide(candidate, { ...bug, radius: bug.radius + 18 }));
    const collidesWithPlayer = circlesCollide(candidate, { ...player, radius: player.radius + 40 });
    const collidesWithOtherPackage = packages.some((item) =>
      circlesCollide(candidate, { ...item, radius: item.radius + 24 }),
    );

    if (!collidesWithBug && !collidesWithPlayer && !collidesWithOtherPackage) {
      nextPackage = candidate;
      break;
    }
  }

  if (!nextPackage) {
    nextPackage = {
      x: randomBetween(48, canvas.width - 48),
      y: randomBetween(48, canvas.height - 48),
      radius,
      pulse: randomBetween(0, Math.PI * 2),
    };
  }

  packages.push(nextPackage);
}

function createBug(levelConfig) {
  const radius = randomBetween(16, 26);
  let x = randomBetween(radius + 8, canvas.width - radius - 8);
  let y = randomBetween(radius + 8, canvas.height - radius - 8);

  for (let attempt = 0; attempt < 35; attempt += 1) {
    const farEnough = Math.hypot(x - player.x, y - player.y) > 180;
    if (farEnough) {
      break;
    }
    x = randomBetween(radius + 8, canvas.width - radius - 8);
    y = randomBetween(radius + 8, canvas.height - radius - 8);
  }

  const baseSpeed = randomBetween(levelConfig.enemySpeed[0], levelConfig.enemySpeed[1]);
  const angle = randomBetween(0, Math.PI * 2);

  return {
    x,
    y,
    radius,
    velocityX: Math.cos(angle) * baseSpeed,
    velocityY: Math.sin(angle) * baseSpeed,
    wobble: randomBetween(0, Math.PI * 2),
  };
}

function buildLevel(levelIndex) {
  const level = LEVELS[levelIndex];

  player = createPlayer();
  packages = [];
  bugs = [];

  game.currentLevel = levelIndex;
  game.collectedInLevel = 0;
  game.timeLeft = level.time;
  game.status = "playing";

  for (let index = 0; index < level.enemyCount; index += 1) {
    bugs.push(createBug(level));
  }

  for (let index = 0; index < 3; index += 1) {
    spawnPackage();
  }

  hideMessage();
  updateHud();
}

function startGame() {
  resetInput();
  game.lives = 3;
  game.score = 0;
  buildLevel(0);
}

function completeLevel() {
  resetInput();
  updateBestScore();
  updateHud();

  if (game.currentLevel === LEVELS.length - 1) {
    game.status = "won";
    showMessage(
      "Projeto entregue",
      `Você concluiu as três fases e terminou com ${game.score} pontos.`,
      "Jogar novamente",
      startGame,
    );
    return;
  }

  game.status = "between-levels";
  showMessage(
    `Fase ${game.currentLevel + 1} concluída`,
    `Boa. Prepare-se para ${LEVELS[game.currentLevel + 1].name.toLowerCase()}.`,
    "Próxima fase",
    () => buildLevel(game.currentLevel + 1),
  );
}

function gameOver(reason) {
  game.status = "lost";
  resetInput();
  game.timeLeft = Math.max(0, game.timeLeft);
  updateBestScore();
  updateHud();
  showMessage("Fim de jogo", reason, "Tentar novamente", startGame);
}

function updateBestScore() {
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    saveBestScore();
  }
}

function updateHud() {
  const level = LEVELS[game.currentLevel];
  const progressRatio = level ? game.collectedInLevel / level.goal : 0;

  levelValue.textContent = String(game.currentLevel + 1);
  livesValue.textContent = String(game.lives);
  scoreValue.textContent = String(game.score);
  timerValue.textContent = `${Math.max(0, Math.ceil(game.timeLeft))}s`;
  bestScoreValue.textContent = String(game.bestScore);
  progressFill.style.width = `${clamp(progressRatio, 0, 1) * 100}%`;
  progressLabel.textContent = `${game.collectedInLevel} / ${level.goal} pacotes`;
}

function collectPackage(packageIndex) {
  packages.splice(packageIndex, 1);
  game.score += 10;
  game.collectedInLevel += 1;

  if (game.collectedInLevel >= LEVELS[game.currentLevel].goal) {
    completeLevel();
    return;
  }

  spawnPackage();
  updateBestScore();
  updateHud();
}

function hitByBug() {
  if (player.invulnerableTimer > 0) {
    return;
  }

  game.lives -= 1;
  player.invulnerableTimer = 2.2;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if (game.lives <= 0) {
    gameOver("Os bugs tomaram conta do laboratório antes da entrega final.");
    return;
  }

  updateHud();
}

function movePlayer(deltaTime) {
  let moveX = 0;
  let moveY = 0;

  if (inputState.up) moveY -= 1;
  if (inputState.down) moveY += 1;
  if (inputState.left) moveX -= 1;
  if (inputState.right) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const magnitude = Math.hypot(moveX, moveY);
    moveX /= magnitude;
    moveY /= magnitude;
    player.trailAngle = Math.atan2(moveY, moveX);
  }

  player.x += moveX * player.speed * deltaTime;
  player.y += moveY * player.speed * deltaTime;
  player.x = clamp(player.x, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y, player.radius, canvas.height - player.radius);
}

function updateBugs(deltaTime) {
  for (const bug of bugs) {
    bug.x += bug.velocityX * deltaTime;
    bug.y += bug.velocityY * deltaTime;
    bug.wobble += deltaTime * 4;

    if (bug.x - bug.radius <= 0 || bug.x + bug.radius >= canvas.width) {
      bug.velocityX *= -1;
      bug.x = clamp(bug.x, bug.radius, canvas.width - bug.radius);
    }

    if (bug.y - bug.radius <= 0 || bug.y + bug.radius >= canvas.height) {
      bug.velocityY *= -1;
      bug.y = clamp(bug.y, bug.radius, canvas.height - bug.radius);
    }
  }
}

function updatePackages(deltaTime) {
  for (const item of packages) {
    item.pulse += deltaTime * 3;
  }
}

function update(deltaTime) {
  if (game.status !== "playing") {
    return;
  }

  game.timeLeft -= deltaTime;
  if (game.timeLeft <= 0) {
    gameOver("O prazo terminou antes de você concluir a fase.");
    return;
  }

  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer -= deltaTime;
  }

  movePlayer(deltaTime);
  updateBugs(deltaTime);
  updatePackages(deltaTime);

  for (let index = packages.length - 1; index >= 0; index -= 1) {
    if (circlesCollide(player, packages[index])) {
      collectPackage(index);
      break;
    }
  }

  for (const bug of bugs) {
    if (circlesCollide(player, bug)) {
      hitByBug();
      break;
    }
  }

  updateHud();
}

function drawArena() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#07121f");
  gradient.addColorStop(1, "#102742");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let x = 24; x < canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 24; y < canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPackage(item) {
  const glowRadius = item.radius + Math.sin(item.pulse) * 2 + 6;

  ctx.save();
  ctx.fillStyle = "rgba(76, 201, 240, 0.18)";
  ctx.beginPath();
  ctx.arc(item.x, item.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(item.x, item.y);
  ctx.rotate(item.pulse * 0.4);
  ctx.fillStyle = "#4cc9f0";
  ctx.beginPath();
  ctx.moveTo(0, -item.radius - 4);
  ctx.lineTo(item.radius + 4, 0);
  ctx.lineTo(0, item.radius + 4);
  ctx.lineTo(-item.radius - 4, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#dff8ff";
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
}

function drawBug(bug) {
  const wobble = Math.sin(bug.wobble) * 3;

  ctx.save();
  ctx.translate(bug.x, bug.y);
  ctx.rotate(bug.wobble * 0.15);

  ctx.fillStyle = "rgba(255, 89, 94, 0.22)";
  ctx.beginPath();
  ctx.arc(0, 0, bug.radius + 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff595e";
  ctx.beginPath();
  ctx.moveTo(0, -bug.radius - wobble);
  ctx.lineTo(bug.radius, 0);
  ctx.lineTo(0, bug.radius + wobble);
  ctx.lineTo(-bug.radius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#ffd6d6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-bug.radius * 0.45, -bug.radius * 0.3);
  ctx.lineTo(bug.radius * 0.45, bug.radius * 0.3);
  ctx.moveTo(bug.radius * 0.45, -bug.radius * 0.3);
  ctx.lineTo(-bug.radius * 0.45, bug.radius * 0.3);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  const blinking = player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 10) % 2 === 0;

  if (blinking) {
    return;
  }

  const thrusterX = player.x - Math.cos(player.trailAngle) * 18;
  const thrusterY = player.y - Math.sin(player.trailAngle) * 18;

  ctx.save();
  ctx.fillStyle = "rgba(255, 230, 109, 0.25)";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius + 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 159, 28, 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(thrusterX, thrusterY);
  ctx.lineTo(
    thrusterX - Math.cos(player.trailAngle) * 10 + Math.sin(player.trailAngle) * 4,
    thrusterY - Math.sin(player.trailAngle) * 10 - Math.cos(player.trailAngle) * 4,
  );
  ctx.moveTo(thrusterX, thrusterY);
  ctx.lineTo(
    thrusterX - Math.cos(player.trailAngle) * 10 - Math.sin(player.trailAngle) * 4,
    thrusterY - Math.sin(player.trailAngle) * 10 + Math.cos(player.trailAngle) * 4,
  );
  ctx.stroke();

  ctx.fillStyle = "#ffe66d";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#07131f";
  ctx.beginPath();
  ctx.arc(player.x + 4, player.y - 3, 3.5, 0, Math.PI * 2);
  ctx.arc(player.x - 4, player.y - 3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#07131f";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y + 3, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawLevelBadge() {
  const level = LEVELS[game.currentLevel];
  if (!level) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(18, 18, 240, 52);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(18, 18, 240, 52);
  ctx.fillStyle = "#7ae8de";
  ctx.font = "700 12px JetBrains Mono";
  ctx.fillText(`META: ${level.goal} PACOTES`, 34, 40);
  ctx.fillStyle = "#f3f7fb";
  ctx.font = "700 20px Outfit";
  ctx.fillText(level.name, 34, 58);
  ctx.restore();
}

function render() {
  drawArena();
  drawLevelBadge();
  packages.forEach(drawPackage);
  bugs.forEach(drawBug);
  drawPlayer();
}

function frame(timestamp) {
  if (!game.lastFrameTime) {
    game.lastFrameTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - game.lastFrameTime) / 1000, 0.03);
  game.lastFrameTime = timestamp;

  update(deltaTime);
  render();

  window.requestAnimationFrame(frame);
}

function setInputFromKey(key, isPressed) {
  if (key === "ArrowUp" || key === "w" || key === "W") inputState.up = isPressed;
  if (key === "ArrowDown" || key === "s" || key === "S") inputState.down = isPressed;
  if (key === "ArrowLeft" || key === "a" || key === "A") inputState.left = isPressed;
  if (key === "ArrowRight" || key === "d" || key === "D") inputState.right = isPressed;
}

window.addEventListener("keydown", (event) => {
  const supportedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"];
  if (supportedKeys.includes(event.key)) {
    event.preventDefault();
    setInputFromKey(event.key, true);
  }

  if (event.key === "Enter" && game.nextAction) {
    game.nextAction();
  }
});

window.addEventListener("keyup", (event) => {
  setInputFromKey(event.key, false);
});

touchButtons.forEach((button) => {
  const control = button.dataset.control;

  const press = (event) => {
    event.preventDefault();
    inputState[control] = true;
    button.classList.add("pressed");
  };

  const release = () => {
    inputState[control] = false;
    button.classList.remove("pressed");
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
});

messageButton.addEventListener("click", () => {
  if (game.nextAction) {
    game.nextAction();
  }
});

updateHud();
showMessage(
  "Entrega final em andamento",
  "Colete os pacotes azuis, cumpra a meta de cada fase e evite os bugs vermelhos para concluir o projeto.",
  "Iniciar jogo",
  startGame,
);
window.requestAnimationFrame(frame);
