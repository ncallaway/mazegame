// src/maze.ts
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
  console.log(`initialCell: ${initialCell.col},${initialCell.row}`);
  unvisited.delete(initialCell);
  visited.add(initialCell);
  const path = generateMazePath(size, visited, unvisited);
};
var generateMazePath = (size, visited, unvisited) => {
  const start = unvisited.sample();
  const path = new MazeAddressSet;
  path.add(start);
  console.log(`path start: ${start.col},${start.row}`);
  let prior = undefined;
  let current = start;
  while (true) {
    const next = selectNextCell(current, prior, size, path, visited);
    if (!next) {
      throw new Error("Maze generation failed, because we couldn't generate a next cell!");
    }
    console.log(`next: ${next.col},${next.row}`);
    if (visited.has(next)) {
      path.add(next);
      console.log(`next touches visited. Adding it to the maze.`);
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
