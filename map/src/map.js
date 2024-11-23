import * as d3 from "d3";
import { getMapLayers } from "./mapLayers";
import { getMapStyles } from "./mapStyles";
import { prepareCanvas, roadsRailFilters } from "./utils";
import { width, height } from "./constants";
import { renderHillshade } from "./hillshade";
import { renderLabels } from "./labels";
import { renderRoads } from "./roads";
import { projection } from "./geo";
import { renderLandWater } from "./landWater";
import { renderNeatline } from "./neatline";

/**
 * @typedef { object } Flags
 * @property { boolean } show_labels
 * @property { boolean } show_places
 */

/**
 * renders the SVG map with some layers optionally enabled
 * @param { Flags } flags
 */
export async function renderMap(flags) {
  const mapStyles = getMapStyles();
  console.log("mapStyles: ", mapStyles);

  const layers = await getMapLayers();
  console.log("map layers: ", layers);

  const roadsLayers = new Map(
    Array.from(layers).filter(([key]) => roadsRailFilters(key)),
  );

  const otherLayers = new Map(
    Array.from(layers).filter(([key]) => !roadsRailFilters(key)),
  );

  /** @type { CanvasRenderingContext2D } */
  const ctx = prepareCanvas("canvas#layers");

  const svg = d3
    .select("svg")
    .attr("width", width)
    .attr("height", height)
    // .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .style("max-width", "100%")
    // log coordinates on click for adjusting map extent
    .on("click", function (event) {
      console.log(projection.invert(d3.pointer(event)));
    });

  // HILLSHADE
  if (flags.show_hillshade) {
    renderHillshade();
  }

  // LAND & WATER
  renderLandWater(otherLayers, mapStyles, ctx);

  // ROADS
  if (flags.show_roads) {
    renderRoads(roadsLayers, mapStyles, ctx);
  }

  // LABELS
  if (flags.show_labels) {
    renderLabels(svg, layers, mapStyles);
  }

  // NEATLINE
  renderNeatline(svg, mapStyles);
}
