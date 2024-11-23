import { getPathCanvas } from "./geo";

/**
 *
 * @param { Map<string, any> } roadsLayers
 * @param { CanvasRenderingContext2D } ctx
 */
export function renderRoads(roadsLayers, mapStyles, ctx) {
  const pathCanvas = getPathCanvas(ctx);

  // roads casings / bottom layers
  for (const [key, value] of roadsLayers) {
    const layerStyles = mapStyles.get(key);
    if (!layerStyles) continue;
    ctx.beginPath();
    pathCanvas(value);
    ctx.lineWidth = layerStyles["stroke-width-casing"];
    ctx.strokeStyle = layerStyles.stroke;
    ctx.stroke();
  }

  // roads top layers
  for (const [key, value] of roadsLayers) {
    const layerStyles = mapStyles.get(key);
    if (!layerStyles) continue;

    if (key === "railways") {
      ctx.lineCap = "butt";
    } else {
      ctx.lineCap = "round";
    }

    ctx.beginPath();
    pathCanvas(value);
    ctx.lineWidth = layerStyles["stroke-width"];
    ctx.strokeStyle = layerStyles["stroke-top"];
    ctx.setLineDash(layerStyles["stroke-dasharray"] ?? []);
    ctx.stroke();
  }
}
