const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function setupGame() {
  const elements = new Map();
  const listeners = new Map();
  const windowListeners = new Map();

  function element(id) {
    const classes = new Set(id === "gameOverScreen" ? ["hidden"] : []);
    return {
      id,
      style: {},
      textContent: "",
      clientWidth: 780,
      clientHeight: 640,
      offsetWidth: 74,
      offsetHeight: 142,
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
      },
      appendChild() {},
      remove() {},
      addEventListener(type, callback) {
        listeners.set(`${id}:${type}`, callback);
      },
    };
  }

  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element(id));
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    createElement() { return element("obstacle"); },
  };
  const window = {
    addEventListener: (type, callback) => windowListeners.set(type, callback),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
  };
  const context = vm.createContext({ document, window, Math });
  const source = readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  vm.runInContext(source, context);
  return { context, document, listeners, windowListeners };
}

function pressKey(game, key) {
  const event = { key, repeat: false, preventDefault() {} };
  game.windowListeners.get("keydown")(event);
}

test("as setas respeitam os limites das tres faixas", () => {
  const game = setupGame();
  game.listeners.get("startButton:click")();
  pressKey(game, "ArrowLeft");
  pressKey(game, "ArrowLeft");
  assert.equal(game.document.getElementById("laneValue").textContent, "Esquerda");
  pressKey(game, "ArrowRight");
  pressKey(game, "ArrowRight");
  pressKey(game, "ArrowRight");
  assert.equal(game.document.getElementById("laneValue").textContent, "Direita");
});

test("uma colisao encerra a partida e mostra a pontuacao", () => {
  const game = setupGame();
  game.listeners.get("startButton:click")();
  vm.runInContext(`
    state.nextObstacleDistance = Infinity;
    state.obstacles = [{
      laneIndex: 1, width: 70, height: 132,
      distance: metrics.playerHeight + 34 - 132,
      element: { style: {}, remove() {} }
    }];
    updateGame(0);
  `, game.context);
  assert.equal(game.document.getElementById("gameOverScreen").classList.contains("hidden"), false);
  assert.equal(game.document.getElementById("endTitle").textContent, "Fim da corrida");
  assert.equal(vm.runInContext("state.isRunning", game.context), false);
});

test("atingir 500 pontos encerra com vitoria", () => {
  const game = setupGame();
  game.listeners.get("startButton:click")();
  vm.runInContext(`
    state.obstacles = [];
    state.nextObstacleDistance = Infinity;
    state.time = 49.99;
    updateGame(0.02);
  `, game.context);
  assert.equal(game.document.getElementById("endLabel").textContent, "Vitória");
  assert.equal(game.document.getElementById("finalScoreValue").textContent, "500");
  assert.equal(vm.runInContext("state.isRunning", game.context), false);
});

test("reiniciar restaura pontuacao e faixa central", () => {
  const game = setupGame();
  game.listeners.get("startButton:click")();
  pressKey(game, "ArrowRight");
  vm.runInContext("state.score = 123; state.time = 12.3; endGame('lose')", game.context);
  game.listeners.get("restartButton:click")();
  assert.equal(game.document.getElementById("scoreValue").textContent, "0");
  assert.equal(game.document.getElementById("laneValue").textContent, "Centro");
  assert.equal(game.document.getElementById("gameOverScreen").classList.contains("hidden"), true);
});
