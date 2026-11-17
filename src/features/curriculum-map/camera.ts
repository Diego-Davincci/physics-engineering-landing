/**
 * Camera math for the curriculum map: where the stage sits and how big it is.
 * Pure functions, no DOM — the stage is drawn with `translate(x, y) scale(scale)`.
 */

/** Stage offset in screen pixels and its zoom factor. */
export interface Camera {
  x: number;
  y: number;
  scale: number;
}

/** A width/height pair in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** A point in viewport pixels. */
export interface Point {
  x: number;
  y: number;
}

export const MIN_SCALE = 0.35;
export const MAX_SCALE = 1.6;

/** Below this zoom the cards are too small to read, so only their colors are shown. */
export const LOW_DETAIL_SCALE = 0.55;

/** Space kept between the stage and the viewport edge when panning to an end, in pixels. */
const EDGE = 40;

/**
 * Keeps the stage inside the viewport: an axis that fits is centered, one that doesn't
 * can pan until its far edge is EDGE pixels from the viewport edge.
 * @param camera - proposed camera
 * @param viewport - viewport size
 * @param content - stage size at scale 1
 */
export function clamp(camera: Camera, viewport: Size, content: Size): Camera {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, camera.scale));
  const axis = (pos: number, view: number, size: number) => {
    const scaled = size * scale;
    if (scaled + EDGE * 2 <= view) return (view - scaled) / 2;
    return Math.min(EDGE, Math.max(view - scaled - EDGE, pos));
  };
  return {
    scale,
    x: axis(camera.x, viewport.width, content.width),
    y: axis(camera.y, viewport.height, content.height),
  };
}

/**
 * Zooms by a factor while keeping the stage point under `anchor` fixed on screen.
 * @param camera - current camera
 * @param factor - multiplier for the scale (>1 zooms in)
 * @param anchor - viewport point that stays put (cursor, pinch center, viewport center)
 */
export function zoomAt(camera: Camera, factor: number, anchor: Point): Camera {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, camera.scale * factor));
  const ratio = scale / camera.scale;
  return {
    scale,
    x: anchor.x - (anchor.x - camera.x) * ratio,
    y: anchor.y - (anchor.y - camera.y) * ratio,
  };
}

/**
 * Camera that shows the whole stage, never zooming in past 1.
 * @param viewport - viewport size
 * @param content - stage size at scale 1
 */
export function fit(viewport: Size, content: Size): Camera {
  const scale = Math.max(
    MIN_SCALE,
    Math.min(1, (viewport.width - EDGE * 2) / content.width, (viewport.height - EDGE * 2) / content.height),
  );
  return {
    scale,
    x: (viewport.width - content.width * scale) / 2,
    y: (viewport.height - content.height * scale) / 2,
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
    scale: from.scale + (to.scale - from.scale) * t,
  };
}
