import { scaleLinear, format } from "d3";
import { numberColors } from "./constants";

const lightnessScale = scaleLinear()
  .range([1, 0])
  .domain([0, numberColors - 1]);

const lightnessFormat = format(".2f");

export const paletteDark = Array.from({ length: numberColors }).map(
  (_, index) => `oklch(${lightnessFormat(lightnessScale(index))} 0 0)`,
);

export const paletteLight = [...paletteDark].reverse();

export const getCurrentPalette = () =>
  document.body.dataset.theme === "dark" ? paletteDark : paletteLight;
