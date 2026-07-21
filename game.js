// src/input.ts
var action = {
  discrete: { x: undefined, y: undefined },
  analog: { dx: undefined, dy: undefined }
};
var resetAction = () => {
  action.discrete.x = undefined;
  action.discrete.y = undefined;
  action.analog.dx = undefined;
  action.analog.dy = undefined;
};
var initializeKeyboard = () => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      action.discrete.x = -1;
    }
    if (e.key === "ArrowRight") {
      action.discrete.x = 1;
    }
    if (e.key === "ArrowUp") {
      action.discrete.y = -1;
    }
    if (e.key === "ArrowDown") {
      action.discrete.y = 1;
    }
  });
};
var getAction = () => {
  const result = {
    discrete: { ...action.discrete },
    analog: { ...action.analog }
  };
  resetAction();
  return result;
};

// src/diagnostic.ts
var EMPTY = "·";
var VISITED = "o";
var FILLER = " ";
var H_LINK = "─";
var V_LINK = "│";
var START = "S";
var HEAD = "@";
var BODY = "●";
var END = "E";
var parseCell = (key) => {
  const [row, col] = key.split("x").map(Number);
  return { row, col };
};
var parseEdge = (edge) => {
  const [a, b] = edge.split("|");
  return [parseCell(a), parseCell(b)];
};
var makeCanvas = (size) => {
  const rows = Math.max(size.height * 2 - 1, 0);
  const cols = Math.max(size.width * 2 - 1, 0);
  const canvas = [];
  for (let r = 0;r < rows; r++) {
    const line = [];
    for (let c = 0;c < cols; c++) {
      if (r % 2 === 0 && c % 2 === 0) {
        line.push(EMPTY);
      } else {
        line.push(FILLER);
      }
    }
    canvas.push(line);
  }
  return canvas;
};
var drawLink = (canvas, a, b) => {
  if (a.row === b.row) {
    canvas[a.row * 2][a.col + b.col] = H_LINK;
  } else if (a.col === b.col) {
    canvas[a.row + b.row][a.col * 2] = V_LINK;
  }
};
var setCell = (canvas, cell, glyph) => {
  canvas[cell.row * 2][cell.col * 2] = glyph;
};
var renderMaze = (size, view) => {
  const canvas = makeCanvas(size);
  if (view.visited) {
    for (const cell of view.visited) {
      setCell(canvas, cell, VISITED);
    }
  }
  if (view.edges) {
    for (const edge of view.edges) {
      const [a, b] = parseEdge(edge);
      drawLink(canvas, a, b);
    }
  }
  if (view.path) {
    const path = view.path;
    for (let i = 1;i < path.length; i++) {
      drawLink(canvas, path[i - 1], path[i]);
    }
    path.forEach((cell, i) => {
      const isStart = i === 0;
      const isHead = i === path.length - 1;
      let marker = BODY;
      if (isStart) {
        marker = START;
      }
      if (isHead && !isStart) {
        marker = HEAD;
      }
      setCell(canvas, cell, marker);
    });
  }
  if (view.start) {
    setCell(canvas, view.start, START);
  }
  if (view.end) {
    setCell(canvas, view.end, END);
  }
  return canvas.map((line) => line.join("")).join(`
`);
};
var logMaze = (size, view, label) => {
  if (label) {
    console.log(label);
  }
  console.log(renderMaze(size, view));
  console.log("");
};
var logPath = (size, path, label) => {
  logMaze(size, { path }, label);
};
var allCells = (size) => {
  const cells = [];
  for (let row = 0;row < size.height; row++) {
    for (let col = 0;col < size.width; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
};
var renderMazeObject = (maze) => {
  return renderMaze(maze.size, {
    visited: allCells(maze.size),
    edges: maze.edges,
    start: maze.start,
    end: maze.end
  });
};
var logMazeObject = (maze, label) => {
  if (label) {
    console.log(label);
  }
  console.log(renderMazeObject(maze));
  console.log("");
};

// src/maze.ts
var SHOW_STEPS = true;
console.log("hello world!");
var createFullSet = (size) => {
  const full = new MazeAddressSet;
  for (let row = 0;row < size.height; row++) {
    for (let col = 0;col < size.width; col++) {
      full.add({ row, col });
    }
  }
  return full;
};
var cellsConnected = (a, b, edges) => {
  const key = edgeKey(a, b);
  return edges.has(key);
};
var connected = (a, b, maze) => {
  const key = edgeKey(a, b);
  return maze.edges.has(key);
};
var generateMaze = (params) => {
  const size = params.size;
  console.log(`Generating: ${size.width}x${size.height} maze`);
  const initialCell = selectRandomCell(size);
  const unvisited = createFullSet(size);
  const visited = new MazeAddressSet;
  const edges = new Set;
  console.log(`initialCell: ${initialCell.col},${initialCell.row}`);
  unvisited.delete(initialCell);
  visited.add(initialCell);
  while (unvisited.size > 0) {
    console.log("========== STARTING NEW PATH GENERATION ==============");
    const path = generateMazePath(size, visited, unvisited);
    for (let idx = 1;idx < path.size; idx++) {
      const first = path.at(idx - 1);
      const second = path.at(idx);
      edges.add(edgeKey(first, second));
    }
    for (let idx = 0;idx < path.size; idx++) {
      const cell = path.at(idx);
      visited.add(cell);
      unvisited.delete(cell);
    }
  }
  const end = selectMazeGoal(params, edges, initialCell);
  const maze = {
    size,
    edges,
    start: initialCell,
    end
  };
  logMazeObject(maze, "final maze");
  return maze;
};
var selectMazeGoal = (params, edges, start) => {
  const solutionMap = buildSolutionMap(start, params.size, edges);
  let iterations = 0;
  while (true) {
    iterations++;
    const proposedEnd = selectRandomCell(params.size);
    const distance = findSolutionMapDistance(start, proposedEnd, solutionMap);
    const tolerance = Math.floor(iterations / 10);
    const goalMin = Math.max(1, params.goalDistanceMin - tolerance);
    const goalMax = params.goalDistanceMax + tolerance;
    if (distance >= goalMin && distance <= goalMax) {
      return proposedEnd;
    }
  }
};
var findSolutionMapDistance = (start, end, solutionMap) => {
  let distance = 0;
  let curr = end;
  while (true) {
    if (addrEqual(start, curr)) {
      return distance;
    }
    curr = solutionMap.get(curr);
    distance += 1;
  }
};
var buildSolutionMap = (start, size, edges) => {
  const previousMap = new MazeAddressSet;
  const visited = new MazeAddressSet;
  const toVisit = new MazeAddressSet;
  toVisit.add(start);
  while (toVisit.size > 0) {
    const current = toVisit.sample();
    visited.add(current);
    toVisit.delete(current);
    const left = { row: current.row, col: current.col - 1 };
    const right = { row: current.row, col: current.col + 1 };
    const up = { row: current.row - 1, col: current.col };
    const down = { row: current.row + 1, col: current.col };
    if (isInMaze(left, size) && !visited.has(left) && !toVisit.has(left) && cellsConnected(current, left, edges)) {
      toVisit.add(left);
      previousMap.add(left, current);
    }
    if (isInMaze(right, size) && !visited.has(right) && !toVisit.has(right) && cellsConnected(current, right, edges)) {
      toVisit.add(right);
      previousMap.add(right, current);
    }
    if (isInMaze(up, size) && !visited.has(up) && !toVisit.has(up) && cellsConnected(current, up, edges)) {
      toVisit.add(up);
      previousMap.add(up, current);
    }
    if (isInMaze(down, size) && !visited.has(down) && !toVisit.has(down) && cellsConnected(current, down, edges)) {
      toVisit.add(down);
      previousMap.add(down, current);
    }
  }
  return previousMap;
};
var generateMazePath = (size, visited, unvisited) => {
  const start = unvisited.sample();
  const path = new MazeAddressSet;
  path.add(start);
  console.log(`path start: ${start.col},${start.row}`);
  let prior = undefined;
  let current = start;
  let step = 0;
  while (true) {
    if (SHOW_STEPS) {
      logPath(size, path.toArray(), `step ${step} — current (${current.row},${current.col})`);
    }
    step++;
    const next = selectNextCell(current, prior, size, path, visited);
    if (!next) {
      throw new Error("Maze generation failed, because we couldn't generate a next cell!");
    }
    console.log(`next: ${next.col},${next.row}`);
    if (addrEqual(next, start)) {
      console.warn(`selected start cell for next, skipping`);
      continue;
    }
    if (visited.has(next)) {
      path.add(next);
      console.log(`next touches visited. Adding it to the maze.`);
      if (SHOW_STEPS) {
        logPath(size, path.toArray(), `final path (${path.size} cells)`);
      }
      return path;
    }
    if (path.has(next)) {
      console.log(`loop detected! truncating and then iterating`);
      const loopIndex = path.indexOf(next);
      path.truncateAt(loopIndex);
      current = path.at(path.size - 1);
      if (path.size > 1) {
        prior = path.at(path.size - 2);
      }
      continue;
    }
    console.log(`adding to path and continuing`);
    path.add(next);
    prior = current;
    current = next;
  }
};
var selectNextCell = (current, prior, size, path, visited) => {
  const options = [];
  const left = { row: current.row, col: current.col - 1 };
  const right = { row: current.row, col: current.col + 1 };
  const up = { row: current.row - 1, col: current.col };
  const down = { row: current.row + 1, col: current.col };
  if (isInMaze(left, size) && !addrEqual(left, prior)) {
    options.push(left);
  }
  if (isInMaze(right, size) && !addrEqual(right, prior)) {
    options.push(right);
  }
  if (isInMaze(up, size) && !addrEqual(up, prior)) {
    options.push(up);
  }
  if (isInMaze(down, size) && !addrEqual(down, prior)) {
    options.push(down);
  }
  if (options.length === 0) {
    return;
  }
  return options[Math.floor(Math.random() * options.length)];
};
var addrEqual = (a, b) => !a && !b || a?.row == b?.row && a?.col == b?.col;
var isInMaze = (addr, size) => {
  return addr.row >= 0 && addr.row < size.height && addr.col >= 0 && addr.col < size.width;
};
var selectRandomCell = (size) => {
  const row = Math.floor(Math.random() * size.height);
  const col = Math.floor(Math.random() * size.width);
  return { row, col };
};
var cellKey = (cell) => `${cell.row}x${cell.col}`;
var edgeKey = (a, b) => {
  let first = a;
  let second = b;
  if (second.row < first.row) {
    first = b;
    second = a;
  }
  if (first.row == second.row && second.col < first.col) {
    first = b;
    second = a;
  }
  return `${cellKey(first)}|${cellKey(second)}`;
};

class MazeAddressSet {
  #items = [];
  #index = new Map;
  #data = new Map;
  static #key({ row, col }) {
    return `${row}x${col}`;
  }
  has(addr) {
    return this.#index.has(MazeAddressSet.#key(addr));
  }
  indexOf(addr) {
    return this.#index.get(MazeAddressSet.#key(addr));
  }
  truncateAt(index) {
    for (let i = index;i < this.#items.length; i++) {
      const k = MazeAddressSet.#key(this.#items[i]);
      this.#index.delete(k);
      this.#data.delete(k);
    }
    this.#items.length = Math.min(this.#items.length, index);
  }
  at(index) {
    return this.#items[index];
  }
  toArray() {
    return [...this.#items];
  }
  add(addr, ...rest) {
    const k = MazeAddressSet.#key(addr);
    if (this.#index.has(k)) {
      return;
    }
    this.#index.set(k, this.#items.length);
    this.#data.set(k, rest[0]);
    this.#items.push(addr);
  }
  get(addr) {
    const k = MazeAddressSet.#key(addr);
    return this.#data.get(k);
  }
  delete(addr) {
    const k = MazeAddressSet.#key(addr);
    const i = this.#index.get(k);
    if (i === undefined) {
      return false;
    }
    const last = this.#items.pop();
    if (i < this.#items.length && last) {
      this.#items[i] = last;
      this.#index.set(MazeAddressSet.#key(last), i);
    }
    this.#index.delete(k);
    this.#data.delete(k);
    return true;
  }
  sample() {
    if (this.#items.length === 0) {
      return;
    }
    return this.#items[Math.floor(Math.random() * this.#items.length)];
  }
  get size() {
    return this.#items.length;
  }
}

// src/render.ts
function render(ctx, state) {
  const maze = state.maze;
  const width = ctx.canvas.clientWidth;
  const height = ctx.canvas.clientHeight;
  ctx.clearRect(0, 0, ctx.canvas.width, height);
  const cellWidth = Math.floor(width / maze.size.width);
  const cellHeight = Math.floor(height / maze.size.height);
  const cellSize = Math.min(cellWidth, cellHeight);
  const mazeWidth = cellSize * maze.size.width;
  const mazeHeight = cellSize * maze.size.height;
  const mazeX = (width - mazeWidth) / 2;
  const mazeY = (height - mazeHeight) / 2;
  for (let row = 0;row < maze.size.height; row++) {
    for (let col = 0;col < maze.size.width; col++) {
      ctx.fillStyle = (row + col) % 2 == 0 ? "blue" : "green";
      const cellX = mazeX + col * cellSize;
      const cellY = mazeY + row * cellSize;
      const cell = { row, col };
      const left = { row, col: col - 1 };
      const right = { row, col: col + 1 };
      const top = { row: row - 1, col };
      const bottom = { row: row + 1, col };
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
  const cellPosition = (addr, x, y) => ({
    x: mazeX + addr.col * cellSize + cellSize * Math.max(Math.min(x, 1), 0),
    y: mazeY + addr.row * cellSize + cellSize * Math.max(Math.min(y, 1), 0)
  });
  const cellCenter = (addr) => cellPosition(addr, 0.5, 0.5);
  const goal = cellCenter(maze.end);
  drawEarth(ctx, goal.x, goal.y, cellSize);
  const player = cellPosition(state.playerPosition, state.physicalPosition.x, state.physicalPosition.y);
  drawRocket(ctx, player.x, player.y, cellSize);
  if (state.targetPosition) {
    const target = cellCenter(state.targetPosition);
    drawTarget(ctx, target.x, target.y, cellSize);
  }
}
function drawEarth(ctx, cx, cy, cellSize) {
  const r = cellSize * 0.34;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#2f6fd0";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#3fa34d";
  const blobs = [
    [-r * 0.35, -r * 0.25, r * 0.5],
    [r * 0.4, r * 0.05, r * 0.42],
    [-r * 0.05, r * 0.55, r * 0.33]
  ];
  for (const [bx, by, br] of blobs) {
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.restore();
}
function drawRocket(ctx, cx, cy, cellSize) {
  const halfW = cellSize * 0.13;
  const noseTop = -cellSize * 0.3;
  const bodyTop = -cellSize * 0.1;
  const bodyBottom = cellSize * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "#d1453b";
  const finDrop = cellSize * 0.12;
  const finOut = cellSize * 0.11;
  ctx.beginPath();
  ctx.moveTo(halfW, bodyBottom - finDrop);
  ctx.lineTo(halfW + finOut, bodyBottom + cellSize * 0.05);
  ctx.lineTo(halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-halfW, bodyBottom - finDrop);
  ctx.lineTo(-halfW - finOut, bodyBottom + cellSize * 0.05);
  ctx.lineTo(-halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f4a323";
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.6, bodyBottom);
  ctx.lineTo(0, bodyBottom + cellSize * 0.16);
  ctx.lineTo(halfW * 0.6, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2f2f2";
  ctx.beginPath();
  ctx.rect(-halfW, bodyTop, halfW * 2, bodyBottom - bodyTop);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d1453b";
  ctx.beginPath();
  ctx.moveTo(0, noseTop);
  ctx.lineTo(halfW, bodyTop);
  ctx.lineTo(-halfW, bodyTop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7ec8e3";
  ctx.beginPath();
  ctx.arc(0, bodyTop + cellSize * 0.08, cellSize * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawTarget(ctx, cx, cy, cellSize) {
  const boxSize = cellSize * 0.13;
  const outlineSize = cellSize * 0.2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#ffffffbb";
  ctx.fillStyle = "#ffffff99";
  ctx.beginPath();
  ctx.rect(-boxSize * 0.5, -boxSize * 0.5, boxSize, boxSize);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(-outlineSize * 0.5, -outlineSize * 0.5, outlineSize, outlineSize);
  ctx.stroke();
  ctx.restore();
}

// src/game.ts
var LEVELS = [
  { size: { width: 8, height: 8 }, goalDistanceMin: 6, goalDistanceMax: 10 },
  { size: { width: 9, height: 9 }, goalDistanceMin: 8, goalDistanceMax: 14 }
];
console.log("level 1");
var maze = generateMaze(LEVELS[0]);
var mazeState = {
  maze,
  targetPosition: undefined,
  playerPosition: maze.start,
  physicalPosition: { x: 0.5, y: 0.5 },
  physicalVelocity: { x: 0, y: 0 }
};
var el = document.querySelector("#game-output");
if (!el) {
  throw new Error("canvas #game-output not found");
}
var context = el.getContext("2d");
if (!context) {
  throw new Error("canvas 2d context not found");
}
function resize() {
  const dpr = window.devicePixelRatio || 1;
  el.width = el.clientWidth * dpr;
  el.height = el.clientHeight * dpr;
  context.scale(dpr, dpr);
}
resize();
window.addEventListener("resize", resize);
initializeKeyboard();
var update = (s, action2) => {
  let moved = false;
  if (!moved && action2.discrete.x !== undefined && action2.discrete.x != 0) {
    const current = s.targetPosition ?? s.playerPosition;
    const next = { row: current.row, col: current.col + action2.discrete.x };
    if (connected(current, next, s.maze)) {
      s.targetPosition = next;
      moved = true;
    }
  }
  if (!moved && action2.discrete.y !== undefined && action2.discrete.y != 0) {
    const current = s.targetPosition ?? s.playerPosition;
    const next = { row: current.row + action2.discrete.y, col: current.col };
    if (connected(current, next, s.maze)) {
      s.targetPosition = next;
      moved = true;
    }
  }
};
var loop = () => {
  let last = performance.now();
  function frame(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(mazeState, getAction());
    render(context, mazeState);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
loop();

//# debugId=81BC59DF4A0D3FF764756E2164756E21
//# sourceMappingURL=game.js.map
