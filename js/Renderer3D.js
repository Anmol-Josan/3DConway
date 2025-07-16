import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js?module';
import { OrbitControls } from 'https://unpkg.com/three@0.155.0/examples/jsm/controls/OrbitControls.js?module';

// Renderer3D.js
// Three.js scene and rendering for 3D Life

class Renderer3D {
  constructor(canvas, gridSize) {
    this.canvas = canvas;
    this.gridSize = gridSize;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(gridSize[0]*1.5, gridSize[1]*1.5, gridSize[2]*2.5);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(0x181c20);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    // Add a grid helper for orientation
    this.gridHelper = new THREE.GridHelper(Math.max(...gridSize) + 2, Math.max(...gridSize) + 2, 0x8888ff, 0x444488);
    this.gridHelper.position.set(gridSize[0]/2, -0.5, gridSize[2]/2);
    this.scene.add(this.gridHelper);
    // Add axes helper
    this.axesHelper = new THREE.AxesHelper(Math.max(...gridSize) / 2);
    this.scene.add(this.axesHelper);
    // Use OrbitControls from THREE namespace
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(gridSize[0]/2, gridSize[1]/2, gridSize[2]/2);
    this.controls.update();
    this._setupLights();
    this._setupInstancedMesh(gridSize);
    this.lastRenderTime = performance.now();
    this.fps = 0;
  }

  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(1, 2, 3);
    this.scene.add(dir);
  }

  _setupInstancedMesh(gridSize) {
    const [sx, sy, sz] = gridSize;
    const maxInstances = sx * sy * sz;
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x44aaff,
      metalness: 0.2,
      roughness: 0.35,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      transmission: 0.1,
      thickness: 0.2,
      reflectivity: 0.4,
      ior: 1.2,
      opacity: 0.95,
      transparent: true
    });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.scene.add(this.instancedMesh);
  }

  resize(gridSize) {
    this.gridSize = gridSize;
    this.scene.remove(this.instancedMesh);
    this._setupInstancedMesh(gridSize);
    this.controls.target.set(gridSize[0]/2, gridSize[1]/2, gridSize[2]/2);
    this.controls.update();
  }

  updateCells(liveCells, nextStateCells = null) {
    const mesh = this.instancedMesh;
    let i = 0;
    const dummy = new THREE.Object3D();
    for (const [x, y, z] of liveCells) {
      dummy.position.set(x, y, z);
      // Color logic: nextStateCells provided, color by fate
      let color = 0x44aaff; // default
      if (nextStateCells) {
        const key = `${x},${y},${z}`;
        if (nextStateCells.survive.has(key)) color = 0x00ff00; // green
        else if (nextStateCells.die.has(key)) color = 0xff0000; // red
        else if (nextStateCells.born.has(key)) color = 0x0000ff; // blue
      }
      mesh.setColorAt(i, new THREE.Color(color));
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  pickCell(mouse, camera) {
    // mouse: normalized device coords {x: -1..1, y: -1..1}
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    // Intersect with the instanced mesh bounding box
    const [sx, sy, sz] = this.gridSize;
    const box = new THREE.Box3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(sx, sy, sz)
    );
    const intersection = raycaster.ray.intersectBox(box, new THREE.Vector3());
    if (intersection) {
      // Snap to nearest integer grid coordinate
      const x = Math.floor(intersection.x);
      const y = Math.floor(intersection.y);
      const z = Math.floor(intersection.z);
      if (
        x >= 0 && x < sx &&
        y >= 0 && y < sy &&
        z >= 0 && z < sz
      ) {
        return [x, y, z];
      }
    }
    return null;
  }

  setPreviewCell(cell) {
    if (!this.previewMesh) {
      const geometry = new THREE.BoxGeometry(0.97, 0.97, 0.97);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00, opacity: 0.5, transparent: true });
      this.previewMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.previewMesh);
    }
    if (cell) {
      this.previewMesh.visible = true;
      this.previewMesh.position.set(...cell);
    } else {
      this.previewMesh.visible = false;
    }
  }

  setSelectedCell(cell) {
    if (!this.selectedMesh) {
      const geometry = new THREE.BoxGeometry(1.05, 1.05, 1.05);
      const material = new THREE.MeshBasicMaterial({ color: 0xff00ff, opacity: 0.7, transparent: true });
      this.selectedMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.selectedMesh);
    }
    if (cell) {
      this.selectedMesh.visible = true;
      this.selectedMesh.position.set(...cell);
    } else {
      this.selectedMesh.visible = false;
    }
  }

  render() {
    this.controls.update();
    // Fix disappearing cells: clamp camera position and prevent flipping
    const maxDist = Math.max(...this.gridSize) * 10;
    const minY = 0.1;
    if (this.camera.position.length() > maxDist) {
      this.camera.position.setLength(maxDist);
    }
    if (this.camera.up.y < minY) {
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.gridSize[0]/2, this.gridSize[1]/2, this.gridSize[2]/2);
    }
    this.renderer.render(this.scene, this.camera);
    const now = performance.now();
    this.fps = 1000 / (now - this.lastRenderTime);
    this.lastRenderTime = now;
  }

  resizeRendererToDisplaySize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }
}

export { Renderer3D };
window.Renderer3D = Renderer3D;