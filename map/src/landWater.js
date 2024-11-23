import { getPathCanvas } from "./geo";

export function renderLandWater(otherLayers, mapStyles, ctx) {
  const pathCanvas = getPathCanvas(ctx);

  for (const [key, value] of otherLayers) {
    const layerStyles = mapStyles.get(key);
    // console.log(key, layerStyles);

    if (!layerStyles) continue;

    ctx.beginPath();
    pathCanvas(value);

    if (layerStyles.fill && layerStyles.fill !== "none") {
      ctx.fillStyle = layerStyles.fill;
      ctx.fill();
    }

    if (layerStyles.stroke && layerStyles.stroke !== "none") {
      ctx.lineWidth = layerStyles["stroke-width"];
      ctx.strokeStyle = layerStyles.stroke;
      ctx.stroke();
    }
  }
}
