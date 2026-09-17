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
let gameState = 'ready';
let lastStep = performance.now();
let particles = [];
let touchStart = null;

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
  return Math.max(78, 170 - score * 4);
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  speedEl.textContent = `${(170 / stepDuration()).toFixed(1)}x`;
}

function setOverlay(title, text, buttonText, visible) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.toggle('hidden', !visible);
}

function setState(state) {
  gameState = state;
  const labels = { ready: 'En attente', playing: 'En jeu', paused: 'Pause', over: 'Partie terminée' };
  statusText.textContent = labels[state];
  status.classList.toggle('playing', state === 'playing');
  pauseButton.textContent = state === 'paused' ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', state === 'paused' ? 'Reprendre la partie' : 'Mettre en pause');
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
  setOverlay('Game over.', `Score final : ${score} — ton record est de ${bestScore}.`, 'Rejouer', true);
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
  ctx.lineWidth = 15;
  ctx.strokeStyle = '#126b76';
  ctx.shadowColor = '#4de9ff';
  ctx.shadowBlur = 10;
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
    const radius = index === 0 ? 10 : Math.max(6, 9 - index * .08);
    ctx.save();
    ctx.shadowColor = index === 0 ? '#b8ff57' : '#4de9ff';
    ctx.shadowBlur = index === 0 ? 18 : 9;
    ctx.fillStyle = index === 0 ? '#b8ff57' : `hsl(${185 + index * 3}, 90%, ${58 - Math.min(index, 8) * 2}%)`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const head = points[0];
  const side = { x: -direction.y, y: direction.x };
  const eyeDistance = 5;
  const eyeForward = 3;
  const eyes = [
    { x: head.x + direction.x * eyeForward + side.x * eyeDistance, y: head.y + direction.y * eyeForward + side.y * eyeDistance },
    { x: head.x + direction.x * eyeForward - side.x * eyeDistance, y: head.y + direction.y * eyeForward - side.y * eyeDistance }
  ];

  ctx.save();
  eyes.forEach(eye => {
    ctx.fillStyle = '#07111c';
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eye.x + direction.x, eye.y + direction.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  });

  const tongueStart = {
    x: head.x + direction.x * 9,
    y: head.y + direction.y * 9
  };
  const tongueEnd = {
    x: head.x + direction.x * 15,
    y: head.y + direction.y * 15
  };
  ctx.strokeStyle = '#ff5ca8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tongueStart.x, tongueStart.y);
  ctx.lineTo(tongueEnd.x, tongueEnd.y);
  ctx.lineTo(tongueEnd.x + side.x * 3, tongueEnd.y + side.y * 3);
  ctx.moveTo(tongueEnd.x, tongueEnd.y);
  ctx.lineTo(tongueEnd.x - side.x * 3, tongueEnd.y - side.y * 3);
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  particles = particles.filter(particle => particle.life > 0);
  particles.forEach(particle => {
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.life -= .035;
  ctx.globalAlpha = Math.max(particle.life, 0);
  ctx.fillStyle = '#b8ff57';
  ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  ctx.globalAlpha = 1;
}

function drawFrame(timestamp) {
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
    setOverlay('Pause.', 'Le serpent attend ton prochain mouvement.', 'Reprendre', true);
  }
}

startButton.addEventListener('click', togglePause);
pauseButton.addEventListener('click', togglePause);
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
updateHud();
setState('ready');
requestAnimationFrame(drawFrame);
