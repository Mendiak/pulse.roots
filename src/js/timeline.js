import { state } from './state.js';

let cachedFacts = null;

const ERAS = [
  { label: 'Pioneers', start: 1897, end: 1979, color: 'rgba(128, 128, 128, 0.06)' },
  { label: '80s', start: 1980, end: 1989, color: 'rgba(128, 128, 128, 0.04)' },
  { label: '90s', start: 1990, end: 1999, color: 'rgba(128, 128, 128, 0.06)' },
  { label: '00s', start: 2000, end: 2009, color: 'rgba(128, 128, 128, 0.04)' },
  { label: '10s+', start: 2010, end: 2022, color: 'rgba(128, 128, 128, 0.06)' },
];

async function fetchFacts() {
  try {
    const resp = await fetch(`${state.BASE_PATH}/data/music_history.json`);
    return await resp.json();
  } catch {
    return [];
  }
}

function renderTimeline(facts) {
  const svgContainer = d3.select('#treemap');
  svgContainer.selectAll('*').remove();

  const containerBounds = svgContainer.node().getBoundingClientRect();
  const containerWidth = containerBounds.width;
  const height = Math.min(420, Math.max(280, window.innerHeight * 0.48));
  const margin = { top: 24, right: 20, bottom: 44, left: 20 };
  const innerWidth = containerWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = svgContainer
    .attr('width', containerWidth)
    .attr('height', height)
    .attr('viewBox', `0 0 ${containerWidth} ${height}`);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const minYear = d3.min(facts, f => +f.date) - 2;
  const maxYear = d3.max(facts, f => +f.date) + 2;
  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, innerWidth]);

  const countMap = {};
  facts.forEach(f => {
    const y = +f.date;
    countMap[y] = (countMap[y] || 0) + 1;
  });
  const maxCount = d3.max(Object.values(countMap));

  const densityTop = 10;
  const yScaleDensity = d3.scaleLinear()
    .domain([0, Math.max(maxCount * 1.3, 3)])
    .range([innerHeight - 10, densityTop]);

  const densityData = [];
  for (let y = minYear; y <= maxYear; y++) {
    densityData.push({ year: y, count: countMap[y] || 0 });
  }

  const isLight = document.body.classList.contains('light-mode');
  const textMuted = isLight ? '#666666' : '#888888';
  const accentColor = '#ff0066';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  g.selectAll('.era-band')
    .data(ERAS)
    .enter()
    .append('rect')
    .attr('class', 'era-band')
    .attr('x', d => xScale(Math.max(d.start, minYear)))
    .attr('width', d => Math.max(0, xScale(Math.min(d.end, maxYear)) - xScale(Math.max(d.start, minYear))))
    .attr('y', 4)
    .attr('height', innerHeight - 4)
    .attr('fill', d => d.color)
    .attr('rx', 4);

  g.selectAll('.era-label')
    .data(ERAS.filter(d => d.start <= maxYear && d.end >= minYear))
    .enter()
    .append('text')
    .attr('class', 'era-label')
    .attr('x', d => {
      const cx = (xScale(Math.max(d.start, minYear)) + xScale(Math.min(d.end, maxYear))) / 2;
      return cx;
    })
    .attr('y', 16)
    .attr('text-anchor', 'middle')
    .attr('fill', textMuted)
    .attr('font-family', '"Outfit", sans-serif')
    .attr('font-size', '10px')
    .attr('font-weight', 600)
    .attr('letter-spacing', '1.5px')
    .attr('opacity', 0.4)
    .text(d => d.label);

  const decadeTicks = [];
  const firstDecade = Math.ceil(minYear / 10) * 10;
  for (let y = firstDecade; y <= maxYear; y += 10) {
    decadeTicks.push(y);
  }
  g.selectAll('.decade-line')
    .data(decadeTicks)
    .enter()
    .append('line')
    .attr('class', 'decade-line')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d))
    .attr('y1', 4)
    .attr('y2', innerHeight - 4)
    .attr('stroke', gridColor)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3');

  const areaGenerator = d3.area()
    .x(d => xScale(d.year))
    .y0(innerHeight - 4)
    .y1(d => yScaleDensity(d.count))
    .curve(d3.curveCatmullRom);

  g.append('path')
    .attr('class', 'density-curve')
    .attr('d', areaGenerator(densityData))
    .attr('fill', isLight ? 'rgba(255, 0, 102, 0.06)' : 'rgba(255, 0, 102, 0.08)')
    .style('opacity', 0)
    .transition()
    .duration(800)
    .style('opacity', 1);

  const yearGroups = new Map();
  facts.forEach(f => {
    const y = f.date;
    if (!yearGroups.has(y)) yearGroups.set(y, []);
    yearGroups.get(y).push(f);
  });

  const dotSpacing = 16;
  const dotsData = [];
  yearGroups.forEach((group) => {
    const count = group.length;
    const baseY = yScaleDensity(count);
    const spread = (count - 1) * dotSpacing / 2;
    group.forEach((f, i) => {
      dotsData.push({
        fact: f.fact,
        date: f.date,
        url: f.url || null,
        year: +f.date,
        x: xScale(+f.date),
        y: baseY - spread + i * dotSpacing,
        r: count > 3 ? 6 : 7,
      });
    });
  });

  let tooltipTimeout;

  const tooltip = d3.select('body')
    .selectAll('.timeline-tooltip')
    .data([0])
    .join('div')
    .attr('class', 'timeline-tooltip')
    .style('opacity', 0)
    .on('mouseenter', () => clearTimeout(tooltipTimeout))
    .on('mouseleave', () => hideTooltip());

  function showTooltip(event, d) {
    clearTimeout(tooltipTimeout);
    tooltip.transition().duration(200).style('opacity', 0.95);
    const maxW = 340;
    const left = Math.min(event.pageX + 12, window.innerWidth - maxW - 10);
    const linkLabel = d.url?.includes('wikipedia.org') ? 'Wikipedia' : d.url?.includes('roland.com') || d.url?.includes('ableton.com') || d.url?.includes('native-instruments.com') ? 'Official site' : 'Learn more';
    const linkHtml = d.url ? `<br><a href="${d.url}" target="_blank" rel="noopener noreferrer" class="tl-link">${linkLabel} ↗</a>` : '';
    tooltip.html(`<strong>${d.date}</strong> ${d.fact}${linkHtml}`)
      .style('left', left + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  function hideTooltip() {
    tooltipTimeout = setTimeout(() => {
      tooltip.transition().duration(150).style('opacity', 0);
    }, 200);
  }

  g.selectAll('.tl-dot-ring')
    .data(dotsData)
    .enter()
    .append('circle')
    .attr('class', d => d.url ? 'tl-dot-ring' : 'tl-dot-ring tl-dot-ring-hidden')
    .attr('cx', d => d.x)
    .attr('cy', innerHeight)
    .attr('r', d => d.r + 3)
    .attr('fill', 'none')
    .attr('stroke', accentColor)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3,2')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay((d, i) => i * 12)
    .attr('cy', d => d.y)
    .style('opacity', d => d.url ? 0.6 : 0);

  g.selectAll('.tl-dot')
    .data(dotsData)
    .enter()
    .append('circle')
    .attr('class', 'tl-dot')
    .attr('cx', d => d.x)
    .attr('cy', innerHeight)
    .attr('r', d => d.r)
    .attr('fill', accentColor)
    .attr('stroke', isLight ? '#fff' : '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .style('opacity', 0)
    .on('mouseover', (event, d) => {
      showTooltip(event, d);
      d3.select(event.currentTarget)
        .transition().duration(200)
        .attr('r', 10)
        .attr('stroke-width', 3);
    })
    .on('mouseout', (event) => {
      hideTooltip();
      d3.select(event.currentTarget)
        .transition().duration(200)
        .attr('r', d => d.r || 7)
        .attr('stroke-width', 1.5);
    })
    .on('click', (event, d) => {
      showTooltip(event, d);
      d3.select(event.currentTarget)
        .transition().duration(120)
        .attr('r', 14)
        .transition().duration(300)
        .attr('r', d => d.r || 7);
    })
    .transition()
    .duration(500)
    .delay((d, i) => i * 12)
    .attr('cy', d => d.y)
    .style('opacity', 1);

  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format('d'))
    .ticks(10)
    .tickSizeOuter(0);

  const axisG = g.append('g')
    .attr('class', 'tl-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .style('opacity', 0)
    .call(xAxis);

  axisG.selectAll('.domain').attr('stroke', textMuted).attr('stroke-width', 1);
  axisG.selectAll('.tick line').attr('stroke', gridColor).attr('stroke-width', 1);
  axisG.selectAll('.tick text')
    .attr('fill', textMuted)
    .attr('font-family', '"Outfit", sans-serif')
    .attr('font-size', '11px')
    .attr('font-weight', 500);

  axisG.transition().duration(600).style('opacity', 1);

  const totalFacts = facts.length;
  const yearSpan = maxYear - minYear;
  g.append('text')
    .attr('class', 'tl-label')
    .attr('x', innerWidth / 2)
    .attr('y', -6)
    .attr('text-anchor', 'middle')
    .attr('fill', textMuted)
    .attr('font-family', '"Outfit", sans-serif')
    .attr('font-size', '12px')
    .attr('font-weight', 500)
    .style('opacity', 0)
    .text(`${totalFacts} milestones · ${yearSpan} years of electronic music`)
    .transition()
    .duration(600)
    .style('opacity', 1);
}

export async function createTimeline() {
  if (!cachedFacts) {
    const svgContainer = d3.select('#treemap');
    svgContainer.selectAll('*').remove();
    const bounds = svgContainer.node().getBoundingClientRect();
    const w = bounds.width;
    const h = Math.min(420, Math.max(280, window.innerHeight * 0.48));
    svgContainer
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`);
    svgContainer.append('text')
      .attr('x', w / 2)
      .attr('y', h / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888888')
      .attr('font-family', '"Outfit", sans-serif')
      .attr('font-size', '14px')
      .text('Loading timeline...');
    cachedFacts = await fetchFacts();
    state.historyFacts = cachedFacts;
  }
  renderTimeline(cachedFacts);
}
