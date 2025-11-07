# Maitham Al-rubaye
# u:account: alrubayem88
# VIS25W - Assignment 3 - Vue.js, Pinia, D3.js, Bootstrap.

## This visualization project is built using Vue.js framework (V3), Pinia, D3.js (V7.9) and Bootstrap 5.

## The data used in this project is from the following sources:
- US ba degree or higher (2006-2019): https://teaching.vda.univie.ac.at/vis/25w/data/usa_ba-degree-or-higher_2006-2019.csv
- US personal income by state (2006-2019): https://teaching.vda.univie.ac.at/vis/25w/data/usa_personal-income-by-state_2006-2019.csv
- US states GeoJSON: https://teaching.vda.univie.ac.at/vis/25w/data/us-states-geo.json

## Changes made in the following files of the boilerplate code provided for the assignment (https://github.com/asilcetin/vis-vue-d3):

- App.vue
	- I changed from a two-row layout with the slider in a narrow left column to a centered, full-width slider area.
	- I changed from showing BarChart on the left to showing Scatterplot instead (BarChart → Scatterplot).
	- I changed the page header alignment from left to centered.

- store.js
	- I changed from storing only raw CSV tables to also storing long-form rows (state, year, value) for easier year filtering.
	- I added a 3×3 bivariate color palette so all views use the same colors.
	- I added year-sliced getters (incomeByYear, eduByYear) instead of manual filtering inside components.
	- I added a joinedByYear getter to pair income and education per state for the selected year.
	- I added quantile thresholds (1/3, 2/3) for income and education to define bin boundaries.
	- I added binning and color helpers (binFor, binnedByYear, colorByState) so components look up colors consistently.
	- I added highlightedState and kept selectedStates to coordinate interactions across views.

- YearSlider.vue
	- I changed from a basic slider bound as a string to a slider that coerces the year to a number before updating the store.
	- I changed from left-aligned controls to centered slider content and label.

- Scatterplot.vue
	- I changed from a placeholder SVG to a working scatterplot that uses the store’s joinedByYear data.
	- I added a 3×3 background grid so visual bins match the bivariate palette.
	- I changed from default domains to fixed axes (edu %, income $) to match the assignment scale.
	- I changed point colors from a static fill to the store’s colorByState so colors match the map.
	- I added click-to-toggle highlight so clicking a point selects/deselects a state.
	- I added brushing with live feedback; clearing the brush also clears highlight/selection.
	- I added a cursor-following tooltip that shows the state name beside the mouse.
	- I changed the brush/overlay cursor from a plus/crosshair to the normal arrow while keeping points as pointer.
	- I changed axis tick labels to be larger for readability.

- ChoroplethMap.vue
	- I changed from a stub to a full choropleth using Albers USA projection and the provided GeoJSON.
	- I changed fills from static to the store’s bivariate colors so it stays in sync with the scatter.
	- I changed muted (unselected) states to a neutral grey so selections stand out.
	- I added click-to-toggle highlight for states and empty-map click to clear it.
	- I added a cursor-following tooltip showing the state name beside the mouse.
	- I changed the map size and top offset so it aligns visually with the scatter.

## Design Choices
- I followed the suggested solution procedure end-to-end (data prep → thresholds → binning → linked views).
- I used the same 3×3 bivariate color scheme as in the suggested procedure, with the same row/column orientation.
- Single source of truth in the Pinia store for thresholds, bins, and colors to keep the map and scatter perfectly in sync.
- Scatterplot uses fixed axes (edu % on x, income $ on y) to match the assignment scale and enable cross-year comparison.
- Map and scatter are linked: brushing on the scatter selects states; clicking in either view toggles highlight for the same state.
- Cursor-following tooltips show state names on hover in both views, without interfering with brushing.
- Unselected states on the map render in neutral grey so selected/highlighted states stand out clearly.
- Centered year slider and aligned layout so the scatter and map appear balanced and comparable.
- Defensive data handling (numeric coercion and name normalization) prevents subtle CSV/GeoJSON mismatches.
- Thresholds and bins are computed from the selected year’s distribution, so colors reflect that year’s data.

## Run the project locally
* Make sure you have Git, Node.js and npm installed on your machine
* Clone this repository by typing into a terminal:
```
git clone https://github.com/Maitham16/vda_exercise_3
```
* Go into into cloned directory by typing
```
cd vis-vue-d3
```
* Follow the steps for project setup and compiling for development

## Project setup
Installs the dependencies for the project
```
npm install
```

### Compiles and hot-reloads for development
Compiles your project code and makes the application available on a localhost instance that you can visit in your browser
```
npm run dev
```

## Online Access: https://wwwlab.cs.univie.ac.at/~alrubayem88/VIS25W/A3/

## Files:
```
├── index.html
├── jsconfig.json
├── LICENSE
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── usa_ba-degree-or-higher_2006-2019.csv
│   └── usa_personal-income-by-state_2006-2019.csv
├── README.md
├── src
│   ├── App.vue
│   ├── assets
│   │   ├── base.css
│   │   ├── logo.svg
│   │   ├── main.css
│   │   └── us-states-geo.json
│   ├── components
│   │   ├── BarChart.vue
│   │   ├── ChoroplethMap.vue
│   │   ├── Scatterplot.vue
│   │   └── YearSlider.vue
│   ├── main.js
│   └── stores
│       └── store.js
├── video.mp4
└── vite.config.js
```

## Github Repository: https://github.com/Maitham16/vda_exercise_3