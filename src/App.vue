<template>
  <div id="app">
    <div class="container-fluid">
  <h1 class="mt-3 mb-4 text-center">US-States: Personal Income vs. Educational Attainment (2006–2019)</h1>
      <div class="row">
        <div class="col-md-12">
          <YearSlider/>
        </div>
      </div>
      <div class="row">
        <div class="col-md-5">
          <Scatterplot />
        </div>
        <div class="col-md-7">
          <ChoroplethMap/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from '@/stores/store.js';

// Initialize store
const store = useStore();

// Import components
import Scatterplot from '@/components/Scatterplot.vue';
import YearSlider from '@/components/YearSlider.vue';
import ChoroplethMap from '@/components/ChoroplethMap.vue';

// Load data when component is mounted
onMounted(() => {
  store.loadData();
});
</script>

<style>
</style>
