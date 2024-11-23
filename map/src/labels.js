import * as d3 from "d3";
import { getPathSvg } from "./geo";
import { width, height } from "./constants";

const fontFamily = `Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif`;
const pathSvg = getPathSvg();

const textOffsetDy = "1.3em";

/** @type { Set<string>} */
const neighborhoodRemoveList = new Set([
  "2729523599",
  "6383916996",
  "6383916996",
  "358808952",
  "4287067158",
  "10139029526",
  "1214036345",
  "2521367678",
  "1214036332",
  "4287067163",
  "2984041827",
  "4287067159",
  "2308943878",
  "1102389836",
  "1214036363",
  "4259927957",
  "358822394",
  "300787004",
  "4609282252",
  "6356958471",
  "8386071501",
  "5458228244",
  "1281064684",
  "295254135", // jingletown
  "4609282246", // millsmont
  "150958342", // fernside
  "2984042203", // Longfellow
]);

/**
 * @param { Selection<SVGElement> } svg
 * @param { Map<string, any> } layers
 */
export function renderLabels(svg, layers, mapStyles) {
  const labelsGroup = svg
    .append("g")
    .attr("id", "labels")
    .attr("font-family", fontFamily)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle");

  const neighborhoods = layers.get("neighborhoods").features;
  const cities = layers.get("cities").features;
  renderNeighborhoods(labelsGroup, neighborhoods, mapStyles);
  renderCities(labelsGroup, cities, mapStyles);
  renderWaterFeaturesLabels(labelsGroup, mapStyles);
  renderAttributionLabel(labelsGroup, mapStyles);
}

function renderAttributionLabel(labelsGroup, mapStyles) {
  const attribution = [
    "Map design © Chris Henrick 2024 - present",
    "Map data © OpenStreetMap contributors",
  ];
  const styles = mapStyles.get("attribution");
  const offsetY = 20;
  const offsetX = 6;
  const x = width - offsetX;
  const y = height - offsetY;
  const attributionGroup = labelsGroup
    .append("g")
    .attr("id", "attribution")
    .attr("transform", `translate(${x}, ${y})`)
    .attr("text-anchor", styles["text-anchor"])
    .attr("fill", styles.fill)
    .attr("font-size", styles["font-size"])
    .attr("letter-spacing", styles["letter-spacing"]);

  attributionGroup
    .append("rect")
    .attr("x", -225 + offsetX)
    .attr("y", -15)
    .attr("width", 225)
    .attr("height", 40)
    .attr("fill", mapStyles.get("attribution-background").fill);

  attributionGroup
    .append("text")
    .selectAll("tspan")
    .data(attribution)
    .enter()
    .append("tspan")
    .attr("x", 0)
    .attr("dy", (d, i) => (i ? textOffsetDy : undefined))
    .text((d) => d);
}

function filterNeighborhoods(d) {
  const result = !neighborhoodRemoveList.has(d.properties.osm_id);
  // console.log(result);
  // console.log(d.properties.name, d.properties.osm_id);
  return result;
}

function formatNeighborhoodText(text) {
  const split = text.split(" ").reduce((acc, cur, i, arr) => {
    const next = arr[i + 1];
    const minLength = 4;
    const shouldConcatenate =
      next?.length < minLength || cur.length < minLength;
    if (shouldConcatenate) {
      delete arr[i + 1];
      cur += " " + next;
    }
    return [...acc, cur.trim()];
  }, []);
  return split;
}

function renderNeighborhoodLabel(d) {
  // const id = d.properties.osm_id;
  const text = d.properties.name;
  // console.log(id, text);
  const textArr = formatNeighborhoodText(text);
  d3.select(this)
    .append("text")
    .selectAll("tspan")
    .data(textArr)
    .enter()
    .append("tspan")
    .attr("x", 0)
    .attr("dy", (d, i) => (i ? textOffsetDy : undefined))
    .text((d) => d);
}

/**
 * @param { Selection<SVGGElement> } labelsGroup
 * @param { [] } features
 */
function renderNeighborhoods(labelsGroup, features, mapStyles) {
  const styles = mapStyles.get("neighborhood-labels");

  // additional "neighborhoods" to add
  features = features.concat([
    createPointGeometry(
      [6021202.111996171, 2128365.14112991],
      "Treasure Island",
    ),
  ]);
  labelsGroup
    .append("g")
    .attr("id", "neighborhood-labels")
    .attr("fill", styles.fill)
    .attr("stroke", styles.stroke)
    .attr("stroke-width", styles["stroke-width"])
    .attr("font-size", styles["font-size"])
    .attr("letter-spacing", styles["letter-spacing"])
    .selectAll(".neighborhood-label")
    .data(features.filter(filterNeighborhoods))
    .enter()
    .append("g")
    .classed("neighborhood-label", true)
    .attr("transform", (d) => {
      const { name } = d.properties;
      let [x, y] = pathSvg.centroid(d);

      // HACK: manually adjust labels to prevent text being cut off or overlap
      // NOTE: intended for a large monitor, results may differ on smaller screen sizes
      if (/rockridge/i.test(name)) {
        y = 18;
      }

      // nudge label above water features to prevent overlap
      if (/gold\scoast/i.test(name)) {
        [x, y] = pathSvg.centroid(
          createPointGeometry([6051706.976261441, 2107031.5233900994], name),
        );
      }

      // ditto
      if (/jack\slondon\ssquare/i.test(name)) {
        [x, y] = pathSvg.centroid(
          createPointGeometry([6048946.861278108, 2117469.8488101233], name),
        );
      }

      return transformTranslateLabel(x, y);
    })
    .each(renderNeighborhoodLabel);
}

function renderCityLabel(d) {
  let text = d.properties.name.split(" ");
  d3.select(this)
    .append("text")
    .selectAll("tspan")
    .data(text)
    .enter()
    .append("tspan")
    .attr("x", 0)
    .attr("dy", (d, i) => {
      if (d === "Francisco") {
        return i ? textOffsetDy : 0;
      }
    })
    .attr("text-anchor", (d) =>
      d === "San" || d === "Francisco" ? "start" : "middle",
    )
    .text((d) => d);
}

function renderCities(labelsGroup, features, mapStyles) {
  const styles = mapStyles.get("city-labels");

  // additional cities to add
  features = features.concat([
    createPointGeometry(
      [6014821.409987838, 2108030.7015794874],
      "San Francisco",
    ),
  ]);

  labelsGroup
    .append("g")
    .attr("id", "city-labels")
    .style("text-transform", styles["text-transform"])
    .style("letter-spacing", styles["letter-spacing"])
    .attr("font-size", styles["font-size"])
    .attr("fill", styles.fill)
    .attr("stroke", styles.stroke)
    .attr("stroke-width", styles["stroke-width"])
    .selectAll(".city-label")
    .data(features)
    .enter()
    .append("g")
    .classed("city-label", true)
    .style("font-size", (d) =>
      d.properties.name === "Oakland" ? styles["font-size-oakland"] : undefined,
    )
    .attr("transform", (d) => {
      const [x, y] = pathSvg.centroid(d);
      return transformTranslateLabel(x, y);
    })
    .each(renderCityLabel);
}

function renderWaterLabel(d) {
  let text = d.properties.name.split(" ");
  d3.select(this)
    .append("text")
    .selectAll("tspan")
    .data(text)
    .enter()
    .append("tspan")
    .attr("x", 0)
    .attr("dy", (d, i) => (i ? textOffsetDy : 0))
    .text((d) => d);
}

function renderWaterFeaturesLabels(labelsGroup, mapStyles) {
  const sfBayLabel = createPointGeometry(
    [6024380.204516682, 2116854.403787895],
    "San Francisco Bay",
  );
  const lakeMerritLabel = createPointGeometry(
    [6053844.162614139, 2119708.8948037853],
    "Lake Merritt",
  );
  const oaklandEstuaryLabel = createPointGeometry(
    [6051272.278499121, 2113917],
    "Oakland Estuary",
  );
  const features = [sfBayLabel, lakeMerritLabel, oaklandEstuaryLabel];
  const styles = mapStyles.get("water-labels");

  labelsGroup
    .append("g")
    .attr("id", "water-labels")
    .style("text-transform", styles["text-transform"])
    .style("letter-spacing", styles["letter-spacing"])
    .attr("font-size", styles["font-size"])
    .attr("font-style", styles["font-style"])
    .attr("fill", styles.fill)
    .attr("stroke", styles.stroke)
    .attr("stroke-width", styles["stroke-width"])
    .attr("text-anchor", "middle")
    .selectAll(".city-label")
    .data(features)
    .enter()
    .append("g")
    .classed("water-label", true)
    .attr("transform", (d) => {
      const [x, y] = pathSvg.centroid(d);
      return transformTranslateLabel(x, y);
    })
    .each(renderWaterLabel);
}

function transformTranslateLabel(x, y) {
  return `translate(${Math.floor(x)}, ${Math.floor(y)})`;
}

function createPointGeometry(coordinates, name) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates,
    },
    properties: {
      name,
    },
  };
}
