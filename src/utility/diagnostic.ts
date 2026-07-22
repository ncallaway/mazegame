// Diagnostic tools for visualizing a maze in the console.
//
// Everything is drawn on a character canvas that is twice as dense as the maze,
// so there is room for a connector character between every pair of adjacent
// cells:
//
//   cell (r, c)            -> canvas (2r,     2c)
//   link (r,c)-(r,c+1)     -> canvas (2r,     2c + 1)   horizontal
//   link (r,c)-(r+1,c)     -> canvas (2r + 1, 2c)       vertical

export type Cell = { row: number; col: number };
export type Size = { width: number; height: number };

// Canonical edge key as produced by maze.ts's edgeKey ("rowxcol|rowxcol").
export type Edge = string;

export type MazeView = {
  edges?: Iterable<Edge>; // carved passages to draw as lines
  visited?: readonly Cell[]; // cells to mark as visited
  path?: readonly Cell[]; // an in-progress walk to overlay (start/body/head)
  start?: Cell; // maze start, highlighted on top of everything
  end?: Cell; // maze goal, highlighted on top of everything
};

// The subset of a Maze needed to draw it (structural — no import from maze.ts).
export type MazeLike = {
  size: Size;
  edges: Iterable<Edge>;
  start: Cell;
  end: Cell;
};

const EMPTY = "·"; // a cell that is neither visited nor on the path
const VISITED = "o"; // a cell that belongs to the maze
const FILLER = " "; // gap between cells with no connector
const H_LINK = "─"; // horizontal connector
const V_LINK = "│"; // vertical connector
const START = "S"; // start cell (path start or maze start)
const HEAD = "@"; // last (current) cell of the path
const BODY = "●"; // any other cell on the path
const END = "E"; // maze goal / end cell

const parseCell = (key: string): Cell => {
  const [row, col] = key.split("x").map(Number);
  return { row, col };
};

const parseEdge = (edge: Edge): [Cell, Cell] => {
  const [a, b] = edge.split("|");
  return [parseCell(a), parseCell(b)];
};

// Empty grid: cell positions get a dot, everything else a gap.
const makeCanvas = (size: Size): string[][] => {
  const rows = Math.max(size.height * 2 - 1, 0);
  const cols = Math.max(size.width * 2 - 1, 0);
  const canvas: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const line: string[] = [];
    for (let c = 0; c < cols; c++) {
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

// Draw a connector between two orthogonally adjacent cells.
const drawLink = (canvas: string[][], a: Cell, b: Cell): void => {
  if (a.row === b.row) {
    canvas[a.row * 2][a.col + b.col] = H_LINK;
  } else if (a.col === b.col) {
    canvas[(a.row + b.row)][a.col * 2] = V_LINK;
  }
};

const setCell = (canvas: string[][], cell: Cell, glyph: string): void => {
  canvas[cell.row * 2][cell.col * 2] = glyph;
};

// Render any combination of visited cells, edges, and an in-progress path.
export const renderMaze = (size: Size, view: MazeView): string => {
  const canvas = makeCanvas(size);

  // 1. visited cells (drawn first so path markers can sit on top)
  if (view.visited) {
    for (const cell of view.visited) {
      setCell(canvas, cell, VISITED);
    }
  }

  // 2. edges / carved passages
  if (view.edges) {
    for (const edge of view.edges) {
      const [a, b] = parseEdge(edge);
      drawLink(canvas, a, b);
    }
  }

  // 3. the in-progress path, on top of everything
  if (view.path) {
    const path = view.path;
    for (let i = 1; i < path.length; i++) {
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

  // 4. start / end markers, on top of everything else
  if (view.start) {
    setCell(canvas, view.start, START);
  }
  if (view.end) {
    setCell(canvas, view.end, END);
  }

  return canvas.map((line) => line.join("")).join("\n");
};

// Convenience: render just a path (used for the per-step generation view).
export const renderPath = (size: Size, path: readonly Cell[]): string => {
  return renderMaze(size, { path });
};

// Log a full maze view, optionally under a label line.
export const logMaze = (size: Size, view: MazeView, label?: string): void => {
  if (label) {
    console.log(label);
  }
  console.log(renderMaze(size, view));
  console.log("");
};

// Log just a path (unchanged from before).
export const logPath = (size: Size, path: readonly Cell[], label?: string): void => {
  logMaze(size, { path }, label);
};

// Every cell of the grid, used to show a finished maze as filled-in cells.
const allCells = (size: Size): Cell[] => {
  const cells: Cell[] = [];
  for (let row = 0; row < size.height; row++) {
    for (let col = 0; col < size.width; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
};

// Render a finished Maze: all cells filled, edges as passages, start/end marked.
export const renderMazeObject = (maze: MazeLike): string => {
  return renderMaze(maze.size, {
    visited: allCells(maze.size),
    edges: maze.edges,
    start: maze.start,
    end: maze.end,
  });
};

// Log a finished Maze, optionally under a label line.
export const logMazeObject = (maze: MazeLike, label?: string): void => {
  if (label) {
    console.log(label);
  }
  console.log(renderMazeObject(maze));
  console.log("");
};
