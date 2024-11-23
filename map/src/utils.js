import Color from "colorjs.io";
import queryString from "query-string";
import * as d3 from "d3";
import { width, height, scale, defaultFlags } from "./constants";

export const parseQueryParams = () => {
  const parsed = queryString.parse(location.search, { parseBooleans: true });
  return {
    ...defaultFlags,
    ...parsed,
  };
};

/**
 * @param { string } key
 * @returns { boolean }
 */
export const roadsRailFilters = (key) =>
  key === "motorways" || key.includes("roads") || key === "railways";

/**
 * @param { string } colorStr
 * @param { number } alpha
 * @returns { string }
 */
export const colorToAlpha = (colorStr, alpha) => {
  const color = new Color(colorStr);
  color.alpha = alpha;
  return color.toString();
};

/**
 * @param { string } selector
 * @returns { CanvasRenderingContext2D }
 */
export const prepareCanvas = (selector) => {
  const canvas = d3.select(selector);
  canvas
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .attr("width", Math.floor(width * scale))
    .attr("height", Math.floor(height * scale));

  /** @type { CanvasRenderingContext2D } */
  const ctx = canvas.node().getContext("2d");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.scale(scale, scale);

  return ctx;
};
