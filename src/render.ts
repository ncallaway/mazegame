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

  // center of a cell in canvas pixels
  const cellCenter = (addr: MazeAddress) => ({
    x: mazeX + addr.col * cellSize + cellSize / 2,
    y: mazeY + addr.row * cellSize + cellSize / 2,
  });

  // goal (earth) and player (rocket)
  const goal = cellCenter(maze.end);
  drawEarth(ctx, goal.x, goal.y, cellSize);

  const player = cellCenter(state.playerPosition);
  drawRocket(ctx, player.x, player.y, cellSize);
}

// A simple planet earth: blue ocean, a few green continents, black outline.
function drawEarth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  const r = cellSize * 0.34;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  // ocean
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#2f6fd0";
  ctx.fill();

  // continents, clipped to the globe so they never spill past the edge
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#3fa34d";
  const blobs: [number, number, number][] = [
    [-r * 0.35, -r * 0.25, r * 0.5],
    [r * 0.4, r * 0.05, r * 0.42],
    [-r * 0.05, r * 0.55, r * 0.33],
  ];
  for (const [bx, by, br] of blobs) {
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // outline (drawn last so it sits on top of the continents)
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
  ctx.stroke();

  ctx.restore();
}

// A simple upright rocket: white body, red nose and fins, a window, a flame.
function drawRocket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  const halfW = cellSize * 0.13;
  const noseTop = -cellSize * 0.3;
  const bodyTop = -cellSize * 0.1;
  const bodyBottom = cellSize * 0.22;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";

  // fins (behind the body so the body overlaps them)
  ctx.fillStyle = "#d1453b";
  const finDrop = cellSize * 0.12;
  const finOut = cellSize * 0.11;
  // right fin
  ctx.beginPath();
  ctx.moveTo(halfW, bodyBottom - finDrop);
  ctx.lineTo(halfW + finOut, bodyBottom + cellSize * 0.05);
  ctx.lineTo(halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // left fin
  ctx.beginPath();
  ctx.moveTo(-halfW, bodyBottom - finDrop);
  ctx.lineTo(-halfW - finOut, bodyBottom + cellSize * 0.05);
  ctx.lineTo(-halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // flame
  ctx.fillStyle = "#f4a323";
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.6, bodyBottom);
  ctx.lineTo(0, bodyBottom + cellSize * 0.16);
  ctx.lineTo(halfW * 0.6, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // body
  ctx.fillStyle = "#f2f2f2";
  ctx.beginPath();
  ctx.rect(-halfW, bodyTop, halfW * 2, bodyBottom - bodyTop);
  ctx.fill();
  ctx.stroke();

  // nose cone
  ctx.fillStyle = "#d1453b";
  ctx.beginPath();
  ctx.moveTo(0, noseTop);
  ctx.lineTo(halfW, bodyTop);
  ctx.lineTo(-halfW, bodyTop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // window
  ctx.fillStyle = "#7ec8e3";
  ctx.beginPath();
  ctx.arc(0, bodyTop + cellSize * 0.08, cellSize * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
