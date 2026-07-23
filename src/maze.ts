import { logPath, logMazeObject } from "./utility/diagnostic";

// toggle path visualization during maze generation
const SHOW_STEPS = false;

export type Maze = {
  size: MazeSize;
  edges: Set<string>;
  start: MazeAddress;
  end: MazeAddress;
}

export type MazeAddress = {
  row: number;
  col: number;
}

export type MazeSize = {
  width: number;
  height: number;
}

export type MazeParameters = {
  size: MazeSize;
  goalDistanceMin: number;
  goalDistanceMax: number;
}

const createFullSet = (size:MazeSize): MazeAddressSet => {
  const full = new MazeAddressSet();
  for (let row = 0; row < size.height; row++) {
    for (let col = 0; col < size.width; col++) {
      full.add({ row, col});
    }
  }

  return full;
}

const cellsConnected = (a: MazeAddress, b: MazeAddress, edges: Set<string>) => {
  const key = edgeKey(a, b);
  return edges.has(key);
}

export const connected = (a: MazeAddress, b: MazeAddress, maze: Maze) => {
  const key = edgeKey(a, b);
  return maze.edges.has(key);
}

export const generateMaze = (params: MazeParameters): Maze => {
  const size = params.size;

  console.log(`Generating: ${size.width}x${size.height} maze`);
  const initialCell = selectRandomCell(size);
  const unvisited = createFullSet(size);
  const visited = new MazeAddressSet();
  const edges = new Set<string>();

  console.log(`initialCell: ${initialCell.col},${initialCell.row}`);

  unvisited.delete(initialCell);
  visited.add(initialCell);

  while (unvisited.size > 0) {
    console.log("========== STARTING NEW PATH GENERATION ==============");
    const path = generateMazePath(size, visited, unvisited);
    // add the path to the maze:
    // first add edges
    for (let idx=1; idx<path.size; idx++) {
      const first = path.at(idx-1)!;
      const second = path.at(idx)!;
      edges.add(edgeKey(first, second));
    }
    // then update the visited set
    for (let idx=0; idx<path.size; idx++) {
      const cell = path.at(idx)!;
      visited.add(cell);
      unvisited.delete(cell);
    }
  }

  const end: MazeAddress = selectMazeGoal(params, edges, initialCell);

  const maze: Maze = {
    size,
    edges,
    start: initialCell,
    end
  }

  logMazeObject(maze, "final maze");

  return maze;
}

const selectMazeGoal = (params: MazeParameters, edges: Set<string>, start: MazeAddress): MazeAddress => {
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
}

const findSolutionMapDistance = (start: MazeAddress, end: MazeAddress, solutionMap: MazeAddressSet<MazeAddress>) => {
  let distance = 0;
  let curr = end;

  while (true) {
    if (addrEqual(start, curr)) { return distance; }
    curr = solutionMap.get(curr)!;
    distance += 1;
  }
}

const buildSolutionMap = (start: MazeAddress, size: MazeSize, edges: Set<string>): MazeAddressSet<MazeAddress> => {
  const previousMap = new MazeAddressSet<MazeAddress>();
  
  const visited = new MazeAddressSet();
  const toVisit = new MazeAddressSet();
  toVisit.add(start);

  while (toVisit.size > 0) {
    const current: MazeAddress = toVisit.sample()!;
    visited.add(current);
    toVisit.delete(current);

    const left: MazeAddress = { row: current.row, col: current.col - 1 };
    const right: MazeAddress = { row: current.row, col: current.col + 1 };
    const up: MazeAddress = { row: current.row - 1, col: current.col };
    const down: MazeAddress = { row: current.row + 1, col: current.col };

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

}

const generateMazePath = (size: MazeSize, visited: MazeAddressSet, unvisited: MazeAddressSet): MazeAddressSet => {
  const start: MazeAddress = unvisited.sample()!;
  const path = new MazeAddressSet();
  path.add(start);
  console.log(`path start: ${start.col},${start.row}`);

  let prior: MazeAddress | undefined = undefined;
  let current: MazeAddress = start;

  let step = 0;
  while (true) {
    if (step >= 100_000) {
      throw new Error("Failed to generate a maze after 100k steps");
    }
    if (SHOW_STEPS) {
      logPath(size, path.toArray(), `step ${step} — current (${current.row},${current.col})`);
    }
    step++;

    const next = selectNextCell(current, prior, size);
    // if next is undefined, we've failed to generate a maze
    if (!next) {
      throw new Error("Maze generation failed, because we couldn't generate a next cell!");
    }
    console.log(`next: ${next!.col},${next!.row}`);

    // if *next* is start, then we remove the entire loop from the maze and keep generating the path
    // *but* we need to handle it carefully because we need to restart from 'start'
    if (addrEqual(next,start)) {
      console.log(`loop back to start detected! truncating and then iterating`);
      // remove the loop from the path: find the index of next in the path:
      path.truncateAt(0);
      path.add(start);
      current = start;
      prior = undefined;

      // iterate!
      continue;
    }

    // if *next* is in visited, then we consume this path and add it to the maze
    if (visited.has(next)) {
      // consume the path, adding it to the maze
      path.add(next);
      console.log(`next touches visited. Adding it to the maze.`);
      if (SHOW_STEPS) {
        logPath(size, path.toArray(), `final path (${path.size} cells)`);
      }
      return path;
    }

    // if *next* is a loop, remove the entire loop from the maze and keep generating the path
    if (path.has(next)) {
      console.log(`loop detected! truncating and then iterating`);
      // remove the loop from the path: find the index of next in the path:
      const loopIndex = path.indexOf(next)!;
      path.truncateAt(loopIndex);
      current = path.at(path.size-1)!;
      if (path.size > 1) {
        prior = path.at(path.size-2);
      }

      // iterate!
      continue;
    }

    // otherwise, add next to the path and keep generating the path
    console.log(`adding to path and continuing`);
    path.add(next);
    prior = current;
    current = next;
    // iterate path!
  }
}

const selectNextCell = (current: MazeAddress, prior: MazeAddress | undefined, size: MazeSize): MazeAddress | undefined => {
  const options: MazeAddress[] = [];
  const left: MazeAddress = { row: current.row, col: current.col - 1 };
  const right: MazeAddress = { row: current.row, col: current.col + 1 };
  const up: MazeAddress = { row: current.row - 1, col: current.col };
  const down: MazeAddress = { row: current.row + 1, col: current.col };

  if (isInMaze(left, size) && !addrEqual(left, prior)) { options.push(left); }
  if (isInMaze(right, size) && !addrEqual(right, prior)) { options.push(right); }
  if (isInMaze(up, size) && !addrEqual(up, prior)) { options.push(up); }
  if (isInMaze(down, size) && !addrEqual(down, prior)) { options.push(down); }

  if (options.length === 0) { return undefined; }

  return options[Math.floor(Math.random() * options.length)];
}

export const addrEqual = (a: MazeAddress | undefined, b: MazeAddress | undefined) => (!a && !b) || (a?.row == b?.row && a?.col == b?.col);

// Path (inclusive) from `from` to `to`, following carved passages.
// The maze is a spanning tree, so this path is unique. Reuses the same
// predecessor-map walk as selectMazeGoal / findSolutionMapDistance.
export const computePath = (maze: Maze, from: MazeAddress, to: MazeAddress): MazeAddress[] => {
  if (addrEqual(from, to)) { return [from]; }

  const solutionMap = buildSolutionMap(from, maze.size, maze.edges);

  // walk from `to` back to `from` via the predecessor map, then reverse
  const path: MazeAddress[] = [];
  let curr: MazeAddress | undefined = to;
  while (curr) {
    path.push(curr);
    if (addrEqual(curr, from)) { break; }
    curr = solutionMap.get(curr);
  }
  return path.reverse();
}
const isInMaze = (addr: MazeAddress, size: MazeSize): boolean => {
  return addr.row >= 0 && addr.row < size.height && addr.col >= 0 && addr.col < size.width;
}

const selectRandomCell = (size: MazeSize): MazeAddress => {
  const row = Math.floor(Math.random() * size.height);
  const col = Math.floor(Math.random() * size.width);

  return { row, col };
}

const cellKey = (cell: MazeAddress) => `${cell.row}x${cell.col}`;
const edgeKey = (a: MazeAddress, b: MazeAddress) => {
  let first = a;
  let second = b;

  // swap!
  if (second.row < first.row) {
    first = b;
    second = a;
  }
 
  // swap!
  if (first.row == second.row && second.col < first.col) {
    first = b;
    second = a;
  }

  return `${cellKey(first)}|${cellKey(second)}`;
}

class MazeAddressSet<T = void> {
  #items:MazeAddress[] = [];
  #index:Map<string,number> = new Map();
  #data:Map<string,T> = new Map();

  static #key({ row, col }: MazeAddress): string {
    return `${row}x${col}`;
  }

  has(addr:MazeAddress): boolean {
    return this.#index.has(MazeAddressSet.#key(addr));
  }

  indexOf(addr:MazeAddress): number | undefined {
    return this.#index.get(MazeAddressSet.#key(addr));
  }

  truncateAt(index:number): void {
    for (let i = index; i < this.#items.length; i++) {
      const k = MazeAddressSet.#key(this.#items[i])
      this.#index.delete(k);
      this.#data.delete(k);
    }
    this.#items.length = Math.min(this.#items.length, index);
  }

  at(index: number): MazeAddress | undefined {
    return this.#items[index];
  }

  toArray(): MazeAddress[] {
    return [...this.#items];
  }

  add(addr:MazeAddress, ...rest: [T] extends [void] ? [] : [data: T]): void {
    const k = MazeAddressSet.#key(addr);
    if (this.#index.has(k)) {
      return;
    }
    this.#index.set(k, this.#items.length);
    this.#data.set(k, rest[0] as T);
    this.#items.push(addr);
  }

  get(addr:MazeAddress): T | undefined {
    const k = MazeAddressSet.#key(addr);
    return this.#data.get(k);
  }

  delete(addr:MazeAddress): boolean {
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

  sample(): MazeAddress | undefined {
    if (this.#items.length === 0) {
      return undefined;
    }
    return this.#items[Math.floor(Math.random() * this.#items.length)];
  }

  get size(): number {
    return this.#items.length;
  }
}
