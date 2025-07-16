// Simple 2D Conway's Game of Life implementation

const canvas = document.getElementById('life2d-canvas');
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('play2d');
const stepBtn = document.getElementById('step2d');
const clearBtn = document.getElementById('clear2d');
const randomBtn = document.getElementById('random2d');
const sizeInput = document.getElementById('size2d');
const genSpan = document.getElementById('gen2d');
const liveSpan = document.getElementById('live2d');

let gridSize = parseInt(sizeInput.value);
let cellSize = Math.floor(canvas.width / gridSize);
let grid = createGrid(gridSize);
let nextGrid = createGrid(gridSize);
let running = false;
let generation = 0;
let speed = parseInt(document.getElementById('speed2d')?.value || 100);

// Drag-to-draw/erase support
let isDragging = false;
let drawValue = 1;

window.addEventListener('resize', () => {
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
  drawGrid();
});

canvas.addEventListener('mousedown', e => {
  isDragging = true;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);
  if (x >= 0 && y >= 0 && x < gridSize && y < gridSize) {
    drawValue = e.button === 2 ? 0 : grid[y][x] ? 0 : 1;
    grid[y][x] = drawValue;
    drawGrid();
  }
});
canvas.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);
  if (x >= 0 && y >= 0 && x < gridSize && y < gridSize) {
    grid[y][x] = drawValue;
    drawGrid();
  }
});
canvas.addEventListener('mouseup', () => { isDragging = false; });
canvas.addEventListener('mouseleave', () => { isDragging = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Paste config support
const applyBtn = document.getElementById('apply2d');
if (applyBtn) {
  applyBtn.onclick = () => {
    const txt = document.getElementById('paste2d').value.trim();
    if (!txt) return;
    let arr;
    try {
      let json = txt;
      if (!json.startsWith('[')) json = '[' + json;
      if (!json.endsWith(']')) json = json + ']';
      arr = JSON.parse(json);
      if (!Array.isArray(arr[0])) arr = [arr];
    } catch {
      alert('Invalid format. Use [x,y],[x2,y2],...');
      return;
    }
    let count = 0;
    for (const [x, y] of arr) {
      if (
        typeof x === 'number' && typeof y === 'number' &&
        x >= 0 && y >= 0 && x < gridSize && y < gridSize
      ) {
        grid[y][x] = 1;
        count++;
      }
    }
    drawGrid();
    alert(`Set ${count} cells.`);
  };
}

document.getElementById('speed2d')?.addEventListener('input', e => {
  speed = parseInt(e.target.value);
});

function createGrid(size) {
  return Array.from({length: size}, () => Array(size).fill(0));
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff99';
  let live = 0;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x]) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        live++;
      }
    }
  }
  genSpan.textContent = `Gen: ${generation}`;
  liveSpan.textContent = `Live: ${live}`;
}

function step() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if ((dx || dy) && grid[(y+dy+gridSize)%gridSize][(x+dx+gridSize)%gridSize]) n++;
      nextGrid[y][x] = (grid[y][x] && (n === 2 || n === 3)) || (!grid[y][x] && n === 3) ? 1 : 0;
    }
  }
  [grid, nextGrid] = [nextGrid, grid];
  generation++;
  drawGrid();
}

function clear() {
  grid = createGrid(gridSize);
  nextGrid = createGrid(gridSize);
  generation = 0;
  drawGrid();
}

function randomize() {
  for (let y = 0; y < gridSize; y++)
    for (let x = 0; x < gridSize; x++)
      grid[y][x] = Math.random() < 0.2 ? 1 : 0;
  generation = 0;
  drawGrid();
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);
  if (x >= 0 && y >= 0 && x < gridSize && y < gridSize) {
    grid[y][x] = grid[y][x] ? 0 : 1;
    drawGrid();
  }
});

playBtn.onclick = () => {
  running = !running;
  playBtn.textContent = running ? 'Pause' : 'Play';
  if (running) run();
};

stepBtn.onclick = () => { step(); };
clearBtn.onclick = () => { clear(); };
randomBtn.onclick = () => { randomize(); };
sizeInput.onchange = () => {
  gridSize = parseInt(sizeInput.value);
  cellSize = Math.floor(canvas.width / gridSize);
  clear();
};

function run() {
  if (!running) return;
  step();
  setTimeout(run, speed);
}

drawGrid();
