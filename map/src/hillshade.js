import { width, height } from "./constants";
import { prepareCanvas } from "./utils";

/**
 *
 * @param { CanvasRenderingContext2D } ctx
 */
function loadHillshade(ctx) {
  const image = new Image(width, height);
  image.onload = function () {
    ctx.drawImage(this, 0, 0, this.width, this.height);
  };
  image.src = "/hillshade.png";
}

export function renderHillshade() {
  /** @type { CanvasRenderingContext2D } */
  const ctx = prepareCanvas("canvas#hillshade");
  loadHillshade(ctx);
}
