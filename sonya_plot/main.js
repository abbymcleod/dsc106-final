const LAT_BANDS = [
    { key: "90°S–60°S", label: "Antarctic (90°S–60°S)" },
    { key: "60°S–30°S", label: "Southern Ocean (60°S–30°S)" },
    { key: "30°S–0°", label: "Southern Tropics (30°S–0°)" },
    { key: "0°–30°N", label: "Northern Tropics (0°–30°N)" },
    { key: "30°N–60°N", label: "Mid-Latitudes (30°N–60°N)" },
    { key: "60°N–90°N", label: "Arctic (60°N–90°N)" },
];

const SSP_COLORS = {
    ssp126: "#1a9850",
    ssp245: "#fee08b",
    ssp370: "#f46d43",
    ssp585: "#d73027",
};

const SSP_LABELS = {
    ssp126: "SSP1-2.6 (Best Case)",
    ssp245: "SSP2-4.5 (Middle Road)",
    ssp370: "SSP3-7.0 (High Emissions)",
    ssp585: "SSP5-8.5 (Worst Case)",
};

const SCENARIOS = ["ssp126", "ssp245", "ssp370", "ssp585"];

// Interpolate temperature for a given co2 target at a given year/band
// Uses linear interpolation between the two bracketing SSP scenarios
function interpolateTemp(co2Target, co2Row, tempRow) {
    const co2vals = SCENARIOS.map(s => ({ s, co2: co2Row[`co2_${s}`] }))
        .sort((a, b) => a.co2 - b.co2);

    // Clamp to bounds
    if (co2Target <= co2vals[0].co2) return tempRow[`temp_${co2vals[0].s}`];
    if (co2Target >= co2vals[co2vals.length - 1].co2)
        return tempRow[`temp_${co2vals[co2vals.length - 1].s}`];

    // Find bracketing pair
    for (let i = 0; i < co2vals.length - 1; i++) {
        const lo = co2vals[i], hi = co2vals[i + 1];
        if (co2Target >= lo.co2 && co2Target <= hi.co2) {
            const t = (co2Target - lo.co2) / (hi.co2 - lo.co2);
            return tempRow[`temp_${lo.s}`] + t * (tempRow[`temp_${hi.s}`] - tempRow[`temp_${lo.s}`]);
        }
    }
}

// Find closest SSP label for a given co2 value at 2100
function closestSSP(co2Target, co2At2100) {
    let closest = SCENARIOS[0];
    let minDist = Infinity;
    for (const s of SCENARIOS) {
        const dist = Math.abs(co2Target - co2At2100[s]);
        if (dist < minDist) { minDist = dist; closest = s; }
    }
    return closest;
}

Promise.all([
    d3.csv("data/d3_regional_temp.csv", d3.autoType),
    d3.csv("data/d3_co2_pathways.csv", d3.autoType),
]).then(([tempData, co2Data]) => {

    // Index data for fast lookup
    const co2ByYear = new Map(co2Data.map(d => [d.year, d]));
    const tempByYearBand = new Map(
        tempData.map(d => [`${d.year}|${d.lat_band}`, d])
    );

    const years = [...new Set(tempData.map(d => d.year))].sort();
    const co2At2100 = Object.fromEntries(
        SCENARIOS.map(s => [s, co2ByYear.get(2100)[`co2_${s}`]])
    );
    const co2Min = co2At2100.ssp126;
    const co2Max = co2At2100.ssp585;

    // ── State ──────────────────────────────────────────────────────────────────
    let selectedBand = "60°N–90°N"; // default to Arctic
    let sliderCO2 = co2At2100.ssp585; // default to worst case

    // ── Layout ─────────────────────────────────────────────────────────────────
    const margin = { top: 30, right: 80, bottom: 50, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 380 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Scales ─────────────────────────────────────────────────────────────────
    const xScale = d3.scaleLinear().domain([2015, 2100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([-0.5, 9]).range([height, 0]);

    // ── Axes ───────────────────────────────────────────────────────────────────
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8));

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale).ticks(6));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", -48)
        .attr("text-anchor", "middle")
        .text("Temperature Anomaly (°C vs. 2015–2020)");

    // ── SSP reference lines ────────────────────────────────────────────────────
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.anomaly))
        .defined(d => d.anomaly != null);

    const sspLines = svg.append("g").attr("class", "ssp-lines");

    SCENARIOS.forEach(s => {
        const bandData = tempData
            .filter(d => d.lat_band === selectedBand)
            .map(d => ({ year: d.year, anomaly: d[`temp_${s}`] }))
            .sort((a, b) => a.year - b.year);

        sspLines.append("path")
            .datum(bandData)
            .attr("class", `ssp-line ssp-line-${s}`)
            .attr("fill", "none")
            .attr("stroke", SSP_COLORS[s])
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.4)
            .attr("d", line);
    });

    // ── User scenario line ─────────────────────────────────────────────────────
    const userLine = svg.append("path")
        .attr("class", "user-line")
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "6,3");

    // ── Endpoint dot + label ───────────────────────────────────────────────────
    const endDot = svg.append("circle")
        .attr("r", 5)
        .attr("fill", "#ffffff");

    const endLabel = svg.append("text")
        .attr("class", "end-label")
        .attr("dy", "-0.6em")
        .attr("text-anchor", "end");

    // ── Tooltip ────────────────────────────────────────────────────────────────
    const tooltip = d3.select("#tooltip");

    // Invisible overlay for hover
    svg.append("rect")
        .attr("width", width).attr("height", height)
        .attr("fill", "none").attr("pointer-events", "all")
        .on("mousemove", function (event) {
            const [mx] = d3.pointer(event);
            const year = Math.round(xScale.invert(mx));
            if (year < 2015 || year > 2100) return;

            const co2Row = co2ByYear.get(year);
            const tempRow = tempByYearBand.get(`${year}|${selectedBand}`);
            if (!co2Row || !tempRow) return;

            const userTemp = interpolateTemp(sliderCO2, co2Row, tempRow);
            if (userTemp == null) return;

            tooltip
                .style("display", "block")
                .style("left", (event.pageX + 16) + "px")
                .style("top", (event.pageY - 28) + "px")
                .html(`<strong>${year}</strong><br/>
               Your scenario: <strong>${userTemp.toFixed(2)}°C</strong>`);
        })
        .on("mouseleave", () => tooltip.style("display", "none"));

    // ── SSP end labels (right side) ────────────────────────────────────────────
    const sspEndLabels = svg.append("g").attr("class", "ssp-end-labels");

    // ── Render / update ────────────────────────────────────────────────────────
    function update() {
        // Update SSP reference lines for new band
        SCENARIOS.forEach(s => {
            const bandData = tempData
                .filter(d => d.lat_band === selectedBand)
                .map(d => ({ year: d.year, anomaly: d[`temp_${s}`] }))
                .sort((a, b) => a.year - b.year);

            sspLines.select(`.ssp-line-${s}`)
                .datum(bandData)
                .attr("d", line);
        });

        // Compute user interpolated line
        const userData = years.map(year => {
            const co2Row = co2ByYear.get(year);
            const tempRow = tempByYearBand.get(`${year}|${selectedBand}`);
            if (!co2Row || !tempRow) return null;
            // Scale slider CO2 linearly from current (423 ppm) to sliderCO2 at 2100
            const t = (year - 2015) / (2100 - 2015);
            const co2AtYear = 423 + t * (sliderCO2 - 423);
            return { year, anomaly: interpolateTemp(co2AtYear, co2Row, tempRow) };
        }).filter(d => d && d.anomaly != null);

        userLine.datum(userData).attr("d", line);

        // Endpoint
        const last = userData[userData.length - 1];
        if (last) {
            endDot.attr("cx", xScale(last.year)).attr("cy", yScale(last.anomaly));
            endLabel
                .attr("x", xScale(last.year))
                .attr("y", yScale(last.anomaly))
                .text(`${last.anomaly.toFixed(1)}°C`);
        }

        // SSP end labels
        sspEndLabels.selectAll("*").remove();
        SCENARIOS.forEach(s => {
            const lastTemp = tempData.find(
                d => d.year === 2099 && d.lat_band === selectedBand
            );
            if (!lastTemp) return;
            sspEndLabels.append("text")
                .attr("x", xScale(2100) + 4)
                .attr("y", yScale(lastTemp[`temp_${s}`]))
                .attr("dominant-baseline", "middle")
                .attr("font-size", "10px")
                .attr("fill", SSP_COLORS[s])
                .attr("opacity", 0.7)
                .text(s.toUpperCase().replace("SSP", "SSP ").replace(/(\d)(\d)/, "$1-$2"));
        });

        // Update closest SSP badge
        const nearest = closestSSP(sliderCO2, co2At2100);
        d3.select("#nearest-ssp")
            .style("color", SSP_COLORS[nearest])
            .text(SSP_LABELS[nearest]);

        // Update CO2 display
        d3.select("#co2-display").text(`${Math.round(sliderCO2)} ppm`);
    }

    // ── Region buttons ─────────────────────────────────────────────────────────
    const bandButtons = d3.select("#band-buttons");
    LAT_BANDS.forEach(b => {
        bandButtons.append("button")
            .attr("class", () => b.key === selectedBand ? "band-btn active" : "band-btn")
            .text(b.label)
            .on("click", function () {
                selectedBand = b.key;
                d3.selectAll(".band-btn").classed("active", false);
                d3.select(this).classed("active", true);
                update();
            });
    });

    // ── CO2 slider ─────────────────────────────────────────────────────────────
    d3.select("#co2-slider")
        .attr("min", Math.round(co2Min / 5) * 5) // round to nearest 5 for nicer slider steps
        .attr("max", Math.round(co2Max / 5) * 5)
        .attr("value", Math.round(sliderCO2 / 5) * 5)
        .on("input", function () {
            sliderCO2 = +this.value;
            update();
        });

    update();
});