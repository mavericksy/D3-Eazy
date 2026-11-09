// The first ten charts, built on the shared makeChart() factory. They keep the setter names they
// always had (Band, Val, DomainBand, LinearAccessor, ...) and now also have every shared option:
// themes, legend, tooltip, axes, grid, overlays, events, export and so on.
//
// Orientation, like every bar chart in the library: "horizontal" puts the categories on the x axis.
import * as d3 from "d3";
import {
  makeChart, colours, palette, V, formatValue, keyed, tip, axisBottom, axisLeft, legend, active, drawIn, grow, linkEvent,
  showTooltip, hideTooltip, makeFormatter, isAnimated,
} from "./chart-kit.js";
import { xyRender, xyDefaults } from "./charts-more.js";

// --- value labels for bars --------------------------------------------------------------

const textDefaults = {
  WithText: false, TextFormat: (d) => d, FontDividend: 4, TextFill: null, TextAnchor: null,
  TextDeltaX: 0, TextDeltaY: 0, BarLength: 50,
};

// Print each bar's value. The label sits inside a long bar and just past the end of a short one.
// `items`: [{ mid, end, value, colour }] where mid is the band position and end the value position, in pixels.
function valueLabels(g, o, items, { vert, bandwidth, full, base }) {
  if (!(o.WithText || o.DataLabels)) return;
  const { theme } = active();
  const fontSize = Math.max(10, Math.min(14, bandwidth / o.FontDividend));
  const format = makeFormatter(o, o.LabelFormat || o.ValueFormat) || o.TextFormat;
  const inside = (it) => Math.abs(it.end - base) > full * (o.BarLength / 100);
  const onBar = (it) => (d3.hsl(it.colour).l > 0.6 ? "#111" : "#fff");
  const text = g.append("g").attr("class", "bar-labels").attr("font-size", fontSize)
    .selectAll("text").data(items).join("text").attr("class", "bar-text").attr("pointer-events", "none")
    .attr("x", (it) => (vert ? it.end + (inside(it) ? -6 : 6) + o.TextDeltaX : it.mid + o.TextDeltaX))
    .attr("y", (it) => (vert ? it.mid + o.TextDeltaY : it.end + (inside(it) ? fontSize + 3 : -5) + o.TextDeltaY))
    .attr("dy", vert ? "0.35em" : null)
    .attr("text-anchor", (it) => {
      const i = inside(it) ? 1 : 0;
      if (o.TextAnchor) return o.TextAnchor[i];
      return vert ? (i ? "end" : "start") : "middle";
    })
    .attr("fill", (it) => (o.TextFill ? o.TextFill[inside(it) ? 1 : 0] : inside(it) ? onBar(it) : theme.text))
    .text((it) => format(it.value));
  if (isAnimated()) {
    text.style("opacity", 0).transition("label").duration(o.Duration).delay((d, i) => Math.min(i * o.Stagger, 600)).style("opacity", 1);
  }
}

// --- BarChartSimple --------------------------------------------------------------------

function barRender(g, o, { width: w, height: h }) {
  const vert = o.Orient === "vertical";
  const rows = o.Data;
  const valueOf = o.Val;
  const keys = o.DomainBand.length
    ? o.DomainBandAsObject ? o.DomainBand.map(o.BandAccessor) : o.DomainBand
    : rows.map(o.Band);
  const round = o.DomainRound ? "rangeRound" : "range";
  const bandScale = d3.scaleBand().domain(keys)[round](vert ? [0, h] : [0, w]).padding(o.BarPadding);
  const val = d3.scaleLinear().domain(o.DomainVal.length ? o.DomainVal : [0, d3.max(rows, valueOf) ?? 1])[round](vert ? [0, w] : [h, 0]);
  if (!o.DomainVal.length) val.nice();
  if (o.Debug) console.debug("BarChartSimple", { width: w, height: h, keys, domain: val.domain() });
  const bandAxis = vert ? axisLeft(g, bandScale) : axisBottom(g, bandScale, h);
  if (vert) axisBottom(g, val, h, 4); else axisLeft(g, val, 5);
  if (o.DomainBandAsObject && bandAxis) {
    const labels = new Map(o.DomainBand.map((b) => [o.BandAccessor(b), b.val ?? o.BandAccessor(b)]));
    bandAxis.selectAll("text").text((k) => labels.get(k) ?? k);
  }
  const colour = o.Colour || colours(o, keys);
  const base = val(Math.max(val.domain()[0], o.BaselineOffset));
  const rects = g.append("g").selectAll("rect").data(rows).join("rect").attr("class", "mark")
    .attr("fill", (d) => colour(o.Band(d))).attr("rx", o.CornerRadiusX)
    .attr(vert ? "y" : "x", (d) => bandScale(o.Band(d)))
    .attr(vert ? "height" : "width", bandScale.bandwidth())
    .attr(vert ? "x" : "y", (d) => Math.min(base, val(valueOf(d))))
    .attr(vert ? "width" : "height", (d) => Math.abs(val(valueOf(d)) - base));
  keyed(tip(rects, (d) => `${o.Band(d)}: ${V(valueOf(d))}`), (d) => o.Band(d));
  grow(rects, vert, base);
  valueLabels(g, o, rows.map((d) => ({
    mid: bandScale(o.Band(d)) + bandScale.bandwidth() / 2, end: val(valueOf(d)), value: valueOf(d), colour: colour(o.Band(d)),
  })), { vert, bandwidth: bandScale.bandwidth(), full: vert ? w : h, base });
}

/** Bars for one value per category. `Band` and `Val` pick the fields. `Orient` sets the direction. */
export const BarChartSimple = () =>
  makeChart({
    Band: (d) => d.name, Val: (d) => d.value, Orient: "horizontal", DomainBand: [], DomainVal: [],
    BandAccessor: (d) => d.key, DomainBandAsObject: false, DomainRound: false, BarPadding: 0.1,
    CornerRadiusX: 3, BaselineOffset: 0, Colour: null, Debug: false, ...textDefaults,
  }, barRender);

// --- GroupedBarChartSimple -------------------------------------------------------------

function groupedRender(g, o, { width: w, height: h }) {
  const vert = o.Orient === "vertical";
  const rows = o.Data;
  const groups = o.Band.length ? o.Band : rows.map(o.GroupAccessor);
  const subs = o.Subgroup;
  const groupBand = d3.scaleBand().domain(groups).rangeRound(vert ? [0, h] : [0, w]).paddingInner(o.BarPadding);
  const subBand = d3.scaleBand().domain(subs).rangeRound([0, groupBand.bandwidth()]).padding(o.SubgroupPadding);
  const max = d3.max(rows, (r) => d3.max(subs, (k) => +r[k])) ?? 1;
  const val = d3.scaleLinear().domain(o.DomainVal.length ? o.DomainVal : [0, max]).nice().rangeRound(vert ? [0, w] : [h, 0]);
  if (vert) { axisLeft(g, groupBand); axisBottom(g, val, h, 5); } else { axisBottom(g, groupBand, h); axisLeft(g, val); }
  const bySub = o.ColourBy === "subgroup";
  const colour = o.Colour || colours(o, bySub ? subs : groups);
  const cells = rows.flatMap((row) => subs.map((key) => ({ key, value: row[key], name: o.GroupAccessor(row), row })));
  const base = val(Math.max(val.domain()[0], 0));
  const along = (d) => groupBand(d.name) + subBand(d.key);
  const rects = g.append("g").selectAll("rect").data(cells).join("rect").attr("class", "mark")
    .attr("fill", (d) => colour(bySub ? d.key : d.name))
    .attr(vert ? "y" : "x", along).attr(vert ? "height" : "width", subBand.bandwidth())
    .attr(vert ? "x" : "y", (d) => Math.min(base, val(d.value)))
    .attr(vert ? "width" : "height", (d) => Math.abs(val(d.value) - base));
  keyed(tip(rects, (d) => `${d.name} · ${d.key}: ${V(d.value)}`), (d) => d.key);
  grow(rects, vert, base);
  valueLabels(g, o, cells.map((d) => ({
    mid: along(d) + subBand.bandwidth() / 2, end: val(d.value), value: d.value, colour: colour(bySub ? d.key : d.name),
  })), { vert, bandwidth: subBand.bandwidth(), full: vert ? w : h, base });
  if (bySub) legend(g, subs, colour);
}

/** Several bars side by side per category. `Band` lists the categories, `Subgroup` the fields to compare. */
export const GroupedBarChartSimple = () =>
  makeChart({
    Band: [], Subgroup: [], GroupAccessor: (g) => g.name, DomainVal: [], Orient: "horizontal", BarPadding: 0.1,
    SubgroupPadding: 0.1, ColourBy: "group", Colour: null,
    WithText: false, FontDividend: 2.5, TextFormat: (d) => d, TextFill: null, TextAnchor: null,
    TextDeltaX: 0, TextDeltaY: 0, BarLength: 50,
  }, groupedRender);

// --- DonutChartSimple ------------------------------------------------------------------

function donutRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const side = Math.min(w, h);
  const outer = o.OuterRadiusArc ?? side * 0.46;
  const inner = o.InnerRadiusArc ?? outer * 0.4;
  const colour = colours(o, rows.map(o.Key));
  const arcs = d3.pie().value(o.Val).padAngle(1 / outer).sort((a, b) => d3.ascending(o.Val(a), o.Val(b)))(rows);
  const arc = d3.arc().innerRadius(inner).outerRadius(outer);
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const slices = centre.selectAll("path.slice").data(arcs).join("path").attr("class", "mark slice")
    .attr("fill", (a) => colour(o.Key(a.data))).attr("d", arc);
  const text = (value) => {
    const format = makeFormatter(o, o.ValueFormat);
    if (format && typeof value === "number") return format(value);
    return typeof value === "number" ? value.toLocaleString(typeof o.Locale === "string" ? o.Locale : "en-US") : value;
  };
  keyed(tip(slices, (a) => `${o.Key(a.data)}: ${text(o.ValText(a.data))}`), (a) => o.Key(a.data));
  if (isAnimated()) {
    slices.transition("arc").duration(o.Duration * 1.5).attrTween("d", (a) => {
      const step = d3.interpolate({ startAngle: 0, endAngle: 0, padAngle: a.padAngle }, a);
      return (t) => arc(step(t));
    });
  }
  if (o.Shadow) {
    // a darker thin ring just inside the donut
    const ring = d3.arc().innerRadius(inner - o.ShadowWidth).outerRadius(inner + 1);
    centre.selectAll("path.shadow").data(arcs).join("path").attr("class", "shadow").attr("pointer-events", "none")
      .attr("fill", (a) => { const c = d3.hsl(colour(o.Key(a.data))); return d3.hsl(c.h + 5, c.s - 0.07, c.l - 0.15); })
      .attr("d", ring);
  }
  const label = d3.arc().innerRadius(inner).outerRadius(outer);
  // Thin slices get no label, because the text would overlap its neighbours. The tooltip still names them.
  const labels = centre.append("g").attr("font-size", 12).attr("text-anchor", "middle").attr("pointer-events", "none")
    .selectAll("text").data(arcs.filter((a) => a.endAngle - a.startAngle > o.MinLabelAngle)).join("text").attr("class", "donut-text")
    .attr("transform", (a) => `translate(${label.centroid(a)})`)
    .attr("fill", (a) => (d3.hsl(colour(o.Key(a.data))).l > 0.6 ? "#111" : "#fff"));
  labels.append("tspan").attr("y", "-0.4em").attr("font-weight", "bold").text((a) => o.Key(a.data));
  labels.filter((a) => a.endAngle - a.startAngle > 0.25).append("tspan").attr("x", 0).attr("y", "0.7em")
    .text((a) => text(o.ValText(a.data)));
  if (o.CenterText) {
    centre.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("font-size", 15).attr("fill", "currentColor")
      .attr("fill-opacity", 0.7).text(o.CenterText);
  }
  if (o.ShowLegend) legend(g, rows.map(o.Key), colour);
}

/** Donut with a label on each slice. `Key` names a slice, `Val` sizes it, `ValText` is the text shown. */
export const DonutChartSimple = () =>
  makeChart({
    Key: (d) => d.name, Val: (d) => d.value, ValText: (d) => d.value, CenterText: "", OuterRadiusArc: null,
    InnerRadiusArc: null, Shadow: true, ShadowWidth: 10, ShowLegend: false, MinLabelAngle: 0.2,
  }, donutRender);

// --- LineLinearSpark -------------------------------------------------------------------

// The dot, guide line and readout drawn where the pointer (or a linked chart) is.
function sparkLook(g, o, { lin, vs, h, stroke }) {
  const dot = g.append("circle").attr("class", "spark-dot").attr("r", 3).attr("fill", stroke).style("pointer-events", "none").style("opacity", 0);
  const guide = g.append("line").attr("class", "spark-guide").attr("stroke", "#999").attr("stroke-width", 0.5)
    .attr("stroke-dasharray", "5 3").attr("y2", h).style("pointer-events", "none").style("opacity", 0);
  const readout = g.append("text").attr("class", "spark-readout").attr("y", -4).attr("font-size", 11).attr("fill", stroke).style("opacity", 0);
  return {
    show(d) {
      if (d === undefined) return;
      const px = lin(o.LinearAccessor(d));
      dot.attr("cx", px).attr("cy", vs(o.ValAccessor(d))).style("opacity", 1);
      guide.attr("x1", px).attr("x2", px).style("opacity", 1);
      readout.text(`${formatValue(o, o.ValAccessor(d))} · ${formatValue(o, o.LinearAccessor(d))}`).style("opacity", 1);
    },
    clear() {
      dot.style("opacity", 0);
      guide.style("opacity", 0);
      readout.style("opacity", 0);
    },
  };
}

function sparkRender(g, o, { width: w, height: h }) {
  const data = o.Data;
  const linearOf = o.LinearAccessor, valueOf = o.ValAccessor;
  const isTime = o.TimeSeries || linearOf(data[0]) instanceof Date;
  const lin = (isTime ? d3.scaleTime() : d3.scaleLinear())
    .domain(o.DomainLinear.length ? o.DomainLinear : d3.extent(data, linearOf)).range([0, w]);
  const vs = d3.scaleLinear().domain(o.DomainVal.length ? o.DomainVal : [0, d3.max(data, valueOf) ?? 1]).range([h, 0]);
  axisBottom(g, lin, h);
  axisLeft(g, vs);
  if (o.WithRightScale) g.append("g").attr("transform", `translate(${w},0)`).call(d3.axisRight(vs).ticks(1));
  const stroke = o.ChartColour || "currentColor";
  const line = d3.line().x((d) => lin(linearOf(d))).y((d) => vs(valueOf(d))).curve(o.Curve);
  const path = g.append("path").datum(data).attr("class", "mark line").attr("fill", "none").attr("stroke", stroke)
    .attr("stroke-width", o.StrokeWidth).attr("shape-rendering", "geometricPrecision").attr("d", line);
  drawIn(path);
  if (o.Markers) {
    g.append("g").selectAll("circle").data(data).join("circle").attr("class", "marker").attr("r", 1.5).attr("fill", stroke)
      .attr("fill-opacity", 0.6).attr("cx", (d) => lin(linearOf(d))).attr("cy", (d) => vs(valueOf(d))).style("pointer-events", "none");
  }
  if (o.EndLabel) {
    const last = data[data.length - 1];
    g.append("text").attr("class", "end-label").attr("fill", "currentColor").attr("fill-opacity", 0.6).attr("font-size", 11)
      .attr("x", w + 6).attr("y", vs(valueOf(last)) + 4).text(V(valueOf(last)));
  }
  const { theme } = active();
  const look = sparkLook(g, o, { lin, vs, h, stroke });
  const bisect = d3.bisector((d) => +linearOf(d)).center;
  const nearest = (value) => data[Math.max(0, Math.min(data.length - 1, bisect(data, +value)))];
  const key = o.SvgID || "spark";
  const hover = o.WithHover && typeof o.WithHover === "object" ? o.WithHover : null;
  if (hover || o.Tooltip !== "none") {
    g.append("rect").attr("class", "spark-area").attr("data-self-tooltip", "").attr("width", w).attr("height", h).attr("fill", "none").attr("pointer-events", "all")
      .on("mousemove", (event) => {
        const [px] = d3.pointer(event);
        const d = nearest(lin.invert(px));
        look.show(d);
        if (o.Tooltip !== "none") showTooltip(o, theme, `${formatValue(o, valueOf(d))}\n${formatValue(o, linearOf(d))}`, event.clientX, event.clientY);
        if (hover) {
          Object.assign(hover.detail, { _data: d, originalEvent: event, posX: px, posY: d3.pointer(event)[1], enter: true });
          document.body.dispatchEvent(hover);
        }
      })
      .on("mouseleave", () => {
        look.clear();
        hideTooltip();
        if (hover) { hover.detail.enter = false; document.body.dispatchEvent(hover); }
      });
  }
  // Show the same moment when a linked chart broadcasts a hover. `OnHover("eventName")` or the chart's own event.
  const follow = (e) => {
    if (!e.detail || !e.detail.enter) return look.clear();
    look.show(e.detail._data ?? nearest(e.detail.date ?? e.detail.value));
  };
  if (hover) linkEvent(hover.type, key, follow);
  if (typeof o.OnHover === "string") linkEvent(o.OnHover, key, follow);
}

/** A line over a number axis, made for small charts. Hover shows a guide line. Linked hover: `WithHover` / `OnHover("name")`. */
export const LineLinearSpark = () =>
  makeChart({
    LinearAccessor: (d) => d.x, ValAccessor: (d) => d.y, DomainLinear: [], DomainVal: [], Curve: d3.curveBasis,
    ChartColour: null, StrokeWidth: 1, WithRightScale: false, WithHover: false, TimeSeries: false, Markers: false,
    EndLabel: true, ShowXAxis: false, ShowYAxis: false, MarginTop: 14, MarginLeft: 10, MarginRight: 40, MarginBottom: 10,
  }, sparkRender);

// --- LineTimeChartSimple and MultiLineTimeChartSimple ---------------------------------

/** One line over time. Same drawing as LineChartSimple with time-specific setter names. */
export const LineTimeChartSimple = () =>
  makeChart({
    ...xyDefaults, Area: false, Grid: "both", Time: (d) => d.date, Linear: (d) => d.value,
    DomainTime: [], DomainLinear: [], StrokeColour: null, StrokeWidth: 1.5, Crosshair: true,
  }, (g, o, size) => xyRender(g, {
    ...o, X: o.Time, Y: o.Linear, Series: null, DomainX: o.DomainTime,
    DomainY: o.DomainLinear.length ? o.DomainLinear : null,
    ColourOverrides: o.StrokeColour ? { ...o.ColourOverrides, "": o.StrokeColour } : o.ColourOverrides,
  }, size));

/**
 * Several lines over time from rows like `{ date, a: 1, b: 2 }`. `LineKeys` picks the fields.
 * `WithLegend({ a: "Label A" })` gives the legend text. The tooltip lists every line at the pointer.
 */
export const MultiLineTimeChartSimple = () =>
  makeChart({
    ...xyDefaults, Area: false, Grid: "both", Time: (d) => d.date, LineKeys: [], DomainTime: [], DomainVal: [],
    WithLegend: {}, WithDateOptions: xyDefaults.DateOptions, Colour: null, Crosshair: true,
  }, (g, o, size) => {
    const rows = o.Data.flatMap((row) => o.LineKeys.map((key) => ({ date: o.Time(row), key, value: row[key] })));
    xyRender(g, {
      ...o, Data: rows, X: (d) => d.date, Y: (d) => d.value, Series: (d) => d.key, DomainX: o.DomainTime,
      DomainY: o.DomainVal.length ? o.DomainVal : null, DateOptions: o.WithDateOptions,
      LegendLabels: o.WithLegend,
      ColourDomain: o.ColourDomain.length ? o.ColourDomain : o.LineKeys,
    }, size);
  });

// --- SingleHorzBarChart ----------------------------------------------------------------

function singleRender(g, o, { width: w, height: h }) {
  const series = o.Data;
  const x = d3.scaleLinear().domain(o.DomainVal.length ? o.DomainVal : [0, d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1]).range([0, w]);
  axisBottom(g, x, h);
  const colour = o.Colour || colours(o, series.map((s) => s.key));
  const { root } = active();
  const groups = g.append("g").selectAll("g").data(series).join("g").attr("class", "category_bar")
    .attr("fill", (s) => colour(s.key)).attr("data-series", (s) => s.key);
  const rects = groups.selectAll("rect").data((s) => s).join("rect").attr("class", "mark")
    .attr("x", (d) => x(d[0])).attr("y", 0).attr("height", h).attr("width", (d) => x(d[1]) - x(d[0]));
  keyed(tip(rects, function (d) { return `${d3.select(this.parentNode).datum().key}: ${V(+(d[1] - d[0]).toFixed(3))}`; }),
    function () { return d3.select(this.parentNode).datum().key; });
  grow(rects, true, x(x.domain()[0]));
  if (o.WithText) {
    g.append("g").attr("class", "text").attr("fill", "currentColor").attr("text-anchor", "middle")
      .selectAll("text").data(series).join("text")
      .attr("x", (s) => (x(s[0][0]) + x(s[0][1])) / 2).attr("y", h).attr("dy", "1.2em").text((s) => s.key);
  }
  if (o.WithHover && series.length > 1) {
    let locked = false, inside = false;
    const fire = (id) => { if (o.HoverEvent) document.body.dispatchEvent(new CustomEvent(o.HoverEvent, { detail: { id } })); };
    const only = (id) => groups.attr("opacity", (s) => (id === null || s.key === id ? 1 : 0.1));
    rects
      .on("mouseenter", function () {
        inside = true;
        if (locked) return;
        const id = d3.select(this.parentNode).datum().key;
        only(id);
        fire(id);
      })
      .on("mouseleave", () => {
        inside = false;
        if (locked) return;
        only(null);
        fire("");
      })
      .on("click", () => { locked = !locked; });
    linkEvent("click", o.SvgID || "single-bar", () => {
      if (!inside && locked) { locked = false; only(null); fire(""); }
    });
  }
  void root;
}

/** One stacked bar. `Data` is the result of `d3.stack().keys([...])([row])`. */
export const SingleHorzBarChart = () =>
  makeChart({
    DomainVal: [], Colour: null, WithHover: false, HoverEvent: "", WithText: false,
    ShowXAxis: false, ShowYAxis: false, MarginTop: 4, MarginBottom: 24, MarginLeft: 4, MarginRight: 4,
  }, singleRender);

// --- LineAndBarChartSimple -------------------------------------------------------------

function lineAndBarRender(g, o, { width: w, height: h }) {
  const data = o.Data;
  const domainX = o.BandDomain.length ? o.BandDomain : [0, d3.max(data, (d) => +d.key) ?? 1];
  const domainY = o.ValDomain.length ? o.ValDomain : [0, d3.max(data, (d) => d.value) ?? 1];
  const x = d3.scaleLinear().domain(domainX).range([0, w]);
  const y = d3.scaleLinear().domain(domainY).range([h, 0]);
  axisBottom(g, x, h);
  axisLeft(g, y, 5);
  const barWidth = o.BarWidth ?? (domainX[1] ? w / domainX[1] / 2 : 4);
  const rects = g.append("g").selectAll("rect").data(data).join("rect").attr("class", "mark")
    .attr("fill", o.BarColour).attr("x", (d) => x(d.key)).attr("width", barWidth)
    .attr("y", (d) => y(d.value)).attr("height", (d) => h - y(d.value));
  tip(rects, (d) => `${V(d.key)}: ${V(d.value)}`);
  grow(rects, false, h);
  const bins = d3.bin().value((d) => d.key).domain(x.domain()).thresholds(x.ticks(domainX[1] * o.ThresholdBin))(data);
  const mean = (b) => (b.length ? d3.mean(b, (d) => d.value) : 0);
  const line = d3.line().curve(d3.curveMonotoneX).x((b, i) => x(i === 0 ? b.x0 : b.x1)).y((b) => y(mean(b)));
  const stroke = o.StrokeColour || palette()[1] || "currentColor";
  drawIn(g.append("path").datum(bins).attr("class", "path").attr("fill", "none").attr("stroke", stroke)
    .attr("stroke-width", o.StrokeWidth).attr("d", line));
}

/** Bars at numeric positions with a line of the average value per bin. `Data` rows are `{ key: number, value }`. */
export const LineAndBarChartSimple = () =>
  makeChart({
    BandDomain: [], ValDomain: [], ThresholdBin: 0.3, StrokeColour: null, StrokeWidth: 1.5, BarColour: "#69b3a2", BarWidth: null,
    MarginLeft: 40,
  }, lineAndBarRender);

// --- HeatMapBlockedSimple --------------------------------------------------------------

function heatBlocksRender(g, o, { width: w, height: h }) {
  const rows = o.DataAccessor(o.Data).slice().sort(o.SortFn);
  if (!rows.length) return;
  const rowCount = Math.max(1, o.DateExtent);
  const columns = Math.ceil(rows.length / rowCount);
  const gap = o.CellSpacing;
  const cellW = Math.max(0, w / columns - gap * 2), cellH = Math.max(0, h / rowCount - gap * 2);
  const statuses = [...new Set(rows.map(o.StatusAccessor))];
  const colour = o.ColourFnZ || d3.scaleOrdinal(o.ColourDomainZ.length ? o.ColourDomainZ : statuses, o.ColourRangeZ || palette());
  const dateText = (d) => String(o.DateAccessor(d));
  const column = (i) => (o.Orient === "vertical" ? Math.floor(i / rowCount) : i % columns);
  const rowOf = (i) => (o.Orient === "vertical" ? i % rowCount : Math.floor(i / columns));
  const seen = new Set();
  const cells = g.append("g").attr("class", "cells").selectAll("rect").data(rows).join("rect").attr("class", "mark square")
    .attr("data-date", dateText).attr("width", cellW).attr("height", cellH)
    .attr("x", (d, i) => column(i) * (cellW + gap * 2) + gap).attr("y", (d, i) => rowOf(i) * (cellH + gap * 2) + gap)
    .attr("fill", (d) => colour(o.StatusAccessor(d))).attr("stroke", "#111")
    .attr("stroke-width", (d) => { const t = dateText(d); if (seen.has(t)) return 0.1; seen.add(t); return 2; });
  keyed(tip(cells, (d) => `${o.DateAccessor(d) instanceof Date ? o.DateAccessor(d).toLocaleDateString() : o.DateAccessor(d)}: ${o.StatusAccessor(d)}`),
    (d) => o.StatusAccessor(d));
  grow(cells, false, 0);
  // Highlight every block of one date. Used by hover and by linked charts.
  const highlight = (date) => cells.style("opacity", function () { return this.getAttribute("data-date") === String(date) ? 1 : 0.2; });
  const clear = () => cells.style("opacity", null);
  const key = o.SvgID || "heat-blocks";
  const hover = o.WithHover && typeof o.WithHover === "object" ? o.WithHover : null;
  if (hover) {
    cells
      .on("mousemove", function (event, d) {
        const [px, py] = d3.pointer(event, g.node());
        Object.assign(hover.detail, { date: o.DateAccessor(d), obj: d, originalEvent: event, posX: px, posY: py, enter: true });
        document.body.dispatchEvent(hover);
      })
      .on("mouseleave", () => { hover.detail.enter = false; document.body.dispatchEvent(hover); });
    linkEvent(hover.type, key, (e) => (e.detail.enter ? highlight(e.detail.date) : clear()));
  }
  if (typeof o.OnHover === "string") linkEvent(o.OnHover, key, (e) => (e.detail.enter ? highlight(e.detail.date) : clear()));
}

/**
 * One block per record, coloured by its status, filled row by row. `DateExtent` is the number of rows.
 * Linked hover: `WithHover(new CustomEvent(name, { detail: {} }))` sends, `OnHover("name")` receives.
 */
export const HeatMapBlockedSimple = () =>
  makeChart({
    DataAccessor: (d) => d, DateAccessor: (d) => d.date, StatusAccessor: (d) => d.status, SortFn: () => 0,
    WithHover: false, ColourFnZ: null, ColourDomainZ: [], ColourRangeZ: null, Orient: "horizontal",
    DateExtent: 7, CellSpacing: 0.1, MarginLeft: 4, MarginRight: 4, MarginTop: 4, MarginBottom: 4,
  }, heatBlocksRender, { empty: (o) => o.DataAccessor(o.Data).length === 0 });

// --- CircularHeatChartSimple -----------------------------------------------------------

function circularRender(g, o, { width: w, height: h }) {
  const data = o.Data;
  const rings = Math.max(1, Math.ceil(data.length / o.NumSegments));
  const outer = o.InnerRadius + rings * o.SegmentHeight;
  const extent = o.DomainVal.length ? o.DomainVal : d3.extent(data, o.DataAccessor);
  const colour = d3.scaleLinear().domain(extent).range(o.ColourRange);
  const step = (2 * Math.PI) / o.NumSegments;
  const arc = d3.arc()
    .innerRadius((d, i) => o.InnerRadius + Math.floor(i / o.NumSegments) * o.SegmentHeight)
    .outerRadius((d, i) => o.InnerRadius + (Math.floor(i / o.NumSegments) + 1) * o.SegmentHeight)
    .startAngle((d, i) => (i % o.NumSegments) * step)
    .endAngle((d, i) => ((i % o.NumSegments) + 1) * step);
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const segments = centre.selectAll("path").data(data).join("path").attr("class", "mark segment")
    .attr("d", (d, i) => arc(d, i)).attr("fill", (d) => colour(o.DataAccessor(d)));
  tip(segments, (d) => `${V(o.DataAccessor(d))}`);
  centre.selectAll("text.segment-label").data(o.SegmentLabels).join("text").attr("class", "segment-label")
    .attr("text-anchor", "middle").attr("dy", "0.35em").attr("font-size", 10).attr("fill", "currentColor")
    .attr("transform", (d, i) => {
      const angle = (i + 0.5) * step, r = outer + 10;
      return `translate(${Math.sin(angle) * r},${-Math.cos(angle) * r})`;
    })
    .text((d) => d);
  centre.selectAll("text.radial-label").data(o.RadialLabels).join("text").attr("class", "radial-label")
    .attr("text-anchor", "end").attr("dy", "0.35em").attr("font-size", 10).attr("fill", "currentColor")
    .attr("x", -4).attr("y", (d, i) => -(o.InnerRadius + (i + 0.5) * o.SegmentHeight)).text((d) => d);
}

/** Rings of arcs for cyclic data. Item `i` goes to ring `floor(i / NumSegments)`. `ColourRange` is [low, high]. */
export const CircularHeatChartSimple = () =>
  makeChart({
    DataAccessor: (d) => d, InnerRadius: 50, NumSegments: 24, SegmentHeight: 20, DomainVal: [],
    ColourRange: ["white", "red"], RadialLabels: [], SegmentLabels: [], MarginLeft: 20,
  }, circularRender);
