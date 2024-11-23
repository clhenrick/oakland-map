<!-- omit from toc -->

# Oakland Map

An minimal reference map of the City of Oakland, California made using data from OpenStreetMap and the USGS National Elevation Dataset. Map design via D3JS in the browser.

![a light gray color scheme geographic map of Oakland, California centered on downtown](/img/oakland-map-light.webp)

![a dark gray color scheme geographic map of Oakland, California centered on downtown](/img/oakland-map-dark.webp)

**Table of Contents:**

- [Dependencies](#dependencies)
  - [Data Processing](#data-processing)
  - [Map Screenshotting:](#map-screenshotting)
- [Data](#data)
- [Data Processing](#data-processing-1)
- [Map Rendering](#map-rendering)
  - [Map Layer Toggling](#map-layer-toggling)
- [License](#license)
- [Credits](#credits)

## Dependencies

For the `npm` (JavaScript) dependencies it's recommended to use the correct version of NodeJS via `nvm` or similar:

```bash
nvm use
```

Install `npm` dependencies:

```bash
npm install
cd map && npm install
```

### Data Processing

Data processing requires the following dependencies to be installed:

- `make` for running the `Makefile` which has all the data processing pipeline tasks
- `curl` for making API requests to the OSM Overpass API
- `gdal` Geospatial Data Abstraction Library, open source GIS software for manipulating geospatial data
- `sd` a modern interpretation of `sed`
- `npx` a way to run `npm` packages without installing them (any modern version of `npm` should already include this tool)

I'm on a MacOS machine so installed non-npm related dependencies via homebrew:

```bash
brew install make
brew install curl
brew install gdal
brew install sd
```

> [!NOTE]
> These dependencies are not required to render the map as the necessary data files are already included in the `map/public` directory. If you want to run the data processing pipeline then you will need to make sure they are installed and available. I've installed them on MacOS with `zsh` shell and `homebrew` so if you're on a different OS you may need to make adjustments.

### Map Screenshotting:

Headless Chrome and ImageMagick are required to screenshot the map.

```bash
brew install magick
```

To run Chrome on the command line it is recommended to create an `alias` to the installation of Chrome.

```bash
alias chrome="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
```

## Data

Data is sourced from:

- OpenStreetMap using the OverPass API
- USGS National Elevation Dataset

Data wrangling is handled via a [`Makefile`](./Makefile), see [Data Processing](#data-processing) below for more info.

The final data files used to render the map:

- `map.json` a TopoJSON file used for rendering vector layers (roads, coastline, etc) and labels
- `hillshade.png` a for rendering the shaded relief of the east bay hills

Both of these files are copied from the `out` directory to the `map/public` directory for use in rendering the map.

## Data Processing

Check for installed dependencies:

```bash
make install
```

Run the data pipeline task via `make`:

```bash
make all
```

> [!NOTE]
> You may have to run `make all` a couple times as currently there is a bug with generating the `cities.geojson` file. Make will exit, but running `make all` a second time seems to fix the issue.

To clean up:

```bash
make clean
```

To print variables:

```bash
make info
```

## Map Rendering

The `map/` directory contains code for rendering the map in the browser using `d3js` and `topojson`.

The following commands are to be run within the `map` directory.

Install dependencies:

```bash
npm install
```

Start a local development server

```bash
npm run dev
```

Create the screenshots of the map:

```bash
source scripts/screenshot.sh
```

### Map Layer Toggling

Map layers may be toggled using URL query parameters:

| param          | values          | what it does                                        |
| -------------- | --------------- | --------------------------------------------------- |
| theme          | "light", "dark" | toggles the map color scheme between light and dark |
| show_roads     | true, false     | toggles visibility of the road layers               |
| show_labels    | true, false     | toggles visibility of the labels layers             |
| show_hillshade | true, false     | toggles visibility of the hillshade layer           |

Example:

```
http://localhost:5173??theme=light&show_roads=true&show_labels=false&show_hillshade=false
```

## License

- Map design copyright: Chris Henrick, 2024 – present.
- Map design license: [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Software license: MIT
- OSM data copyright OpenStreetMap Contributors

## Credits

Map design inspiration taken from [Stamen Design](https://stamen.com) & CARTO's [Positron and Dark Matter map tiles](https://carto.com/blog/getting-to-know-positron-and-dark-matter).
