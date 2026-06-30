import * as d3 from 'd3';
import { state } from './state.js';
import { slugify } from './utils.js';

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

function showTooltip(event, d) {
  if (d.depth === 0) return;

  const desc = d.data.description || '';
  const truncatedDesc = desc.length > 120 ? desc.substr(0, 120).replace(/\s+\S*$/, '') + '…' : desc;

  tooltip.transition().duration(200).style('opacity', 0.95);
  tooltip.html(`
    <h3>${d.data.name}</h3>
    ${truncatedDesc ? `<p>${truncatedDesc}</p>` : ''}
    <p><i class="bi bi-arrow-up-right-circle"></i> Click para detalles</p>
  `)
    .style('left', Math.min(event.pageX + 12, window.innerWidth - 300) + 'px')
    .style('top', (event.pageY - 24) + 'px');
}

function hideTooltip() {
  tooltip.transition().duration(200).style('opacity', 0);
}

export function createTree(data) {
  const svgContainer = d3.select('#treemap');
  svgContainer.selectAll('*').remove();

  const containerBounds = svgContainer.node().getBoundingClientRect();
  const containerWidth = containerBounds.width;

  let height, innerWidth, innerHeight, margin, treeLayout;

  function transformToHierarchyForCount(node) {
    const newNode = { name: node.name || node.style };
    if (node.substyles && node.substyles.length > 0) {
      newNode.children = node.substyles.map(transformToHierarchyForCount);
    }
    return newNode;
  }

  const tempHierarchicalData = {
    name: 'Electronic Music',
    children: data.map(transformToHierarchyForCount)
  };
  const tempRoot = d3.hierarchy(tempHierarchicalData);
  const totalNodes = tempRoot.descendants().length;

  if (state.currentLayout === 'vertical') {
    margin = { top: 20, right: 250, bottom: 20, left: 50 };
    const nodeSpacing = 22;
    height = Math.max(1000, totalNodes * nodeSpacing);
    innerWidth = containerWidth - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    treeLayout = d3.tree().size([innerHeight, innerWidth]);
  } else {
    margin = { top: 20, right: 20, bottom: 20, left: 20 };
    height = Math.min(window.innerHeight * 1.8, 1400);
    innerWidth = containerWidth - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(containerWidth, height) / 2 - 150;
    treeLayout = d3.tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
  }

  const svg = svgContainer.attr('width', containerWidth)
    .attr('height', height)
    .attr('viewBox', `0 0 ${containerWidth} ${height}`);

  const defs = svg.append('defs');
  const filter = defs.append('filter')
    .attr('id', 'svg-glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');
  filter.append('feGaussianBlur')
    .attr('stdDeviation', '3')
    .attr('result', 'coloredBlur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  svg.append('rect')
    .attr('width', containerWidth)
    .attr('height', height)
    .attr('fill', 'transparent')
    .on('click', () => {
      state.activeSelectedNode = null;
      clearBranchHighlight();
    });

  const g = svg.append('g');

  if (state.currentLayout === 'vertical') {
    g.attr('transform', `translate(${margin.left},${margin.top})`);
  } else {
    g.attr('transform', `translate(${containerWidth / 2},${height / 2})`);
  }

  function transformToHierarchy(node) {
    const newNode = {
      name: node.name || node.style,
      description: node.description,
      example: node.example,
      spotify_track_id: node.spotify_track_id,
      wikipedia_url: node.wikipedia_url,
      substyles: node.substyles
    };
    if (node.substyles && node.substyles.length > 0) {
      newNode.children = node.substyles.map(transformToHierarchy);
    }
    return newNode;
  }

  const hierarchicalData = {
    name: 'Electronic Music',
    children: data.map(transformToHierarchy)
  };

  const root = d3.hierarchy(hierarchicalData);
  state.treeRoot = root;
  treeLayout(root);

  const nodesToShow = root.descendants().filter(d => d.depth > 0);

  const linkGenerator = state.currentLayout === 'vertical'
    ? d3.linkHorizontal().x(d => d.y).y(d => d.x + (d.children ? 0 : 0.5))
    : d3.linkRadial().angle(d => d.x).radius(d => d.y);

  const links = g.selectAll('.link')
    .data(root.links().filter(l => l.target.depth > 0))
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', linkGenerator)
    .style('stroke', d => {
      const isLight = document.body.classList.contains('light-mode');
      const topLevelAncestor = d.target.ancestors().find(ancestor => ancestor.depth === 1);
      return topLevelAncestor ? state.colorScale(topLevelAncestor.data.name) : (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)');
    })
    .style('stroke-opacity', 0.25)
    .style('opacity', 0);

  links.each(function (d) {
    const length = this.getTotalLength();
    const validLength = length || 100;
    d3.select(this)
      .attr('stroke-dasharray', validLength + ' ' + validLength)
      .attr('stroke-dashoffset', validLength)
      .transition()
      .duration(700)
      .delay(d.target.depth * 150)
      .style('opacity', 1)
      .attr('stroke-dashoffset', 0);
  });

  const node = g.selectAll('.node')
    .data(nodesToShow)
    .enter()
    .append('g')
    .attr('class', 'node clickable-node')
    .attr('transform', d => {
      if (state.currentLayout === 'vertical') {
        return `translate(${d.y},${d.x})`;
      } else {
        return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`;
      }
    })
    .attr('tabindex', 0)
    .attr('aria-label', d => d.data.name)
    .style('opacity', 0)
    .on('keydown', async (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
        state.activeSelectedNode = d;
        highlightBranch(event.currentTarget, d);
        scrollToNode(d);
        const { showInfoPanel } = await import('./panel.js');
        showInfoPanel(d.data, nodeColor);
      }
    })
    .on('mouseover', (event, d) => {
      showTooltip(event, d);
      highlightBranch(event.currentTarget, d);
    })
    .on('mouseout', () => {
      hideTooltip();
      if (!state.lastHighlightedNode || state.lastHighlightedNode !== state.activeSelectedNode) {
        clearBranchHighlight();
      }
    })
    .on('click', async (event, d) => {
      event.stopPropagation();
      const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');

      state.activeSelectedNode = d;
      highlightBranch(event.currentTarget, d);
      scrollToNode(d);

      const { showInfoPanel } = await import('./panel.js');
      showInfoPanel(d.data, nodeColor);
    });

  node.style('opacity', 0);

  node.each(function (d) { d.gNode = this; });

  node.append('circle')
    .attr('r', 0)
    .style('fill', d => {
      const topLevelAncestor = d.ancestors().find(ancestor => ancestor.depth === 1);
      if (topLevelAncestor) {
        return state.colorScale(topLevelAncestor.data.name);
      }
      return '#666';
    })
    .style('stroke', 'none');

  node.append('text')
    .attr('dy', '0.31em')
    .attr('x', d => {
      if (state.currentLayout === 'vertical') return d.children ? -10 : 10;
      return d.x < Math.PI ? 10 : -10;
    })
    .attr('text-anchor', d => {
      if (state.currentLayout === 'vertical') return d.children ? 'end' : 'start';
      return d.x < Math.PI ? 'start' : 'end';
    })
    .attr('transform', d => {
      if (state.currentLayout === 'vertical') return null;
      return d.x >= Math.PI ? 'rotate(180)' : null;
    })
    .style('font-family', '"Outfit", sans-serif')
    .style('font-size', d => d.children ? '14px' : '13px')
    .style('fill', document.body.classList.contains('light-mode') ? '#1a1a1a' : '#f5f5f5')
    .style('font-weight', d => d.children ? '500' : '400')
    .style('letter-spacing', '0.01em')
    .style('opacity', d => d.children ? 1 : 0.85)
    .text(d => d.data.name);

  node.transition()
    .duration(600)
    .delay(d => (d.depth * 150) + 400)
    .style('opacity', 1);

  node.select('circle')
    .transition()
    .duration(600)
    .delay(d => (d.depth * 150) + 400)
    .ease(d3.easeCubicOut)
    .attrTween('r', function(d) {
      const target = d.children ? 8 : 5;
      return function(t) { return target * t; };
    });
}

export function highlightBranch(element, d) {
  state.lastHighlightedNode = d;
  const nodeColor = d3.select(element).select('circle').style('fill');

  d3.selectAll('.node, .link')
    .classed('path-highlight-node', false)
    .classed('path-highlight-link', false);

  d3.select('#visualization-container').style('--highlight-color', nodeColor);

  d3.selectAll('.node').classed('faded', true);
  d3.selectAll('.link').classed('faded', true);

  const ancestors = d.ancestors();
  ancestors.forEach(ancestor => {
    d3.selectAll('.node').filter(n => n === ancestor)
      .classed('faded', false)
      .classed('path-highlight-node', true);
  });

  d3.selectAll('.link')
    .filter(link => ancestors.includes(link.target) && ancestors.includes(link.source))
    .classed('faded', false)
    .classed('path-highlight-link', true);

  d3.selectAll('.node').classed('active-node-pulse', false);
  if (state.activeSelectedNode) {
    d3.selectAll('.node').filter(n => n === state.activeSelectedNode).classed('active-node-pulse', true);
  }
}

export function clearBranchHighlight() {
  state.lastHighlightedNode = null;

  if (state.activeSelectedNode) {
    const nodeToHighlight = d3.selectAll('.node').filter(n => n === state.activeSelectedNode);
    if (!nodeToHighlight.empty()) {
      highlightBranch(nodeToHighlight.node(), state.activeSelectedNode);
      return;
    }
  }

  d3.selectAll('.node, .link')
    .classed('faded', false)
    .classed('path-highlight-node', false)
    .classed('path-highlight-link', false);

  d3.selectAll('.node').classed('active-node-pulse', false);
}

export function scrollToNode(d) {
  const nodeElements = d3.selectAll('.node').filter(n => n === d);
  if (nodeElements.empty()) return;

  const element = nodeElements.node();
  const rect = element.getBoundingClientRect();
  const scrollY = window.pageYOffset + rect.top - (window.innerHeight / 2);

  window.scrollTo({
    top: scrollY,
    behavior: 'smooth'
  });

  const circle = d3.select(element).select('circle');
  const currentR = parseFloat(circle.attr('r'));
  if (currentR) {
    circle.transition()
      .duration(200)
      .attr('r', currentR * 1.6)
      .transition()
      .duration(500)
      .ease(d3.easeCubicOut)
      .attr('r', currentR);
  }
}
