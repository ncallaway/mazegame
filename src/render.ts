import { connected, MazeAddress } from "./maze";
import { MazeState } from "./state";

export function render(ctx: CanvasRenderingContext2D, state: MazeState): void {
  const maze = state.maze;
  const width = ctx.canvas.clientWidth;
  const height = ctx.canvas.clientHeight;
  // clear
  ctx.clearRect(0, 0, ctx.canvas.width, height);

  // compute cell size
  const cellWidth = Math.floor(width / maze.size.width);
  const cellHeight = Math.floor(height / maze.size.height);

  const cellSize = Math.min(cellWidth, cellHeight);

  const mazeWidth = cellSize * maze.size.width; 
  const mazeHeight = cellSize * maze.size.height; 

  const mazeX = (width - mazeWidth) / 2;
  const mazeY = (height - mazeHeight) / 2;

  for (let row = 0; row < maze.size.height; row++) {
    for (let col = 0; col < maze.size.width; col++) {
      ctx.fillStyle = (row + col) % 2 == 0 ? "blue" : "green";
      const cellX = mazeX + (col * cellSize);
      const cellY = mazeY + (row * cellSize);
      // ctx.fillRect(cellX, cellY, cellSize, cellSize);

      const cell: MazeAddress = { row, col };
      const left: MazeAddress = { row, col: col - 1 };
      const right: MazeAddress = { row, col: col + 1 };
      const top: MazeAddress = { row: row - 1, col };
      const bottom: MazeAddress = { row: row + 1, col };

      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
      ctx.beginPath();

      if (!connected(cell, left, maze)) {
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(cellX, cellY + cellSize);
      }
      if (!connected(cell, right, maze)) {
        ctx.moveTo(cellX + cellSize, cellY);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
      }
      if (!connected(cell, top, maze)) {
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(cellX + cellSize, cellY);
      }
      if (!connected(cell, bottom, maze)) {
        ctx.moveTo(cellX, cellY + cellSize);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
      }

      ctx.stroke();
    }
  }

  // 3. for each cell, for each of its 4 sides: draw a wall line
  //    UNLESS there's an edge through that side (cellsConnected)
  // 4. draw start (state.maze.start) and end markers
  // 5. draw player at (player.x * cellSize, player.y * cellSize)
}
