<template>
  <div class="vis-component" ref="chart">
    <!-- <div>
      <strong>Here comes the choropleth map</strong>.
      <p></p>
      <p></p>
      <p>Selected states on the scatter: {{ selectedStates }}</p>
    </div> -->
    <!-- add a ref so D3 can select and draw into the SVG-->
    <svg class="main-svg" :width="svgWidth" :height="svgHeight" ref="svgEl"></svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { useStore } from '@/stores/store.js';
import mapStatesUSA from '@/assets/us-states-geo.json'; // Import the map data

// Access the Pinia store
const store = useStore();

// Reactive data properties
// Make the map larger so its visual height matches the example and sits level with the scatter
const svgWidth = ref(790);
const svgHeight = ref(560);
const svgPadding = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

// store the SVG node for drawing
const svgEl = ref(null)

// Computed properties to get data from the Pinia store
const personaleIncome = computed(() => store.personaleIncome);
const baDegreeOrHigher = computed(() => store.baDegreeOrHigher);
const selectedStates = computed(() => store.selectedStates);

// onMounted hook for any D3 setup needed
onMounted(() => {
  // Draw the AlbersUSA choropleth; fill by bivariate color; gray non-brushed states; redraw on year/data/brush changes
  const svg = d3.select(svgEl.value)
  const width = +svgWidth.value
  const height = +svgHeight.value

  // add a small topOffset so the map content lines up visually with the scatter's top padding
  const topOffset = 20
  const projection = d3.geoAlbersUsa().fitSize([width, height - topOffset], mapStatesUSA)
  const path = d3.geoPath(projection)

  // create a single tooltip DIV appended to document.body so it follows the cursor reliably
  const tooltip = d3
    .select(document.body)
    .selectAll('.map-tooltip')
    .data([null])
    .join('div')
    .attr('class', 'map-tooltip')
    .style('position', 'fixed')
    .style('pointer-events', 'none')
    .style('background', 'rgba(0,0,0,0.78)')
    .style('color', '#fff')
    .style('padding', '4px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('white-space', 'nowrap')
    .style('box-shadow', '0 2px 6px rgba(0,0,0,0.2)')
    .style('opacity', 0)
    .style('transition', 'opacity 0.08s ease')
    .style('z-index', 10000)

  const hideTooltip = () => tooltip.style('opacity', 0)
  const showTooltip = (event, name) => {
    if (!name) return
    const cx = event.clientX
    const cy = event.clientY
    tooltip.text(name).style('opacity', 1).style('left', `${cx + 10}px`).style('top', `${cy + 10}px`)
  }

  function render() {
    svg.selectAll('*').remove()

  // color lookup for current year
  const colorOf = new Map((store.binnedByYear || []).map(d => [d.state, d.color]))
  const brushed = new Set(store.selectedStates || [])
  const mutedColor = '#b5b5b5' // grey for unselected states

    const highlighted = store.highlightedState

  // translate group down by topOffset to align with scatter padding
  svg.append('g').attr('transform', `translate(0, ${topOffset})`)
      .selectAll('path')
      .data(mapStatesUSA.features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const name = d.properties.name
        const c = colorOf.get(name) || mutedColor
        if (highlighted && name === highlighted) return c         // show true color for highlighted
        if (brushed.size === 0) return c
        return brushed.has(name) ? c : mutedColor                  // grey for muted
      })
      .attr('opacity', d => {
        const name = d.properties.name
        if (highlighted && name === highlighted) return 1
        return (brushed.size === 0 || brushed.has(name)) ? 1 : 0.6
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)

      // map click sets the highlighted state and empty map click clears it
      .on('click', (event, d) => {
        event.stopPropagation()
        const name = d.properties.name
        store.highlightedState = (store.highlightedState === name ? null : name)
      })
      .on('pointerover', (event, d) => {
        // show tooltip near cursor
        const name = d.properties.name
        showTooltip(event, name)
      })
      .on('pointermove', (event, d) => {
        const name = d.properties.name
        showTooltip(event, name)
      })
      .on('pointerout', () => {
        hideTooltip()
      })
      .on('pointerdown', () => {
        // hide tooltip if user starts an interaction (e.g., drag)
        hideTooltip()
      })

  // empty click inside the map clears highlight
  svg.on('click', () => {
    store.highlightedState = null
  })
  // ensure tooltip removed when component unmounts (clean HMR/cleanup)
  onUnmounted(() => {
    try {
      d3.select(document.body).selectAll('.map-tooltip').remove()
    } catch (e) {
      /* ignore */
    }
  })
  }

  // initial draw (may redraw again as data loads)
  render()

  // redraw when year/bin colors or brush selection changes
  watch(() => store.binnedByYear, () => render(), { deep: true })
  watch(() => store.selectedYear, () => render())
  watch(() => store.selectedStates, () => render(), { deep: true })
  watch(() => store.highlightedState, () => render())

});
</script>

<style scoped></style>
