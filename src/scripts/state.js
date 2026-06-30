import * as d3 from 'd3';

export const state = {
  colorScale: d3.scaleOrdinal(d3.schemeTableau10),
  BASE_PATH: window.location.pathname.includes('/pulse.roots') ? '/pulse.roots' : '',
  focusedElementBeforePanel: null,
  allGenreData: null,
  genreMap: new Map(),
  activeSelectedNode: null,
  currentLayout: 'vertical',
  lastHighlightedNode: null,
  treeRoot: null,
  matchedNodes: [],
  currentMatchIndex: -1,
  historyFacts: null,
};
