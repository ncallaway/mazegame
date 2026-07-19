console.log("hello world!");

/*
 * type MazeAddress = { row: int; col: int; }
 * type MazeCell = 'n' | 's' | 'e' | 'w'
 * type Maze = {
 *   definition: MazeDefinition;
 *   cells: MazeCell[][];
 *   start: MazeAddress;
 *   end: MazeAddress;
 * }
 * type MazeDefinition = {
 *   width: int;
 *   height: int;
 *   start: MazeAddress;
 *   end: MazeAddress;
 * }
 */

type MazeAddress = {
  row: number;
  col: number;
}

type MazeSize = {
  width: number;
  height: number;
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

const generateMaze = (size: MazeSize) => {
  console.log(`Generating: ${size.width}x${size.height} maze`);
  const initialCell = selectRandomCell(size);
  const unvisited = createFullSet(size);
  const visited = new MazeAddressSet();

  console.log(`initialCell: ${initialCell.col},${initialCell.row}`);

  unvisited.delete(initialCell);
  visited.add(initialCell);

  const path = generateMazePath(size, visited, unvisited);
}

const generateMazePath = (size: MazeSize, visited: MazeAddressSet, unvisited: MazeAddressSet): MazeAddressSet => {
  const start: MazeAddress = unvisited.sample()!;
  const path = new MazeAddressSet();
  path.add(start);
  console.log(`path start: ${start.col},${start.row}`);

  let prior: MazeAddress | undefined = undefined;
  let current: MazeAddress = start;

  while (true) {
    const next = selectNextCell(current, prior, size, path, visited);
    // if next is undefined, we've failed to generate a maze
    if (!next) {
      throw new Error("Maze generation failed, because we couldn't generate a next cell!");
    }
    console.log(`next: ${next!.col},${next!.row}`);

    // if *next* is in visited, then we consume this path and add it to the maze
    if (visited.has(next)) {
      // consume the path, adding it to the maze
      path.add(next);
      console.log(`next touches visited. Adding it to the maze.`);
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

const selectNextCell = (current: MazeAddress, prior: MazeAddress | undefined, size: MazeSize, path: MazeAddressSet, visited: MazeAddressSet): MazeAddress | undefined => {
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

const addrEqual = (a: MazeAddress | undefined, b: MazeAddress | undefined) => (!a && !b) || (a?.row == b?.row && a?.col == b?.col);
const isInMaze = (addr: MazeAddress, size: MazeSize): boolean => {
  return addr.row >= 0 && addr.row < size.height && addr.col >= 0 && addr.col < size.width;
}

const selectRandomCell = (size: MazeSize): MazeAddress => {
  const row = Math.floor(Math.random() * size.height);
  const col = Math.floor(Math.random() * size.width);

  return { row, col };
}

class MazeAddressSet {
  #items:MazeAddress[] = [];
  #index:Map<string,number> = new Map();

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
      this.#index.delete(MazeAddressSet.#key(this.#items[i]));
    }
    this.#items.length = Math.min(this.#items.length, index);
  }

  at(index: number): MazeAddress | undefined {
    return this.#items[index];
  }

  add(addr:MazeAddress): void {
    const k = MazeAddressSet.#key(addr);
    if (this.#index.has(k)) {
      return;
    }
    this.#index.set(k, this.#items.length);
    this.#items.push(addr);
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

generateMaze({ width: 4, height: 4});
