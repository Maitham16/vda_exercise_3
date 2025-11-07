import { defineStore } from 'pinia';
import * as d3 from 'd3';

export const useStore = defineStore({
  id: 'main',
  state: () => ({
    selectedYear: 2006,
    selectedStates: [],
    personaleIncome: [], // Original state property
    baDegreeOrHigher: [],
    bivariateColors: [
      ['#c62aa9', '#851aa8', '#1302a6'],
      ['#d996c9', '#9292c8', '#4590c7'],
      ['#eae6dd', '#a1d4d5', '#5bc0ca']
],
    highlightedState: null,
    incomeLong: [],
    eduLong: []
  }),
  actions: {
    async loadData() {
      const incomeData = await d3.csv('./usa_personal-income-by-state_2006-2019.csv', d3.autoType)
      const educationData = await d3.csv('./usa_ba-degree-or-higher_2006-2019.csv', d3.autoType)
      const toLong = rows => rows.flatMap(r =>
        Object.keys(r).filter(k => k !== 'State').map(y => ({ state: r.State, year: +y, value: +r[y] }))
      )
      this.personaleIncome = incomeData
      this.baDegreeOrHigher = educationData
      this.incomeLong = toLong(incomeData)
      this.eduLong = toLong(educationData)
    },
    changeSelectedYear(year) {
      this.selectedYear = year;
    },
    changeSelectedState(state) {
      this.selectedStates.push(state);
    },
  },
  getters: {
    filteredPersonaleIncome(state) {
      if (!state.personaleIncome) return []; // Guard clause to handle undefined
      return state.personaleIncome
        .filter(d => state.selectedYear in d)
        .map(d => ({
          state: d.State,
          value: +d[state.selectedYear],
        }));
    },
    filteredBaDegreeOrHigher(state) {
      if (!state.baDegreeOrHigher) return []; // Guard clause to handle undefined
      return state.baDegreeOrHigher
        .filter(d => state.selectedYear in d)
        .map(d => ({
          state: d.State,
          value: +d[state.selectedYear],
        }));
    },
    // Income records for the selected year, in long format
    incomeByYear(state) {
      return state.incomeLong.filter(d => d.year === state.selectedYear)
    },
    // Education records for the selected year, in long format
    eduByYear(state) {
      return state.eduLong.filter(d => d.year === state.selectedYear)
    },
    // Thresholds (1/3 and 2/3 quantiles) for income and education for the selected year
    incomeThresholds(state) {
      return [45000, 65000]
    },
    eduThresholds(state) {
      return [30, 50]
    },
    // Join income and education by state for the selected year
    joinedByYear(state) {
      // use this to access other getters on the store
      const inc = new Map(this.incomeByYear.map(d => [d.state, d.value]))
      const edu = new Map(this.eduByYear.map(d => [d.state, d.value]))
      return [...inc.keys()]
        .filter(k => edu.has(k) && inc.get(k) != null && edu.get(k) != null)
        .map(k => ({ state: k, income: inc.get(k), edu: edu.get(k) }))
    }
    ,
    // Return a small binner function: given a value and [t1,t2] return 0/1/2
    binFor: (s) => (val, [t1, t2]) => (val < t1 ? 0 : val < t2 ? 1 : 2),
    // Binned records for the selected year with bi/bj indices and color
    binnedByYear(state) {
      const it = this.incomeThresholds, et = this.eduThresholds
      return this.joinedByYear.map(d => {
        const bi = this.binFor(d.income, it)
        const bj = this.binFor(d.edu, et)
        const color = this.bivariateColors[2 - bi][bj]
        return { state: d.state, income: d.income, edu: d.edu, bi, bj, color }
      })
    },
    // Helper that returns a function mapping state name -> color
    colorByState(state) {
      const m = new Map(this.binnedByYear.map(d => [d.state, d.color]))
      return (st) => m.get(st) || '#ccc'
    }
  },
});