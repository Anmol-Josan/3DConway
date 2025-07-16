// Controls.js
// UI event bindings for 3D Life

class Controls {
  constructor(life, renderer, updateStatus, loadPresets) {
    this.life = life;
    this.renderer = renderer;
    this.updateStatus = updateStatus;
    this.loadPresets = loadPresets;
    this.isPlaying = false;
    this.speed = 1;
    this.interval = null;
    this._bindUI();
  }

  _bindUI() {
    const playPauseBtn = document.getElementById('play-pause');
    const stepBtn = document.getElementById('step');
    const speedSlider = document.getElementById('speed');
    const gridX = document.getElementById('grid-x');
    const gridY = document.getElementById('grid-y');
    const gridZ = document.getElementById('grid-z');
    const randomizeBtn = document.getElementById('randomize');
    const clearBtn = document.getElementById('clear');
    const presetSelect = document.getElementById('preset-select');
    const saveBtn = document.getElementById('save');
    const loadBtn = document.getElementById('load-btn');
    const loadInput = document.getElementById('load');

    playPauseBtn.onclick = () => this.togglePlay();
    stepBtn.onclick = () => this.step();
    speedSlider.oninput = e => this.setSpeed(parseFloat(e.target.value));
    randomizeBtn.onclick = () => { this.life.randomize(); this.update(); };
    clearBtn.onclick = () => { this.life.clear(); this.update(); };
    saveBtn.onclick = () => this.save();
    loadBtn.onclick = () => loadInput.click();
    loadInput.onchange = e => this.load(e.target.files[0]);
    presetSelect.onchange = () => this.loadPreset(presetSelect.value);
    [gridX, gridY, gridZ].forEach(input => {
      input.onchange = () => this.resizeGrid();
    });
  }

  setSpeed(val) {
    this.speed = val;
    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    document.getElementById('play-pause').textContent = 'Pause';
    this.interval = setInterval(() => this.step(), 1000 / this.speed);
  }

  stop() {
    this.isPlaying = false;
    document.getElementById('play-pause').textContent = 'Play';
    clearInterval(this.interval);
  }

  togglePlay() {
    this.isPlaying ? this.stop() : this.play();
  }

  step() {
    this.life.step();
    this.update();
  }

  update() {
    this.renderer.updateCells(this.getLiveCells());
    this.updateStatus();
  }

  getLiveCells() {
    const [sx, sy, sz] = this.life.size;
    const cells = [];
    for (let z = 0; z < sz; z++)
      for (let y = 0; y < sy; y++)
        for (let x = 0; x < sx; x++)
          if (this.life.getCell(x, y, z))
            cells.push([x, y, z]);
    return cells;
  }

  resizeGrid() {
    const x = parseInt(document.getElementById('grid-x').value);
    const y = parseInt(document.getElementById('grid-y').value);
    const z = parseInt(document.getElementById('grid-z').value);
    this.life.fromJSON({ size: [x, y, z], liveCells: [] });
    this.renderer.resize([x, y, z]);
    this.update();
  }

  save() {
    const data = JSON.stringify(this.life.toJSON(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3dlife.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  load(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const obj = JSON.parse(e.target.result);
        this.life.fromJSON(obj);
        this.renderer.resize(obj.size);
        this.update();
      } catch (err) {
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  }

  async loadPreset(name) {
    if (!name) return;
    const resp = await fetch(`presets/${name}`);
    const obj = await resp.json();
    this.life.fromJSON(obj);
    this.renderer.resize(obj.size);
    this.update();
  }
}

export { Controls };
window.Controls = Controls;
