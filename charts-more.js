// More chart types. Every chart is built by makeChart(), so all of them share the same
// behaviour: chained Pascal-case setters, one <svg> per container, margins, accessible
// Title/Description, and a redraw when a setter changes after the first draw.
//
// Orientation: like BarChartSimple, "horizontal" puts the categories on the x axis and
// "vertical" puts them on the y axis.
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyJustify, sankeyLeft, sankeyRight, sankeyCenter } from "d3-sankey";
import {
  makeChart, colours, palette, V, formatValue, keyed, tip, axisBottom, axisLeft, valueScale, xScaleFor, legend,
  trendPoints, labelAt, labelText, place, bandValueScales, active, refreshOverlays, grow, emptyMessage, showTooltip, hideTooltip, makeFormatter,
} from "./chart-kit.js";
import { resolveInterpolator } from "./features.js";

// --- line and area ---------------------------------------------------------------------


// A vertical line that follows the pointer, a dot on every series, and one tooltip that lists them.
// It reads the scales from `ctx` on every event, so it keeps working after a zoom.
function crosshair(g, o, { ctx, groups, colour, w, h }) {
  const { theme } = ctx;
  const series = [...groups].map(([key, rows]) => ({ key, rows: rows.slice().sort((a, b) => o.X(a) - o.X(b)) }));
  const bisect = d3.bisector((d) => +o.X(d)).center;
  const line = g.append("line").attr("class", "crosshair").attr("stroke", theme.axis).attr("stroke-dasharray", "4 3")
    .attr("y1", 0).attr("y2", h).style("opacity", 0).style("pointer-events", "none");
  const dots = g.append("g").style("pointer-events", "none").selectAll("circle").data(series).join("circle")
    .attr("r", 4).attr("fill", (s) => colour(s.key)).attr("stroke", "#fff").style("opacity", 0);
  const heading = (value) => (value instanceof Date ? value.toLocaleString(typeof o.Locale === "string" ? o.Locale : "en-US", o.DateOptions) : formatValue(o, value));
  // Zoom hides the crosshair, because its dots belong to the old scales until the pointer moves again.
  ctx.hideCrosshair = () => { line.style("opacity", 0); dots.style("opacity", 0); hideTooltip(); };
  const pick = (px) => {
    const target = ctx.x.invert(px);
    return series.map((s) => ({ s, d: s.rows[Math.max(0, Math.min(s.rows.length - 1, bisect(s.rows, +target)))] })).filter((p) => p.d);
  };
  return g.append("rect").attr("class", "crosshair-area").attr("data-self-tooltip", "").attr("width", w).attr("height", h)
    .attr("fill", "none").attr("pointer-events", "all")
    .on("mousemove", (event) => {
      const picks = pick(d3.pointer(event)[0]);
      if (!picks.length) return;
      const anchor = picks[0].d;
      line.attr("x1", ctx.x(o.X(anchor))).attr("x2", ctx.x(o.X(anchor))).style("opacity", 1);
      dots.style("opacity", (s) => (picks.some((p) => p.s === s) ? 1 : 0))
        .attr("cx", (s) => { const p = picks.find((q) => q.s === s); return p ? ctx.x(o.X(p.d)) : 0; })
        .attr("cy", (s) => { const p = picks.find((q) => q.s === s); return p ? ctx.y(o.Y(p.d)) : 0; });
      if (o.Tooltip !== "none") {
        const rows = picks.map((p) => `${(o.LegendLabels && o.LegendLabels[p.s.key]) || p.s.key || "value"}: ${formatValue(o, o.Y(p.d))}`);
        showTooltip(o, theme, [heading(o.X(anchor)), ...rows].join("\n"), event.clientX, event.clientY);
      }
    })
    .on("click", (event) => {
      // The overlay covers the lines, so it passes a click on to OnClick with the point nearest the pointer.
      if (typeof o.OnClick !== "function") return;
      const [px, py] = d3.pointer(event);
      const points = pick(px).map((p) => p.d);
      if (!points.length) return;
      o.OnClick(event, d3.least(points, (d) => Math.abs(ctx.y(o.Y(d)) - py)), event.currentTarget);
    })
    .on("mouseleave", () => { line.style("opacity", 0); dots.style("opacity", 0); hideTooltip(); });
}

// Wheel to zoom, drag to pan, double-click to reset. Only the x axis zooms. The y axis refits to the
// visible points (ZoomFitY). The chart is updated in place, so the animation does not replay.
function zoomBehaviour(area, o, { ctx, base, data, X, defined, yFor, y0, paint, w, h }) {
  const zoom = d3.zoom().scaleExtent([1, o.ZoomMax]).translateExtent([[0, 0], [w, h]]).extent([[0, 0], [w, h]])
    .on("zoom", (event) => {
      const next = event.transform.rescaleX(base);
      let ny = y0;
      if (o.ZoomFitY) {
        const [lo, hi] = next.domain();
        const visible = data.filter((d) => defined(d) && X(d) >= lo && X(d) <= hi);
        if (visible.length > 1) ny = yFor(visible);
      }
      if (ctx.hideCrosshair) ctx.hideCrosshair();
      ctx.x = next;
      ctx.y = ny;
      ctx.xAxis(next);
      ctx.yAxis(ny);
      paint(next, ny);
      refreshOverlays(ctx);
    })
    .on("end", (event) => {
      if (!event.sourceEvent) return;
      const domain = ctx.x.domain();
      ctx.setSilent("ZoomDomain", event.transform.k === 1 && event.transform.x === 0 ? null : domain);
      if (typeof o.OnZoom === "function") o.OnZoom(domain);
    });
  area.style("cursor", "grab").call(zoom).on("dblclick.zoom", null)
    .on("dblclick", () => {
      ctx.set("ZoomDomain", null);
      if (typeof o.OnZoom === "function") o.OnZoom(null);
    });
}

// Keep the first, last, lowest and highest point of every pixel column. A line drawn from these
// looks the same as one drawn from all the points, and spikes are not lost. Undefined rows are kept,
// because they break the line.
function decimateRows(rows, px, py, defined) {
  const out = [];
  let bucket = null;
  const flush = () => {
    if (!bucket) return;
    const picks = [...new Set([bucket.first, bucket.min, bucket.max, bucket.last])].sort((a, b) => a.i - b.i);
    for (const pick of picks) out.push(pick.d);
    bucket = null;
  };
  rows.forEach((d, i) => {
    if (!defined(d)) { flush(); out.push(d); return; }
    const column = Math.floor(px(d)), value = py(d), rec = { d, i };
    if (bucket && bucket.column === column) {
      bucket.last = rec;
      if (value < bucket.low) { bucket.min = rec; bucket.low = value; }
      if (value > bucket.high) { bucket.max = rec; bucket.high = value; }
    } else {
      flush();
      bucket = { column, first: rec, last: rec, min: rec, max: rec, low: value, high: value };
    }
  });
  flush();
  return out;
}

export function xyRender(g, o, { width: w, height: h }) {
  const ctx = active();
  const { Data: data, X, Y } = o;
  const defined = (d) => Y(d) != null && !Number.isNaN(+Y(d));
  const base = xScaleFor(data.map(X), [0, w]);
  const start = o.ZoomDomain || (o.DomainX && o.DomainX.length ? o.DomainX : null);
  if (start) base.domain(start);
  const type = valueScale(o.YScale);
  const yFor = (rows) => {
    const ys = rows.filter(defined).map(Y);
    const lowest = o.YScale === "log" ? d3.min(ys.filter((v) => v > 0)) ?? 1 : Math.min(0, d3.min(ys) ?? 0);
    return type().domain(o.DomainY ?? [lowest, d3.max(ys) ?? 1]).nice().range([h, 0]);
  };
  const y0 = yFor(data);
  axisBottom(g, base, h);
  axisLeft(g, y0);
  const groups = o.Series ? d3.group(data, o.Series) : new Map([["", data]]);
  const colour = colours(o, [...groups.keys()]);
  const clipId = `${o.SvgID || "chart"}-clip`;
  if (o.Zoom) ctx.root.append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", w).attr("height", h);
  const plot = g.append("g").attr("class", "plot").attr("clip-path", o.Zoom ? `url(#${clipId})` : null);

  // Sort each series once. Zoom repaints often, so it must not sort again.
  const series = [...groups].map(([key, rows]) => {
    const sorted = rows.slice().sort((a, b) => X(a) - X(b));
    const xs = sorted.map((d) => +X(d));
    return { key, sorted, xs, trend: o.Trendline ? trendPoints(sorted.filter(defined).map((d) => [+X(d), +Y(d)])) : null };
  });

  // Draw every mark for the scales `x` and `y`. Zoom calls this again with new scales.
  function paint(x, y) {
    plot.selectAll("*").remove();
    const line = d3.line().curve(o.Curve).defined(defined).x((d) => x(X(d))).y((d) => y(Y(d)));
    const floor = y(o.YScale === "log" ? y.domain()[0] : Math.max(y.domain()[0], 0));
    const area = d3.area().curve(o.Curve).defined(defined).x((d) => x(X(d))).y0(floor).y1((d) => y(Y(d)));
    let index = 0;
    const [lo, hi] = x.domain().map(Number).sort((a, b) => a - b);
    for (const { key, sorted: all, xs, trend } of series) {
      // Only the points in view, plus one on each side so the line reaches the edges.
      const sorted = all.slice(Math.max(0, d3.bisectLeft(xs, lo) - 1), Math.min(all.length, d3.bisectRight(xs, hi) + 1));
      const drawn = o.Decimate && sorted.length > w * 4 ? decimateRows(sorted, (d) => x(X(d)), (d) => y(Y(d)), defined) : sorted;
      const dash = Array.isArray(o.Dash) ? o.Dash[index] : o.Dash;
      if (o.Area) {
        let fill = colour(key);
        if (o.Gradient) {
          const id = `${o.SvgID || "chart"}-fade-${index}`;
          ctx.root.select(`#${id}`).remove();
          const grad = ctx.root.append("defs").append("linearGradient").attr("id", id).attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
          grad.append("stop").attr("offset", "0%").attr("stop-color", fill).attr("stop-opacity", 0.7);
          grad.append("stop").attr("offset", "100%").attr("stop-color", fill).attr("stop-opacity", 0.02);
          fill = `url(#${id})`;
        }
        keyed(plot.append("path").attr("class", "area").attr("fill", fill).attr("opacity", o.Gradient ? 1 : o.Opacity).attr("d", area(drawn)), key);
      }
      keyed(plot.append("path").datum(sorted).attr("class", "mark line").attr("fill", "none").attr("stroke", colour(key))
        .attr("stroke-width", o.StrokeWidth).attr("stroke-dasharray", dash || null).attr("stroke-linecap", "round")
        .attr("d", line(drawn)), key);
      if (o.Points) {
        keyed(tip(
          plot.append("g").selectAll("circle").data(sorted.filter(defined)).join("circle").attr("class", "point")
            .attr("cx", (d) => x(X(d))).attr("cy", (d) => y(Y(d))).attr("r", o.PointSize).attr("fill", colour(key)),
          (d) => `${key ? key + ": " : ""}${V(Y(d))}`,
        ), key);
      }
      if (o.Trendline) {
        const t = trend;
        if (t) {
          const isDate = X(all[0]) instanceof Date;
          const pos = (v) => x(isDate ? new Date(v) : v);
          plot.append("line").attr("class", "trendline").attr("stroke", colour(key)).attr("stroke-dasharray", "5 4").attr("stroke-opacity", 0.8)
            .attr("x1", pos(t[0][0])).attr("y1", y(t[0][1])).attr("x2", pos(t[1][0])).attr("y2", y(t[1][1]));
        }
      }
      index += 1;
    }
  }
  paint(base, y0);
  if (groups.size > 1) legend(g, [...groups.keys()], colour, (key) => (o.LegendLabels && o.LegendLabels[key]) || key);
  let area = null;
  if (o.Crosshair) area = crosshair(g, o, { ctx, groups, colour, w, h });
  if (o.Zoom) {
    area = area || g.append("rect").attr("class", "zoom-area").attr("width", w).attr("height", h).attr("fill", "none").attr("pointer-events", "all");
    zoomBehaviour(area, o, { ctx, base, data, X, defined, yFor, y0, paint, w, h });
  }
}

export const xyDefaults = {
  X: (d) => d.x,
  Y: (d) => d.y,
  Series: null,
  Curve: d3.curveLinear,
  DomainY: null,
  StrokeWidth: 1.5,
  Points: false,
  PointSize: 3,
  Opacity: 0.3,
  YScale: "linear",
  Dash: null,
  Gradient: false,
  Trendline: false,
  DomainX: null,
  Crosshair: false,
  Decimate: true,
  Zoom: false,
  ZoomDomain: null,
  ZoomMax: 40,
  ZoomFitY: true,
  OnZoom: null,
  LegendLabels: null,
  DateOptions: { year: "numeric", month: "short", day: "numeric" },
};

// Keys a render function shows in its legend. makeChart reads `render.legendKeys` to reserve room.
const groupKeys = (rows, accessor) => {
  if (!accessor) return [];
  const keys = [...new Set(rows.map(accessor))];
  return keys.length > 1 ? keys : [];
};
xyRender.legendKeys = (o) => groupKeys(o.Data, o.Series);

/** Lines over a number or date x axis. `Series` (accessor) splits the data into several lines. */
export const LineChartSimple = () => makeChart({ ...xyDefaults, Area: false }, xyRender);
/** Same as LineChartSimple with the area under each line filled. */
export const AreaChartSimple = () => makeChart({ ...xyDefaults, Area: true }, xyRender);

function stackedAreaRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const keys = o.Keys;
  const series = d3.stack().keys(keys).offset(o.Offset).order(o.Order)(rows);
  const x = xScaleFor(rows.map(o.X), [0, w]);
  const y = d3
    .scaleLinear()
    .domain([d3.min(series, (s) => d3.min(s, (d) => d[0])) ?? 0, d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1])
    .nice()
    .range([h, 0]);
  const colour = colours(o, keys);
  const area = d3
    .area()
    .curve(o.Curve)
    .x((d, i) => x(o.X(rows[i])))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]));
  tip(
    keyed(g.selectAll("path.mark").data(series).join("path").attr("class", "mark layer")
      .attr("fill", (s) => colour(s.key)).attr("d", area), (s) => s.key),
    (s) => s.key,
  );
  axisBottom(g, x, h);
  if (o.ShowYAxis) axisLeft(g, y);
  legend(g, keys, colour);
}
stackedAreaRender.legendKeys = (o) => o.Keys;

/** Stacked area. Data is rows like `{ day: Date, a: 1, b: 2 }`. `Keys` lists the fields to stack. */
export const StackedAreaChartSimple = () =>
  makeChart(
    { X: (d) => d.x, Keys: [], Offset: d3.stackOffsetNone, Order: d3.stackOrderNone, Curve: d3.curveLinear, ShowYAxis: true },
    stackedAreaRender,
  );
/** Stacked area centred on a wiggling baseline. Same setters as StackedAreaChartSimple. */
export const StreamGraphSimple = () =>
  makeChart(
    { X: (d) => d.x, Keys: [], Offset: d3.stackOffsetWiggle, Order: d3.stackOrderInsideOut, Curve: d3.curveBasis, ShowYAxis: false, Grid: "none" },
    stackedAreaRender,
  );

function stepRender(g, o, size) {
  xyRender(g, { ...o, Curve: d3.curveStepAfter }, size);
}
/** Step line. Same setters as LineChartSimple. */
export const StepLineChartSimple = () => makeChart({ ...xyDefaults, Area: false }, stepRender);

// --- bars ------------------------------------------------------------------------------

function stackedBarRender(g, o, size) {
  const rows = o.Data;
  const keys = o.Keys;
  const series = d3.stack().keys(keys).offset(o.Normalize ? d3.stackOffsetExpand : d3.stackOffsetNone)(rows);
  const { bandScale, val } = bandValueScales(
    g, o, size, rows.map(o.Band), [0, d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1],
  );
  const colour = colours(o, keys);
  const vert = o.Orient === "vertical";
  for (const s of series) {
    const rects = g.append("g").attr("fill", colour(s.key)).selectAll("rect").data(s).join("rect").attr("class", "mark")
      .attr(vert ? "y" : "x", (d) => bandScale(o.Band(d.data)))
      .attr(vert ? "height" : "width", bandScale.bandwidth())
      .attr(vert ? "x" : "y", (d) => (vert ? val(d[0]) : val(d[1])))
      .attr(vert ? "width" : "height", (d) => Math.abs(val(d[1]) - val(d[0])));
    keyed(tip(rects, (d) => `${s.key}: ${V(+(d[1] - d[0]).toFixed(3))}`), s.key);
    grow(rects, vert, val(0));
    if (o.DataLabels) {
      // centred in each segment
      s.forEach((d) => {
        const mid = (val(d[0]) + val(d[1])) / 2, band = bandScale(o.Band(d.data)) + bandScale.bandwidth() / 2;
        const [lx, ly] = place(o.Orient)(band, mid);
        labelAt(g, labelText(o, +(d[1] - d[0]).toFixed(3)), lx, ly + 3, "middle", "#fff").attr("data-key", s.key).attr("pointer-events", "none");
      });
    }
  }
  legend(g, keys, colour);
}
stackedBarRender.legendKeys = (o) => o.Keys;

/** Stacked bars. Data is rows like `{ name: "Q1", a: 1, b: 2 }`. `Keys` lists the fields to stack. `Normalize(true)` makes every bar 100%. */
export const StackedBarChartSimple = () =>
  makeChart({ Band: (d) => d.name, Keys: [], Orient: "horizontal", Normalize: false, Padding: 0.15 }, stackedBarRender);

function lollipopRender(g, o, size) {
  const rows = o.Data;
  const { bandScale, val } = bandValueScales(g, o, size, rows.map(o.Band), [0, d3.max(rows, o.Val) ?? 1]);
  const colour = colours(o, rows.map(o.Band));
  const p = place(o.Orient);
  const base = val(0);
  const stems = g.append("g").attr("stroke", "#888");
  const heads = g.append("g");
  rows.forEach((d) => {
    const b = bandScale(o.Band(d)) + bandScale.bandwidth() / 2;
    const [x1, y1] = p(b, base);
    const [x2, y2] = p(b, val(o.Val(d)));
    stems.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
    tip(
      heads.append("circle").datum(d).attr("class", "mark").attr("cx", x2).attr("cy", y2)
        .attr("r", o.Radius).attr("fill", colour(o.Band(d))),
      () => `${o.Band(d)}: ${V(o.Val(d))}`,
    );
    if (o.DataLabels) {
      const vert = o.Orient === "vertical";
      labelAt(g, labelText(o, o.Val(d)), vert ? x2 + o.Radius + 4 : x2, vert ? y2 + 3 : y2 - o.Radius - 4, vert ? "start" : "middle", "currentColor");
    }
  });
}
/** Lollipop chart: a bar chart drawn as a stem and a dot. Same setters as BarChartSimple. */
export const LollipopChartSimple = () =>
  makeChart({ Band: (d) => d.name, Val: (d) => d.value, Orient: "horizontal", Radius: 6, Padding: 0.4 }, lollipopRender);

function dumbbellRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const y = d3.scaleBand().domain(rows.map(o.Band)).range([0, h]).padding(0.4);
  const all = rows.flatMap((d) => [o.From(d), o.To(d)]);
  const x = d3.scaleLinear().domain([Math.min(0, d3.min(all) ?? 0), d3.max(all) ?? 1]).nice().range([0, w]);
  axisLeft(g, y);
  axisBottom(g, x, h, 5);
  const [c0, c1] = palette();
  rows.forEach((d) => {
    const cy = y(o.Band(d)) + y.bandwidth() / 2;
    g.append("line").attr("class", "mark").attr("stroke", "#999").attr("stroke-width", 2)
      .attr("x1", x(o.From(d))).attr("x2", x(o.To(d))).attr("y1", cy).attr("y2", cy);
    tip(g.append("circle").attr("cx", x(o.From(d))).attr("cy", cy).attr("r", 5).attr("fill", c0), () => `${o.Band(d)} from ${o.From(d)}`);
    tip(g.append("circle").attr("cx", x(o.To(d))).attr("cy", cy).attr("r", 5).attr("fill", c1), () => `${o.Band(d)} to ${o.To(d)}`);
  });
}
/** Dumbbell: the change between two values per category. `ColourRange` gives the two dot colours. */
export const DumbbellChartSimple = () =>
  makeChart(
    { Band: (d) => d.name, From: (d) => d.from, To: (d) => d.to, ColourRange: ["#4e79a7", "#e15759"], MarginLeft: 80 },
    dumbbellRender,
  );

function slopeRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const all = rows.flatMap((d) => [o.From(d), o.To(d)]);
  const y = d3.scaleLinear().domain(d3.extent(all)).nice().range([h, 0]);
  const colour = colours(o, rows.map(o.Name));
  const pad = 60;
  rows.forEach((d) => {
    const name = o.Name(d);
    tip(
      g.append("line").attr("class", "mark").attr("stroke", colour(name)).attr("stroke-width", 2)
        .attr("x1", pad).attr("x2", w - pad).attr("y1", y(o.From(d))).attr("y2", y(o.To(d))),
      () => `${name}: ${o.From(d)} to ${o.To(d)}`,
    );
    g.append("text").attr("x", pad - 6).attr("y", y(o.From(d))).attr("dy", "0.35em").attr("text-anchor", "end").attr("font-size", 10).text(`${name} ${o.From(d)}`);
    g.append("text").attr("x", w - pad + 6).attr("y", y(o.To(d))).attr("dy", "0.35em").attr("font-size", 10).text(`${o.To(d)} ${name}`);
  });
  g.append("text").attr("x", pad).attr("y", -6).attr("text-anchor", "middle").attr("font-weight", "bold").text(o.FromLabel);
  g.append("text").attr("x", w - pad).attr("y", -6).attr("text-anchor", "middle").attr("font-weight", "bold").text(o.ToLabel);
}
/** Slope chart: how each item moves between two points in time. */
export const SlopeChartSimple = () =>
  makeChart(
    { Name: (d) => d.name, From: (d) => d.from, To: (d) => d.to, FromLabel: "Before", ToLabel: "After", MarginTop: 30 },
    slopeRender,
  );

function waterfallRender(g, o, size) {
  const rows = o.Data;
  let total = 0;
  const steps = rows.map((d) => {
    const start = total;
    total += o.Val(d);
    return { name: o.Name(d), start, end: total, delta: o.Val(d) };
  });
  if (o.ShowTotal) steps.push({ name: o.TotalLabel, start: 0, end: total, delta: total, isTotal: true });
  const extent = d3.extent(steps.flatMap((s) => [s.start, s.end, 0]));
  const { bandScale, val } = bandValueScales(g, { ...o, Orient: "horizontal" }, size, steps.map((s) => s.name), extent);
  const bars = g.selectAll("rect").data(steps).join("rect").attr("class", "mark")
    .attr("x", (s) => bandScale(s.name)).attr("width", bandScale.bandwidth())
    .attr("y", (s) => val(Math.max(s.start, s.end))).attr("height", (s) => Math.abs(val(s.start) - val(s.end)))
    .attr("fill", (s) => (s.isTotal ? o.Total : s.delta >= 0 ? o.Up : o.Down));
  tip(bars, (s) => `${s.name}: ${s.delta >= 0 ? "+" : ""}${V(s.delta)}`);
  grow(bars, false, val(0));
  if (o.DataLabels) {
    for (const s of steps) {
      const top = s.end >= s.start;
      labelAt(g, labelText(o, s.delta), bandScale(s.name) + bandScale.bandwidth() / 2, top ? val(s.end) - 4 : val(s.end) + 12, "middle", "currentColor");
    }
  }
}
/** Waterfall: running total built from positive and negative steps, plus an optional total bar. */
export const WaterfallChartSimple = () =>
  makeChart(
    { Name: (d) => d.name, Val: (d) => d.value, ShowTotal: true, TotalLabel: "Total", Up: "#4e9f50", Down: "#d1495b", Total: "#4e79a7", Padding: 0.2 },
    waterfallRender,
  );

function histogramRender(g, o, { width: w, height: h }) {
  const values = o.Data.map(o.Value);
  const bins = d3.bin().thresholds(o.Thresholds).domain(o.Domain ?? (d3.extent(values)[0] === undefined ? [0, 1] : d3.extent(values)))(values);
  const x = d3.scaleLinear().domain([bins[0].x0, bins[bins.length - 1].x1]).range([0, w]);
  const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length) || 1]).nice().range([h, 0]);
  axisBottom(g, x, h);
  axisLeft(g, y);
  const bars = g.selectAll("rect").data(bins).join("rect").attr("class", "mark").attr("fill", palette()[0])
    .attr("x", (b) => x(b.x0) + 1).attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0) - 1))
    .attr("y", (b) => y(b.length)).attr("height", (b) => h - y(b.length));
  tip(bars, (b) => `${b.x0} to ${b.x1}: ${b.length}`);
  grow(bars, false, h);
  if (o.DataLabels) {
    for (const b of bins) {
      if (b.length) labelAt(g, labelText(o, b.length), (x(b.x0) + x(b.x1)) / 2, y(b.length) - 4, "middle", "currentColor");
    }
  }
}
/** Histogram of one numeric field. `Thresholds` is a bin count or a list of bin edges. */
export const HistogramSimple = () => makeChart({ Value: (d) => d, Thresholds: 10, Domain: null }, histogramRender);

// --- scatter ---------------------------------------------------------------------------

function scatterRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const xs = valueScale(o.XScale)().domain(o.DomainX ?? d3.extent(rows, o.X)).nice().range([0, w]);
  const y = valueScale(o.YScale)().domain(o.DomainY ?? d3.extent(rows, o.Y)).nice().range([h, 0]);
  axisBottom(g, xs, h);
  axisLeft(g, y);
  const groups = o.Group ? [...new Set(rows.map(o.Group))] : [];
  const colour = colours(o, groups);
  const rOf =
    typeof o.R === "function"
      ? ((scale) => (d) => scale(o.R(d)))(d3.scaleSqrt().domain([0, d3.max(rows, o.R) || 1]).range([2, o.MaxRadius]))
      : () => o.R;
  keyed(tip(
    g.selectAll("circle").data(rows).join("circle").attr("class", "mark")
      .attr("cx", (d) => xs(o.X(d))).attr("cy", (d) => y(o.Y(d))).attr("r", rOf)
      .attr("fill", (d) => (o.Group ? colour(o.Group(d)) : palette()[0])).attr("fill-opacity", o.Opacity),
    (d) => `${o.Group ? o.Group(d) + ": " : ""}(${V(o.X(d))}, ${V(o.Y(d))})`,
  ), (d) => (o.Group ? o.Group(d) : ""));
  if (o.Trendline) {
    const t = trendPoints(rows.map((d) => [+o.X(d), +o.Y(d)]));
    if (t) {
      g.append("line").attr("class", "trendline").attr("stroke", "currentColor").attr("stroke-opacity", 0.6).attr("stroke-dasharray", "5 4")
        .attr("x1", xs(t[0][0])).attr("y1", y(t[0][1])).attr("x2", xs(t[1][0])).attr("y2", y(t[1][1]));
    }
  }
  if (groups.length > 1) legend(g, groups, colour);
}
scatterRender.legendKeys = (o) => groupKeys(o.Data, o.Group);

/** Scatter plot. Set `R` to a number for a fixed size, or an accessor to make it a bubble chart. `Group` colours the dots. */
export const ScatterPlotSimple = () =>
  makeChart({ X: (d) => d.x, Y: (d) => d.y, R: 4, MaxRadius: 24, Group: null, Opacity: 0.7, DomainX: null, DomainY: null, XScale: "linear", YScale: "linear", Trendline: false }, scatterRender);

function candlestickRender(g, o, { width: w, height: h }) {
  const rows = o.Data.slice().sort((a, b) => o.Date(a) - o.Date(b));
  const x = d3.scaleBand().domain(rows.map((d) => +o.Date(d))).range([0, w]).padding(0.3);
  const y = d3
    .scaleLinear()
    .domain([d3.min(rows, o.Low) ?? 0, d3.max(rows, o.High) ?? 1])
    .nice()
    .range([h, 0]);
  const every = Math.max(1, Math.ceil(rows.length / 8));
  const fmt = d3.timeFormat("%b %d");
  g.append("g").attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % every === 0)).tickFormat((t) => fmt(new Date(t))));
  axisLeft(g, y);
  rows.forEach((d) => {
    const cx = x(+o.Date(d)) + x.bandwidth() / 2;
    const up = o.Close(d) >= o.Open(d);
    const colour = up ? o.Up : o.Down;
    g.append("line").attr("stroke", colour).attr("x1", cx).attr("x2", cx).attr("y1", y(o.High(d))).attr("y2", y(o.Low(d)));
    tip(
      g.append("rect").attr("class", "mark").attr("fill", colour).attr("x", x(+o.Date(d))).attr("width", x.bandwidth())
        .attr("y", y(Math.max(o.Open(d), o.Close(d)))).attr("height", Math.max(1, Math.abs(y(o.Open(d)) - y(o.Close(d))))),
      () => `${fmt(o.Date(d))} O ${o.Open(d)} H ${o.High(d)} L ${o.Low(d)} C ${o.Close(d)}`,
    );
  });
}
/** Candlestick chart for open, high, low and close prices. */
export const CandlestickChartSimple = () =>
  makeChart(
    { Date: (d) => d.date, Open: (d) => d.open, High: (d) => d.high, Low: (d) => d.low, Close: (d) => d.close, Up: "#4e9f50", Down: "#d1495b" },
    candlestickRender,
  );

function boxPlotRender(g, o, size) {
  const groups = [...d3.group(o.Data, o.Group)].map(([key, rows]) => {
    const v = rows.map(o.Value).sort(d3.ascending);
    const q1 = d3.quantile(v, 0.25), median = d3.quantile(v, 0.5), q3 = d3.quantile(v, 0.75);
    const iqr = q3 - q1;
    const inside = v.filter((x) => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr);
    return { key, q1, median, q3, lo: inside[0], hi: inside[inside.length - 1], outliers: v.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr) };
  });
  const all = groups.flatMap((s) => [s.lo, s.hi, ...s.outliers]);
  const { bandScale, val } = bandValueScales(g, o, size, groups.map((s) => s.key), d3.extent(all));
  const colour = colours(o, groups.map((s) => s.key));
  const p = place(o.Orient);
  const line = (b1, v1, b2, v2, stroke = "currentColor") => {
    const [x1, y1] = p(b1, v1), [x2, y2] = p(b2, v2);
    g.append("line").attr("stroke", stroke).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
  };
  for (const s of groups) {
    const b0 = bandScale(s.key), b1 = b0 + bandScale.bandwidth(), mid = (b0 + b1) / 2;
    line(mid, val(s.lo), mid, val(s.q1));
    line(mid, val(s.q3), mid, val(s.hi));
    const [bx, by] = p(b0, val(s.q3));
    const vert = o.Orient === "vertical";
    tip(
      g.append("rect").attr("class", "mark").attr("fill", colour(s.key)).attr("fill-opacity", 0.6).attr("stroke", "currentColor")
        .attr("x", vert ? val(s.q1) : bx).attr("y", vert ? by : val(s.q3))
        .attr("width", vert ? val(s.q3) - val(s.q1) : bandScale.bandwidth())
        .attr("height", vert ? bandScale.bandwidth() : val(s.q1) - val(s.q3)),
      () => `${s.key}: min ${s.lo}, Q1 ${s.q1}, median ${s.median}, Q3 ${s.q3}, max ${s.hi}`,
    );
    line(b0, val(s.median), b1, val(s.median), "currentColor");
    for (const out of s.outliers) {
      const [cx, cy] = p(mid, val(out));
      g.append("circle").attr("class", "outlier").attr("cx", cx).attr("cy", cy).attr("r", 3).attr("fill", "none").attr("stroke", "currentColor");
    }
  }
}
/** Box plot: median, quartiles, whiskers (1.5 x IQR) and outliers per group. */
export const BoxPlotSimple = () =>
  makeChart({ Group: (d) => d.group, Value: (d) => d.value, Orient: "horizontal", Padding: 0.4 }, boxPlotRender);

// --- part of a whole -------------------------------------------------------------------

function pieRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const radius = Math.min(w, h) / 2;
  const keys = rows.map(o.Key);
  const colour = colours(o, keys);
  const total = d3.sum(rows, o.Val) || 1;
  const arcs = d3.pie().sort(null).value(o.Val).padAngle(o.PadAngle).startAngle(o.StartAngle).endAngle(o.EndAngle)(rows);
  const arc = d3.arc().innerRadius(radius * o.InnerRadius).outerRadius(radius).cornerRadius(o.CornerRadius);
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  keyed(tip(
    centre.selectAll("path").data(arcs).join("path").attr("class", "mark")
      .attr("fill", (a) => colour(o.Key(a.data))).attr("d", arc),
    (a) => `${o.Key(a.data)}: ${V(o.Val(a.data))} (${d3.format(".1%")(o.Val(a.data) / total)})`,
  ), (a) => o.Key(a.data));
  if (o.Labels) {
    const mid = radius * (1 + o.InnerRadius) / 2;
    const label = d3.arc().innerRadius(mid).outerRadius(mid);
    const text = (a) => (o.ShowPercent ? d3.format(".0%")(o.Val(a.data) / total) : o.Key(a.data));
    centre.selectAll("text").data(arcs.filter((a) => a.endAngle - a.startAngle > 0.25)).join("text")
      .attr("transform", (a) => `translate(${label.centroid(a)})`).attr("text-anchor", "middle").attr("font-size", 10)
      .attr("fill", "#fff").attr("pointer-events", "none").text(text);
  }
  if (o.CentreText) {
    centre.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("font-size", radius * 0.22).attr("font-weight", 600).attr("fill", "currentColor").text(o.CentreText);
  }
  if (o.Legend !== "none" && o.ShowLegend) legend(g, keys, colour);
}
pieRender.legendKeys = (o) => (o.ShowLegend ? o.Data.map(o.Key) : []);

/** Pie chart. `InnerRadius` is a fraction of the radius (0 = pie, 0.6 = donut). */
export const PieChartSimple = () =>
  makeChart(
    { Key: (d) => d.name, Val: (d) => d.value, InnerRadius: 0, PadAngle: 0.01, Labels: true, ShowPercent: false, StartAngle: 0, EndAngle: 2 * Math.PI, CornerRadius: 0, CentreText: "", ShowLegend: false },
    pieRender,
  );

function funnelRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const max = d3.max(rows, o.Val) || 1;
  const scale = d3.scaleLinear().domain([0, max]).range([0, w]);
  const step = h / Math.max(1, rows.length);
  const colour = colours(o, rows.map(o.Stage));
  rows.forEach((d, i) => {
    const top = scale(o.Val(d)) / 2;
    const bottom = (i + 1 < rows.length ? scale(o.Val(rows[i + 1])) : scale(o.Val(d)) * 0.8) / 2;
    const y0 = i * step, y1 = (i + 1) * step - 2, c = w / 2;
    tip(
      g.append("path").attr("class", "mark").attr("fill", colour(o.Stage(d)))
        .attr("d", `M${c - top},${y0}L${c + top},${y0}L${c + bottom},${y1}L${c - bottom},${y1}Z`),
      () => `${o.Stage(d)}: ${V(o.Val(d))}`,
    );
    g.append("text").attr("x", c).attr("y", (y0 + y1) / 2).attr("dy", "0.35em").attr("text-anchor", "middle").attr("fill", "#fff").attr("font-size", 11).text(`${o.Stage(d)}: ${o.ShowPercent ? d3.format(".0%")(o.Val(d) / max) : V(o.Val(d))}`);
  });
}
/** Funnel chart: stages from widest to narrowest. */
export const FunnelChartSimple = () => makeChart({ Stage: (d) => d.name, Val: (d) => d.value, ShowPercent: false }, funnelRender);

function gaugeRender(g, o, { width: w, height: h }) {
  const radius = Math.min(w / 2, h);
  const angle = d3.scaleLinear().domain([o.Min, o.Max]).range([-Math.PI / 2, Math.PI / 2]).clamp(true);
  const arc = d3.arc().innerRadius(radius * 0.7).outerRadius(radius);
  const value = o.Value;
  const colour = (o.Thresholds.find(([upTo]) => value <= upTo) || o.Thresholds[o.Thresholds.length - 1] || [0, palette()[0]])[1];
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h})`);
  centre.append("path").attr("fill", "#e5e7eb").attr("d", arc({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }));
  centre.append("path").attr("class", "mark").attr("fill", colour).attr("d", arc({ startAngle: -Math.PI / 2, endAngle: angle(value) }));
  centre.append("text").attr("text-anchor", "middle").attr("y", -radius * 0.1).attr("font-size", radius * 0.28).attr("font-weight", "bold").text(makeFormatter(o, o.ValueFormat)?.(value) ?? o.Format(value));
  if (o.Label) centre.append("text").attr("text-anchor", "middle").attr("y", 14).attr("font-size", 11).attr("fill", "#666").text(o.Label);
}
/** Half-circle gauge for one value. `Thresholds` is `[[upTo, colour], ...]`. Does not use `Data`. */
export const GaugeChartSimple = () =>
  makeChart(
    { Value: 0, Min: 0, Max: 100, Thresholds: [[60, "#d1495b"], [85, "#edae49"], [Infinity, "#4e9f50"]], Label: "", Format: d3.format(".0f"), MarginBottom: 40 },
    gaugeRender,
    { empty: () => false },
  );

function radarRender(g, o, { width: w, height: h }) {
  const axes = o.Axes, rows = o.Data;
  const radius = Math.min(w, h) / 2 - 20;
  const max = o.Max ?? d3.max(rows, (r) => d3.max(axes, (a) => o.Value(r, a))) ?? 1;
  const r = d3.scaleLinear().domain([0, max]).range([0, radius]);
  const ang = (i) => (i * 2 * Math.PI) / axes.length;
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const ring = d3.lineRadial().angle((_, i) => ang(i)).radius((r) => r).curve(d3.curveLinearClosed);
  for (let l = 1; l <= o.Levels; l++) {
    centre.append("path").attr("fill", "none").attr("stroke", "#ddd").attr("d", ring(axes.map(() => (radius * l) / o.Levels)));
  }
  axes.forEach((a, i) => {
    const [x, y] = [Math.sin(ang(i)), -Math.cos(ang(i))];
    centre.append("line").attr("stroke", "#ccc").attr("x2", x * radius).attr("y2", y * radius);
    centre.append("text").attr("x", x * (radius + 8)).attr("y", y * (radius + 8)).attr("dy", "0.35em").attr("font-size", 10)
      .attr("text-anchor", Math.abs(x) < 0.1 ? "middle" : x > 0 ? "start" : "end").text(a);
  });
  const colour = colours(o, rows.map(o.Series));
  const shape = d3.lineRadial().angle((_, i) => ang(i)).radius((r) => r).curve(d3.curveLinearClosed);
  tip(
    keyed(centre.selectAll("path.mark").data(rows).join("path").attr("class", "mark").attr("fill", (d) => colour(o.Series(d)))
      .attr("fill-opacity", 0.25).attr("stroke", (d) => colour(o.Series(d))).attr("stroke-width", 2)
      .attr("d", (d) => shape(axes.map((a) => r(o.Value(d, a))))), (d) => o.Series(d)),
    (d) => o.Series(d),
  );
  if (rows.length > 1) legend(g, rows.map(o.Series), colour);
}
radarRender.legendKeys = (o) => (o.Data.length > 1 ? o.Data.map(o.Series) : []);

/** Radar chart. Each row of Data is one shape. `Axes` lists the fields, `Value(row, axis)` reads one. */
export const RadarChartSimple = () =>
  makeChart({ Axes: [], Series: (d) => d.name, Value: (d, axis) => d[axis], Max: null, Levels: 4 }, radarRender);

// --- hierarchy, flow and networks ------------------------------------------------------

function hierarchyOf(o) {
  // Negative and missing values count as zero, so a node can never have a negative size.
  return d3.hierarchy(o.Data, o.Children).sum((d) => Math.max(0, +o.Value(d) || 0)).sort((a, b) => b.value - a.value);
}
const hierarchyDefaults = {
  Children: (d) => d.children,
  Value: (d) => d.value,
  Name: (d) => d.name,
  MarginTop: 10, MarginBottom: 10, MarginLeft: 10, MarginRight: 10,
  Data: { name: "root", children: [] },
};
function topColour(o, root) {
  const colour = colours(o, (root.children || []).map((c) => o.Name(c.data)));
  return (node) => colour(o.Name((node.ancestors().reverse()[1] || node).data));
}

const tiles = { squarify: d3.treemapSquarify, binary: d3.treemapBinary, slice: d3.treemapSlice, dice: d3.treemapDice, sliceDice: d3.treemapSliceDice };
function treemapRender(g, o, { width: w, height: h }) {
  const root = hierarchyOf(o);
  if (!(root.value > 0)) return emptyMessage(g, o, { width: w, height: h });
  d3.treemap().tile(tiles[o.Tile] || d3.treemapSquarify).size([w, h]).paddingInner(o.Padding).round(true)(root);
  const colour = topColour(o, root);
  const leaves = root.leaves();
  const cell = g.selectAll("g").data(leaves).join("g").attr("transform", (d) => `translate(${d.x0},${d.y0})`);
  tip(
    cell.append("rect").attr("class", "mark").attr("fill", colour).attr("width", (d) => d.x1 - d.x0).attr("height", (d) => d.y1 - d.y0),
    (d) => `${d.ancestors().reverse().map((n) => o.Name(n.data)).join(" / ")}: ${V(d.value)}`,
  );
  cell.filter((d) => d.x1 - d.x0 > 40 && d.y1 - d.y0 > 16).append("text").attr("x", 4).attr("y", 13).attr("font-size", 11).attr("fill", "#fff").text((d) => o.Name(d.data));
}
/** Treemap. Data is a nested object like `{ name, children: [{ name, value }] }`. */
export const TreemapChartSimple = () => makeChart({ ...hierarchyDefaults, Tile: "squarify", Padding: 1 }, treemapRender, { empty: () => false });

function sunburstRender(g, o, { width: w, height: h }) {
  const root = hierarchyOf(o);
  if (!(root.value > 0)) return emptyMessage(g, o, { width: w, height: h });
  const radius = Math.min(w, h) / 2;
  d3.partition().size([2 * Math.PI, radius])(root);
  const colour = topColour(o, root);
  const arc = d3.arc().startAngle((d) => d.x0).endAngle((d) => d.x1).innerRadius((d) => d.y0).outerRadius((d) => d.y1 - 1);
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  tip(
    centre.selectAll("path").data(root.descendants().filter((d) => d.depth > 0)).join("path").attr("class", "mark")
      .attr("fill", colour).attr("d", arc),
    (d) => `${d.ancestors().reverse().map((n) => o.Name(n.data)).join(" / ")}: ${d.value}`,
  );
}
/** Sunburst. Same data as TreemapChartSimple, drawn as rings. */
export const SunburstChartSimple = () => makeChart({ ...hierarchyDefaults }, sunburstRender, { empty: () => false });

function packRender(g, o, { width: w, height: h }) {
  const root = hierarchyOf(o);
  if (!(root.value > 0)) return emptyMessage(g, o, { width: w, height: h });
  d3.pack().size([Math.max(1, w), Math.max(1, h)]).padding(3)(root);
  const colour = topColour(o, root);
  tip(
    g.selectAll("circle").data(root.descendants().filter((d) => d.depth > 0)).join("circle").attr("class", "mark")
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => d.r)
      .attr("fill", (d) => (d.children ? "none" : colour(d))).attr("fill-opacity", 0.8)
      .attr("stroke", (d) => (d.children ? "#999" : "none")),
    (d) => `${d.ancestors().reverse().map((n) => o.Name(n.data)).join(" / ")}: ${d.value}`,
  );
  g.selectAll("text").data(root.leaves().filter((d) => d.r > 16)).join("text").attr("x", (d) => d.x).attr("y", (d) => d.y)
    .attr("dy", "0.35em").attr("text-anchor", "middle").attr("font-size", 10).attr("fill", "#fff").text((d) => o.Name(d.data));
}
/** Circle packing. Same data as TreemapChartSimple, drawn as nested circles. */
export const CirclePackChartSimple = () => makeChart({ ...hierarchyDefaults }, packRender, { empty: () => false });

function treeRender(g, o, { width: w, height: h }) {
  const root = d3.hierarchy(o.Data, o.Children);
  d3.tree().size([h, Math.max(0, w - o.LabelSpace)])(root);
  g.append("g").attr("fill", "none").attr("stroke", "#bbb")
    .selectAll("path").data(root.links()).join("path")
    .attr("d", d3.linkHorizontal().x((d) => d.y).y((d) => d.x));
  const node = g.selectAll("g.node").data(root.descendants()).join("g").attr("class", "node").attr("transform", (d) => `translate(${d.y},${d.x})`);
  node.append("circle").attr("class", "mark").attr("r", 4).attr("fill", (d) => (d.children ? "#555" : "#4e79a7"));
  node.append("text").attr("dy", "0.32em").attr("x", (d) => (d.children ? -8 : 8)).attr("text-anchor", (d) => (d.children ? "end" : "start")).attr("font-size", 10).text((d) => o.Name(d.data));
}
/** Tree diagram (tidy tree). Data is a nested object like `{ name, children: [...] }`. */
export const TreeDiagramSimple = () =>
  makeChart({ Children: (d) => d.children, Name: (d) => d.name, LabelSpace: 90, Data: { name: "root" } }, treeRender, { empty: () => false });

function chordRender(g, o, { width: w, height: h }) {
  const matrix = o.Data;
  const names = o.Names.length ? o.Names : matrix.map((_, i) => `${i}`);
  const outer = Math.max(2, Math.min(w, h) / 2 - 24), inner = Math.max(1, outer - 12);
  const colour = colours(o, names);
  const chords = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
  const centre = g.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const arc = d3.arc().innerRadius(inner).outerRadius(outer);
  const group = centre.selectAll("g.group").data(chords.groups).join("g").attr("class", "group");
  tip(group.append("path").attr("class", "mark").attr("fill", (d) => colour(names[d.index])).attr("d", arc), (d) => `${names[d.index]}: ${d.value}`);
  group.append("text").attr("font-size", 10).attr("dy", "0.35em")
    .attr("transform", (d) => {
      const a = (d.startAngle + d.endAngle) / 2 - Math.PI / 2;
      return `rotate(${(a * 180) / Math.PI}) translate(${outer + 6}) ${a > Math.PI / 2 ? "rotate(180) translate(-12)" : ""}`;
    })
    .attr("text-anchor", (d) => ((d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start")).text((d) => names[d.index]);
  tip(
    centre.append("g").attr("fill-opacity", 0.7).selectAll("path").data(chords).join("path").attr("class", "ribbon")
      .attr("fill", (d) => colour(names[d.source.index])).attr("d", d3.ribbon().radius(inner)),
    (d) => `${names[d.source.index]} to ${names[d.target.index]}: ${d.source.value}`,
  );
}
/** Chord diagram. Data is a square matrix of flows. `Names` labels the rows. */
export const ChordDiagramSimple = () => makeChart({ Data: [], Names: [] }, chordRender);

function forceRender(g, o, { width: w, height: h }) {
  const nodes = (o.Data.nodes || []).map((d) => ({ ...d }));
  const links = (o.Data.links || []).map((d) => ({ ...d }));
  const sim = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(o.LinkDistance))
    .force("charge", d3.forceManyBody().strength(o.Charge))
    .force("x", d3.forceX(w / 2).strength(0.06))
    .force("y", d3.forceY(h / 2).strength(0.06))
    .stop();
  sim.tick(o.Iterations); // run the layout now so every draw gives the same picture
  // Keep every node inside the plot area.
  for (const n of nodes) {
    n.x = Math.max(o.NodeRadius, Math.min(w - o.NodeRadius, n.x));
    n.y = Math.max(o.NodeRadius, Math.min(h - o.NodeRadius, n.y));
  }
  const colour = colours(o, [...new Set(nodes.map(o.Group))]);
  g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6)
    .selectAll("line").data(links).join("line").attr("class", "link")
    .attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
  tip(
    g.append("g").selectAll("circle").data(nodes).join("circle").attr("class", "mark").attr("r", o.NodeRadius)
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("fill", (d) => colour(o.Group(d))).attr("stroke", "#fff"),
    (d) => d.id,
  );
}
/** Force-directed network. Data is `{ nodes: [{ id, group }], links: [{ source, target }] }`. */
export const ForceNetworkSimple = () =>
  makeChart({ Data: { nodes: [], links: [] }, Group: (d) => d.group, NodeRadius: 6, Charge: -60, LinkDistance: 40, Iterations: 300 }, forceRender, {
    empty: (o) => !(o.Data.nodes && o.Data.nodes.length),
  });

const aligns = { justify: sankeyJustify, left: sankeyLeft, right: sankeyRight, center: sankeyCenter };
function sankeyRender(g, o, { width: w, height: h }) {
  const positive = (o.Data.links || []).filter((d) => +d.value > 0).map((d) => ({ ...d }));
  if (!positive.length) return emptyMessage(g, o, { width: w, height: h });
  const graph = { nodes: (o.Data.nodes || []).map((d) => ({ ...d })), links: positive };
  const layout = sankey().nodeId((d) => d.name).nodeWidth(o.NodeWidth).nodePadding(o.NodePadding).nodeAlign(aligns[o.Align] || sankeyJustify).extent([[0, 0], [w, h]]);
  const { nodes, links } = layout(graph);
  const colour = colours(o, nodes.map((d) => d.name));
  tip(
    g.append("g").attr("fill", "none").attr("stroke-opacity", 0.4).selectAll("path").data(links).join("path").attr("class", "link")
      .attr("d", sankeyLinkHorizontal()).attr("stroke", (d) => colour(d.source.name)).attr("stroke-width", (d) => Math.max(1, d.width)),
    (d) => `${d.source.name} to ${d.target.name}: ${d.value}`,
  );
  tip(
    g.append("g").selectAll("rect").data(nodes).join("rect").attr("class", "mark").attr("x", (d) => d.x0).attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0).attr("height", (d) => Math.max(1, d.y1 - d.y0)).attr("fill", (d) => colour(d.name)),
    (d) => `${d.name}: ${d.value}`,
  );
  g.append("g").selectAll("text").data(nodes).join("text").attr("font-size", 10).attr("dy", "0.35em")
    .attr("x", (d) => (d.x0 < w / 2 ? d.x1 + 6 : d.x0 - 6)).attr("y", (d) => (d.y0 + d.y1) / 2)
    .attr("text-anchor", (d) => (d.x0 < w / 2 ? "start" : "end")).text((d) => d.name);
}
/** Sankey diagram. Data is `{ nodes: [{ name }], links: [{ source, target, value }] }` with names as source and target. */
export const SankeyDiagramSimple = () =>
  makeChart({ Data: { nodes: [], links: [] }, NodeWidth: 14, NodePadding: 10, Align: "justify", MarginLeft: 60, MarginRight: 60 }, sankeyRender, {
    empty: (o) => !(o.Data.nodes && o.Data.nodes.length),
  });

// --- grids -----------------------------------------------------------------------------

function calendarRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  if (!rows.length) return;
  const dates = rows.map(o.Date);
  const start = d3.timeWeek.floor(d3.min(dates));
  const weeks = d3.timeWeek.count(start, d3.max(dates)) + 1;
  const cell = Math.floor(Math.min(w / weeks, h / 7));
  const colour = d3.scaleSequential(resolveInterpolator(o.Interpolator)).domain(d3.extent(rows, o.Value));
  tip(
    g.selectAll("rect").data(rows).join("rect").attr("class", "mark")
      .attr("x", (d) => d3.timeWeek.count(start, o.Date(d)) * cell).attr("y", (d) => o.Date(d).getDay() * cell)
      .attr("width", cell - 2).attr("height", cell - 2).attr("rx", 2).attr("fill", (d) => colour(o.Value(d))),
    (d) => `${d3.timeFormat("%Y-%m-%d")(o.Date(d))}: ${o.Value(d)}`,
  );
  ["Mon", "Wed", "Fri"].forEach((day, i) =>
    g.append("text").attr("x", -4).attr("y", (i * 2 + 1) * cell + cell / 2).attr("text-anchor", "end").attr("font-size", 9).text(day));
  d3.timeMonth.range(d3.timeMonth.ceil(start), d3.max(dates)).forEach((m) =>
    g.append("text").attr("x", d3.timeWeek.count(start, m) * cell).attr("y", -4).attr("font-size", 9).text(d3.timeFormat("%b")(m)));
}
/** Calendar heat map: one square per day, one column per week. */
export const CalendarHeatmapSimple = () =>
  makeChart({ Date: (d) => d.date, Value: (d) => d.value, Interpolator: d3.interpolateGreens, MarginTop: 24 }, calendarRender);

function heatGridRender(g, o, { width: w, height: h }) {
  const rows = o.Data;
  const xs = [...new Set(rows.map(o.X))], ys = [...new Set(rows.map(o.Y))];
  const x = d3.scaleBand().domain(xs).range([0, w]).padding(0.03);
  const y = d3.scaleBand().domain(ys).range([0, h]).padding(0.03);
  const colour = d3.scaleSequential(resolveInterpolator(o.Interpolator)).domain(d3.extent(rows, o.Value));
  axisBottom(g, x, h);
  axisLeft(g, y);
  tip(
    g.selectAll("rect").data(rows).join("rect").attr("class", "mark").attr("x", (d) => x(o.X(d))).attr("y", (d) => y(o.Y(d)))
      .attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("fill", (d) => colour(o.Value(d))),
    (d) => `${o.X(d)}, ${o.Y(d)}: ${o.Value(d)}`,
  );
  if (o.ShowValues) {
    g.selectAll("text.value").data(rows).join("text").attr("class", "value").attr("x", (d) => x(o.X(d)) + x.bandwidth() / 2)
      .attr("y", (d) => y(o.Y(d)) + y.bandwidth() / 2).attr("dy", "0.35em").attr("text-anchor", "middle").attr("font-size", 10).text((d) => o.Value(d));
  }
}
/** Heat map on two categorical axes. Each row is one cell. */
export const HeatGridChartSimple = () =>
  makeChart({ X: (d) => d.x, Y: (d) => d.y, Value: (d) => d.value, Interpolator: d3.interpolateYlOrRd, ShowValues: false, MarginLeft: 60 }, heatGridRender);

function parallelRender(g, o, { width: w, height: h }) {
  const dims = o.Dimensions, rows = o.Data;
  const x = d3.scalePoint().domain(dims).range([0, w]);
  const y = Object.fromEntries(dims.map((d) => [d, d3.scaleLinear().domain(d3.extent(rows, (r) => o.Value(r, d))).nice().range([h, 0])]));
  const groups = o.Group ? [...new Set(rows.map(o.Group))] : [];
  const colour = colours(o, groups);
  const line = d3.line();
  tip(
    keyed(g.append("g").attr("fill", "none").attr("stroke-opacity", 0.6).selectAll("path").data(rows).join("path").attr("class", "mark")
      .attr("stroke", (d) => (o.Group ? colour(o.Group(d)) : palette()[0]))
      .attr("d", (d) => line(dims.map((dim) => [x(dim), y[dim](o.Value(d, dim))]))), (d) => (o.Group ? o.Group(d) : "")),
    (d) => (o.Group ? o.Group(d) : ""),
  );
  for (const dim of dims) {
    const axis = g.append("g").attr("transform", `translate(${x(dim)},0)`).call(d3.axisLeft(y[dim]).ticks(5));
    axis.append("text").attr("y", -8).attr("text-anchor", "middle").attr("fill", "#000").attr("font-weight", "bold").text(dim);
  }
  if (groups.length > 1) legend(g, groups, colour);
}
parallelRender.legendKeys = (o) => groupKeys(o.Data, o.Group);

/** Parallel coordinates: one line per row across several numeric fields. `Dimensions` lists the fields. */
export const ParallelCoordinatesSimple = () =>
  makeChart({ Dimensions: [], Value: (d, dim) => d[dim], Group: null, MarginTop: 30 }, parallelRender);
