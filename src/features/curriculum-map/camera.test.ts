import { describe, expect, it } from 'vitest';
import { clamp, EDGE, lerp } from './camera';

const viewport = { width: 1000, height: 600 };

describe('clamp', () => {
  it('centers an axis whose content fits', () => {
    expect(clamp({ x: 300, y: -50 }, viewport, { width: 400, height: 200 })).toEqual({ x: 300, y: 200 });
  });

  it('stops panning past the start with an EDGE margin', () => {
    expect(clamp({ x: 500, y: 0 }, viewport, { width: 2400, height: 200 }).x).toBe(EDGE);
  });

  it('stops panning past the end with an EDGE margin', () => {
    expect(clamp({ x: -5000, y: 0 }, viewport, { width: 2400, height: 200 }).x).toBe(1000 - 2400 - EDGE);
  });

  it('leaves a position inside the range alone', () => {
    expect(clamp({ x: -300, y: 0 }, viewport, { width: 2400, height: 200 }).x).toBe(-300);
  });
});

describe('lerp', () => {
  it('blends both axes', () => {
    expect(lerp({ x: 0, y: 100 }, { x: 100, y: 0 }, 0.25)).toEqual({ x: 25, y: 75 });
  });
});
