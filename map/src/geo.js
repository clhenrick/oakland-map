import * as d3 from "d3";
import { width, height } from "./constants";

// NOTE: these values are also used in the oakland-map data's Makefile for the target `$(OUTDIR)/hillshade.png`
const topLeft = [6013173.166708564, 2134456.8847583598];
const bottomRight = [6085931.132594729, 2101238.6588186114];

const cropExtent = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [topLeft, bottomRight],
  },
};

export const projection = d3
  .geoIdentity()
  .reflectY(true)
  .fitExtent(
    [
      [0, 0],
      [width, height],
    ],
    cropExtent,
  );

/**
 *
 * @param { CanvasRenderingContext2D } ctx
 * @returns { import("d3").GeoPath }
 */
export const getPathCanvas = (ctx) => d3.geoPath(projection, ctx);
export const getPathSvg = () => d3.geoPath(projection);
