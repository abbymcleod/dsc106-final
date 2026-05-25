  const width  = 975;
  const height = 610;

  let selectedScenario = "ssp126";
  let selectedYear     = 2025;
  let selectedCity     = null;
  let playTimer        = null;
  let rawData, citySummary;

  const svg = d3.select("#map")
    .attr("viewBox", [0, 0, width, height]);

  const tooltip = d3.select("#tooltip");

  const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1200);

  const path = d3.geoPath(projection);
  const CITY_NOTES = {
  "Boston MA":
    "Boston finishes with a moderate projected risk in this CMIP6 scenario. While projected sea-level anomalies remain lower than many Atlantic cities, coastal infrastructure near the harbor may still face increased flooding risk over time.",

  "New York NY":
    "New York reaches a high projected risk because even moderate increases in sea level can affect densely developed coastal areas, tidal waterways, and transportation infrastructure.",

  "Atlantic City NJ":
    "Atlantic City reaches critical projected risk in this visualization. Barrier-island communities are especially exposed to sea-level rise because small increases in ocean height can affect large low-lying coastal areas.",

  "Norfolk VA":
    "Norfolk shows one of the highest projected risks in the dataset. The city’s coastal position along the Chesapeake Bay makes it highly sensitive to rising sea levels and recurrent tidal flooding.",

  "Charleston SC":
    "Charleston reaches high projected risk because much of the historic coastal city lies close to sea level near tidal waterways and marshland environments.",

  "Miami FL":
    "Miami shows moderate projected risk in this CMIP6 anomaly dataset, though even relatively small increases in sea level may worsen coastal flooding and saltwater intrusion.",

  "Tampa FL":
    "Tampa reaches moderate projected risk in this CMIP6 anomaly dataset. While projected sea-level anomalies are lower than some Atlantic Coast cities, low-lying development around Tampa Bay may still face increasing coastal flooding risk over time.",
  "New Orleans LA":
  "New Orleans reaches moderate projected risk in this CMIP6 anomaly dataset. Although its projected dynamic sea-level anomaly is lower than some Atlantic Coast cities, the surrounding coastal region remains highly sensitive to rising water levels because much of the area is already low-lying and close to sea level.",

  "Galveston TX":
    "Galveston reaches moderate projected risk in this CMIP6 scenario. As a barrier-island city along the Gulf Coast, it remains exposed to shoreline change and coastal flooding.",

  "Seattle WA":
    "Seattle shows one of the lowest projected risks in the dataset, with smaller projected CMIP6 sea-level anomalies compared with Atlantic and Gulf Coast cities.",

  "San Francisco CA":
    "San Francisco reaches moderate projected risk. Although projected anomalies are lower than many East Coast cities, low-lying shoreline areas around the Bay remain sensitive to sea-level rise.",

  "Honolulu HI":
    "Honolulu shows moderate projected risk in this dataset. Even modest sea-level increases may affect beaches, coastal roads, and shoreline infrastructure on island coastlines."
};

  // ── Scales ─────────────────────────────────────────────────────────────────
  // Color: matches your original threshold logic
  const colorScale = d3.scaleThreshold()
    .domain([15, 25])
    .range(["#58a6ff", "#e3b341", "#f85149"]);

  // NEW: radius encodes magnitude (your dormant radiusScale, now active)
  const radiusScale = d3.scaleSqrt()
    .domain([0, 120])
    .range([5, 22]);

  // ── Load data ───────────────────────────────────────────────────────────────
  Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.csv("data/combined_city_sea_level.csv", d3.autoType)
  ]).then(([us, data]) => {
    rawData = data;
    rawData.forEach(d => { if (d.lon > 180) d.lon -= 360; });
    drawBaseMap(us);
    processData();
    buildLegend();
    updateMap();
  });

  // ── Base map (unchanged from yours) ────────────────────────────────────────
  function drawBaseMap(us) {
    const states = topojson.feature(us, us.objects.states);
    svg.append("g")
      .selectAll("path")
      .data(states.features)
      .join("path")
      .attr("class", "state")
      .attr("d", path);
  }

  // ── processData: now builds ALL years, not just 2100 ──────────────────────
  function processData() {
    const baselineByCityModel = d3.rollup(
      rawData.filter(d =>
        d.scenario === "historical" &&
        d.year >= 1995 &&
        d.year <= 2014 &&
        Number.isFinite(d.zos_raw)
      ),
      v => d3.median(v, d => d.zos_raw),
      d => d.city,
      d => d.model
    );

    rawData.forEach(d => {
      const baseline = baselineByCityModel.get(d.city)?.get(d.model);

      d.anomaly_cm = Number.isFinite(baseline)
        ? (d.zos_raw - baseline) * 100
        : NaN;
    });

    citySummary = d3.rollups(
      rawData.filter(d =>
        d.scenario !== "historical" &&
        d.year >= 2025 &&
        d.year <= 2100 &&
        Number.isFinite(d.anomaly_cm)
      ),
      values => ({
        city: values[0].city,
        lat: values[0].lat,
        lon: values[0].lon,
        scenario: values[0].scenario,
        year: values[0].year,
        sea_level_cm: d3.median(values, d => d.anomaly_cm)
      }),
      d => d.city,
      d => d.scenario,
      d => d.year
    ).flatMap(([city, scenarios]) =>
      scenarios.flatMap(([scenario, years]) =>
        years.map(([year, summary]) => summary)
      )
    );

    console.log("citySummary:", citySummary);
}

  // ── updateMap: animated transitions + dual encoding ────────────────────────
  function updateMap() {
    const filtered = citySummary.filter(d =>
      d.scenario === selectedScenario &&
      d.year     === selectedYear
    );

    const dots = svg.selectAll(".city-dot")
      .data(filtered, d => d.city)
      .join(
        enter => enter.append("circle")
          .attr("class", "city-dot")
          .attr("cx", d => projection([d.lon, d.lat])?.[0])
          .attr("cy", d => projection([d.lon, d.lat])?.[1])
          .attr("r",  0)
          .attr("stroke", "#0d1117")
          .attr("stroke-width", 1.5)
          .attr("fill-opacity", 0.82)
          .style("cursor", "pointer"),
        update => update,
        exit   => exit.transition().duration(200).attr("r", 0).remove()
      );

    // Animate radius + color on every update (scenario OR year change)
    dots.transition().duration(300)
      .attr("cx",   d => projection([d.lon, d.lat])?.[0])
      .attr("cy",   d => projection([d.lon, d.lat])?.[1])
      .attr("r",    d => radiusScale(d.sea_level_cm))      // ← now active
      .attr("fill", d => colorScale(d.sea_level_cm));

    // Tooltip — unchanged from your original
    dots
      .on("mousemove", function(event, d) {
        tooltip
          .style("opacity", 1)
          .style("left",  `${event.pageX + 12}px`)
          .style("top",   `${event.pageY + 12}px`)
          .html(`
            <strong>${d.city}</strong><br>
            ${getRiskLabel(d.sea_level_cm)}<br>
            Scenario: ${formatScenario(d.scenario)}<br>
            <strong>${d.sea_level_cm.toFixed(1)} cm</strong> above 1995–2014
          `);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0))

      // NEW: click opens the side panel
      .on("click", (event, d) => {
        selectedCity = d.city;
        updatePanel(d.city);
        // Highlight selected circle
        svg.selectAll(".city-dot")
          .attr("stroke", "#0d1117")
          .attr("stroke-width", 1.5);
        d3.select(event.currentTarget)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2.5);
      });
  }

  // ── Side panel ──────────────────────────────────────────────────────────────
  function updatePanel(city) {
    const panel = d3.select("#side-panel").classed("empty", false);

    // Current value for selected scenario + year
    const current = citySummary.find(d =>
      d.city     === city &&
      d.scenario === selectedScenario &&
      d.year     === selectedYear
    );
    if (!current) return;

    const riskLabel = getRiskLabel(current.sea_level_cm);
    const riskClass = riskLabel === "Critical risk" ? "risk-critical"
                    : riskLabel === "High risk"     ? "risk-high"
                    :                                 "risk-moderate";

    d3.select("#panel-city").text(city);
    d3.select("#panel-risk")
      .attr("class", `risk-label ${riskClass}`)
      .text(riskLabel);

    // Value at 2100 for comparison
    const val2100 = citySummary.find(d =>
      d.city === city && d.scenario === selectedScenario && d.year === 2100
    );

    d3.select("#panel-stats").html(`
      <div class="stat-row">
        <span class="stat-label">Year</span>
        <span class="stat-val">${selectedYear}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Scenario</span>
        <span class="stat-val">${formatScenario(selectedScenario)}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label info-label">
          CMIP6 dynamic sea-level anomaly
          <span class="info-icon">ⓘ</span>

          <span class="info-tooltip">
            This estimate uses only CMIP6 <code>zos</code>.
            If land-ice melt and local subsidence were added,
            total relative sea-level rise would likely be higher
            in many coastal cities.
          </span>
        </span>
        <span class="stat-val">${current.sea_level_cm.toFixed(1)} cm</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">By 2100</span>
        <span class="stat-val">
          ${val2100 ? val2100.sea_level_cm.toFixed(1) + " cm" : "—"}
        </span>
      </div>
      
    `);
    d3.select("#city-annotation").html(`
      <div class="annotation-box">
        <div class="annotation-title">
          Why this risk level?
        </div>

        <div class="annotation-text">
          ${CITY_NOTES[city]}
        </div>
      </div>
    `);

    drawSparkline(city);
  }

  // ── Sparkline: all scenarios for the selected city ─────────────────────────
  function drawSparkline(city) {
  const sw = 208, sh = 70;
  const sp = d3.select("#sparkline")
    .attr("viewBox", [0, 0, sw, sh]);
  sp.selectAll("*").remove();

  const cityData = citySummary.filter(d => d.city === city);
  if (!cityData.length) return;

  const xScale = d3.scaleLinear().domain([2025, 2100]).range([0, sw]);
  const allVals = cityData.map(d => d.sea_level_cm);
  const yScale = d3.scaleLinear()
    .domain([d3.min(allVals), 45]).range([sh - 4, 4]);
  
  const mtValue = 30;

  if (mtValue <= yScale.domain()[1]) {
    sp.append("line")
      .attr("class", "mt-line")
      .attr("x1", 0)
      .attr("x2", sw)
      .attr("y1", yScale(mtValue))
      .attr("y2", yScale(mtValue));

    sp.append("text")
      .attr("class", "mt-label")
      .attr("x", sw - 18)
      .attr("y", yScale(mtValue) - 4)
      .text("CR")
      .on("mousemove", function(event) {
        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY + 12}px`)
          .html(`
            <strong>Coastal risk reference</strong><br>
            Around this level, some coastal areas may face increased flooding and shoreline change.
          `);
      })
      .on("mouseleave", function() {
        tooltip.style("opacity", 0);
      });
  } 
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.sea_level_cm))
    .curve(d3.curveCatmullRom);

  const sparkColors = {
    ssp126: "#58a6ff", ssp245: "#e3b341",
    ssp370: "#f0883e", ssp585: "#f85149"
  };

  ["ssp126","ssp245","ssp370","ssp585"].forEach(scen => {
    const scenData = cityData
      .filter(d => d.scenario === scen)
      .sort((a, b) => a.year - b.year);
    if (!scenData.length) return;

    const isSelected = scen === selectedScenario;

    sp.append("path")
      .datum(scenData)
      .attr("class", `spark-line spark-${scen}`)
      .attr("d", line)
      .attr("stroke", sparkColors[scen])
      .attr("stroke-width", isSelected ? 2.2 : 0.8)
      .attr("opacity", isSelected ? 1 : 0.2)       // ← faded when not selected
      .attr("fill", "none")
      .style("cursor", "pointer")
      .on("click", () => {
        // clicking a faded line switches the active scenario
        selectedScenario = scen;
        d3.selectAll("#scenario-buttons button")
          .classed("active", false);
        d3.select(`[data-scenario="${scen}"]`)
          .classed("active", true);
        updateMap();
        updatePanel(city);       // redraws sparkline with new selectedScenario
      })
      .on("mouseover", function() {
        // hover temporarily highlights any line without committing
        if (scen !== selectedScenario) {
          d3.select(this).attr("opacity", 0.65).attr("stroke-width", 1.4);
        }
      })
      .on("mouseout", function() {
        if (scen !== selectedScenario) {
          d3.select(this).attr("opacity", 0.2).attr("stroke-width", 0.8);
        }
      });
  });

  // current year dot — unchanged
  const cur = cityData.find(d =>
    d.scenario === selectedScenario && d.year === selectedYear
  );
  if (cur) {
    sp.append("circle")
      .attr("cx", xScale(cur.year))
      .attr("cy", yScale(cur.sea_level_cm))
      .attr("r",  3.5)
      .attr("fill", sparkColors[selectedScenario])
      .attr("stroke", "#161b22")
      .attr("stroke-width", 1.5);
  }
}

  // ── Legend ──────────────────────────────────────────────────────────────────
  function buildLegend() {
    const items = [
      { label: "Moderate  (<15 cm)", color: "#58a6ff", r: 7  },
      { label: "High  (15–25 cm)",   color: "#e3b341", r: 7 },
      { label: "Critical  (>25 cm)", color: "#f85149", r: 7 },
    ];
    const leg = d3.select("#legend");
    items.forEach(item => {
      const wrap = leg.append("div").attr("class", "legend-item");
      wrap.append("div")
        .attr("class", "legend-circle")
        .style("width",  `${item.r * 2}px`)
        .style("height", `${item.r * 2}px`)
        .style("background", item.color)
        .style("opacity", 0.82);
      wrap.append("span").text(item.label);
    });
  }

  // ── Year slider ─────────────────────────────────────────────────────────────
  const sliderEl  = document.getElementById("year-slider");
  const yearDisp  = document.getElementById("year-display");
  const playBtn   = document.getElementById("play-btn");

  sliderEl.addEventListener("input", () => {
    selectedYear = +sliderEl.value;
    yearDisp.textContent = selectedYear;
    updateMap();
    if (selectedCity) updatePanel(selectedCity);
  });

  // Play button: animates year from current to 2100
  playBtn.addEventListener("click", () => {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
      playBtn.textContent = "▶ Play";
      return;
    }
    if (selectedYear >= 2100) {
      sliderEl.value = 2025;
      selectedYear   = 2025;
      yearDisp.textContent = 2025;
    }
    playBtn.textContent = "⏹ Stop";
    playTimer = setInterval(() => {
      selectedYear = Math.min(selectedYear + 1, 2100);
      sliderEl.value = selectedYear;
      yearDisp.textContent = selectedYear;
      updateMap();
      if (selectedCity) updatePanel(selectedCity);
      if (selectedYear >= 2100) {
        clearInterval(playTimer);
        playTimer = null;
        playBtn.textContent = "▶ Play";
      }
    }, 80);   // 80ms per year → ~6s for full 2025–2100 run
  });

  // ── Scenario buttons (your original wiring, unchanged) ─────────────────────
  d3.selectAll("#scenario-buttons button").on("click", function() {
    selectedScenario = this.dataset.scenario;
    d3.selectAll("#scenario-buttons button").classed("active", false);
    d3.select(this).classed("active", true);
    updateMap();
    if (selectedCity) updatePanel(selectedCity);
  });

  // ── Helpers (your originals) ────────────────────────────────────────────────
  function getRiskLabel(value) {
    if (value < 15) return "Moderate risk";
    if (value < 25) return "High risk";
    return "Critical risk";
  }

  function formatScenario(scenario) {
    return { ssp126:"SSP1-2.6", ssp245:"SSP2-4.5",
             ssp370:"SSP3-7.0", ssp585:"SSP5-8.5" }[scenario] || scenario;
  }