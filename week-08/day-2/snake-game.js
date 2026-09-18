const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const speedEl = document.getElementById('speed');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const statusText = document.getElementById('status-text');
const status = document.querySelector('.status');
const speedButtons = document.querySelectorAll('.speed-button');

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const boardSize = canvas.width;
const storageKey = 'snakeBestScore';

let snake;
let previousSnake;
let direction;
let nextDirection;
let food;
let score;
let bestScore = Number(localStorage.getItem(storageKey)) || 0;
let speedMultiplier = 1;
let gameState = 'ready';
let lastStep = performance.now();
let particles = [];
let touchStart = null;
let readyStartedAt = 0;
let readyCountdown = 3;

function resetSnake() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  previousSnake = snake.map(segment => ({ ...segment }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
}

function randomFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function stepDuration() {
  const baseDuration = Math.max(80, 170 - score * 4);
  const acceleration = 1 + score * 0.08;
  return Math.max(38, baseDuration / (speedMultiplier * acceleration));
}

function formatSpeed(value) {
  return Number.isInteger(value) ? `${value}x` : `${value.toFixed(1)}x`;
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  speedEl.textContent = formatSpeed(speedMultiplier);
}

function setOverlay(title, text, buttonText, visible) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.toggle('hidden', !visible);
}

function resetReadyCountdown() {
  readyCountdown = 3;
  readyStartedAt = performance.now();
  setOverlay('Choose your speed.', `The game starts in ${readyCountdown}s.`, 'Start now', true);
}

function updateReadyCountdown() {
  if (gameState !== 'ready' || readyCountdown <= 0) return;

  const elapsed = (performance.now() - readyStartedAt) / 1000;
  const remaining = Math.max(0, 3 - elapsed);
  const remainingText = remaining <= 0 ? 'Starting now...' : `The game starts in ${Math.ceil(remaining)}s.`;
  overlayText.textContent = `${remainingText} Current speed: ${formatSpeed(speedMultiplier)}.`;

  if (remaining <= 0) {
    readyCountdown = 0;
    startGame();
  }
}

function setState(state) {
  gameState = state;
  const labels = { ready: 'Waiting', playing: 'Playing', paused: 'Paused', over: 'Game over' };
  statusText.textContent = labels[state];
  status.classList.toggle('playing', state === 'playing');
  pauseButton.textContent = state === 'paused' ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', state === 'paused' ? 'Resume the game' : 'Pause the game');
}

function startGame() {
  resetSnake();
  randomFood();
  score = 0;
  particles = [];
  updateHud();
  setState('playing');
  setOverlay('', '', '', false);
  lastStep = performance.now();
}

function endGame() {
  setState('over');
  setOverlay('Game over.', `Final score: ${score} — your best is ${bestScore}.`, 'Play again', true);
}

function addParticles(x, y) {
  for (let index = 0; index < 12; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const force = 0.7 + Math.random() * 1.8;
    particles.push({
      x: x * gridSize + gridSize / 2,
  y: y * gridSize + gridSize / 2,
  vx: Math.cos(angle) * force,
  vy: Math.sin(angle) * force,
      life: 1,
      size: 2 + Math.random() * 3
    });
  }
}

function update() {
  previousSnake = snake.map(segment => ({ ...segment }));
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
  const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(storageKey, bestScore);
  }
  addParticles(food.x, food.y);
  randomFood();
    updateHud();
  } else {
    snake.pop();
  }
}

function drawBoard() {
  const gradient = ctx.createLinearGradient(0, 0, boardSize, boardSize);
  gradient.addColorStop(0, '#101b35');
  gradient.addColorStop(1, '#070b18');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, boardSize, boardSize);

  ctx.strokeStyle = 'rgba(104, 145, 210, .11)';
  ctx.lineWidth = 1;
  for (let index = 0; index <= tileCount; index += 1) {
    const position = index * gridSize + .5;
    ctx.beginPath();
  ctx.moveTo(position, 0);
  ctx.lineTo(position, boardSize);
  ctx.moveTo(0, position);
    ctx.lineTo(boardSize, position);
    ctx.stroke();
  }
}

function drawFood(timestamp) {
  const pulse = 1 + Math.sin(timestamp / 180) * .12;
  const center = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;
  ctx.save();
  ctx.shadowColor = '#ff5ca8';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ff5ca8';
  ctx.beginPath();
  ctx.arc(center, centerY, 6 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff4fa';
  ctx.beginPath();
  ctx.arc(center - 2, centerY - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnake(progress) {
  const points = snake.map((segment, index) => {
    const previous = previousSnake[index] || segment;
    return {
      x: (previous.x + (segment.x - previous.x) * progress) * gridSize + gridSize / 2,
      y: (previous.y + (segment.y - previous.y) * progress) * gridSize + gridSize / 2
    };
  });

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#2a090d';
  ctx.shadowColor = '#ff3d3d';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ff4d4d';
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();

  snake.forEach((segment, index) => {
    const previous = previousSnake[index] || segment;
    const x = (previous.x + (segment.x - previous.x) * progress) * gridSize + gridSize / 2;
    const y = (previous.y + (segment.y - previous.y) * progress) * gridSize + gridSize / 2;
    const size = index === 0 ? 12 : 8.5 - index * 0.06;
    const angle = index === 0 ? Math.atan2(direction.y, direction.x) : Math.atan2(
      (segment.y - (previousSnake[index + 1]?.y ?? segment.y)) || 0,
      (segment.x - (previousSnake[index + 1]?.x ?? segment.x)) || 0
    );

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = index === 0 ? '#ffc1c1' : '#ff6b6b';
    ctx.shadowBlur = index === 0 ? 18 : 10;
    ctx.fillStyle = index === 0 ? '#ff7a7a' : '#3f0a12';
    ctx.beginPath();
    ctx.moveTo(size * 0.9, 0);
    ctx.lineTo(size * 0.35, size * 0.8);
    ctx.lineTo(-size * 0.7, size * 0.55);
    ctx.lineTo(-size * 0.95, 0);
    ctx.lineTo(-size * 0.7, -size * 0.55);
    ctx.lineTo(size * 0.35, -size * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  const head = points[0];
  const angle = Math.atan2(direction.y, direction.x);

  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(angle);
  ctx.shadowColor = '#ffb3b3';
  ctx.shadowBlur = 20;

  ctx.fillStyle = '#ff5656';
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(18, 5.5);
  ctx.lineTo(10.5, 8.5);
  ctx.lineTo(2, 7);
  ctx.lineTo(-9, 0);
  ctx.lineTo(2, -7);
  ctx.lineTo(10.5, -8.5);
  ctx.lineTo(18, -5.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#34070a';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(24, 4.5);
  ctx.lineTo(24, -4.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1a0204';
  ctx.beginPath();
  ctx.moveTo(-3, -7.5);
  ctx.lineTo(4, -10.5);
  ctx.lineTo(2, -3.5);
  ctx.closePath();
  ctx.moveTo(-3, 7.5);
  ctx.lineTo(4, 10.5);
  ctx.lineTo(2, 3.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffebeb';
  ctx.fillRect(2, -4.5, 9, 2.2);
  ctx.fillRect(2, 2.3, 9, 2.2);

  ctx.fillStyle = '#ff1a1a';
  ctx.fillRect(8, -4.2, 4.5, 1.2);
  ctx.fillRect(8, 3, 4.5, 1.2);
  ctx.restore();
}

function drawParticles() {
  particles = particles.filter(particle => particle.life > 0);
  particles.forEach(particle => {
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.life -= .035;
  ctx.globalAlpha = Math.max(particle.life, 0);
  ctx.fillStyle = particle.life > 0.5 ? '#ff8c8c' : '#7a0f16';
  ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  ctx.globalAlpha = 1;
}

function drawFrame(timestamp) {
  if (gameState === 'ready') {
    updateReadyCountdown();
  }

  if (gameState === 'playing' && timestamp - lastStep >= stepDuration()) {
    update();
    lastStep = timestamp;
  }
  const progress = gameState === 'playing' ? Math.min((timestamp - lastStep) / stepDuration(), 1) : 1;
  drawBoard();
  drawFood(timestamp);
  drawSnake(progress);
  drawParticles();
  requestAnimationFrame(drawFrame);
}

function setSpeedMultiplier(multiplicator) {
  speedMultiplier = multiplicator;
  speedButtons.forEach(button => {
    const isActive = Number(button.dataset.speed) === multiplicator;
    button.classList.toggle('active', isActive);
  });
  updateHud();
  if (gameState === 'ready') {
    resetReadyCountdown();
  }
}

function changeDirection(newDirection) {
  if (newDirection.x === -direction.x && newDirection.y === -direction.y) return;
  nextDirection = newDirection;
  if (gameState === 'ready') startGame();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const directions = {
  arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
  arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 }
  };
  if (directions[key]) {
    event.preventDefault();
    changeDirection(directions[key]);
  }
  if (key === ' ' || key === 'p') {
    event.preventDefault();
    togglePause();
  }
  if (key === 'enter' && gameState !== 'playing') startGame();
}

function togglePause() {
  if (gameState === 'ready' || gameState === 'over') return startGame();
  if (gameState === 'paused') {
  setState('playing');
  setOverlay('', '', '', false);
  lastStep = performance.now();
  } else {
    setState('paused');
    setOverlay('Paused.', 'The serpent is waiting for your next move.', 'Resume', true);
  }
}

startButton.addEventListener('click', () => {
  if (gameState === 'ready' || gameState === 'over') {
    startGame();
  } else {
    togglePause();
  }
});
pauseButton.addEventListener('click', togglePause);
speedButtons.forEach(button => {
  button.addEventListener('click', () => setSpeedMultiplier(Number(button.dataset.speed)));
});
document.addEventListener('keydown', handleKeydown);
canvas.addEventListener('touchstart', event => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
canvas.addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 20) return;
  changeDirection(Math.abs(deltaX) > Math.abs(deltaY)
    ? { x: Math.sign(deltaX), y: 0 }
    : { x: 0, y: Math.sign(deltaY) });
}, { passive: true });

resetSnake();
randomFood();
score = 0;
setSpeedMultiplier(1);
updateHud();
setState('ready');
resetReadyCountdown();
requestAnimationFrame(drawFrame);
