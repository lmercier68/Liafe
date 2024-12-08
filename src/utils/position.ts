export function constrainPosition(x: number, y: number) {
  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
  };
}