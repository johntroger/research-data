import { describe, expect, it } from "vitest";
import { stepZoom, toCanvasBox, ZOOM_MAX, ZOOM_MIN } from "./pdf-view";

describe("PDF viewer geometry", () => {
  // Page 600 x 800 points shown at 1.5x: pdf.js flips y, so the matrix is [1.5, 0, 0, -1.5, 0, 1200].
  const transform = [1.5, 0, 0, -1.5, 0, 1200];

  it("turns a rectangle in PDF points (origin bottom left) into canvas pixels (origin top left)", () => {
    const box = toCanvasBox(transform, [100, 700, 300, 712]);
    expect(box).toEqual({ left: 150, top: 1200 - 712 * 1.5, width: 300, height: 18 });
  });

  it("pads the box on every side", () => {
    const box = toCanvasBox(transform, [100, 700, 300, 712], 2);
    expect(box).toEqual({ left: 148, top: 1200 - 712 * 1.5 - 2, width: 304, height: 22 });
  });

  it("handles a page shown turned a quarter circle", () => {
    // 90° rotation: x' = y, y' = x
    const box = toCanvasBox([0, 1, 1, 0, 0, 0], [10, 20, 30, 25]);
    expect(box).toEqual({ left: 20, top: 10, width: 5, height: 20 });
  });

  it("steps the zoom by a quarter and stays between the limits", () => {
    expect(stepZoom(1, 1)).toBe(1.25);
    expect(stepZoom(1, -1)).toBe(0.75);
    expect(stepZoom(ZOOM_MAX, 1)).toBe(ZOOM_MAX);
    expect(stepZoom(ZOOM_MIN, -1)).toBe(ZOOM_MIN);
  });
});
