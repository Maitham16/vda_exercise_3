<template>
  <div class="vis-component" ref="chart">
    <!-- <div class="">
      <br/>
      <br/>
      <br/>
      <strong>Here comes the scatterplot</strong>.
    </div> -->
    <!-- add ref to select the svg for d3 rendering -->
    <svg
      class="main-svg"
      :width="svgWidth"
      :height="svgHeight"
      ref="svgEl"
    ></svg>
  </div>
</template>

<script setup>
// add d3 + watch for drawing and reacting to year changes.
import { ref, computed, onMounted, watch } from "vue";
import * as d3 from "d3";
import { useStore } from "@/stores/store.js";

// Access the Pinia store
const store = useStore();

// Define reactive properties for SVG dimensions
const svgWidth = ref(500);
const svgHeight = ref(500);
const svgPadding = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

// access SVG node, data for selected year, chart margins, and point size
const chart = ref(null);
const svgEl = ref(null);
const joined = computed(() => store.joinedByYear);
const margins = { top: 40, right: 40, bottom: 60, left: 80 };
const r = 4;

// Computed properties to get data from Pinia store
const personaleIncome = computed(() => store.personaleIncome);
const baDegreeOrHigher = computed(() => store.baDegreeOrHigher);

onMounted(() => {
  // all D3 setup/logic renders 3×3 background, axes+labels, circles, tooltips.
  function render() {
    const svg = d3.select(svgEl.value);
    svg.selectAll("*").remove();

    // Create a single tooltip DIV appended to document.body and style it inline
    // (avoid Vue scoped CSS not applying to elements created by D3)
    const tooltip = d3
      .select(document.body)
      .selectAll(".scatter-tooltip")
      .data([null])
      .join("div")
      .attr("class", "scatter-tooltip")
      .style("position", "fixed")
      .style("pointer-events", "none")
      .style("background", "rgba(0,0,0,0.78)")
      .style("color", "#fff")
      .style("padding", "4px 8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("white-space", "nowrap")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
      .style("opacity", 0)
      .style("transition", "opacity 0.08s ease")
      .style("z-index", 10000);

    const hideTooltip = () => tooltip.style("opacity", 0);
    const showTooltip = (event, d) => {
      if (!d) return;
      // Use viewport coordinates so the tooltip follows the mouse reliably
      const cx = event.clientX;
      const cy = event.clientY;
      tooltip
        .text(d.state)
        .style("opacity", 1)
        .style("left", `${cx + 12}px`)
        .style("top", `${cy + 12}px`);
    };

    const width = +svgWidth.value;
    const height = +svgHeight.value;
    const innerW = width - margins.left - margins.right;
    const innerH = height - margins.top - margins.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);
    const data = joined.value.filter(
      (d) => Number.isFinite(d.edu) && Number.isFinite(d.income)
    );

    // Guard: if data not loaded yet, wait for watchers to re-call render
    if (!data.length) return;

    const x = d3.scaleLinear().domain([10, 70]).range([0, innerW]);
    const y = d3.scaleLinear().domain([25000, 85000]).range([innerH, 0]);

    const brushed = new Set(store.selectedStates || []);
    const quadtree = d3.quadtree(
      data,
      (d) => x(d.edu),
      (d) => y(d.income)
    );

    const colW = innerW / 3;
    const rowH = innerH / 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        g.append("rect")
          .attr("x", j * colW)
          .attr("y", i * rowH)
          .attr("width", colW)
          .attr("height", rowH)
          .attr("fill", store.bivariateColors[i][j])
          .attr("opacity", 1);
      }
    }

    // Axes
    const xG = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x));
    const yG = g
      .append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format("$.0s")));

    xG.selectAll(".tick text").attr("font-size", "14px");
    yG.selectAll(".tick text").attr("font-size", "14px");

    // Axis labels
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("padding", "10px")
      .text("Educational Attainment: Bachelor's Degree or Higher (%)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("padding", "10px")
      .text("Average Yearly Personal Income (in $)");

    // Points + tooltip
    g.selectAll("circle")
      .data(data, (d) => d.state)
      .join("circle")
      .style("cursor", "pointer")
      .attr("cx", (d) => x(d.edu))
      .attr("cy", (d) => y(d.income))
      .attr("r", (d) => (d.state === store.highlightedState ? r * 1.8 : r))
      .attr("fill", "#757e83") // green fill
      .attr("stroke", "#cfcee5") // white outline

      .attr("stroke-width", (d) =>
        d.state === store.highlightedState
          ? 3
          : brushed.size === 0
          ? 1
          : brushed.has(d.state)
          ? 2
          : 1
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        store.highlightedState =
          store.highlightedState === d.state ? null : d.state;
      })
      .on("pointerover", (event, d) => {
        event.stopPropagation();
        showTooltip(event, d);
      })
      .on("pointermove", (event, d) => {
        event.stopPropagation();
        showTooltip(event, d);
      })
      .on("pointerout", () => hideTooltip())

      .attr("opacity", (d) =>
        brushed.size === 0 ? 1 : brushed.has(d.state) ? 1 : 0.25
      )

      .append("title")
      .text((d) => d.state);

    // select points within rectangle and update selectedStates
    const brush = d3.brush()
      .extent([[0, 0], [innerW, innerH]])
      // live feedback while dragging (do NOT re-render here)
      .on('brush', (event) => {
        const sel = event.selection
        if (!sel) return
        hideTooltip()
        const [[x0, y0], [x1, y1]] = sel

        const brushed = data
          .filter(d => {
            const px = x(d.edu), py = y(d.income)
            return x0 <= px && px <= x1 && y0 <= py && py <= y1
          })
          .map(d => d.state)

        const set = new Set(brushed)
        g.selectAll('circle')
          .attr('opacity', d => set.has(d.state) ? 1 : 0.25)
          .attr('stroke-width', d =>
            d.state === store.highlightedState ? 3 : (set.has(d.state) ? 2 : 1)
          )

        store.selectedStates = brushed
      })
  // finalize selection: clear or redraw once
  .on('end', (event) => {
    if (!event.selection) {
      store.selectedStates = []
    }
    // re-render once at the end to reset layers & keep the box visible
    hideTooltip()
    render()
  })


    const brushG = g.append("g").attr("class", "brush").call(brush);
  const overlay = brushG.select(".overlay");
  // Use the arrow (default) cursor for the overlay so users draw the brush with the normal pointer
  overlay.style("cursor", "default");
  // Also ensure the SVG uses the default arrow cursor (avoid plus/crosshair from other styles)
  svg.style("cursor", "default");

    overlay
      .on("mousemove.tooltip", (event) => {
        const [mx, my] = d3.pointer(event, g.node());
        const match = quadtree.find(mx, my, 15);
        if (match) {
          showTooltip(event, match);
        } else {
          hideTooltip();
        }
      })
      .on("mouseleave.tooltip", () => hideTooltip())
      .on("mousedown.tooltip", () => hideTooltip());

    // empty click inside the plot clears brush & removes rectangle
    brushG.select(".overlay").on("click", () => {
      store.selectedStates = [];
      store.highlightedState = null;
      brushG.call(brush.move, null);
      hideTooltip()
      render()
    });
  }

  // Draw once now
  render();

  // Redraw when data loads or year changes
  watch(
    () => store.joinedByYear,
    () => render(),
    { deep: true, immediate: false }
  );
  watch(
    () => store.selectedYear,
    () => render()
  );
  watch(
    () => store.highlightedState,
    () => render()
  );
});
</script>

<style scoped>
.vis-component {
  position: relative;
}

.scatter-tooltip {
  position: fixed;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 1000;
}
</style>
