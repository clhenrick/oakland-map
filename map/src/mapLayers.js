import * as topojson from "topojson";

export const getMapLayers = async () => {
  const res = await fetch("./map.json");
  if (res.ok) {
    const json = await res.json();
    const processed = handleLayers(json);
    return processed;
  }
  throw new Error("failed to load map.json");
};

const handleLayers = (mapTopoJson) => {
  const layers = new Map();
  for (const key of Object.keys(mapTopoJson.objects)) {
    layers.set(key, topojson.feature(mapTopoJson, mapTopoJson.objects[key]));
  }
  return layers;
};
