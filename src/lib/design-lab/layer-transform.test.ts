import { describe, expect, it } from 'vitest';
import { angleAt, computeMove, computeResizeScale, computeRotation, distanceBetween } from './layer-transform';

describe('computeMove', () => {
  it('translates the start position by the pointer delta', () => {
    const result = computeMove({ x: 100, y: 100 }, { x: 120, y: 90 }, { x: 10, y: 10 });
    expect(result).toEqual({ x: 30, y: 0 });
  });
});

describe('computeResizeScale', () => {
  it('scales up proportionally to the increase in distance from center', () => {
    const center = { x: 0, y: 0 };
    const result = computeResizeScale(center, { x: 20, y: 0 }, 10, 100, 30, 300);
    expect(result).toBe(200);
  });

  it('clamps to the minimum scale', () => {
    const center = { x: 0, y: 0 };
    const result = computeResizeScale(center, { x: 1, y: 0 }, 10, 100, 30, 300);
    expect(result).toBe(30);
  });

  it('clamps to the maximum scale', () => {
    const center = { x: 0, y: 0 };
    const result = computeResizeScale(center, { x: 1000, y: 0 }, 10, 100, 30, 300);
    expect(result).toBe(300);
  });

  it('falls back to a ratio of 1 when the start distance is zero', () => {
    const center = { x: 0, y: 0 };
    const result = computeResizeScale(center, { x: 20, y: 0 }, 0, 100, 30, 300);
    expect(result).toBe(100);
  });
});

describe('computeRotation', () => {
  it('adds the angular delta (in degrees) to the start rotation', () => {
    const center = { x: 0, y: 0 };
    const startAngle = angleAt(center, { x: 10, y: 0 }); // 0deg
    const current = { x: 0, y: 10 }; // 90deg
    const result = computeRotation(center, current, startAngle, 0);
    expect(result).toBeCloseTo(90);
  });

  it('accumulates on top of a non-zero start rotation', () => {
    const center = { x: 0, y: 0 };
    const startAngle = angleAt(center, { x: 10, y: 0 });
    const current = { x: -10, y: 0 }; // 180deg
    const result = computeRotation(center, current, startAngle, 45);
    expect(result).toBeCloseTo(225);
  });
});

describe('distanceBetween', () => {
  it('computes euclidean distance', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
