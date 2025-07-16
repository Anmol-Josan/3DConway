import { Renderer3D } from './Renderer3D.js';
import { Life3D } from './Life3D.js';
import { Controls } from './Controls.js';

// main.js
// Entry point for 3D Conway's Game of Life

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('life-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let life = new Life3D(20, 20, 20);
  let renderer = new Renderer3D(canvas, life.size);

  function getNextStateCells() {
    // Returns sets of cell keys for fate coloring
    const survive = new Set();
    const die = new Set();
    const born = new Set();
    const [sx, sy, sz] = life.size;
    for (let z = 0; z < sz; z++)
      for (let y = 0; y < sy; y++)
        for (let x = 0; x < sx; x++) {
          const idx = life.index(x, y, z);
          let neighbors = 0;
          for (const [dx, dy, dz] of life.neighborOffsets) {
            const nx = x + dx, ny = y + dy, nz = z + dz;
            if (life.inBounds(nx, ny, nz)) {
              neighbors += life.state[life.index(nx, ny, nz)];
            }
          }
          const key = `${x},${y},${z}`;
          if (life.state[idx]) {
            if (life.survive.includes(neighbors)) survive.add(key);
            else die.add(key);
          } else {
            if (life.birth.includes(neighbors)) born.add(key);
          }
        }
    return { survive, die, born };
  }

  function updateStatus() {
    document.getElementById('generation').textContent = `Gen: ${life.generation}`;
    document.getElementById('live-cells').textContent = `Live: ${life.liveCount}`;
    document.getElementById('fps').textContent = `FPS: ${renderer.fps.toFixed(1)}`;
    renderer.updateCells(controls.getLiveCells(), getNextStateCells());
  }

  async function loadPresets() {
    const select = document.getElementById('preset-select');
    select.innerHTML = '<option value="">Load Preset</option>';
    try {
      const resp = await fetch('presets/');
      if (resp.ok) {
        // This will only work if directory listing is enabled
        // Otherwise, hardcode preset names
      }
    } catch {}
    // Fallback: hardcode
    select.innerHTML += '<option value="glider3d.json">3D Glider</option>';
    select.innerHTML += '<option value="cool3dpattern.json">Cool 3D Pattern</option>';
  }

  const controls = new Controls(life, renderer, updateStatus, loadPresets);
  controls.update();
  loadPresets();

  function animate() {
    renderer.resizeRendererToDisplaySize();
    renderer.render();
    requestAnimationFrame(animate);
    updateStatus();
  }
  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.resizeRendererToDisplaySize();
  });

  // Drawing preview: show cell under mouse
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
    const cell = renderer.pickCell(mouse, renderer.camera);
    renderer.setPreviewCell(cell);
  });
  canvas.addEventListener('pointerleave', () => {
    renderer.setPreviewCell(null);
  });

  // Add drawing support: click to set cell alive, right-click or Ctrl+click to erase
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
    const cell = renderer.pickCell(mouse, renderer.camera);
    if (cell) {
      if (event.button === 2 || event.ctrlKey) {
        life.setCell(...cell, 0); // Erase cell
      } else {
        life.setCell(...cell, 1); // Set cell alive
      }
      renderer.updateCells(controls.getLiveCells());
      updateStatus();
      renderer.setPreviewCell(cell);
    }
  });
  // Prevent context menu on right-click
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Coordinate input: set cell at (x, y, z)
  document.getElementById('set-cell-btn').onclick = () => {
    const x = parseInt(document.getElementById('input-x').value);
    const y = parseInt(document.getElementById('input-y').value);
    const z = parseInt(document.getElementById('input-z').value);
    if (life.inBounds(x, y, z)) {
      life.setCell(x, y, z, 1);
      renderer.updateCells(controls.getLiveCells());
      updateStatus();
      renderer.setPreviewCell([x, y, z]);
    } else {
      alert('Coordinates out of bounds!');
    }
  };

  // Paste liveCells array support
  document.getElementById('apply-livecells-btn').onclick = () => {
    const input = document.getElementById('livecells-input').value.trim();
    if (!input) return;
    let arr;
    try {
      // Accepts: [2,2,1],[2,3,2],... or [[2,2,1],[2,3,2],...]
      let json = input;
      if (!json.startsWith('[')) json = '[' + json;
      if (!json.endsWith(']')) json = json + ']';
      arr = JSON.parse(json);
      if (!Array.isArray(arr[0])) arr = [arr]; // single cell
    } catch (e) {
      alert('Invalid format. Paste as: [2,2,1],[2,3,2],... or [[2,2,1],[2,3,2],...]');
      return;
    }
    let count = 0;
    for (const cell of arr) {
      if (Array.isArray(cell) && cell.length === 3 && life.inBounds(cell[0], cell[1], cell[2])) {
        life.setCell(cell[0], cell[1], cell[2], 1);
        count++;
      }
    }
    renderer.updateCells(controls.getLiveCells());
    updateStatus();
    alert(`Set ${count} cells.`);
  };

  // Add drag mode toggle
  let dragMode = false;
  document.getElementById('drag-mode-toggle').onclick = () => {
    dragMode = !dragMode;
    document.getElementById('drag-mode-toggle').textContent = dragMode ? 'Drag Mode: ON' : 'Drag Mode: OFF';
  };

  let selectedCell = null;
  let isDragging = false;

  // Highlight selected cell
  function highlightSelectedCell(cell) {
    renderer.setSelectedCell(cell);
  }

  // Mouse down: select or start drag
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
    const cell = renderer.pickCell(mouse, renderer.camera);
    if (cell) {
      if (event.shiftKey) {
        console.log('Cell selected:', cell);
        selectedCell = cell;
        highlightSelectedCell(cell);
        isDragging = true;
      } else if (event.button === 2 || event.ctrlKey) {
        life.setCell(...cell, 0); // Erase cell
        renderer.updateCells(controls.getLiveCells());
        updateStatus();
        renderer.setPreviewCell(cell);
        highlightSelectedCell(null); // Deselect
        selectedCell = null;
      } else {
        life.setCell(...cell, 1); // Set cell alive
        renderer.updateCells(controls.getLiveCells());
        updateStatus();
        renderer.setPreviewCell(cell);
        highlightSelectedCell(null); // Deselect
        selectedCell = null;
      }
    }
  });

  // Mouse move: drag selected cell
  canvas.addEventListener('pointermove', (event) => {
    if (isDragging && selectedCell) {
      const rect = canvas.getBoundingClientRect();
      const mouse = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
      };
      const newCell = renderer.pickCell(mouse, renderer.camera);
      if (newCell && (newCell[0] !== selectedCell[0] || newCell[1] !== selectedCell[1] || newCell[2] !== selectedCell[2])) {
        life.setCell(...selectedCell, 0); // Remove from old position
        life.setCell(...newCell, 1); // Add to new position
        selectedCell = newCell;
        highlightSelectedCell(newCell);
        renderer.updateCells(controls.getLiveCells());
        updateStatus();
      }
    }
  });

  // Mouse up: end drag
  canvas.addEventListener('pointerup', () => {
    isDragging = false;
  });

  // Keyboard arrows: move selected cell
  window.addEventListener('keydown', (event) => {
    if (selectedCell) {
      let [x, y, z] = selectedCell;
      if (event.key === 'ArrowUp') y++;
      if (event.key === 'ArrowDown') y--;
      if (event.key === 'ArrowLeft') x--;
      if (event.key === 'ArrowRight') x++;
      if (event.key === 'PageUp') z++;
      if (event.key === 'PageDown') z--;
      if (life.inBounds(x, y, z)) {
        life.setCell(...selectedCell, 0);
        life.setCell(x, y, z, 1);
        selectedCell = [x, y, z];
        highlightSelectedCell(selectedCell);
        renderer.updateCells(controls.getLiveCells());
        updateStatus();
      }
    }
  });
});
