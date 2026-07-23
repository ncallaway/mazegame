var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

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

// src/utility/diagnostic.ts
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
var SHOW_STEPS = false;
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
    if (step >= 1e5) {
      throw new Error("Failed to generate a maze after 100k steps");
    }
    if (SHOW_STEPS) {
      logPath(size, path.toArray(), `step ${step} — current (${current.row},${current.col})`);
    }
    step++;
    const next = selectNextCell(current, prior, size);
    if (!next) {
      throw new Error("Maze generation failed, because we couldn't generate a next cell!");
    }
    console.log(`next: ${next.col},${next.row}`);
    if (addrEqual(next, start)) {
      console.log(`loop back to start detected! truncating and then iterating`);
      path.truncateAt(0);
      path.add(start);
      current = start;
      prior = undefined;
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
var selectNextCell = (current, prior, size) => {
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
var computePath = (maze, from, to) => {
  if (addrEqual(from, to)) {
    return [from];
  }
  const solutionMap = buildSolutionMap(from, maze.size, maze.edges);
  const path = [];
  let curr = to;
  while (curr) {
    path.push(curr);
    if (addrEqual(curr, from)) {
      break;
    }
    curr = solutionMap.get(curr);
  }
  return path.reverse();
};
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

// src/levels.ts
var LEVELS = [
  { size: { width: 8, height: 8 }, goalDistanceMin: 6, goalDistanceMax: 10 },
  { size: { width: 8, height: 8 }, goalDistanceMin: 10, goalDistanceMax: 20 },
  { size: { width: 8, height: 8 }, goalDistanceMin: 20, goalDistanceMax: 30 },
  { size: { width: 9, height: 9 }, goalDistanceMin: 20, goalDistanceMax: 30 },
  { size: { width: 10, height: 10 }, goalDistanceMin: 20, goalDistanceMax: 40 },
  { size: { width: 12, height: 10 }, goalDistanceMin: 20, goalDistanceMax: 50 },
  { size: { width: 14, height: 10 }, goalDistanceMin: 30, goalDistanceMax: 60 },
  { size: { width: 14, height: 12 }, goalDistanceMin: 30, goalDistanceMax: 70 },
  { size: { width: 16, height: 12 }, goalDistanceMin: 30, goalDistanceMax: 80 },
  { size: { width: 18, height: 14 }, goalDistanceMin: 40, goalDistanceMax: 90 },
  { size: { width: 20, height: 15 }, goalDistanceMin: 80, goalDistanceMax: 100 }
];
var createMazeState = (level, now) => {
  console.log(`creating maze for level ${level}`);
  const lvlIdx = level - 1;
  const lvlParams = LEVELS[lvlIdx] ?? LEVELS[LEVELS.length - 1];
  const maze = generateMaze(lvlParams);
  return {
    maze,
    targetPosition: undefined,
    playerPosition: maze.start,
    playerOrientation: 0,
    playerRotationalVelocity: 0,
    physicalPosition: { x: 0.5, y: 0.5 },
    physicalVelocity: { x: 0, y: 0 },
    path: undefined,
    won: undefined,
    started: now,
    targetMoved: undefined,
    playerCaughtTarget: false,
    targetSafe: false
  };
};
// node_modules/gl-matrix/esm/vec2.js
var exports_vec2 = {};
__export(exports_vec2, {
  zero: () => zero,
  transformMat4: () => transformMat4,
  transformMat3: () => transformMat3,
  transformMat2d: () => transformMat2d,
  transformMat2: () => transformMat2,
  subtract: () => subtract,
  sub: () => sub,
  str: () => str,
  squaredLength: () => squaredLength,
  squaredDistance: () => squaredDistance,
  sqrLen: () => sqrLen,
  sqrDist: () => sqrDist,
  signedAngle: () => signedAngle,
  set: () => set,
  scaleAndAdd: () => scaleAndAdd,
  scale: () => scale,
  round: () => round2,
  rotate: () => rotate,
  random: () => random,
  normalize: () => normalize,
  negate: () => negate,
  multiply: () => multiply,
  mul: () => mul,
  min: () => min,
  max: () => max,
  lerp: () => lerp,
  length: () => length,
  len: () => len,
  inverse: () => inverse,
  fromValues: () => fromValues,
  forEach: () => forEach,
  floor: () => floor,
  exactEquals: () => exactEquals,
  equals: () => equals,
  dot: () => dot,
  divide: () => divide,
  div: () => div,
  distance: () => distance,
  dist: () => dist,
  cross: () => cross,
  create: () => create,
  copy: () => copy,
  clone: () => clone,
  ceil: () => ceil,
  angle: () => angle,
  add: () => add
});

// node_modules/gl-matrix/esm/common.js
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = Math.random;
function round(a) {
  if (a >= 0)
    return Math.round(a);
  return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
}
var degree = Math.PI / 180;
var radian = 180 / Math.PI;

// node_modules/gl-matrix/esm/vec2.js
function create() {
  var out = new ARRAY_TYPE(2);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}
function clone(a) {
  var out = new ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}
function round2(out, a) {
  out[0] = round(a[0]);
  out[1] = round(a[1]);
  return out;
}
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}
function scaleAndAdd(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  return out;
}
function distance(a, b) {
  var x = b[0] - a[0], y = b[1] - a[1];
  return Math.sqrt(x * x + y * y);
}
function squaredDistance(a, b) {
  var x = b[0] - a[0], y = b[1] - a[1];
  return x * x + y * y;
}
function length(a) {
  var x = a[0], y = a[1];
  return Math.sqrt(x * x + y * y);
}
function squaredLength(a) {
  var x = a[0], y = a[1];
  return x * x + y * y;
}
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}
function inverse(out, a) {
  out[0] = 1 / a[0];
  out[1] = 1 / a[1];
  return out;
}
function normalize(out, a) {
  var x = a[0], y = a[1];
  var len = x * x + y * y;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  return out;
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}
function lerp(out, a, b, t) {
  var ax = a[0], ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}
function random(out, scale2) {
  scale2 = scale2 === undefined ? 1 : scale2;
  var r = RANDOM() * 2 * Math.PI;
  out[0] = Math.cos(r) * scale2;
  out[1] = Math.sin(r) * scale2;
  return out;
}
function transformMat2(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}
function transformMat2d(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}
function transformMat3(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}
function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}
function rotate(out, a, b, rad) {
  var p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}
function angle(a, b) {
  var ax = a[0], ay = a[1], bx = b[0], by = b[1];
  return Math.abs(Math.atan2(ay * bx - ax * by, ax * bx + ay * by));
}
function signedAngle(a, b) {
  var ax = a[0], ay = a[1], bx = b[0], by = b[1];
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}
function zero(out) {
  out[0] = 0;
  out[1] = 0;
  return out;
}
function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
function equals(a, b) {
  var a0 = a[0], a1 = a[1];
  var b0 = b[0], b1 = b[1];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1));
}
var len = length;
var sub = subtract;
var mul = multiply;
var div = divide;
var dist = distance;
var sqrDist = squaredDistance;
var sqrLen = squaredLength;
var forEach = function() {
  var vec = create();
  return function(a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 2;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset;i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }
    return a;
  };
}();
// src/utility/vector.ts
var fromMazeAddress = (address, x = 0.5, y = 0.5) => {
  if (typeof x === "object") {
    return exports_vec2.fromValues(address.col + x.x, address.row + x.y);
  }
  return exports_vec2.fromValues(address.col + x, address.row + y);
};
var toOrientation = (vec) => {
  return Math.atan2(vec[1], vec[0]);
};
var fromOrientation = (angle2) => {
  return exports_vec2.fromValues(Math.cos(angle2), Math.sin(angle2));
};
var vector = {
  fromMazeAddress,
  toOrientation,
  fromOrientation
};

// src/constants/fireworks.ts
var FIREWORKS = {
  LaunchRadius: 0.4,
  Gravity: 1,
  ParticleCount: 100,
  ParticleVelocity: 1,
  ParticleSize: 0.1,
  ParticleDuration: 2,
  LifetimeSpeedBias: 0.6,
  AmbientMin: 3,
  AmbientMax: 5,
  Colors: [
    "#ff2d2d",
    "#ff7a1a",
    "#ffd21a",
    "#4dff4d",
    "#1affd5",
    "#3b82ff",
    "#c04dff",
    "#ff4dd2"
  ]
};

// src/celebration.ts
var state = {
  started: undefined,
  at: undefined,
  fireworks: [],
  particles: [],
  scheduled: []
};
var startCelebration = (at, now) => {
  state.started = now;
  state.at = at;
  scheduleShow(now);
};
var scheduleShow = (now, duration = 15) => {
  const times = [];
  const opening = 3 + Math.floor(Math.random() * 3);
  for (let i = 0;i < opening; i++) {
    times.push(Math.random() * 0.3);
  }
  const peakRate = 6;
  const tau = duration / 3;
  const wavelength = 2 + Math.random() * 4;
  const omega = 2 * Math.PI / wavelength;
  const rate = (t2) => peakRate * Math.exp(-t2 / tau) * (0.55 + 0.45 * Math.cos(omega * t2));
  let t = 0.4;
  while (t < duration) {
    t += -Math.log(1 - Math.random()) / peakRate;
    if (t < duration && Math.random() < rate(t) / peakRate) {
      times.push(t);
    }
  }
  for (const dt of times) {
    state.scheduled.push(randomFirework(now + dt));
  }
};
var scheduleAmbient = (now) => {
  if (state.scheduled.length > 0) {
    return;
  }
  const delay = FIREWORKS.AmbientMin + Math.random() * (FIREWORKS.AmbientMax - FIREWORKS.AmbientMin);
  state.scheduled.push(randomFirework(now + delay));
};
var randomFirework = (at) => {
  const powden = Math.random() * 0.4 + 0.8;
  return {
    at,
    direction: Math.random() * Math.PI * 2,
    height: 0.25 + Math.random() * 0.5,
    color: Math.floor(Math.random() * FIREWORKS.Colors.length),
    power: powden,
    density: powden,
    duration: 1
  };
};
var updateCelebration = (dt, now) => {
  if (!state.started || !state.at) {
    return;
  }
  launchFireworks(now);
  scheduleAmbient(now);
  explodeFireworks(now);
  updateFireworks(dt);
  updateParticles(dt);
  removeStale(now);
};
var launchFireworks = (now) => {
  for (let idx = 0;idx < state.scheduled.length; idx++) {
    const f = state.scheduled[idx];
    if (now > f.at) {
      state.fireworks.push({
        position: launchPosition(f),
        velocity: launchVelocity(f),
        firework: f
      });
      state.scheduled.splice(idx, 1);
      idx -= 1;
    }
  }
};
var explodeFireworks = (now) => {
  const c = earth();
  for (let idx = 0;idx < state.fireworks.length; idx++) {
    const f = state.fireworks[idx];
    const g = exports_vec2.sub(exports_vec2.create(), c, f.position);
    if (exports_vec2.dot(g, f.velocity) >= 0) {
      const count = Math.pow(Math.random(), 0.35) * FIREWORKS.ParticleCount * f.firework.density;
      for (let i = 0;i < count; i++) {
        launchParticle(f, now);
      }
      state.fireworks.splice(idx, 1);
      idx--;
    }
  }
};
var SPEED_FRAC_MEAN = 0.454;
var launchParticle = (f, now) => {
  const angle2 = Math.random() * 2 * Math.PI;
  const dir = vector.fromOrientation(angle2);
  const up = vector.fromOrientation(f.firework.direction);
  const speed = Math.pow(Math.random(), 0.75) * FIREWORKS.ParticleVelocity * f.firework.power;
  const velocity = exports_vec2.scale(exports_vec2.create(), dir, speed);
  exports_vec2.scale(up, up, Math.pow(Math.random(), 0.35) * FIREWORKS.ParticleVelocity);
  exports_vec2.add(velocity, velocity, up);
  const size = Math.pow(Math.random(), 0.5) * FIREWORKS.ParticleSize;
  const maxSpeed = FIREWORKS.ParticleVelocity * (f.firework.power + 1);
  const speedFrac = Math.min(1, exports_vec2.len(velocity) / maxSpeed);
  const speedFactor = Math.max(0.2, 1 + FIREWORKS.LifetimeSpeedBias * (speedFrac - SPEED_FRAC_MEAN));
  const lifetime = Math.pow(Math.random(), 0.5) * FIREWORKS.ParticleDuration * f.firework.duration * speedFactor;
  state.particles.push({
    position: exports_vec2.clone(f.position),
    velocity: exports_vec2.add(velocity, velocity, f.velocity),
    color: f.firework.color,
    at: now,
    lifetime,
    size
  });
};
var updateFireworks = (dt) => {
  const c = earth();
  for (let idx = 0;idx < state.fireworks.length; idx++) {
    const f = state.fireworks[idx];
    const g = exports_vec2.sub(exports_vec2.create(), c, f.position);
    exports_vec2.normalize(g, g);
    const dv = exports_vec2.scale(exports_vec2.create(), g, FIREWORKS.Gravity * dt);
    exports_vec2.add(f.velocity, f.velocity, dv);
    const delta = exports_vec2.scale(exports_vec2.create(), f.velocity, dt);
    exports_vec2.add(f.position, f.position, delta);
  }
};
var updateParticles = (dt) => {
  const c = earth();
  for (let idx = 0;idx < state.particles.length; idx++) {
    const p = state.particles[idx];
    const g = exports_vec2.sub(exports_vec2.create(), c, p.position);
    exports_vec2.normalize(g, g);
    const dv = exports_vec2.scale(exports_vec2.create(), g, FIREWORKS.Gravity * dt);
    exports_vec2.add(p.velocity, p.velocity, dv);
    const delta = exports_vec2.scale(exports_vec2.create(), p.velocity, dt);
    exports_vec2.add(p.position, p.position, delta);
  }
};
var removeStale = (now) => {
  for (let idx = 0;idx < state.particles.length; idx++) {
    const p = state.particles[idx];
    if (now > p.at + p.lifetime) {
      state.particles.splice(idx, 1);
      idx--;
    }
  }
};
var launchPosition = (f) => {
  const c = earth();
  const dir = vector.fromOrientation(f.direction);
  const delta = exports_vec2.scale(exports_vec2.create(), dir, FIREWORKS.LaunchRadius);
  return exports_vec2.add(exports_vec2.create(), c, delta);
};
var launchVelocity = (f) => {
  const dir = exports_vec2.fromValues(Math.cos(f.direction), Math.sin(f.direction));
  const speed = Math.sqrt(2 * FIREWORKS.Gravity * f.height);
  return exports_vec2.scale(exports_vec2.create(), dir, speed);
};
var earth = () => vector.fromMazeAddress(state.at);
var stopCelebration = () => {
  state.started = undefined;
  state.at = undefined;
  state.scheduled = [];
  state.fireworks = [];
  state.particles = [];
};
var renderCelebration = (ctx, originX, originY, cellSize, now) => {
  if (state.fireworks.length === 0 && state.particles.length === 0) {
    return;
  }
  const pixelX = (worldX) => originX + worldX * cellSize;
  const pixelY = (worldY) => originY + worldY * cellSize;
  ctx.save();
  const shellSize = 0.06 * cellSize;
  ctx.fillStyle = "#888888";
  for (const f of state.fireworks) {
    const px = pixelX(f.position[0]);
    const py = pixelY(f.position[1]);
    ctx.fillRect(px - shellSize / 2, py - shellSize / 2, shellSize, shellSize);
  }
  for (const p of state.particles) {
    let t = (now - p.at) / p.lifetime;
    t = Math.pow(t, 0.8);
    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - t));
    ctx.fillStyle = FIREWORKS.Colors[p.color] ?? "#ffffff";
    const s = p.size * cellSize;
    const px = pixelX(p.position[0]);
    const py = pixelY(p.position[1]);
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
  }
  ctx.restore();
};

// src/render.ts
function render(ctx, state2, now) {
  const maze = state2.maze;
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
  const player = cellPosition(state2.playerPosition, state2.physicalPosition.x, state2.physicalPosition.y);
  if (state2.path && state2.path.length > 1) {
    drawPath(ctx, state2.path.map(cellCenter), player, cellSize);
  }
  drawRocket(ctx, player.x, player.y, cellSize, state2.playerOrientation);
  if (state2.targetPosition && !addrEqual(state2.playerPosition, state2.targetPosition)) {
    const target = cellCenter(state2.targetPosition);
    drawTarget(ctx, target.x, target.y, cellSize);
  }
  renderCelebration(ctx, mazeX, mazeY, cellSize, now);
}
function drawPath(ctx, centers, ship, cellSize) {
  if (centers.length < 2) {
    return;
  }
  const dotR = cellSize * 0.035;
  const offsets = [0.125, 0.375, 0.625, 0.875];
  const seg0x = centers[1].x - centers[0].x;
  const seg0y = centers[1].y - centers[0].y;
  const seg0LenSq = seg0x * seg0x + seg0y * seg0y;
  const shipArc = seg0LenSq > 0 ? ((ship.x - centers[0].x) * seg0x + (ship.y - centers[0].y) * seg0y) / seg0LenSq : 0;
  const minArc = shipArc + 0.1;
  ctx.save();
  ctx.fillStyle = "#ffffff77";
  for (let i = 1;i < centers.length; i++) {
    const a = centers[i - 1];
    const b = centers[i];
    for (const t of offsets) {
      if (i - 1 + t < minArc) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
var earthImage = new Image;
earthImage.src = "assets/images/earth_final.png";
var EARTH_SCALE = 0.85;
var rocketImage = new Image;
rocketImage.src = "assets/images/rocket.png";
var ROCKET_SCALE = 0.7;
function drawEarth(ctx, cx, cy, cellSize) {
  if (earthImage.complete && earthImage.naturalWidth > 0) {
    const w = cellSize * EARTH_SCALE;
    const h = w * (earthImage.naturalHeight / earthImage.naturalWidth);
    ctx.drawImage(earthImage, cx - w / 2, cy - h / 2, w, h);
    return;
  }
  drawEarthVector(ctx, cx, cy, cellSize);
}
function drawEarthVector(ctx, cx, cy, cellSize) {
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
function drawRocket(ctx, cx, cy, cellSize, orientation) {
  if (rocketImage.complete && rocketImage.naturalWidth > 0) {
    const h = cellSize * ROCKET_SCALE;
    const w = h * (rocketImage.naturalWidth / rocketImage.naturalHeight);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(orientation + Math.PI / 2);
    ctx.drawImage(rocketImage, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  drawRocketVector(ctx, cx, cy, cellSize, orientation);
}
function drawRocketVector(ctx, cx, cy, cellSize, orientation) {
  const s = cellSize * (2 / 3);
  const halfW = s * 0.13;
  const noseTop = -s * 0.3;
  const bodyTop = -s * 0.1;
  const bodyBottom = s * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(orientation + Math.PI / 2);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "#d1453b";
  const finDrop = s * 0.12;
  const finOut = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(halfW, bodyBottom - finDrop);
  ctx.lineTo(halfW + finOut, bodyBottom + s * 0.05);
  ctx.lineTo(halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-halfW, bodyBottom - finDrop);
  ctx.lineTo(-halfW - finOut, bodyBottom + s * 0.05);
  ctx.lineTo(-halfW, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f4a323";
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.6, bodyBottom);
  ctx.lineTo(0, bodyBottom + s * 0.16);
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
  ctx.arc(0, bodyTop + s * 0.08, s * 0.06, 0, Math.PI * 2);
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

// src/scorebug.ts
var el = {
  level: document.querySelector(".score-bug .level"),
  elapsed: document.querySelector(".score-bug .elapsed"),
  firstMove: document.querySelector(".score-bug .first-move"),
  target: document.querySelector(".score-bug .target")
};
var last = { level: "", elapsed: "", firstMove: "", target: "" };
var set2 = (node, key, value) => {
  if (last[key] === value) {
    return;
  }
  last[key] = value;
  node.textContent = value;
};
var fmt = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};
var syncScorebug = (game, now) => {
  const m = game.maze;
  const end = m.won ?? now;
  set2(el.level, "level", `Level ${game.level}`);
  set2(el.elapsed, "elapsed", fmt(end - m.started));
  set2(el.firstMove, "firstMove", m.targetMoved ? fmt(m.targetMoved - m.started) : fmt(now - m.started));
  let targetMsg = "";
  if (m.targetSafe && !m.playerCaughtTarget) {
    targetMsg = "Target got away!";
  } else if (!m.playerCaughtTarget && m.targetMoved) {
    targetMsg = "Target is running!";
  } else if (m.playerCaughtTarget && m.targetMoved) {
    targetMsg = "Target got caught :/";
  }
  set2(el.target, "target", targetMsg);
};

// src/constants/ship.ts
var SHIP_TARGET_ROTATIONAL_VELOCITY = 16;
var SHIP_MAX_ROTATIONAL_ACCELERATION = 60;
var SHIP_BRAKE_SAFETY = 0.9;
var SHIP_ORIENTATION_SNAP_EPSILON = 0.03;
var SHIP_ROTATIONAL_VELOCITY_SNAP_EPSILON = 0.5;
var SHIP_TARGET_LINEAR_VELOCITY = 4;
var SHIP_MAX_LINEAR_ACCELERATION = 12;
var SHIP_LINEAR_BRAKE_SAFETY = 0.9;
var SHIP_POSITION_SNAP_EPSILON = 0.02;
var SHIP_LINEAR_VELOCITY_SNAP_EPSILON = 0.3;
var SHIP_THRUST_ALIGNMENT = Math.PI / 2;

// src/update.ts
var update = (s, action2, dt, now) => {
  const m = s.maze;
  if (m.won === undefined) {
    inputUpdate(m, action2, now);
  }
  syncPath(m);
  updateCelebration(dt, now);
  orientShip(m, dt);
  moveShip(m, dt);
  if (m.won === undefined && addrEqual(m.playerPosition, m.maze.end)) {
    startCelebration(m.maze.end, now);
    m.won = now;
  } else if (!m.won) {
    stopCelebration();
  }
};
var inputUpdate = (s, action2, now) => {
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
  if (moved && !s.targetMoved) {
    s.targetMoved = now;
  }
  if (addrEqual(s.targetPosition, s.maze.end) && !s.playerCaughtTarget) {
    s.targetSafe = true;
  } else if (addrEqual(s.targetPosition, s.playerPosition) && !s.targetSafe) {
    s.playerCaughtTarget = true;
  }
};
var orientShip = (s, dt) => {
  const desiredOrientation = idealFacingDirection(s);
  if (desiredOrientation !== undefined) {
    const error = wrapAngle(desiredOrientation - s.playerOrientation);
    if (Math.abs(error) < SHIP_ORIENTATION_SNAP_EPSILON && Math.abs(s.playerRotationalVelocity) < SHIP_ROTATIONAL_VELOCITY_SNAP_EPSILON) {
      s.playerOrientation = desiredOrientation;
      s.playerRotationalVelocity = 0;
      return;
    }
  }
  const targetVel = idealRotationalVelocity(desiredOrientation, s);
  const maxDelta = SHIP_MAX_ROTATIONAL_ACCELERATION * dt;
  s.playerRotationalVelocity += clamp(targetVel - s.playerRotationalVelocity, -maxDelta, maxDelta);
  s.playerOrientation = wrapAngle(s.playerOrientation + s.playerRotationalVelocity * dt);
};
var moveShip = (s, dt) => {
  if (dt < 0) {
    dt = 0;
  }
  if (s.targetPosition && addrEqual(s.playerPosition, s.targetPosition)) {
    const dx = 0.5 - s.physicalPosition.x;
    const dy = 0.5 - s.physicalPosition.y;
    const speedSq = s.physicalVelocity.x ** 2 + s.physicalVelocity.y ** 2;
    if (dx * dx + dy * dy < SHIP_POSITION_SNAP_EPSILON ** 2 && speedSq < SHIP_LINEAR_VELOCITY_SNAP_EPSILON ** 2) {
      s.physicalPosition = { x: 0.5, y: 0.5 };
      s.physicalVelocity = { x: 0, y: 0 };
      return;
    }
  }
  const worldPos = vector.fromMazeAddress(s.playerPosition, s.physicalPosition.x, s.physicalPosition.y);
  const vel = exports_vec2.fromValues(s.physicalVelocity.x, s.physicalVelocity.y);
  const targetVel = idealLinearVelocity(s, worldPos);
  const maxDelta = SHIP_MAX_LINEAR_ACCELERATION * dt;
  const dv = exports_vec2.sub(exports_vec2.create(), targetVel, vel);
  const dvLen = exports_vec2.len(dv);
  if (dvLen > maxDelta) {
    exports_vec2.scale(dv, dv, maxDelta / dvLen);
  }
  exports_vec2.add(vel, vel, dv);
  exports_vec2.scaleAndAdd(worldPos, worldPos, vel, dt);
  s.physicalVelocity = { x: vel[0], y: vel[1] };
  const newCol = Math.floor(worldPos[0]);
  const newRow = Math.floor(worldPos[1]);
  const newAddr = { row: newRow, col: newCol };
  s.physicalPosition = { x: worldPos[0] - newCol, y: worldPos[1] - newRow };
  if (newCol !== s.playerPosition.col || newRow !== s.playerPosition.row) {
    if (connected(s.playerPosition, newAddr, s.maze)) {
      s.playerPosition = newAddr;
      if (addrEqual(s.playerPosition, s.targetPosition) && s.targetMoved && !s.targetSafe) {
        s.playerCaughtTarget = true;
      }
      syncPath(s);
    }
  }
};
var idealLinearVelocity = (s, worldPos) => {
  const zero2 = exports_vec2.fromValues(0, 0);
  if (!s.path || s.path.length === 0) {
    return zero2;
  }
  const waypoint = vector.fromMazeAddress(s.path[1] ?? s.path[0]);
  const toWaypoint = exports_vec2.sub(exports_vec2.create(), waypoint, worldPos);
  const distToWaypoint = exports_vec2.len(toWaypoint);
  if (distToWaypoint < 0.000001) {
    return zero2;
  }
  const remaining = distToWaypoint + Math.max(0, s.path.length - 2);
  const dir = exports_vec2.scale(exports_vec2.create(), toWaypoint, 1 / distToWaypoint);
  const brakeSpeed = Math.sqrt(2 * SHIP_MAX_LINEAR_ACCELERATION * SHIP_LINEAR_BRAKE_SAFETY * remaining);
  let speed = Math.min(SHIP_TARGET_LINEAR_VELOCITY, brakeSpeed);
  const headingError = Math.abs(wrapAngle(vector.toOrientation(dir) - s.playerOrientation));
  const gate = clamp((SHIP_THRUST_ALIGNMENT - headingError) / SHIP_THRUST_ALIGNMENT, 0, 1);
  speed *= gate;
  return exports_vec2.scale(exports_vec2.create(), dir, speed);
};
var wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
var clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
var idealRotationalVelocity = (desiredOrientation, s) => {
  if (desiredOrientation === undefined) {
    return 0;
  }
  const error = wrapAngle(desiredOrientation - s.playerOrientation);
  const brakeSpeed = Math.sqrt(2 * SHIP_MAX_ROTATIONAL_ACCELERATION * SHIP_BRAKE_SAFETY * Math.abs(error));
  const speed = Math.min(SHIP_TARGET_ROTATIONAL_VELOCITY, brakeSpeed);
  return Math.sign(error) * speed;
};
var idealFacingDirection = (s) => {
  if (!s.path || !s.path[1]) {
    const velocity = exports_vec2.fromValues(s.physicalVelocity.x, s.physicalVelocity.y);
    if (exports_vec2.sqrLen(velocity) > 0.1) {
      return vector.toOrientation(velocity);
    }
    return;
  }
  const next = vector.fromMazeAddress(s.path[1]);
  const current = vector.fromMazeAddress(s.playerPosition, s.physicalPosition);
  const delta = exports_vec2.sub(exports_vec2.create(), next, current);
  return vector.toOrientation(delta);
};
var syncPath = (s) => {
  if (s.targetPosition === undefined) {
    s.path = undefined;
    return;
  }
  const p = s.path;
  const fresh = p !== undefined && p.length > 0 && addrEqual(p[0], s.playerPosition) && addrEqual(p[p.length - 1], s.targetPosition);
  if (fresh) {
    return;
  }
  s.path = computePath(s.maze, s.playerPosition, s.targetPosition);
};

// src/game.ts
var gameState = {
  level: 1,
  maze: createMazeState(1, performance.now() / 1000)
};
var el2 = document.querySelector("#game-output");
if (!el2) {
  throw new Error("canvas #game-output not found");
}
var context = el2.getContext("2d");
if (!context) {
  throw new Error("canvas 2d context not found");
}
var nextLevelButton = document.querySelector("#next-level");
if (!nextLevelButton) {
  throw new Error("button #next-level not found");
}
var canvas = el2;
var ctx = context;
var nextButton = nextLevelButton;
nextButton.addEventListener("click", () => {
  if (gameState.maze.won) {
    gameState.level += 1;
    gameState.maze = createMazeState(gameState.level, performance.now() / 1000);
  }
});
var buttonShown = false;
var syncNextLevelButton = () => {
  const won = gameState.maze.won !== undefined;
  if (won === buttonShown) {
    return;
  }
  buttonShown = won;
  nextButton.style.display = won ? "block" : "none";
  if (won) {
    nextButton.focus();
  }
};
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
}
resize();
window.addEventListener("resize", resize);
initializeKeyboard();
var loop = () => {
  let last2 = performance.now();
  function frame(now) {
    const dt = (now - last2) / 1000;
    last2 = now;
    const nowSeconds = now / 1000;
    update(gameState, getAction(), dt, nowSeconds);
    render(ctx, gameState.maze, nowSeconds);
    syncScorebug(gameState, nowSeconds);
    syncNextLevelButton();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
loop();

//# debugId=E80F12FF37B28ED664756E2164756E21
//# sourceMappingURL=game.js.map
