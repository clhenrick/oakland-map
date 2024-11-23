export const numberColors = 15;
// NOTE: aspect ratio is computed from public/hillshade.png's dimensions (367 / 803)
export const aspectRatio = 0.4570361146;
export const width = window.innerWidth;
export const height = Math.floor(width * aspectRatio);
export const scale = 3; // window.devicePixelRatio;
console.log({ width, height, scale });

/** fallback values for flags set via URL query params */
export const defaultFlags = {
  show_labels: true,
  show_hillshade: true,
  show_roads: true,
  theme: "dark",
};
