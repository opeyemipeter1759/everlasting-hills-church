"use client";

/**
 * Rasterises a chart's SVG to a PNG the user can save.
 *
 * Charts here are recharts, which renders real SVG into the DOM, so an export is
 * a serialise-and-draw rather than a re-render. The fiddly parts are all about
 * what an SVG loses the moment it leaves the page:
 *
 *  - it inherits its size from the layout, so width/height have to be stamped on
 *  - it inherits its colours from CSS, so `fill: currentColor` and any styling
 *    that lives in a stylesheet rather than an attribute has to be resolved
 *  - it inherits the page background, so without one painted in, a dark-theme
 *    chart exports as light text on transparency and looks empty
 */

/** Attributes recharts sets from CSS rather than inline, which vanish on export. */
const INHERITED_PROPERTIES = [
  "fill",
  "stroke",
  "stroke-width",
  "font-family",
  "font-size",
  "font-weight",
  "opacity",
  "text-anchor",
] as const;

/**
 * Copies the computed value of style-driven properties onto each node as an
 * attribute, so the detached copy renders the way the page does.
 */
function inlineComputedStyles(source: Element, clone: Element): void {
  const computed = window.getComputedStyle(source);
  for (const property of INHERITED_PROPERTIES) {
    const value = computed.getPropertyValue(property);
    if (value && value !== "none" && value !== "normal") {
      clone.setAttribute(property, value);
    }
  }

  const sourceChildren = source.children;
  const cloneChildren = clone.children;
  for (let i = 0; i < sourceChildren.length; i += 1) {
    if (cloneChildren[i]) inlineComputedStyles(sourceChildren[i], cloneChildren[i]);
  }
}

/**
 * A standalone copy of the chart SVG: sized, styled, and sitting on an opaque
 * background. Exported for testing — the canvas half needs a real browser.
 */
export function prepareSvg(svg: SVGSVGElement, background: string): SVGSVGElement {
  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(Math.max(Math.round(width), 1)));
  clone.setAttribute("height", String(Math.max(Math.round(height), 1)));
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`);
  }

  inlineComputedStyles(svg, clone);

  // Painted first so it sits behind every series.
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", background);
  clone.insertBefore(rect, clone.firstChild);

  return clone;
}

function filenameFor(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "chart"}-${new Date().toISOString().slice(0, 10)}.png`;
}

/**
 * Draws the SVG onto a canvas at twice device resolution and saves it.
 *
 * Resolves once the file has been handed to the browser, or rejects with
 * something worth showing — a silent no-op is what this export replaced.
 */
export async function downloadSvgAsPng(
  svg: SVGSVGElement,
  title: string,
  background: string,
): Promise<void> {
  const prepared = prepareSvg(svg, background);
  const source = new XMLSerializer().serializeToString(prepared);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

  const width = Number(prepared.getAttribute("width")) || 640;
  const height = Number(prepared.getAttribute("height")) || 320;
  const scale = Math.min(window.devicePixelRatio || 1, 2) * 2;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not render the chart for export."));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not render the chart for export.");
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not save the chart image.");

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filenameFor(title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
