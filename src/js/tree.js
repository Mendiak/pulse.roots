import * as d3 from 'd3';
import { state } from './state.js';
import { t } from './i18n.js';

const FONT_FAMILY = '"Outfit", sans-serif';
const LABEL_GUTTER = 8;
const MIN_COLUMN_WIDTH = 72;
const NODE_SPACING = 22;

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showTooltip(event, d) {
  if (d.depth === 0) return;

  const desc = d.data.description || '';
  const truncatedDesc = desc.length > 120 ? desc.substr(0, 120).replace(/\s+\S*$/, '') + '…' : desc;

  tooltip.transition().duration(200).style('opacity', 0.95);
  tooltip.html(`
    <h3>${d.data.name}</h3>
    ${truncatedDesc ? `<p>${truncatedDesc}</p>` : ''}
    <p><i class="bi bi-arrow-up-right-circle"></i> ${t('intro.clickForDetails')}</p>
  `);

  // Keep the tooltip inside the viewport, using document coordinates because the
  // tooltip is positioned absolutely on the page.
  const node = tooltip.node();
  const tipWidth = node.offsetWidth || 280;
  const tipHeight = node.offsetHeight || 90;
  const padding = 12;
  const scrollX = window.pageXOffset;
  const scrollY = window.pageYOffset;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;

  let left = event.pageX + 12;
  let top = event.pageY - tipHeight - padding;

  if (top < scrollY + padding) top = event.pageY + 20;

  left = Math.max(scrollX + padding, Math.min(left, scrollX + viewportWidth - tipWidth - padding));
  top = Math.max(scrollY + padding, Math.min(top, scrollY + viewportHeight - tipHeight - padding));

  tooltip.style('left', left + 'px').style('top', top + 'px');
}

function hideTooltip() {
  tooltip.transition().duration(200).style('opacity', 0);
}

// Shrinks a label until it fits the space available, keeping the full name in the
// tooltip and the aria-label.
function truncateTextToWidth(textElement, maxWidth) {
  if (maxWidth <= 0) return;
  if (textElement.getComputedTextLength() <= maxWidth) return;

  const fullText = textElement.textContent;
  const ellipsis = '…';
  let low = 1;
  let high = fullText.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    textElement.textContent = fullText.slice(0, mid).trimEnd() + ellipsis;
    if (textElement.getComputedTextLength() <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  textElement.textContent = fullText.slice(0, Math.max(1, low)).trimEnd() + ellipsis;
}

export function createTree(data) {
  const svgContainer = d3.select('#treemap');
  svgContainer.selectAll('*').remove();

  const containerBounds = svgContainer.node().getBoundingClientRect();
  const containerWidth = containerBounds.width;
  const reducedMotion = prefersReducedMotion();

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

  const maxDepth = Math.max(1, root.height);

  // Labels are rendered once off-screen with their final typography so the
  // margins can be sized from real text widths instead of guessed ones.
  function measureLabelWidths(entries) {
    const group = svgContainer.append('g').attr('visibility', 'hidden').attr('aria-hidden', 'true');
    const texts = group.selectAll('text')
      .data(entries)
      .enter()
      .append('text')
      .attr('font-family', FONT_FAMILY)
      .attr('font-size', d => d.fontSize)
      .attr('font-weight', d => d.fontWeight)
      .text(d => d.text);
    const widths = texts.nodes().map(node => node.getComputedTextLength());
    group.remove();
    return widths;
  }

  let height, innerWidth, innerHeight, margin, treeLayout;

  if (state.currentLayout === 'vertical') {
    const depthOneLabels = root.descendants()
      .filter(d => d.depth === 1)
      .map(d => ({ text: d.data.name, fontSize: '14px', fontWeight: '500' }));
    const leafLabels = root.leaves()
      .map(d => ({ text: d.data.name, fontSize: '13px', fontWeight: '400' }));

    const depthOneMaxWidth = d3.max(measureLabelWidths(depthOneLabels)) || 0;
    const leafMaxWidth = d3.max(measureLabelWidths(leafLabels)) || 0;

    const right = Math.min(
      Math.max(160, Math.ceil(leafMaxWidth + LABEL_GUTTER + 10)),
      Math.max(160, containerWidth * 0.4)
    );

    // Grow the left margin only as far as the columns can afford, so the first
    // level labels stop being clipped without squeezing the tree into itself.
    const maxLeft = Math.max(50, containerWidth - right - (MIN_COLUMN_WIDTH * maxDepth));
    let left = 50;
    for (let i = 0; i < 6; i += 1) {
      const columnWidth = (containerWidth - left - right) / maxDepth;
      const required = depthOneMaxWidth + LABEL_GUTTER + 10 - columnWidth;
      if (required <= left) break;
      left = Math.ceil(required);
      if (left >= maxLeft) break;
    }
    left = Math.max(50, Math.min(left, Math.max(50, maxLeft)));

    margin = { top: 20, right, bottom: 20, left };
    height = Math.max(1000, root.leaves().length * NODE_SPACING);
    innerWidth = Math.max(120, containerWidth - margin.left - margin.right);
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
    .attr('viewBox', `0 0 ${containerWidth} ${height}`)
    .attr('role', 'tree')
    .attr('aria-label', state.currentLayout === 'vertical' ? t('layouts.tree') : t('layouts.radial'));

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
    .attr('role', 'presentation')
    .attr('width', containerWidth)
    .attr('height', height)
    .attr('fill', 'transparent')
    .on('click', () => {
      state.activeSelectedNode = null;
      clearBranchHighlight();
    });

  const g = svg.append('g').attr('role', 'presentation');

  if (state.currentLayout === 'vertical') {
    g.attr('transform', `translate(${margin.left},${margin.top})`);
  } else {
    g.attr('transform', `translate(${containerWidth / 2},${height / 2})`);
  }

  treeLayout(root);

  const nodesToShow = root.descendants().filter(d => d.depth > 0);

  const linkGenerator = state.currentLayout === 'vertical'
    ? d3.linkHorizontal().x(d => d.y).y(d => d.x)
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
    .style('opacity', reducedMotion ? null : 0);

  links.each(function (d) {
    if (reducedMotion) {
      d3.select(this)
        .attr('stroke-dasharray', null)
        .attr('stroke-dashoffset', null)
        .style('opacity', null);
      return;
    }

    const length = this.getTotalLength();
    const validLength = length || 100;
    d3.select(this)
      .attr('stroke-dasharray', validLength + ' ' + validLength)
      .attr('stroke-dashoffset', validLength)
      .transition()
      .duration(700)
      .delay(d.target.depth * 150)
      .style('opacity', 1)
      .attr('stroke-dashoffset', 0)
      .on('end', function () {
        // Drop the inline opacity so the `.faded` highlight class can take over.
        d3.select(this).style('opacity', null);
      });
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
    .attr('tabindex', (d, i) => i === 0 ? 0 : -1)
    .attr('role', 'treeitem')
    .attr('aria-level', d => d.depth)
    .attr('aria-label', d => d.data.name)
    .style('opacity', reducedMotion ? 1 : 0)
    .on('focus', function () {
      // Roving tabindex: only the focused node stays in the tab order.
      d3.selectAll('.node').attr('tabindex', -1);
      d3.select(this).attr('tabindex', 0);
    })
    .on('keydown', async (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const nodeColor = d3.select(event.currentTarget).select('circle').style('fill');
        state.activeSelectedNode = d;
        highlightBranch(event.currentTarget, d);
        scrollToNode(d);
        const { showInfoPanel } = await import('./panel.js');
        showInfoPanel(d.data, nodeColor);
        return;
      }

      const siblings = d.parent ? d.parent.children || [] : [d];
      const siblingIndex = siblings.indexOf(d);
      let target = null;

      switch (event.key) {
        case 'ArrowUp':
          target = siblings[siblingIndex - 1] || null;
          break;
        case 'ArrowDown':
          target = siblings[siblingIndex + 1] || null;
          break;
        case 'ArrowLeft':
          target = d.parent && d.parent.depth > 0 ? d.parent : null;
          break;
        case 'ArrowRight':
          target = d.children && d.children[0] ? d.children[0] : null;
          break;
        case 'Home':
          target = siblings[0] || null;
          break;
        case 'End':
          target = siblings[siblings.length - 1] || null;
          break;
        default:
          break;
      }

      if (target && target.gNode) {
        event.preventDefault();
        target.gNode.focus({ preventScroll: true });
        scrollToNode(target);
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

  node.each(function (d) { d.gNode = this; });

  node.append('circle')
    .attr('r', reducedMotion ? (d => d.children ? 8 : 5) : 0)
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
    .style('font-family', FONT_FAMILY)
    .style('font-size', d => d.depth === 1 ? '14px' : '13px')
    .style('fill', document.body.classList.contains('light-mode') ? '#1a1a1a' : '#f5f5f5')
    .style('font-weight', d => d.depth === 1 ? '500' : '400')
    .style('letter-spacing', '0.01em')
    .style('opacity', d => d.depth === 1 ? 1 : 0.85)
    .text(d => d.data.name);

  // Final guard: no label may overflow the SVG edges. The full name stays in the
  // tooltip and the aria-label.
  if (state.currentLayout === 'vertical') {
    node.select('text').each(function (d) {
      const nodeX = margin.left + d.y;
      const available = this.getAttribute('text-anchor') === 'end'
        ? nodeX - 10 - LABEL_GUTTER
        : containerWidth - nodeX - 10 - LABEL_GUTTER;
      truncateTextToWidth(this, available);
    });
  }

  if (reducedMotion) {
    node.style('opacity', null);
  } else {
    node.transition()
      .duration(600)
      .delay(d => (d.depth * 150) + 400)
      .style('opacity', 1)
      .on('end', function () {
        // Drop the inline opacity so the `.faded` highlight class can take over.
        d3.select(this).style('opacity', null);
      });

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
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  });

  if (prefersReducedMotion()) return;

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
