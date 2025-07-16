// Life3D.js
// 3D Conway's Game of Life engine

export class Life3D {
  constructor(x, y, z) {
    this.size = [x, y, z];
    this.state = new Uint8Array(x * y * z);
    this.nextState = new Uint8Array(x * y * z);
    this.generation = 0;
    this.liveCount = 0;
    this.neighborOffsets = this._computeNeighborOffsets();
    this.birth = [6]; // B6/S5,6: 3D Conway's Game of Life
    this.survive = [5,6];
  }

  _computeNeighborOffsets() {
    const offsets = [];
    for (let dz = -1; dz <= 1; dz++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx !== 0 || dy !== 0 || dz !== 0)
            offsets.push([dx, dy, dz]);
    return offsets;
  }

  index(x, y, z) {
    const [sx, sy, sz] = this.size;
    return x + y * sx + z * sx * sy;
  }

  inBounds(x, y, z) {
    const [sx, sy, sz] = this.size;
    return x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;
  }

  randomize(density=0.2) {
    const [sx, sy, sz] = this.size;
    let count = 0;
    for (let i = 0; i < sx*sy*sz; i++) {
      this.state[i] = Math.random() < density ? 1 : 0;
      if (this.state[i]) count++;
    }
    this.generation = 0;
    this.liveCount = count;
  }

  clear() {
    this.state.fill(0);
    this.generation = 0;
    this.liveCount = 0;
  }

  setCell(x, y, z, val) {
    if (this.inBounds(x, y, z)) {
      this.state[this.index(x, y, z)] = val ? 1 : 0;
    }
  }

  getCell(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.state[this.index(x, y, z)];
    }
    return 0;
  }

  step() {
    const [sx, sy, sz] = this.size;
    this.nextState.fill(0); // Clear nextState before computing next gen
    let liveCount = 0;
    for (let z = 0; z < sz; z++) {
      for (let y = 0; y < sy; y++) {
        for (let x = 0; x < sx; x++) {
          const idx = this.index(x, y, z);
          let neighbors = 0;
          for (const [dx, dy, dz] of this.neighborOffsets) {
            const nx = x + dx, ny = y + dy, nz = z + dz;
            if (this.inBounds(nx, ny, nz)) {
              neighbors += this.state[this.index(nx, ny, nz)];
            }
          }
          if (this.state[idx]) {
            this.nextState[idx] = this.survive.includes(neighbors) ? 1 : 0;
          } else {
            this.nextState[idx] = this.birth.includes(neighbors) ? 1 : 0;
          }
          if (this.nextState[idx]) liveCount++;
        }
      }
    }
    [this.state, this.nextState] = [this.nextState, this.state];
    this.generation++;
    this.liveCount = liveCount;
  }

  toJSON() {
    const [sx, sy, sz] = this.size;
    const liveCells = [];
    for (let z = 0; z < sz; z++)
      for (let y = 0; y < sy; y++)
        for (let x = 0; x < sx; x++)
          if (this.getCell(x, y, z))
            liveCells.push([x, y, z]);
    return {
      size: [sx, sy, sz],
      liveCells,
      rules: { birth: this.birth, survive: this.survive }
    };
  }

  fromJSON(obj) {
    const [sx, sy, sz] = obj.size;
    this.size = [sx, sy, sz];
    this.state = new Uint8Array(sx * sy * sz);
    this.nextState = new Uint8Array(sx * sy * sz);
    this.clear();
    for (const [x, y, z] of obj.liveCells) {
      this.setCell(x, y, z, 1);
    }
    if (obj.rules) {
      this.birth = obj.rules.birth;
      this.survive = obj.rules.survive;
    }
  }
}
