/** Geometry of the PDF viewer (step 3a.3), kept apart from the component so it can be tested. */

export const ZOOM_STEP = 0.25;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Zoom after one step, kept between the limits. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((zoom + direction * ZOOM_STEP) * 100) / 100));
}

/**
 * Maps a rectangle in PDF points (origin bottom left) to a box in canvas pixels (origin top left) with the viewport's
 * own matrix [a, b, c, d, e, f], padded by `pad` pixels on every side.
 */
export function toCanvasBox(transform: number[], rect: [number, number, number, number], pad = 0): Box {
  const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = transform;
  const [x0, y0, x1, y1] = rect;
  const xs = [a * x0 + c * y0 + e, a * x1 + c * y1 + e];
  const ys = [b * x0 + d * y0 + f, b * x1 + d * y1 + f];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return { left: left - pad, top: top - pad, width: Math.max(...xs) - left + 2 * pad, height: Math.max(...ys) - top + 2 * pad };
}
