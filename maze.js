// src/diagnostic.ts
var EMPTY = "·";
var VISITED = "o";
var FILLER = " ";
var H_LINK = "─";
var V_LINK = "│";
var START = "S";
var HEAD = "@";
var BODY = "●";
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
var generateMaze = (size) => {
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
  const maze = {
    size,
    edges,
    start: initialCell,
    end
  };
  logMaze(size, { edges, visited: visited.toArray() }, "final maze");
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
      this.#index.delete(MazeAddressSet.#key(this.#items[i]));
    }
    this.#items.length = Math.min(this.#items.length, index);
  }
  at(index) {
    return this.#items[index];
  }
  toArray() {
    return [...this.#items];
  }
  add(addr) {
    const k = MazeAddressSet.#key(addr);
    if (this.#index.has(k)) {
      return;
    }
    this.#index.set(k, this.#items.length);
    this.#items.push(addr);
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
generateMaze({ width: 4, height: 4 });
