// ── Load data once, draw on scroll trigger ──────────────────

let globalData = null;

d3.csv('../cmip6_global_anomaly.csv', d => ({
  model:    d.model,
  scenario: d.scenario,
  year:     +d.year,
  tas_c:    +d.tas_c,
  anomaly:  +d.anomaly
})).then(data => {
  globalData = data;
  console.log('Data loaded:', data.length, 'rows');
});

// ── Chart 1: Placeholder (your keeling data goes here) ─────
function drawKeeling() {
  if (document.querySelector('#chart-keeling svg')) return;
  const svg = d3.select('#chart-keeling')
    .append('svg')
    .attr('width', 900).attr('height', 400);
  svg.append('text')
    .attr('x', 450).attr('y', 200)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8b949e')
    .text('Keeling Curve coming soon');
}

// ── Chart 2: Historical warming ─────────────────────────────
function drawHistorical() {
  if (!globalData) return;
  if (document.querySelector('#chart-historical svg')) return;

  const data = globalData.filter(d =>
    d.scenario === 'historical'
  );

  const width = 900, height = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select('#chart-historical')
    .append('svg')
    .attr('width', width).attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([-0.5, 1.5])
    .range([innerH, 0]);

  // Ensemble mean
  const byYear = d3.rollup(data, v =>
    d3.mean(v, d => d.anomaly), d => d.year
  );
  const meanData = Array.from(byYear, ([year, anomaly]) =>
    ({ year, anomaly })
  ).sort((a, b) => a.year - b.year);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.anomaly))
    .curve(d3.curveBasis);

  g.append('path')
    .datum(meanData)
    .attr('fill', 'none')
    .attr('stroke', '#888888')
    .attr('stroke-width', 2.5)
    .attr('d', line);

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#8b949e');

  g.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text').attr('fill', '#8b949e');

  // 0 line
  g.append('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', y(0)).attr('y2', y(0))
    .attr('stroke', '#444').attr('stroke-dasharray', '4,4');
}

// ── Chart 3: SSP fan chart ──────────────────────────────────
function drawFan() {
  if (!globalData) return;
  if (document.querySelector('#chart-fan svg')) return;
  // Full fan chart goes here — similar to Chart 2 but with all scenarios
  const svg = d3.select('#chart-fan')
    .append('svg')
    .attr('width', 900).attr('height', 400);
  svg.append('text')
    .attr('x', 450).attr('y', 200)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8b949e')
    .text('SSP fan chart — coming in prototype');
}

// ── Chart 4: Adventure ──────────────────────────────────────
function drawAdventure() {
  if (document.querySelector('#chart-adventure svg')) return;
  const svg = d3.select('#chart-adventure')
    .append('svg')
    .attr('width', 900).attr('height', 400);
  svg.append('text')
    .attr('x', 450).attr('y', 200)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8b949e')
    .text('Adventure mechanic — coming in prototype');
}

// ── Scrollama setup ─────────────────────────────────────────
window.addEventListener('load', () => {
    const scroller = scrollama();
  
    scroller
      .setup({
        step: '.scroll-section',
        offset: 0.5,
        debug: false
      })
      .onStepEnter(response => {
        const id = response.element.id;
        if (id === 'section-now')       drawKeeling();
        if (id === 'section-history')   drawHistorical();
        if (id === 'section-futures')   drawFan();
        if (id === 'section-adventure') drawAdventure();
      });
  });