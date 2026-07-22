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

  const cellPosition = (addr: MazeAddress, x: number, y: number) => ({
    x: mazeX + addr.col * cellSize + (cellSize * Math.max(Math.min(x, 1), 0)),
    y: mazeY + addr.row * cellSize + (cellSize * Math.max(Math.min(y, 1), 0)),
  });

  // center of a cell in canvas pixels
  const cellCenter = (addr: MazeAddress) => cellPosition(addr, 0.5, 0.5);

  // goal (earth) and player (rocket)
  const goal = cellCenter(maze.end);
  drawEarth(ctx, goal.x, goal.y, cellSize);

  const player = cellPosition(state.playerPosition, state.physicalPosition.x, state.physicalPosition.y);

  // path breadcrumbs, drawn under the markers. Dots sit at fixed positions
  // anchored to cell centers; those the ship has already passed are culled.
  if (state.path && state.path.length > 1) {
    drawPath(ctx, state.path.map(cellCenter), player, cellSize);
  }

  drawRocket(ctx, player.x, player.y, cellSize, state.playerOrientation);

  if (state.targetPosition) {
    const target = cellCenter(state.targetPosition);
    drawTarget(ctx, target.x, target.y, cellSize);
  }
}

// Small dots at fixed positions along the path (4 per cell), none landing on a
// cell center so they don't collide with the rocket or target markers. The dots
// stay put in the world as the ship moves; dots the ship has passed are culled,
// so spacing never changes — we just draw fewer of them near the ship.
function drawPath(
  ctx: CanvasRenderingContext2D,
  centers: { x: number; y: number }[],
  ship: { x: number; y: number },
  cellSize: number,
): void {
  if (centers.length < 2) { return; }
  const dotR = cellSize * 0.035;
  const offsets = [0.125, 0.375, 0.625, 0.875];

  // How far the ship has advanced along the first segment, in segment units
  // (0 = current cell center, 1 = next cell center). Dots up to this point,
  // plus a small gap so none sits under the ship, are treated as passed.
  const seg0x = centers[1].x - centers[0].x;
  const seg0y = centers[1].y - centers[0].y;
  const seg0LenSq = seg0x * seg0x + seg0y * seg0y;
  const shipArc = seg0LenSq > 0
    ? ((ship.x - centers[0].x) * seg0x + (ship.y - centers[0].y) * seg0y) / seg0LenSq
    : 0;
  const minArc = shipArc + 0.1;

  ctx.save();
  ctx.fillStyle = "#ffffff77";
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1];
    const b = centers[i];
    for (const t of offsets) {
      // Arc position along the whole path (segments are unit length).
      if ((i - 1) + t < minArc) { continue; }
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Earth photo with a baked-in alpha channel (black keyed to transparent). Loaded
// once; browser decodes async, so we guard on `complete` before drawing.
const earthImage = new Image();
earthImage.src = "assets/images/earth_final.png";
const EARTH_SCALE = 0.85; // sprite width as a fraction of a cell (tune to taste)

// Draw the Earth marker: the photo if it's ready, else the vector globe below.
function drawEarth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  if (earthImage.complete && earthImage.naturalWidth > 0) {
    const w = cellSize * EARTH_SCALE;
    const h = w * (earthImage.naturalHeight / earthImage.naturalWidth);
    ctx.drawImage(earthImage, cx - w / 2, cy - h / 2, w, h);
    return;
  }
  drawEarthVector(ctx, cx, cy, cellSize);
}

// A simple planet earth: blue ocean, a few green continents, black outline.
function drawEarthVector(
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

// A simple rocket: white body, red nose and fins, a window, a flame.
// The sprite is modeled nose-up (toward -y); `orientation` (radians, atan2
// convention with +x right and +y down) rotates it to face its heading.
function drawRocket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  orientation: number,
): void {
  const s = cellSize * (2 / 3); // rocket is 1/3 smaller than a cell-scaled sprite
  const halfW = s * 0.13;
  const noseTop = -s * 0.3;
  const bodyTop = -s * 0.1;
  const bodyBottom = s * 0.22;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(orientation + Math.PI / 2); // nose-up sprite (-y) → heading
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";

  // fins (behind the body so the body overlaps them)
  ctx.fillStyle = "#d1453b";
  const finDrop = s * 0.12;
  const finOut = s * 0.11;
  // right fin
  ctx.beginPath();
  ctx.moveTo(halfW, bodyBottom - finDrop);
  ctx.lineTo(halfW + finOut, bodyBottom + s * 0.05);
  ctx.lineTo(halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // left fin
  ctx.beginPath();
  ctx.moveTo(-halfW, bodyBottom - finDrop);
  ctx.lineTo(-halfW - finOut, bodyBottom + s * 0.05);
  ctx.lineTo(-halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // flame
  ctx.fillStyle = "#f4a323";
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.6, bodyBottom);
  ctx.lineTo(0, bodyBottom + s * 0.16);
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
  ctx.arc(0, bodyTop + s * 0.08, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}


function drawTarget(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  const boxSize = cellSize * 0.13;
  const outlineSize = cellSize * 0.2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#ffffffbb";
  ctx.fillStyle = "#ffffff99";

  ctx.beginPath();
  ctx.rect(-boxSize*0.5, -boxSize * 0.5, boxSize, boxSize);
  ctx.fill();

  ctx.beginPath();
  ctx.rect(-outlineSize*0.5, -outlineSize * 0.5, outlineSize, outlineSize);
  ctx.stroke();

  ctx.restore();
}


