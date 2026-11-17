/**
 * Path builders for the four channel signals on the hero oscilloscope.
 * Pure geometry in SVG user units — no DOM, no framework.
 *
 * All traces share one base period so the four channels stay visually in step.
 */

/** Base period in user units: sine, trapezoid and square repeat every half of it; the wave packet once. */
export const SWEEP_PERIOD = 118;

/** A horizontal lane on the scope screen. */
export interface Lane {
  /** Left edge where the signal starts. */
  x0: number;
  /** Total length to draw (the screen width). */
  length: number;
  /** Vertical center of the lane. */
  y: number;
  /** Peak amplitude (half of peak-to-peak). */
  amp: number;
}

/** Rounds to one decimal to keep the generated markup small. */
const round = (n: number): number => Math.round(n * 10) / 10;

/**
 * Samples a periodic function along a lane.
 * @param lane - where to draw
 * @param period - wave period in user units
 * @param step - sampling distance in user units
 * @param f - signal value in [-1, 1] for a phase t in [0, 1)
 * @returns an SVG path `d` string
 */
function sampled(lane: Lane, period: number, step: number, f: (t: number) => number): string {
  const points: string[] = [];
  for (let x = 0; x <= lane.length; x += step) {
    const t = (x % period) / period;
    points.push(`${round(lane.x0 + x)} ${round(lane.y - lane.amp * f(t))}`);
  }
  return `M${points.join(' L')}`;
}

/**
 * Repeats a piecewise-linear shape along a lane (exact corners, no sampling).
 * @param lane - where to draw
 * @param period - wave period in user units
 * @param shape - vertices of one period as [t, value], t in [0, 1], value in [-1, 1]
 * @returns an SVG path `d` string
 */
function piecewise(lane: Lane, period: number, shape: ReadonlyArray<readonly [number, number]>): string {
  const points: string[] = [];
  for (let start = 0; start <= lane.length; start += period) {
    for (const [t, v] of shape) {
      const x = start + t * period;
      if (x > lane.length) break;
      points.push(`${round(lane.x0 + x)} ${round(lane.y - lane.amp * v)}`);
    }
  }
  return `M${points.join(' L')}`;
}

/** CH1 · Ciencia básica — sine. */
export const sinePath = (lane: Lane): string =>
  sampled(lane, SWEEP_PERIOD / 2, 2, (t) => Math.sin(2 * Math.PI * t));

/** CH2 · Mecánica y diseño — trapezoid. */
export const trapezoidPath = (lane: Lane): string =>
  piecewise(lane, SWEEP_PERIOD / 2, [
    [0, -1],
    [0.15, 1],
    [0.5, 1],
    [0.65, -1],
    [1, -1],
  ]);

/** CH3 · Electrónica — square. */
export const squarePath = (lane: Lane): string =>
  piecewise(lane, SWEEP_PERIOD / 2, [
    [0, 1],
    [0.5, 1],
    [0.5, -1],
    [1, -1],
  ]);

/** CH4 · Física teórica — wave packet (Gaussian envelope × carrier), one packet per loop. */
export const packetPath = (lane: Lane): string =>
  sampled(lane, SWEEP_PERIOD, 1, (t) => Math.exp(-(((t - 0.5) / 0.16) ** 2)) * Math.sin(2 * Math.PI * 7 * t));
