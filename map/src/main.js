import "./style.css";

import { renderMap } from "./map";
import { parseQueryParams } from "./utils";

window.addEventListener("DOMContentLoaded", main);

function main() {
  const flags = parseQueryParams();
  console.log("flags:", flags);

  document.body.dataset.theme = flags.theme === "dark" ? "dark" : "light";

  renderMap(flags);
}
