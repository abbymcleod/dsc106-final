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
  
    d3.csv('../keeling.csv', d => ({
      year:        +d.year,
      month:       +d.month,
      decimal:     +d.decimal_date,
      co2_raw:     +d.co2_raw,
      co2_smooth:  +d.co2_smooth
    })).then(data => {
  
      const width  = 900, height = 420;
      const margin = { top: 30, right: 40, bottom: 50, left: 70 };
      const innerW = width  - margin.left - margin.right;
      const innerH = height - margin.top  - margin.bottom;
  
      const svg = d3.select('#chart-keeling')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
  
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      // ── Scales ──────────────────────────────────────────────
      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.decimal))
        .range([0, innerW]);
  
      const y = d3.scaleLinear()
        .domain([310, 435])
        .range([innerH, 0]);
  
      // ── Gridlines ───────────────────────────────────────────
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
          .tickSize(-innerW)
          .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', '#21262d')
        .attr('stroke-dasharray', '3,3');
  
      g.select('.grid .domain').remove();
  
      // ── Raw CO₂ line (sawtooth) ─────────────────────────────
      const lineRaw = d3.line()
        .defined(d => !isNaN(d.co2_raw))
        .x(d => x(d.decimal))
        .y(d => y(d.co2_raw))
        .curve(d3.curveMonotoneX);
  
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#58a6ff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.4)
        .attr('d', lineRaw);
  
      // ── Smoothed CO₂ line ───────────────────────────────────
      const lineSmooth = d3.line()
        .defined(d => !isNaN(d.co2_smooth))
        .x(d => x(d.decimal))
        .y(d => y(d.co2_smooth))
        .curve(d3.curveMonotoneX);
  
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#58a6ff')
        .attr('stroke-width', 2.5)
        .attr('d', lineSmooth);
  
      // ── Pre-industrial baseline (280 ppm) ───────────────────
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', y(280)).attr('y2', y(280))
        .attr('stroke', '#8b949e')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
  
      g.append('text')
        .attr('x', 8)
        .attr('y', y(280) - 6)
        .attr('fill', '#8b949e')
        .attr('font-size', '11px')
        .attr('font-family', 'sans-serif')
        .text('Pre-industrial baseline (~280 ppm)');
  
      // ── 425 ppm annotation ──────────────────────────────────
      const lastPoint = data[data.length - 1];
  
      g.append('circle')
        .attr('cx', x(lastPoint.decimal))
        .attr('cy', y(lastPoint.co2_smooth))
        .attr('r', 5)
        .attr('fill', '#f97316');
  
      g.append('text')
        .attr('x', x(lastPoint.decimal) - 12)
        .attr('y', y(lastPoint.co2_smooth) - 12)
        .attr('fill', '#f97316')
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .attr('text-anchor', 'end')
        .text(`${lastPoint.co2_smooth.toFixed(1)} ppm today`);
  
      // ── Axes ────────────────────────────────────────────────
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x)
          .tickFormat(d3.format('d'))
          .ticks(10)
        )
        .selectAll('text')
        .attr('fill', '#8b949e')
        .attr('font-family', 'sans-serif');
  
      g.append('g')
        .call(d3.axisLeft(y)
          .tickFormat(d => `${d} ppm`)
        )
        .selectAll('text')
        .attr('fill', '#8b949e')
        .attr('font-family', 'sans-serif');
  
      // style axis lines
      g.selectAll('.domain').attr('stroke', '#30363d');
      g.selectAll('.tick line').attr('stroke', '#30363d');
  
      // ── Y axis label ────────────────────────────────────────
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -55)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8b949e')
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .text('Atmospheric CO₂ (ppm)');
  
      // ── Legend ──────────────────────────────────────────────
      const legend = g.append('g')
        .attr('transform', `translate(20, 10)`);
  
      legend.append('line')
        .attr('x1', 0).attr('x2', 24)
        .attr('y1', 8).attr('y2', 8)
        .attr('stroke', '#58a6ff')
        .attr('stroke-width', 2.5);
  
      legend.append('text')
        .attr('x', 30).attr('y', 12)
        .attr('fill', '#8b949e')
        .attr('font-size', '11px')
        .attr('font-family', 'sans-serif')
        .text('Smoothed trend');
  
      legend.append('line')
        .attr('x1', 0).attr('x2', 24)
        .attr('y1', 28).attr('y2', 28)
        .attr('stroke', '#58a6ff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.4);
  
      legend.append('text')
        .attr('x', 30).attr('y', 32)
        .attr('fill', '#8b949e')
        .attr('font-size', '11px')
        .attr('font-family', 'sans-serif')
        .text('Monthly raw (seasonal variation)');
  
    });
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