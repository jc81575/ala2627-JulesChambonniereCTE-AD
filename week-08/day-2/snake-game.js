const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
];

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 15, y: 10 };
let score = 0;
let bestScore = Number(localStorage.getItem('snakeBestScore')) || 0;
let previousSnake = snake.map(segment => ({ ...segment }));
let lastUpdateTime = performance.now();

bestScoreEl.textContent = bestScore;

function randomFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };

  for (let segment of snake) {
    if (segment.x === food.x && segment.y === food.y) {
      randomFood();
      return;
    }
  }
}

function update() {
  previousSnake = snake.map(segment => ({ ...segment }));
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= tileCount ||
    head.y >= tileCount ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    alert('Game Over!');
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    previousSnake = snake.map(segment => ({ ...segment }));
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = score;
    randomFood();
    lastUpdateTime = performance.now();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = score;

    if (score > bestScore) {
      bestScore = score;
      bestScoreEl.textContent = bestScore;
      localStorage.setItem('snakeBestScore', bestScore);
    }

    randomFood();
  } else {
    snake.pop();
  }
}

function drawBoard() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < tileCount; x++) {
    for (let y = 0; y < tileCount; y++) {
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
}

function drawSnake(progress) {
  snake.forEach((segment, index) => {
    const previousSegment = previousSnake[index] || segment;
    const x = previousSegment.x + (segment.x - previousSegment.x) * progress;
    const y = previousSegment.y + (segment.y - previousSegment.y) * progress;

    ctx.fillStyle = index === 0 ? '#22c55e' : '#16a34a';
    ctx.fillRect(
      x * gridSize + 1,
      y * gridSize + 1,
      gridSize - 2,
      gridSize - 2
    );
  });
}

function drawFrame(timestamp) {
  const progress = Math.min((timestamp - lastUpdateTime) / 180, 1);

  drawBoard();
  drawFood();
  drawSnake(progress);
  requestAnimationFrame(drawFrame);
}

function drawFood() {
  ctx.fillStyle = '#f97316';
  ctx.fillRect(
    food.x * gridSize + 2,
    food.y * gridSize + 2,
    gridSize - 4,
    gridSize - 4
  );
}

function changeDirection(event) {
  const key = event.key;

  if (key === 'ArrowUp' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  if (key === 'ArrowDown' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  if (key === 'ArrowLeft' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  if (key === 'ArrowRight' && direction.x !== -1) nextDirection = { x: 1, y: 0 };

  if (key === 'w' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  if (key === 's' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  if (key === 'a' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  if (key === 'd' && direction.x !== -1) nextDirection = { x: 1, y: 0 };
}

document.addEventListener('keydown', changeDirection);

randomFood();
setInterval(() => {
  update();
  lastUpdateTime = performance.now();
}, 180);
requestAnimationFrame(drawFrame);
