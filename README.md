# 3D Conway's Game of Life

A 3D cellular automaton based on Conway's Game of Life, visualized in 3D.

## Rules (3D Conway's Game of Life)

- The universe is a 3D grid of cells, each either alive or dead.
- Each cell has 26 neighbors (all adjacent cells in 3D).
- **Birth (B6):** A dead cell becomes alive if it has exactly 6 live neighbors.
- **Survival (S5,6):** A live cell remains alive if it has 5 or 6 live neighbors.
- All other cells die or remain dead.

## Usage

- Open the project in a browser (see below for running instructions).
- Use the controls to randomize, clear, or step the simulation.
- Presets can be loaded from the `presets/` folder.

### Drawing and Editing Patterns

- **Draw cells:** Hover over the grid to see a yellow preview of the cell that will be placed. Click to set a cell alive at that position.
- **Preview:** The preview cube shows exactly where your next cell will be placed before you click.
- **Select and move cells:** Shift+Click a cell to select it, then drag with the mouse or use arrow/PageUp/PageDown keys to move it in 3D. The selected cell is highlighted in magenta.
- **Drag Mode:** Use the Drag Mode toggle button to enable or disable cell movement features.
- **Presets:** Load interesting patterns like the Cool 3D Pattern or 3D Glider from the dropdown. You can also paste arrays of cell coordinates or edit JSON files in the `presets/` folder to create or share patterns.
- **Save/Load:** Draw your own patterns and save them with the Save button, or load patterns from a file.

#### Example: Making a 3D Glider

1. Open the app and clear the grid.
2. Use the drawing feature to place live cells at the coordinates specified in `presets/glider3d.json` (open the file in a text editor to see the list).
3. Alternatively, load the preset from the dropdown.
4. You can create your own patterns by drawing and then saving them with the Save button.

## Running Locally

1. Install dependencies (if any):

   ```sh
   npm install
   ```

2. Start the local server:

   ```sh
   npx http-server . -p 8080
   ```

3. Open [http://localhost:8080](http://localhost:8080) in your browser.

## File Structure

- `js/Life3D.js`: Core 3D Game of Life logic.
- `js/Renderer3D.js`: 3D visualization using Three.js.
- `js/Controls.js`: UI controls.
- `presets/`: Example 3D patterns.

## Custom Rules

You can edit the rules in `Life3D.js` by changing the `birth` and `survive` arrays in the constructor.

## License

MIT