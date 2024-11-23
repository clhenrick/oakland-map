import { scaleLinear } from "d3";
import { getCurrentPalette } from "./palettes";
import { colorToAlpha } from "./utils";

export function getMapStyles() {
  const palette = getCurrentPalette();
  console.log("palette: ", palette);

  // for adjusting colors when reversing the dark palette doesn't quite cut it
  const isDarkTheme = document.body.dataset.theme === "dark";

  const styles = new Map();

  /** 1 - 4 corresponds to distinct number of road styles */
  const roadsDomain = [1, 4];
  /** min to max width of top roads layers */
  const roadsRangeTop = [1, 3];
  /** min to max width of bottom roads layers */
  const roadsRangeCasing = [2.5, 4.5];

  /** scale for top roads layer width */
  const roadsScaleTop = scaleLinear().domain(roadsDomain).range(roadsRangeTop);
  /** scale for bottom roads layer width */
  const roadsScaleCasing = scaleLinear()
    .domain(roadsDomain)
    .range(roadsRangeCasing);

  const background = palette[12];
  const water = isDarkTheme ? palette[10] : palette[11];
  const land = colorToAlpha(isDarkTheme ? palette[12] : palette[14], 0.65);
  // const landOther = palette[13];
  const railways = palette[10];
  const railwaysTop = palette[13];
  const roadsMinor = palette[10];
  const roadsMajor = palette[9];
  const roadsMinorTop = palette[13];
  const roadsMajorTop = palette[13];
  const textColor = isDarkTheme ? palette[8] : palette[7];
  const neatline = isDarkTheme ? palette[11] : palette[14];

  styles.set("neatline", {
    fill: "none",
    stroke: neatline,
    "stroke-width": 4,
  });

  styles.set("background-color", {
    fill: background,
    stroke: "none",
  });

  styles.set("sf-bay-mask", {
    fill: water,
    stroke: "none",
  });

  styles.set("land-polygons-clip", {
    fill: land,
    stroke: "none",
  });

  styles.set("waterbodies", {
    fill: water,
    stroke: "none",
  });

  // // TODO: use SVG patterns for other land uses?
  // styles.set("cemeteries", {
  //   fill: landOther,
  //   stroke: "none",
  // });

  // // TODO: use SVG patterns for other land uses?
  // styles.set("parks", {
  //   fill: landOther,
  //   stroke: "none",
  // });

  // // TODO: use SVG patterns for other land uses?
  // styles.set("industrial", {
  //   fill: landOther,
  //   stroke: "none",
  // });

  styles.set("railways", {
    fill: "none",
    stroke: railways,
    "stroke-top": railwaysTop,
    "stroke-width": roadsScaleTop(3),
    "stroke-width-casing": roadsScaleTop(3),
    "stroke-dasharray": [3, 3],
  });

  styles.set("residentialroads", {
    fill: "none",
    stroke: roadsMinor,
    "stroke-top": roadsMinorTop,
    "stroke-width": roadsScaleTop(1),
    "stroke-width-casing": roadsScaleCasing(1),
  });

  styles.set("tertiaryroads", {
    fill: "none",
    stroke: roadsMinor,
    "stroke-top": roadsMinorTop,
    "stroke-width": roadsScaleTop(1),
    "stroke-width-casing": roadsScaleCasing(1),
  });

  styles.set("secondaryroads", {
    fill: "none",
    stroke: roadsMajor,
    "stroke-top": roadsMajorTop,
    "stroke-width": roadsScaleTop(2),
    "stroke-width-casing": roadsScaleCasing(2),
  });

  styles.set("primaryroads", {
    fill: "none",
    stroke: roadsMajor,
    "stroke-top": roadsMajorTop,
    "stroke-width": roadsScaleTop(3),
    "stroke-width-casing": roadsScaleCasing(3),
  });

  styles.set("motorways", {
    fill: "none",
    stroke: roadsMajor,
    "stroke-top": roadsMajorTop,
    "stroke-width": roadsScaleTop(4),
    "stroke-width-casing": roadsScaleCasing(4),
  });

  // TODO: filter out some neighborhoods and render labels
  styles.set("neighborhoods", {
    fill: "none",
    stroke: "none",
    "font-family": "serif",
    "font-size": "10px",
  });

  styles.set("neighborhood-labels", {
    fill: textColor,
    "letter-spacing": "0.05rem",
    "font-size": "12px",
  });

  styles.set("city-labels", {
    fill: textColor,
    "letter-spacing": "0.08rem",
    "text-transform": "uppercase",
    "font-size": "14px",
    "font-size-oakland": "18px",
  });

  styles.set("water-labels", {
    fill: textColor,
    "letter-spacing": "0.08rem",
    "font-size": "14px",
    "font-style": "italic",
  });

  styles.set("attribution", {
    fill: textColor,
    "font-weight": "bold",
    "font-size": "10px",
    "text-anchor": "end",
  });

  styles.set("attribution-background", {
    fill: colorToAlpha(palette[14], 0.5),
  });

  styles.set("textColor", palette[8]);

  return styles;
}
