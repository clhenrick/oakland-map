#!/bin/zsh

# screenshots the map using headless chrome and crops the screenshots to desired height using image magick
# run this script from the root of this repository via: `source scripts/screenshot.sh`
# NOTE: `chrome` is an alias to the path of chrome installation
# e.g. `alias chrome="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"`

size='3008,1504'
time=1200
crop='6016x2744+0+0'

take_screenshot() {
  chrome \
    --headless \
    --virtual-time-budget=$time \
    --screenshot="oakland-map-$1.png" \
    --window-size=$size \
    --hide-scrollbars \
    "http://localhost:5173/?theme=$1"
}

crop_screenshot() {
  magick convert "oakland-map-$1.png" -crop $crop "oakland-map-$1-cropped.png"
}

cleanup() {
  rm oakland-map-$1.png
  mv oakland-map-$1-cropped.png oakland-map-$1.png
}

all() {
  take_screenshot $1
  crop_screenshot $1
  cleanup $1
}

all "light"
all "dark"
