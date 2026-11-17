/**
 * Camera math for the curriculum map: where the stage sits in the viewport.
 * Pure functions, no DOM — the stage is drawn with `translate(x, y)`.
 */

/** Stage offset in viewport pixels. */
export interface Camera {
  x: number;
  y: number;
}

/** A width/height pair in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** Space kept between the stage and the viewport edge when panning to an end, in pixels. */
export const EDGE = 40;

/**
 * Keeps the stage inside the viewport: an axis that fits is centered, one that doesn't
 * can pan until its far edge is EDGE pixels from the viewport edge.
 * @param camera - proposed camera
 * @param viewport - viewport size
 * @param content - stage size
 */
export function clamp(camera: Camera, viewport: Size, content: Size): Camera {
  const axis = (pos: number, view: number, size: number) => {
    if (size + EDGE * 2 <= view) return (view - size) / 2;
    return Math.min(EDGE, Math.max(view - size - EDGE, pos));
  };
  return {
    x: axis(camera.x, viewport.width, content.width),
    y: axis(camera.y, viewport.height, content.height),
  };
}

/**
 * Linear blend between two cameras, for glides.
 * @param from - start camera
 * @param to - end camera
 * @param t - progress in [0, 1]
 */
export function lerp(from: Camera, to: Camera, t: number): Camera {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}
