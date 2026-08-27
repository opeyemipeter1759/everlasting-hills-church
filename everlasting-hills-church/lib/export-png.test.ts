import { describe, expect, it, beforeEach } from "vitest";
import { prepareSvg } from "./export-png";

/**
 * The canvas half of the export needs a real browser, but everything that
 * usually breaks a chart export happens before that: an SVG detached from the
 * page loses its size, its CSS-driven colours, and the background it was sitting
 * on. These assertions cover exactly that.
 */
function makeSvg(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M0 0 L10 10");
  svg.appendChild(path);
  document.body.appendChild(svg);
  // happy-dom gives a detached element no layout, so the real size is stubbed.
  svg.getBoundingClientRect = () => ({ width: 640, height: 320 }) as DOMRect;
  return svg;
}

describe("prepareSvg", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("stamps the rendered size on, since a detached SVG has no layout", () => {
    const clone = prepareSvg(makeSvg(), "#ffffff");
    expect(clone.getAttribute("width")).toBe("640");
    expect(clone.getAttribute("height")).toBe("320");
  });

  it("adds a viewBox when the chart had none, so it scales instead of cropping", () => {
    const clone = prepareSvg(makeSvg(), "#ffffff");
    expect(clone.getAttribute("viewBox")).toBe("0 0 640 320");
  });

  it("keeps a viewBox the chart already declared", () => {
    const svg = makeSvg();
    svg.setAttribute("viewBox", "0 0 100 50");
    expect(prepareSvg(svg, "#ffffff").getAttribute("viewBox")).toBe("0 0 100 50");
  });

  it("declares the SVG namespace, without which the export renders as nothing", () => {
    expect(prepareSvg(makeSvg(), "#ffffff").getAttribute("xmlns")).toBe(
      "http://www.w3.org/2000/svg",
    );
  });

  it("paints the background behind the chart, not over it", () => {
    const clone = prepareSvg(makeSvg(), "#1c1c1e");
    const first = clone.firstChild as SVGRectElement;
    expect(first.tagName).toBe("rect");
    expect(first.getAttribute("fill")).toBe("#1c1c1e");
    // The original series must still be there, after the background.
    expect(clone.querySelector("path")).not.toBeNull();
  });

  it("leaves the chart on the page untouched", () => {
    const svg = makeSvg();
    prepareSvg(svg, "#ffffff");
    expect(svg.querySelector("rect")).toBeNull();
    expect(svg.getAttribute("width")).toBeNull();
  });
});
