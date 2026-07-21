export type InputAction = {
  discrete: { x: -1 | 1 | 0 | undefined, y: -1 | 0 | 1 | undefined };
  analog: { dx: number | undefined, dy: number | undefined }
}

let action: InputAction = {
  discrete: { x : undefined, y : undefined },
  analog: { dx: undefined, dy: undefined }
}

const resetAction = () => {
  action.discrete.x = undefined;
  action.discrete.y = undefined;
  action.analog.dx = undefined;
  action.analog.dy = undefined;
}

export const initializeKeyboard = () => {
  window.addEventListener("keydown", e => {
    if (e.key === 'ArrowLeft') { action.discrete.x = -1; }
    if (e.key === 'ArrowRight') { action.discrete.x = 1; }
    if (e.key === 'ArrowUp') { action.discrete.y = -1; }
    if (e.key === 'ArrowDown') { action.discrete.y = 1; }
  });
}

export const getAction = () => {
  const result: InputAction = {
    discrete: { ...action.discrete },
    analog:   { ...action.analog },
  };
  resetAction();
  return result;
}
