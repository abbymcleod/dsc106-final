const width  = 975;
const height = 610;

let selectedScenario = "ssp126";
let selectedYear     = 2025;
let selectedCity     = null;
let playTimer        = null;
let rawData, citySummary;
let includeTotalSeaLevel = false;



const svg = d3.select("#map")
  .attr("viewBox", [0, 0, width, height]);

const tooltip = d3.select("#tooltip");

const projection = d3.geoAlbersUsa()
  .translate([width / 2, height / 2])
  .scale(1200);

const path = d3.geoPath(projection);
const CITY_NOTES_CMIP = {
  "Boston MA":
    "Boston reaches a critical risk level because its historic waterfront, dense coastal neighborhoods, and aging infrastructure are highly exposed to rising seas and storm surge, increasing the likelihood of widespread flooding and long-term disruption along the harbor.",
  "New York NY":
    "New York reaches a critical risk level because its dense coastal development and low-lying infrastructure — including subways, tunnels, and airports — make even modest sea level rise capable of causing widespread flooding and major disruptions across the city.",

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

const CITY_NOTES_IPCC = {
  "Boston MA":
    "Boston reaches a critical risk level because its historic waterfront, dense coastal neighborhoods, and aging infrastructure are highly exposed to rising seas and storm surge, increasing the likelihood of widespread flooding and long-term disruption along the harbor.",

  "New York NY":
    "New York reaches a critical risk level because its dense coastal development and low-lying infrastructure — including subways, tunnels, and airports — make even modest sea level rise capable of causing widespread flooding and major disruptions across the city.",

  "Atlantic City NJ":
    "Atlantic City reaches a critical risk level because its low-lying barrier island position leaves it highly vulnerable to total sea-level rise, where even gradual increases can inundate large portions of the developed coastline.",

  "Norfolk VA":
    "Norfolk reaches a critical risk level because the combination of rising seas and ongoing land subsidence makes it one of the most flood-exposed cities on the East Coast, with tidal flooding already affecting daily life.",

  "Charleston SC":
    "Charleston reaches a critical risk level because much of its historic downtown sits close to sea level near tidal waterways, making it increasingly susceptible to chronic flooding as total sea-level projections rise.",

  "Miami FL":
    "Miami reaches a critical risk level because its porous limestone geology prevents effective flood barriers, meaning total sea-level rise can push water up through the ground even where seawalls exist.",

  "Tampa FL":
    "Tampa reaches a critical risk level because the shallow, enclosed geometry of Tampa Bay amplifies the impact of rising seas, increasing the risk of coastal flooding across its low-lying shoreline development.",

  "New Orleans LA":
    "New Orleans reaches a critical risk level because much of the city already sits below sea level, meaning any additional rise in total sea-level projections directly worsens an already precarious flood situation.",

  "Galveston TX":
    "Galveston reaches a critical risk level because its flat barrier island geography offers little elevation buffer, leaving the city highly exposed to total sea-level rise and intensifying Gulf Coast storm surge.",

  "Seattle WA":
    "Seattle reaches a high risk level because Pacific Coast sea-level dynamics and slower regional rise keep total projections below the critical threshold, though low-lying shoreline areas around Puget Sound remain increasingly at risk.",

  "San Francisco CA":
    "San Francisco reaches a high risk level because while total sea-level projections remain below the critical threshold, low-lying areas around the Bay face growing exposure to tidal flooding and coastal erosion over time.",

  "Honolulu HI":
    "Honolulu reaches a critical risk level because while total sea-level projections are lower than many mainland cities, its island geography leaves limited options for inland retreat, making even modest rise consequential for coastal communities."
};

const MILESTONES_CMIP = [
  {
    year: 2035,
    scenario: "ssp585",
    city: "Norfolk VA",
    headline: "Norfolk Leads Early Rise",
    text: "All cities remain at moderate risk but Norfolk already shows the highest dynamic sea-level anomaly on the East Coast, signaling early vulnerability along the Chesapeake Bay."
  },
  {
    year: 2050,
    scenario: "ssp585",
    city: "Boston MA",
    headline: "Boston Pulls Ahead",
    text: "Cities remain moderate but Boston overtakes Norfolk as the highest projected dynamic anomaly, reflecting accelerating ocean circulation changes along the Northeast coast."
  },
  {
    year: 2070,
    scenario: "ssp585",
    city: "New York NY",
    headline: "Northeast Shifts to High Risk",
    text: "Boston, New York, Atlantic City, and Norfolk all cross into high risk — the Northeast corridor emerges as the most exposed stretch of the U.S. coastline under the CMIP6 dynamic signal."
  },
  {
    year: 2100,
    scenario: "ssp585",
    city: "Boston MA",
    headline: "Critical Risk Arrives",
    text: "Boston, New York, and Atlantic City reach critical risk by end of century. Charleston moves to high risk and southern cities like Miami, Tampa, and New Orleans close in on the high threshold."
  }
];

const MILESTONES_IPCC = [
  {
    year: 2035,
    scenario: "ssp585",
    city: "Galveston TX",
    headline: "Gulf Coast First to Escalate",
    text: "Galveston is the first city to reach high risk under total sea-level projections, with New Orleans and Norfolk close behind — ice melt and land subsidence push Gulf and mid-Atlantic cities ahead of the rest of the country."
  },
  {
    year: 2050,
    scenario: "ssp585",
    city: "New Orleans LA",
    headline: "Eastern Seaboard Joins High Risk",
    text: "Every city east of Galveston crosses into high risk as total sea-level rise accelerates — ice-sheet and glacier contributions begin compounding on top of ocean dynamics across the Gulf and Atlantic coasts."
  },
  {
    year: 2070,
    scenario: "ssp585",
    city: "Galveston TX",
    headline: "Galveston Hits Critical",
    text: "Galveston becomes the first city to reach critical total sea-level risk while the remaining tracked cities hold at high risk — the Gulf Coast's low elevation and subsidence make it the most exposed region in the country."
  },
  {
    year: 2100,
    scenario: "ssp585",
    city: "Boston MA",
    headline: "Near Universal Critical Risk",
    text: "By end of century every tracked city except Seattle and San Francisco reaches critical total sea-level risk — ice melt, glaciers, land subsidence, and ocean dynamics converge to put the entire Atlantic and Gulf coastline in a precarious position."
  }
];


  // ── Scales ─────────────────────────────────────────────────────────────────
  // Color: matches your original threshold logic
  const colorScale = d3.scaleThreshold()
    .domain([15, 25])
    .range(["#58a6ff", "#e3b341", "#f85149"]);

  // ── Load data ───────────────────────────────────────────────────────────────
  Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  d3.csv("data/combined_city_sea_level.csv", d3.autoType),
  d3.csv("data/all_cities_total_sea_level.csv", d3.autoType)
  ]).then(([us, data, totalData]) => {
  rawData = data;
  rawData.forEach(d => { if (d.lon > 180) d.lon -= 360; });

  processData(totalData);
  drawBaseMap(us);
  buildLegend();
  buildTimeline(); 
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
  function processData(totalData) {
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
    citySummary.forEach(d => {
    const match = totalData.find(t =>
    t.city === d.city &&
    t.scenario === d.scenario &&
    t.year === d.year
    );

    d.total_sea_level_cm = match ? match.total_sea_level_cm : NaN;
    });
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
      .attr("r", d => getRadiusScale()(getSeaLevelValue(d)))
      .attr("fill", d => getRiskColor(getSeaLevelValue(d)));

    // Tooltip — unchanged from your original
    dots
      .on("mousemove", function(event, d) {
        tooltip
          .style("opacity", 1)
          .style("left",  `${event.clientX + 12}px`)
          .style("top",   `${event.clientY - 30}px`)
          .html(`
            <strong>${d.city}</strong><br>
            ${getRiskLabel(getSeaLevelValue(d))}<br>
            Scenario: ${formatScenario(d.scenario)}<br>
            <strong>${getSeaLevelValue(d).toFixed(1)} cm</strong>
            ${includeTotalSeaLevel ? "total projected rise" : "above 1995–2014"}
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
    const currentValue = getSeaLevelValue(current);

    const riskLabel = getRiskLabel(currentValue);
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
      ${
    includeTotalSeaLevel
      ? "IPCC total projected sea-level rise"
      : "CMIP6 dynamic sea-level anomaly"
      }
      <span class="info-icon">ⓘ</span>

      <span class="info-tooltip">
        ${
            includeTotalSeaLevel
              ? "This uses the IPCC total sea-level projection, which includes multiple contributors such as ocean dynamics, ice-sheet melt, glaciers, land water storage, and vertical land motion."
              : "This estimate uses only CMIP6 dynamic sea-level anomaly from zos."
          }
      </span>
    </span>

    <span class="stat-val">${currentValue.toFixed(1)} cm</span>
  </div>

  <div class="stat-row">
    <span class="stat-label">By 2100</span>
    <span class="stat-val">${val2100 ? getSeaLevelValue(val2100).toFixed(1) + " cm" : "—"}</span>
  </div>
  `);
    drawSparkline(city);
    d3.select("#panel-note")
    .style("border-color", getRiskColor(getSeaLevelValue(val2100)));
    d3.select(".annotation-title").style("border-color", getRiskColor(getSeaLevelValue(val2100)));
    d3.select("#panel-note-text").text(getCityNote(city));
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
  const allVals = cityData.map(d => getSeaLevelValue(d));
  const yScale = d3.scaleLinear()
    .domain([d3.min(allVals), d3.max(allVals)]).range([sh - 4, 4]);
  
  
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(getSeaLevelValue(d)))
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
      .attr("cy", yScale(getSeaLevelValue(cur)))
      .attr("r",  3.5)
      .attr("fill", sparkColors[selectedScenario])
      .attr("stroke", "#161b22")
      .attr("stroke-width", 1.5);
  }
}

  // ── Legend ──────────────────────────────────────────────────────────────────
  function buildLegend() {
  const leg = d3.select("#legend");

  // clear old legend
  leg.selectAll("*").remove();

  const [highThreshold, criticalThreshold] = getRiskThresholds();

  const items = [
    {
      label: `Moderate (<${highThreshold} cm)`,
      color: "#58a6ff",
      r: 7
    },
    {
      label: `High (${highThreshold}–${criticalThreshold} cm)`,
      color: "#e3b341",
      r: 7
    },
    {
      label: `Critical (>${criticalThreshold} cm)`,
      color: "#f85149",
      r: 7
    },
  ];

  items.forEach(item => {
    const wrap = leg.append("div")
      .attr("class", "legend-item");

    wrap.append("div")
      .attr("class", "legend-circle")
      .style("width", `${item.r * 2}px`)
      .style("height", `${item.r * 2}px`)
      .style("background", item.color)
      .style("opacity", 0.82);

    wrap.append("span")
      .text(item.label);
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
    highlightMilestone();
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
      if (selectedScenario === "ssp585") highlightMilestone();
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

  d3.select("#total-toggle").on("change", function () {
    includeTotalSeaLevel = this.checked;
    updateMap();
    if (selectedCity) updatePanel(selectedCity);
    buildLegend(); 
    buildTimeline();
  });

  // ── Helpers (your originals) ────────────────────────────────────────────────
 function getRiskLabel(value) {
  const [highThreshold, criticalThreshold] = getRiskThresholds();

  if (value < highThreshold) return "Moderate risk";
  if (value < criticalThreshold) return "High risk";
  return "Critical risk";
}

  function formatScenario(scenario) {
    return { ssp126:"SSP1-2.6", ssp245:"SSP2-4.5",
             ssp370:"SSP3-7.0", ssp585:"SSP5-8.5" }[scenario] || scenario;
  }

function getSeaLevelValue(d) {
  return includeTotalSeaLevel && Number.isFinite(d.total_sea_level_cm)
    ? d.total_sea_level_cm
    : d.sea_level_cm;
}

function getRiskThresholds() {
  return includeTotalSeaLevel
    ? [30, 75]
    : [15, 25];
}

function getRiskColor(value) {
  const [highThreshold, criticalThreshold] = getRiskThresholds();

  if (value < highThreshold) return "#58a6ff";
  if (value < criticalThreshold) return "#e3b341";
  return "#f85149";
}

function getRadiusScale() {
  return d3.scaleSqrt()
    .domain([0, includeTotalSeaLevel ? 150 : 120])
    .range([5, 22]);
}

function getCityNote(city) {
  const notes = includeTotalSeaLevel ? CITY_NOTES_IPCC : CITY_NOTES_CMIP;
  return notes[city] ?? "";
}

function buildTimeline() {
  const milestones = includeTotalSeaLevel ? MILESTONES_IPCC : MILESTONES_CMIP;

  const container = d3.select("#timeline");
  container.selectAll("*").remove();

  milestones.forEach(m => {
    const card = container.append("div")
      .attr("class", "timeline-card")
      .attr("data-year", m.year)
      .on("click", () => {
        // jump map to this milestone
        selectedYear     = m.year;
        selectedScenario = m.scenario;
        selectedCity     = m.city;

        sliderEl.value       = m.year;
        yearDisp.textContent = m.year;

        // sync scenario button
        d3.selectAll("#scenario-buttons button").classed("active", false);
        d3.select(`[data-scenario="${m.scenario}"]`).classed("active", true);

        updateMap();
        updatePanel(m.city);

        // highlight clicked card
        d3.selectAll(".timeline-card").classed("active", false);
        card.classed("active", true);
      });

    card.append("div")
      .attr("class", "timeline-year")
      .text(m.year);

    card.append("div")
      .attr("class", "timeline-headline")
      .text(m.headline);

    card.append("div")
      .attr("class", "timeline-text")
      .text(m.text);
  });
}

function highlightMilestone() {
  const milestones = includeTotalSeaLevel ? MILESTONES_IPCC : MILESTONES_CMIP;
  const active = milestones
    .filter(m => m.year <= selectedYear)
    .at(-1);
  d3.selectAll(".timeline-card").classed("active", false);
  if (active) d3.select(`[data-year="${active.year}"]`).classed("active", true);
}