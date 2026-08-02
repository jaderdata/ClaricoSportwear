export interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** New center position while dragging a layer by its body. */
export function computeMove(start: Point, current: Point, startPosition: Point): Point {
  return {
    x: startPosition.x + (current.x - start.x),
    y: startPosition.y + (current.y - start.y),
  };
}

/** New scale (clamped) while dragging the corner resize handle. */
export function computeResizeScale(
  center: Point,
  current: Point,
  startDistance: number,
  startScale: number,
  min: number,
  max: number
): number {
  const distance = Math.hypot(current.x - center.x, current.y - center.y);
  const ratio = startDistance > 0 ? distance / startDistance : 1;
  return clamp(startScale * ratio, min, max);
}

/** New rotation (degrees) while dragging the rotate handle. */
export function computeRotation(center: Point, current: Point, startAngle: number, startRotation: number): number {
  const angle = Math.atan2(current.y - center.y, current.x - center.x);
  const deltaDeg = (angle - startAngle) * (180 / Math.PI);
  return startRotation + deltaDeg;
}

export function angleAt(center: Point, point: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
