const track = document.getElementById("track");
const obstaclesLayer = document.getElementById("obstaclesLayer");
const playerCar = document.getElementById("playerCar");

const scoreValue = document.getElementById("scoreValue");
const timeValue = document.getElementById("timeValue");
const speedValue = document.getElementById("speedValue");
const laneValue = document.getElementById("laneValue");
const finalScoreValue = document.getElementById("finalScoreValue");
const endLabel = document.getElementById("endLabel");
const endTitle = document.getElementById("endTitle");
const endPrefix = document.getElementById("endPrefix");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const laneDividers = document.querySelectorAll(".lane-divider");
const shoulders = document.querySelectorAll(".shoulder");

const LANE_COUNT = 3;
const BASE_SPEED = 150;
const MAX_SPEED = 250;
const START_OBSTACLE_DISTANCE = 420;
const WIN_SCORE = 500;

const obstacleTypes = [
  { className: "obstacle-car", width: 70, height: 132 },
  { className: "obstacle-cone", width: 48, height: 88 },
  { className: "obstacle-block", width: 68, height: 68 },
];

const laneLabels = ["Esquerda", "Centro", "Direita"];

const state = {
  isRunning: false,
  laneIndex: 1,
  score: 0,
  time: 0,
  distance: 0,
  speed: BASE_SPEED,
  nextObstacleDistance: START_OBSTACLE_DISTANCE,
  obstacles: [],
  lastFrameTime: 0,
  animationId: null,
};

let metrics = readMetrics();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Lê as medidas da pista e do carro para posicionar os elementos nas faixas.
function readMetrics() {
  const trackWidth = track.clientWidth;
  const trackHeight = track.clientHeight;
  const laneWidth = trackWidth / LANE_COUNT;
  const playerWidth = playerCar.offsetWidth || 74;
  const playerHeight = playerCar.offsetHeight || 142;

  return {
    trackWidth,
    trackHeight,
    playerWidth,
    playerHeight,
    playerTop: trackHeight - playerHeight - 34,
    laneCenters: [laneWidth * 0.5, laneWidth * 1.5, laneWidth * 2.5],
  };
}

function laneToLeft(laneIndex, elementWidth) {
  return metrics.laneCenters[laneIndex] - elementWidth / 2;
}

// Posiciona o carro do jogador sempre em uma das três faixas.
function positionPlayer() {
  const left = laneToLeft(state.laneIndex, metrics.playerWidth);
  playerCar.style.left = `${left}px`;
  playerCar.style.top = `${metrics.playerTop}px`;
  playerCar.style.transform = "rotate(0deg)";
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  timeValue.textContent = `${state.time.toFixed(1)}s`;
  speedValue.textContent = `${(state.speed / BASE_SPEED).toFixed(1)}x`;
  laneValue.textContent = laneLabels[state.laneIndex];
}

function clearObstacles() {
  for (const obstacle of state.obstacles) {
    obstacle.element.remove();
  }

  state.obstacles = [];
}

function chooseLane() {
  return Math.floor(Math.random() * LANE_COUNT);
}

// Cria um obstáculo em uma faixa aleatória e registra sua posição no percurso.
function createObstacle(distance) {
  const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const laneIndex = chooseLane();
  const element = document.createElement("div");

  element.className = `obstacle ${type.className}`;
  element.style.width = `${type.width}px`;
  element.style.height = `${type.height}px`;

  const obstacle = {
    laneIndex,
    width: type.width,
    height: type.height,
    distance,
    x: laneToLeft(laneIndex, type.width),
    y: -type.height,
    element,
  };

  element.style.left = `${obstacle.x}px`;
  element.style.top = `${obstacle.y}px`;

  obstaclesLayer.appendChild(element);
  state.obstacles.push(obstacle);
}

function removeObstacle(index) {
  state.obstacles[index].element.remove();
  state.obstacles.splice(index, 1);
}

// Gera obstáculos sempre alguns metros à frente do carro.
function generateObstacles() {
  const visibleDistance = state.distance + metrics.trackHeight + 900;

  while (state.nextObstacleDistance < visibleDistance) {
    createObstacle(state.nextObstacleDistance);
    state.nextObstacleDistance += randomBetween(320, 460);
  }
}

function removePassedObstacles() {
  for (let index = state.obstacles.length - 1; index >= 0; index -= 1) {
    if (state.obstacles[index].distance < state.distance - 220) {
      removeObstacle(index);
    }
  }
}

// Converte a posição do obstáculo no percurso para a posição dele na tela.
function renderObstacles() {
  for (const obstacle of state.obstacles) {
    obstacle.x = laneToLeft(obstacle.laneIndex, obstacle.width);
    obstacle.y = metrics.trackHeight - (obstacle.distance - state.distance) - obstacle.height;

    const visible =
      obstacle.y < metrics.trackHeight + 40 &&
      obstacle.y + obstacle.height > -120;

    obstacle.element.style.left = `${obstacle.x}px`;
    obstacle.element.style.top = `${obstacle.y}px`;
    obstacle.element.style.display = visible ? "block" : "none";
  }
}

function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Verifica se o carro do jogador bateu em algum obstáculo visível.
function detectCollision() {
  const playerRect = {
    x: laneToLeft(state.laneIndex, metrics.playerWidth),
    y: metrics.playerTop,
    width: metrics.playerWidth,
    height: metrics.playerHeight,
  };

  return state.obstacles.some((obstacle) => {
    if (obstacle.element.style.display === "none") {
      return false;
    }

    return rectanglesOverlap(playerRect, {
      x: obstacle.x,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height,
    });
  });
}

function updateRoadMotion() {
  const offset = state.distance * 0.8;

  for (const divider of laneDividers) {
    divider.style.backgroundPositionY = `${offset}px`;
  }

  for (const shoulder of shoulders) {
    shoulder.style.backgroundPositionY = `${offset}px`;
  }
}

function updateSpeed() {
  state.speed = Math.min(BASE_SPEED + state.time * 6, MAX_SPEED);
}

function updateScore(deltaTime) {
  state.time += deltaTime;
  state.score = Math.floor(state.time * 10);
}

function endGame(result) {
  state.isRunning = false;
  finalScoreValue.textContent = String(state.score);

  if (result === "win") {
    endLabel.textContent = "Vitória";
    endTitle.textContent = "Corrida concluída";
    endPrefix.textContent = "Pontuação da vitória:";
  } else {
    endLabel.textContent = "Game Over";
    endTitle.textContent = "Fim da corrida";
    endPrefix.textContent = "Pontuação final:";
  }

  gameOverScreen.classList.remove("hidden");
}

// Atualiza pontuação, velocidade, distância e colisão a cada frame.
function updateGame(deltaTime) {
  updateScore(deltaTime);
  updateSpeed();
  state.distance += state.speed * deltaTime;

  generateObstacles();
  removePassedObstacles();
  renderObstacles();
  updateRoadMotion();

  if (state.score >= WIN_SCORE) {
    updateHud();
    endGame("win");
    return;
  }

  if (detectCollision()) {
    endGame("lose");
  }

  updateHud();
}

function gameLoop(timestamp) {
  if (!state.isRunning) {
    return;
  }

  if (!state.lastFrameTime) {
    state.lastFrameTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - state.lastFrameTime) / 1000, 0.03);
  state.lastFrameTime = timestamp;

  updateGame(deltaTime);

  if (state.isRunning) {
    state.animationId = window.requestAnimationFrame(gameLoop);
  }
}

// Reinicia a partida do zero.
function resetGame() {
  clearObstacles();
  metrics = readMetrics();

  state.isRunning = true;
  state.laneIndex = 1;
  state.score = 0;
  state.time = 0;
  state.distance = 0;
  state.speed = BASE_SPEED;
  state.nextObstacleDistance = START_OBSTACLE_DISTANCE;
  state.lastFrameTime = 0;

  positionPlayer();
  generateObstacles();
  renderObstacles();
  updateRoadMotion();
  updateHud();

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  if (state.animationId) {
    window.cancelAnimationFrame(state.animationId);
  }

  state.animationId = window.requestAnimationFrame(gameLoop);
}

// Move o carro para a esquerda ou direita, uma faixa por vez.
function movePlayer(direction) {
  if (!state.isRunning) {
    return;
  }

  state.laneIndex += direction;
  state.laneIndex = clamp(state.laneIndex, 0, LANE_COUNT - 1);
  positionPlayer();
  updateHud();
}

function handleKeyDown(event) {
  if (event.repeat) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    movePlayer(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    movePlayer(1);
  }
}

function handleResize() {
  metrics = readMetrics();
  positionPlayer();
  renderObstacles();
}

startButton.addEventListener("click", resetGame);
restartButton.addEventListener("click", resetGame);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", handleResize);

positionPlayer();
updateRoadMotion();
updateHud();
