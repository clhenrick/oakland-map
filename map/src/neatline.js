import { width, height } from "./constants";

export function renderNeatline(svg, mapStyles) {
  const styles = mapStyles.get("neatline");
  const strokeWidth = styles["stroke-width"];
  svg
    .append("rect")
    .attr("stroke-linejoin", "miter")
    .attr("x", strokeWidth / 2)
    .attr("y", strokeWidth / 2)
    .attr("width", width - strokeWidth)
    .attr("height", height - strokeWidth)
    .attr("fill", styles.fill)
    .attr("stroke", styles.stroke)
    .attr("stroke-width", strokeWidth);
}
