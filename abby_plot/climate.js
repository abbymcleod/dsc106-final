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

// ── Chart 1: CO2 Data─────
function drawKeeling() {
    if (document.querySelector('#chart-keeling svg')) return;
  
    d3.csv('keeling.csv', d => ({
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

      // ── Tooltip ─────────────────────────────────────────────────
        const tooltip = d3.select('#chart-keeling')
        .append('div')
        .style('position', 'absolute')
        .style('background', '#1c2128')
        .style('border', '1px solid #30363d')
        .style('border-radius', '6px')
        .style('padding', '8px 12px')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('color', '#e6edf3')
        .style('pointer-events', 'none')
        .style('opacity', 0);

        // invisible overlay to capture mouse position
        const bisect = d3.bisector(d => d.decimal).left;

        const overlay = g.append('rect')
        .attr('width', innerW)
        .attr('height', innerH)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

        // vertical hover line
        const hoverLine = g.append('line')
        .attr('stroke', '#58a6ff')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('y1', 0)
        .attr('y2', innerH)
        .style('opacity', 0);

        // hover dot
        const hoverDot = g.append('circle')
        .attr('r', 4)
        .attr('fill', '#58a6ff')
        .style('opacity', 0);

        overlay.on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const decimalVal = x.invert(mouseX);
        const idx = bisect(data, decimalVal, 1);
        const d = data[idx] || data[data.length - 1];

        const months = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthLabel = months[d.month - 1];

        hoverLine
        .attr('x1', x(d.decimal))
        .attr('x2', x(d.decimal))
        .style('opacity', 1);

        hoverDot
        .attr('cx', x(d.decimal))
        .attr('cy', y(d.co2_smooth))
        .style('opacity', 1);

        // flip tooltip to left side if near right edge
        const tooltipX = mouseX > innerW - 160
        ? mouseX + margin.left - 150
        : mouseX + margin.left + 16;

        tooltip
        .style('opacity', 1)
        .style('left', `${tooltipX}px`)
        .style('top',  `${y(d.co2_smooth) + margin.top - 20}px`)
        .html(`
            <div style="color:#8b949e; margin-bottom:3px">${monthLabel} ${d.year}</div>
            <div><span style="color:#58a6ff">●</span> CO₂: <strong>${d.co2_raw.toFixed(2)} ppm</strong></div>
            <div><span style="color:#58a6ff; opacity:0.5">●</span> Trend: <strong>${d.co2_smooth.toFixed(2)} ppm</strong></div>
        `);
        })
        .on('mouseleave', function() {
        hoverLine.style('opacity', 0);
        hoverDot.style('opacity', 0);
        tooltip.style('opacity', 0);
        });
    });
  }

// ── Chart 2: Historical warming ─────────────────────────────
function drawHistorical() {
    if (!globalData) return;
    if (document.querySelector('#chart-historical svg')) return;
  
    const data = globalData.filter(d => d.scenario === 'historical');
  
    const width  = 900, height = 420;
    const margin = { top: 30, right: 40, bottom: 50, left: 70 };
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;
  
    const svg = d3.select('#chart-historical')
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // ── Scales ──────────────────────────────────────────────
    const x = d3.scaleLinear()
      .domain([1850, 2015])
      .range([0, innerW]);
  
    const y = d3.scaleLinear()
      .domain([-0.6, 1.4])
      .range([innerH, 0]);
  
    // ── Gridlines ───────────────────────────────────────────
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#21262d')
      .attr('stroke-dasharray', '3,3');
  
    g.select('.grid .domain').remove();
  
    // ── Uncertainty band (model spread) ─────────────────────
    const byYear = d3.rollup(data, v => ({
      mean: d3.mean(v, d => d.anomaly),
      min:  d3.min(v,  d => d.anomaly),
      max:  d3.max(v,  d => d.anomaly)
    }), d => d.year);
  
    const bandData = Array.from(byYear, ([year, vals]) =>
      ({ year, ...vals })
    ).sort((a, b) => a.year - b.year);
  
    const area = d3.area()
      .x(d => x(d.year))
      .y0(d => y(d.min))
      .y1(d => y(d.max))
      .curve(d3.curveBasis);
  
    g.append('path')
      .datum(bandData)
      .attr('fill', '#888888')
      .attr('opacity', 0.15)
      .attr('d', area);
  
    // ── Ensemble mean line ───────────────────────────────────
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.mean))
      .curve(d3.curveBasis);
  
    g.append('path')
      .datum(bandData)
      .attr('fill', 'none')
      .attr('stroke', '#888888')
      .attr('stroke-width', 2.5)
      .attr('d', line);
  
    // ── Zero baseline ────────────────────────────────────────
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', '#444')
      .attr('stroke-dasharray', '4,4');
  
    g.append('text')
      .attr('x', 8)
      .attr('y', y(0) - 6)
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .text('Pre-industrial baseline (1850–1900)');
  
    // ── 1.2°C annotation ────────────────────────────────────
    const lastYear = bandData[bandData.length - 1];
  
    g.append('circle')
      .attr('cx', x(lastYear.year))
      .attr('cy', y(lastYear.mean))
      .attr('r', 5)
      .attr('fill', '#f97316');
  
    g.append('text')
      .attr('x', x(lastYear.year) - 12)
      .attr('y', y(lastYear.mean) - 12)
      .attr('fill', '#f97316')
      .attr('font-size', '12px')
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'end')
      .text(`+${lastYear.mean.toFixed(2)}°C by 2015`);
  
    // ── Axes ────────────────────────────────────────────────
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(10))
      .selectAll('text')
      .attr('fill', '#8b949e')
      .attr('font-family', 'sans-serif');
  
    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `${d > 0 ? '+' : ''}${d}°C`))
      .selectAll('text')
      .attr('fill', '#8b949e')
      .attr('font-family', 'sans-serif');
  
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
      .text('Temperature Anomaly (°C vs. 1850–1900)');
  
    // ── Tooltip ─────────────────────────────────────────────
    const tooltip = d3.select('#chart-historical')
      .append('div')
      .style('position', 'absolute')
      .style('background', '#1c2128')
      .style('border', '1px solid #30363d')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-family', 'sans-serif')
      .style('font-size', '12px')
      .style('color', '#e6edf3')
      .style('pointer-events', 'none')
      .style('opacity', 0);
  
    const bisect = d3.bisector(d => d.year).left;
  
    const hoverLine = g.append('line')
      .attr('stroke', '#888888')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('y1', 0).attr('y2', innerH)
      .style('opacity', 0);
  
    const hoverDot = g.append('circle')
      .attr('r', 4)
      .attr('fill', '#888888')
      .style('opacity', 0);
  
    g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const yearVal = x.invert(mouseX);
        const idx = bisect(bandData, yearVal, 1);
        const d = bandData[idx] || bandData[bandData.length - 1];
  
        hoverLine
          .attr('x1', x(d.year)).attr('x2', x(d.year))
          .style('opacity', 1);
  
        hoverDot
          .attr('cx', x(d.year)).attr('cy', y(d.mean))
          .style('opacity', 1);
  
        const tooltipX = mouseX > innerW - 160
          ? mouseX + margin.left - 150
          : mouseX + margin.left + 16;
  
        tooltip
          .style('opacity', 1)
          .style('left', `${tooltipX}px`)
          .style('top', `${y(d.mean) + margin.top - 20}px`)
          .html(`
            <div style="color:#8b949e; margin-bottom:3px">${d.year}</div>
            <div><span style="color:#888">●</span> Anomaly: <strong>${d.mean > 0 ? '+' : ''}${d.mean.toFixed(3)}°C</strong></div>
            <div style="color:#8b949e; font-size:11px">Model range: ${d.min.toFixed(2)} to ${d.max.toFixed(2)}°C</div>
          `);
      })
      .on('mouseleave', function() {
        hoverLine.style('opacity', 0);
        hoverDot.style('opacity', 0);
        tooltip.style('opacity', 0);
      });
  
    // ── Legend ───────────────────────────────────────────────
    const legend = g.append('g').attr('transform', 'translate(20, 10)');
  
    legend.append('line')
      .attr('x1', 0).attr('x2', 24)
      .attr('y1', 8).attr('y2', 8)
      .attr('stroke', '#888888')
      .attr('stroke-width', 2.5);
  
    legend.append('text')
      .attr('x', 30).attr('y', 12)
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .text('Ensemble mean (4 models)');
  
    legend.append('rect')
      .attr('x', 0).attr('y', 22)
      .attr('width', 24).attr('height', 10)
      .attr('fill', '#888888')
      .attr('opacity', 0.15);
  
    legend.append('text')
      .attr('x', 30).attr('y', 32)
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .text('Model spread (uncertainty range)');
  }

// ── Chart 3: SSP fan chart ──────────────────────────────────
function drawFan() {
    if (!globalData) return;
    if (document.querySelector('#chart-fan svg')) return;
  
    const width  = 900, height = 480;
    const margin = { top: 40, right: 160, bottom: 50, left: 70 };
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;
  
    const scenarioColors = {
      historical: '#888888',
      ssp126:     '#1a9850',
      ssp245:     '#f6c744',
      ssp370:     '#f46d43',
      ssp585:     '#d73027'
    };
  
    const scenarioLabels = {
      historical: 'Historical',
      ssp126:     'SSP1-2.6 — Best Case',
      ssp245:     'SSP2-4.5 — Middle Road',
      ssp370:     'SSP3-7.0 — High Emissions',
      ssp585:     'SSP5-8.5 — Worst Case'
    };
  
    const svg = d3.select('#chart-fan')
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // ── Scales ──────────────────────────────────────────────
    const x = d3.scaleLinear()
      .domain([1850, 2100])
      .range([0, innerW]);
  
    const y = d3.scaleLinear()
      .domain([-0.6, 7])
      .range([innerH, 0]);
  
    // ── Gridlines ───────────────────────────────────────────
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#21262d')
      .attr('stroke-dasharray', '3,3');
  
    g.select('.grid .domain').remove();
  
    // ── Paris threshold lines ────────────────────────────────
    [1.5, 2.0].forEach(threshold => {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', y(threshold)).attr('y2', y(threshold))
        .attr('stroke', '#a78bfa')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.7);
  
      g.append('text')
        .attr('x', innerW + 6)
        .attr('y', y(threshold) + 4)
        .attr('fill', '#a78bfa')
        .attr('font-size', '11px')
        .attr('font-family', 'sans-serif')
        .text(`${threshold}°C`);
    });
  
    // ── 2015 handoff line ────────────────────────────────────
    g.append('line')
      .attr('x1', x(2015)).attr('x2', x(2015))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#444')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');
  
    g.append('text')
      .attr('x', x(2015) + 6)
      .attr('y', 14)
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .text('Projections →');
  
    // ── Draw each scenario ───────────────────────────────────
    const scenarios = ['historical', 'ssp126', 'ssp245', 'ssp370', 'ssp585'];
  
    scenarios.forEach(scenario => {
      const scenData = globalData.filter(d => d.scenario === scenario);
  
      // ensemble mean per year
      const byYear = d3.rollup(scenData, v => ({
        mean: d3.mean(v, d => d.anomaly),
        min:  d3.min(v,  d => d.anomaly),
        max:  d3.max(v,  d => d.anomaly)
      }), d => d.year);
  
      const band = Array.from(byYear, ([year, vals]) =>
        ({ year, ...vals })
      ).sort((a, b) => a.year - b.year);
  
      const color = scenarioColors[scenario];
  
      // uncertainty band (SSP scenarios only)
      if (scenario !== 'historical') {
        const area = d3.area()
          .x(d => x(d.year))
          .y0(d => y(d.min))
          .y1(d => y(d.max))
          .curve(d3.curveBasis);
  
        g.append('path')
          .datum(band)
          .attr('fill', color)
          .attr('opacity', 0.12)
          .attr('d', area);
      }
  
      // mean line
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.mean))
        .curve(d3.curveBasis);
  
      g.append('path')
        .datum(band)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', scenario === 'historical' ? 2 : 2.5)
        .attr('d', line);
  
      // end label for SSP scenarios
      if (scenario !== 'historical') {
        const last = band[band.length - 1];
        g.append('text')
          .attr('x', x(last.year) + 6)
          .attr('y', y(last.mean) + 4)
          .attr('fill', color)
          .attr('font-size', '11px')
          .attr('font-family', 'sans-serif')
          .text(`+${last.mean.toFixed(1)}°C`);
      }
    });
  
    // ── Axes ────────────────────────────────────────────────
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(10))
      .selectAll('text')
      .attr('fill', '#8b949e')
      .attr('font-family', 'sans-serif');
  
    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `${d > 0 ? '+' : ''}${d}°C`))
      .selectAll('text')
      .attr('fill', '#8b949e')
      .attr('font-family', 'sans-serif');
  
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
      .text('Temperature Anomaly (°C vs. 1850–1900)');
  
    // ── Legend ───────────────────────────────────────────────
    const legend = g.append('g')
      .attr('transform', `translate(20, 10)`);
  
    scenarios.forEach((scenario, i) => {
      const ly = i * 22;
      const color = scenarioColors[scenario];
  
      legend.append('line')
        .attr('x1', 0).attr('x2', 24)
        .attr('y1', ly + 8).attr('y2', ly + 8)
        .attr('stroke', color)
        .attr('stroke-width', 2.5);
  
      legend.append('text')
        .attr('x', 30).attr('y', ly + 12)
        .attr('fill', '#8b949e')
        .attr('font-size', '11px')
        .attr('font-family', 'sans-serif')
        .text(scenarioLabels[scenario]);
    });
  
    // ── Tooltip ─────────────────────────────────────────────
    const tooltip = d3.select('#chart-fan')
      .append('div')
      .style('position', 'absolute')
      .style('background', '#1c2128')
      .style('border', '1px solid #30363d')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-family', 'sans-serif')
      .style('font-size', '12px')
      .style('color', '#e6edf3')
      .style('pointer-events', 'none')
      .style('opacity', 0);
  
    // precompute all scenario band data for tooltip lookup
    const allBands = {};
    scenarios.forEach(scenario => {
      const scenData = globalData.filter(d => d.scenario === scenario);
      const byYear = d3.rollup(scenData, v => ({
        mean: d3.mean(v, d => d.anomaly)
      }), d => d.year);
      allBands[scenario] = Array.from(byYear, ([year, vals]) =>
        ({ year, ...vals })
      ).sort((a, b) => a.year - b.year);
    });
  
    const bisect = d3.bisector(d => d.year).left;
  
    const hoverLine = g.append('line')
      .attr('stroke', '#555')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('y1', 0).attr('y2', innerH)
      .style('opacity', 0);
  
    g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const yearVal = Math.round(x.invert(mouseX));
  
        hoverLine
          .attr('x1', x(yearVal)).attr('x2', x(yearVal))
          .style('opacity', 1);
  
        // build tooltip rows for each scenario
        const rows = scenarios.map(scenario => {
          const band = allBands[scenario];
          const idx  = bisect(band, yearVal, 1);
          const d    = band[idx] || band[band.length - 1];
          const color = scenarioColors[scenario];
          const label = scenarioLabels[scenario].split(' — ')[0];
          return `<div style="margin-bottom:2px">
            <span style="color:${color}">●</span>
            ${label}: <strong>${d.mean > 0 ? '+' : ''}${d.mean.toFixed(2)}°C</strong>
          </div>`;
        }).join('');
  
        const tooltipX = mouseX > innerW - 200
          ? mouseX + margin.left - 210
          : mouseX + margin.left + 16;
  
        tooltip
          .style('opacity', 1)
          .style('left', `${tooltipX}px`)
          .style('top',  `${margin.top}px`)
          .html(`
            <div style="color:#8b949e; margin-bottom:6px;
                 font-weight:bold">${yearVal}</div>
            ${rows}
          `);
      })
      .on('mouseleave', function() {
        hoverLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      });
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