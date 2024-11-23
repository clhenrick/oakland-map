SHELL = /bin/zsh

PREFIX ?= .
DATADIR := $(PREFIX)/data
OUTDIR := $(PREFIX)/out
FILETYPES := osm geojson shp overpassql tif
# Valid GeoJSON geometry types
GEOMETRY := points lines polygons multipolygons
DIRS := $(addprefix $(DATADIR)/,$(FILETYPES)) $(addprefix $(DATADIR)/geojson/,$(GEOMETRY))

# ogr2ogr common flags
OGRFLAGS := -overwrite -skipfailures -t_srs EPSG:4326 -f GeoJSON

# state plane CRS for northern CA
PROJ := EPSG:2227

# City of Oakland center, according to Wikimedia
OAK_CENTER_X := -122.27
OAK_CENTER_Y := 37.8

# amount of room to pad the center coords by
X_OFFSET := 0.2
Y_OFFSET := 0.11

# NOTE: used python here because I could not get `shell echo ...` or `shell expr` to work
# geo data bounding box coordinates, used for querying OSM and clipping land polygons
X_MIN := $(shell python3 -c "print($(OAK_CENTER_X) - $(X_OFFSET))" )
Y_MIN := $(shell python3 -c "print($(OAK_CENTER_Y) - $(Y_OFFSET))" )
X_MAX := $(shell python3 -c "print($(OAK_CENTER_X) + $(X_OFFSET))" )
Y_MAX := $(shell python3 -c "print($(OAK_CENTER_Y) + $(Y_OFFSET))" )

# OSM overpass API expects coordinates in a different order and format than Mapshaper
BBOX_OSM := "$(Y_MIN),$(X_MIN),$(Y_MAX),$(X_MAX)"
BBOX_MAPSHAPER := "$(X_MIN),$(Y_MIN),$(X_MAX),$(Y_MAX)"

# SVG element specific variables
SVG_WIDTH ?= 1280

# Mapshaper options
MAPSHAPER_FLAGS_OUTPUT_COMMON := force precision=0.000001 fix-geometry format=geojson
MAPSHAPER_FLAGS_POINTS := -filter 'name != null' -filter-fields osm_id,name -proj $(PROJ)
MAPSHAPER_FLAGS_ROADS_RAILWAYS := -clip bbox2=$(BBOX_MAPSHAPER) \
	-simplify 25% \
	-proj $(PROJ) \
	-if 'this.field_exists("highway")' -dissolve highway,name \
	-elif 'this.field_exists("railway")' -dissolve railway,name \
	-endif

MAPSHAPER_FLAGS_LAND_COMMON := -clip bbox2=$(BBOX_MAPSHAPER) remove-slivers -clean -proj $(PROJ)
MAPSHAPER_FLAGS_LAND := -clip bbox2=$(BBOX_MAPSHAPER) remove-slivers -filter-islands remove-empty min-area=0.015km2 -simplify 20% -clean -proj $(PROJ)
MAPSHAPER_FLAGS_WATER := -clip bbox2=$(BBOX_MAPSHAPER) remove-slivers -filter-islands remove-empty min-area=0.015km2 -simplify 70% -clean -proj $(PROJ)
MAPSHAPER_FLAGS_PARKS := -clip bbox2=$(BBOX_MAPSHAPER) -clean -proj $(PROJ)
MAPSHAPER_FLAGS_INPUT_SVG := combine-files -style fill=none stroke="\#aaa" stroke-width=0.8
MAPSHAPER_FLAGS_OUTPUT_SVG := force format=svg width=$(SVG_WIDTH)

# NED DEM GeoTiff
DEM_URI ?= https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1/TIFF/historical/n38w123/USGS_1_n38w123_20240826.tif
DEM_SRC_FILE := $(shell basename $(DEM_URI))

# Overpass API endpoint
API ?= http://overpass-api.de/api/interpreter
CURLFLAGS := -s

RAILWAYS_PROCESSED := $(DATADIR)/geojson/lines/railways.geojson

ROADS_PROCESSED := $(DATADIR)/geojson/lines/residentialroads.geojson
ROADS_PROCESSED += $(DATADIR)/geojson/lines/tertiaryroads.geojson
ROADS_PROCESSED += $(DATADIR)/geojson/lines/secondaryroads.geojson
ROADS_PROCESSED += $(DATADIR)/geojson/lines/primaryroads.geojson
ROADS_PROCESSED += $(DATADIR)/geojson/lines/motorways.geojson

LAND_AREAS_PROCESSED := $(DATADIR)/geojson/multipolygons/land-polygons-clip.geojson
LAND_AREAS_PROCESSED += $(DATADIR)/geojson/multipolygons/cemeteries.geojson
LAND_AREAS_PROCESSED += $(DATADIR)/geojson/multipolygons/industrial.geojson
LAND_AREAS_PROCESSED += $(DATADIR)/geojson/multipolygons/parks.geojson

SF_BAY_MASK := $(DATADIR)/geojson/multipolygons/sf-bay-mask.geojson

WATER_FEATURES := $(DATADIR)/geojson/multipolygons/waterbodies.geojson

CULTURAL_FEATURES := $(DATADIR)/geojson/points/neighborhoods.geojson
CULTURAL_FEATURES += $(DATADIR)/geojson/points/cities.geojson

# order is important, svg layers will be rendered in the order they are listed here
MAP_DATA_ALL := $(SF_BAY_MASK) $(LAND_AREAS_PROCESSED) $(WATER_FEATURES) $(RAILWAYS_PROCESSED) $(ROADS_PROCESSED) $(CULTURAL_FEATURES)

.PHONY: all clean install info clean_hillshade

# prints useful stuff to the console; mainly for sanity checks & debugging
info:
	@echo center: $(OAK_CENTER_X) $(OAK_CENTER_Y)
	@echo X_MIN: $(X_MIN)
	@echo Y_MIN: $(Y_MIN)
	@echo X_MAX: $(X_MAX)
	@echo Y_MAX: $(Y_MAX)
	@echo BBOX_OSM: $(BBOX_OSM)
	@echo BBOX_MAPSHAPER: $(BBOX_MAPSHAPER)
	@echo DEM source file: $(DEM_SRC_FILE)
	@echo SQL_SF_BAY_MASK: "$(SQL_SF_BAY_MASK)"

# creates the final output topojson file
$(OUTDIR)/map.json: $(MAP_DATA_ALL)
	npx mapshaper -i $^ combine-files -o $@ force format=topojson

# creates the final map.svg from processed data
$(OUTDIR)/map.svg: $(MAP_DATA_ALL)
	npx mapshaper -i $^ $(MAPSHAPER_FLAGS_INPUT_SVG) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_SVG)

# sf bay mask sql query for spatialite
# code credit: https://gis.stackexchange.com/questions/213851/more-on-cutting-polygons-with-polygons-in-postgis
SQL_SF_BAY_MASK := SELECT ST_Difference(a.geometry, (SELECT ST_Union(b.geometry)
SQL_SF_BAY_MASK += FROM '$(DATADIR)/geojson/multipolygons/land-polygons-clip.geojson'.land-polygons-clip b
SQL_SF_BAY_MASK += WHERE ST_Intersects(b.geometry, a.geometry))) as geometry
SQL_SF_BAY_MASK += FROM clip_extent a

# sf bay mask, for masking out hillshade in the sf bay
$(SF_BAY_MASK): $(DATADIR)/shp/clip_extent.shp $(DATADIR)/geojson/multipolygons/land-polygons-clip.geojson | $(DATADIR)/geojson/multipolygons/
	ogr2ogr \
	  -f "GeoJSON" \
	  $@ $< \
	  -t_srs "EPSG:2227" \
	  -s_srs "EPSG:2227" \
	  -dialect SQLite \
	  -sql "$(SQL_SF_BAY_MASK)"

# bbox shp, used for creating sf bay mask
$(DATADIR)/shp/clip_extent.shp: | $(DATADIR)/shp
	npx mapshaper -rectangle bbox="$(BBOX_MAPSHAPER)" -proj "EPSG:2227" -o $@ format=shapefile

# converts OSM data to GeoJSON line geometries
$(DATADIR)/geojson/lines/%.geojson: $(DATADIR)/osm/%.osm | $(DATADIR)/geojson/lines
	ogr2ogr $@ $^ lines $(OGRFLAGS)
	npx mapshaper -i $@ $(MAPSHAPER_FLAGS_ROADS_RAILWAYS) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# point data for place & natural feature labels (neighborhoods, cities, etc.)
$(DATADIR)/geojson/points/%.geojson: $(DATADIR)/osm/%.osm | $(DATADIR)/geojson/points/
	ogr2ogr $@ $< points $(OGRFLAGS)
	npx mapshaper -i $@ $(MAPSHAPER_FLAGS_POINTS) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# processed osm cemetery areas polygons as geojson
$(DATADIR)/geojson/multipolygons/cemeteries.geojson: $(DATADIR)/osm/cemeteries.osm | $(DATADIR)/geojson/multipolygons/
	ogr2ogr $@ $< multipolygons $(OGRFLAGS)
	npx mapshaper -i $@ $(MAPSHAPER_FLAGS_LAND_COMMON) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# processed osm industrial areas polygons as geojson
$(DATADIR)/geojson/multipolygons/industrial.geojson: $(DATADIR)/osm/industrial.osm | $(DATADIR)/geojson/multipolygons/
	ogr2ogr $@ $< multipolygons $(OGRFLAGS)
	npx mapshaper -i $@ $(MAPSHAPER_FLAGS_LAND_COMMON) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# processed osm water polygons as geojson
$(DATADIR)/geojson/multipolygons/waterbodies.geojson: $(DATADIR)/osm/waterbodies.osm | $(DATADIR)/geojson/multipolygons/
	ogr2ogr $@ $< multipolygons $(OGRFLAGS)
	npx mapshaper -i $@ $(MAPSHAPER_FLAGS_WATER) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# processed osm parks / nature reserves as geojson
$(DATADIR)/geojson/multipolygons/parks.geojson: $(DATADIR)/osm/parks.osm | $(DATADIR)/geojson/multipolygons/
	ogr2ogr $@ $< multipolygons $(OGRFLAGS)
	npx mapshaper -i $@ $(MAPSHAPER_FLAGS_PARKS) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# processed osm land polygons as geojson
$(DATADIR)/geojson/multipolygons/land-polygons-clip.geojson: $(DATADIR)/shp/land-polygons-complete-4326/land_polygons.shp | $(DATADIR)/geojson/multipolygons/
	npx mapshaper -i $^ $(MAPSHAPER_FLAGS_LAND) -o $@ $(MAPSHAPER_FLAGS_OUTPUT_COMMON)

# land polygons shapefile data is large, avoid re-downloading it
.PRECIOUS: $(DATADIR)/shp/%.*

$(DATADIR)/shp/land-polygons-complete-4326/land_polygons.shp: | $(DATADIR)/shp
	curl -O https://osmdata.openstreetmap.de/download/land-polygons-complete-4326.zip
	unzip -o "land-polygons-complete-4326.zip" -d $(DATADIR)/shp
	rm -f "land-polygons-complete-4326.zip"

# OSM files are precious because they tend to be big, we don't want make to delete them
.PRECIOUS: $(DATADIR)/osm/%.osm

# POST the query to the OSM overpass API
$(DATADIR)/osm/%.osm: $(DATADIR)/overpassql/%.overpassql | $(DATADIR)/osm
	curl $(API) $(CURLFLAGS) -o $@ --data @$<

# find and replace "{{bbox}}" in our overpassql queries with the $(BBOX_OSM) var
$(DATADIR)/overpassql/%.overpassql: overpassql/%.overpassql | $(DATADIR)/overpassql
	cat $< | sd "\{\{bbox\}\}" $(BBOX_OSM) > $@

# GeoTiffs are quite large, don't delete them after downloading them
.PRECIOUS: $(DATADIR)/tif/%.tif

# source DEM from NED
$(DATADIR)/tif/$(DEM_SRC_FILE): | $(DATADIR)/tif
	curl $(DEM_URI) -o $@

DEM_MIN_ELEV := 10

# remove lower elevation areas
$(DATADIR)/tif/dem_calc.tif: $(DATADIR)/tif/$(DEM_SRC_FILE) | $(DATADIR)/tif
	gdal_calc.py -A $< --outfile=$@ --calc="A*(A>=$(DEM_MIN_ELEV))" --NoDataValue="none"

# convert the DEM to 8 bit grayscale
# NOTE: -scale value was a result of doing `gdalinfo -mm` on source DEM and noting values for "Pixel Size"
$(DATADIR)/tif/dem_8bit_gray.tif: $(DATADIR)/tif/dem_calc.tif | $(DATADIR)/tif
	gdal_translate \
		-scale -102.710 985.003 0 255 \
		-ot Byte \
		$< $@ \
		-co COMPRESS=LZW

# reprojected and clipped DEM from NED
# NOTE: clipping coordinates taken doing: `ogrinfo -al -so data/geojson/lines/motorways.geojson`
$(DATADIR)/tif/dem_2227_clipped.tif: $(DATADIR)/tif/dem_8bit_gray.tif | $(DATADIR)/tif
	gdalwarp \
		-s_srs "EPSG:4269" \
		-t_srs "$(PROJ)" \
		-r bilinear \
		-te 5991814.455729 2077637.509986 6108712.479361 2158932.304889 \
		$< $@ \
		-co COMPRESS=LZW

# hillshade generated from clipped & reprojected DEM
# -b 1 -z 1.5 -s 1.0 -alt 75.0
$(DATADIR)/tif/hillshade.tif: $(DATADIR)/tif/dem_2227_clipped.tif | $(DATADIR)/tif
	gdaldem hillshade $< $@ -s 0.03048 -of GTiff -igor -co COMPRESS=LZW

# convert hillshade to PNG format for the web and crop to final desired extent
# NOTE: value passed to `-te` flag is derived from oakland-map-viz extent
$(OUTDIR)/hillshade.png: $(DATADIR)/tif/hillshade.tif | $(OUTDIR)
	gdalwarp \
	-te 6013173.166708564 2101238.6588186114 6085931.132594729 2134456.8847583598 \
	-r bilinear \
	-of PNG \
	$< $@ \
	-co worldfile=YES

# creates any necessary output directory
$(DIRS): ; mkdir -p $@

clean:
	rm -rf $(DATADIR)
	rm -rf $(OUTDIR)

clean_hillshade:
	rm $(DATADIR)/tif/dem*
	rm $(DATADIR)/tif/hillshade.tif
	rm $(OUTDIR)/hillshade*

# install dependencies if not found
# FIXME: not sure how to correctly handle nvm & correct node version
install:
	which sd || brew install sd
	which ogr2ogr || brew install gdal
	test $(SHELL) -l -c 'nvm use' || $(SHELL) -l -c 'nvm install'
	test -d "node_modules" || npm install

all: $(OUTDIR)/map.svg $(OUTDIR)/map.json $(OUTDIR)/hillshade.png
