// Shared chart kit: the SVG plumbing, the makeChart factory and the helpers every chart uses.
// charts-classic.js and charts-more.js build all charts from this file.
import * as d3 from "d3";
import {
  resolveTheme, rangeOf, makeFormatter, axisFormatter, applyFrame, wireInteractions,
  prefersReducedMotion, observeResize, showTooltip, hideTooltip,
} from "./features.js";

// --- svg plumbing ----------------------------------------------------------------------

// TODO not great on resize. maybe aspect can be changed?
export function responsivefy(svg) {
  var container = d3.select(svg.node().parentNode),
    parent = container._groups[0][0].getBoundingClientRect(),
    width = parseInt(parent.width, 10),
    height = parseInt(parent.height, 10),
    aspect = width / height;
  //
  svg
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMin")
    .call(resize);
  //
  function resize(evt) {
    var base = container._groups[0][0];
    var parent = base.getBoundingClientRect();
    var targetWidth = parseInt(parent.width, 10);
    var targetHeight = Math.round(targetWidth / aspect);
    svg.attr("width", targetWidth);
    svg.attr("height", targetHeight);
  }
  d3.select(window).on("resize." + container.attr("id"), resize);
}
//
// Every SVG a chart draws is recorded per container so a redraw can remove it.
const createdSvgs = new WeakMap();
// TODO objects parameters for more configurability
export function getBaseSVG(_selection, _svg_id, _dimensions, _responsivefy, _a11y) {
  const svg = d3
    .select(_selection)
    .append("svg")
    .attr("id", _svg_id)
    .attr("style", "max-width: 100%;overflow:visible;")
    .call(_responsivefy);
  if (!createdSvgs.has(_selection)) createdSvgs.set(_selection, []);
  createdSvgs.get(_selection).push(svg.node());
  // Accessible name and description (WAI-ARIA graphics pattern: role=img + title/desc).
  if (_a11y && (_a11y.title || _a11y.description)) {
    const prefix = (_svg_id || "d3eazy") + "-";
    const ids = [];
    svg.attr("role", "img");
    if (_a11y.title) {
      svg.insert("title", ":first-child").attr("id", prefix + "title").text(_a11y.title);
      ids.push(prefix + "title");
    }
    if (_a11y.description) {
      svg.append("desc").attr("id", prefix + "desc").text(_a11y.description);
      ids.push(prefix + "desc");
    }
    svg.attr("aria-labelledby", ids.join(" "));
  }
  return svg;
}
//
// General update pattern fallback.
// Charts call mount(selection) on every render. When a setter changes a value and the
// chart has no dedicated update hook, schedule() re-renders every mounted container once
// per tick, so a chain of setter calls causes one redraw, not one per setter.
export function makeRedraw(chart) {
  const mounts = [];
  let pending = false;
  return {
    mount(selection) {
      selection.each(function () {
        if (!mounts.includes(this)) mounts.push(this);
      });
    },
    schedule() {
      if (!mounts.length || pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        for (const el of mounts) {
          for (const old of createdSvgs.get(el) || []) old.remove();
          createdSvgs.set(el, []);
        }
        chart(d3.selectAll(mounts));
      });
    },
  };
}
//

// --- factory ---------------------------------------------------------------------------

// The chart being drawn right now. Helpers read it, so render functions do not pass options around.
let ACTIVE = null;

// Options every chart has. A chart's own defaults are added on top.
const commonDefaults = {
  // identity and size
  SvgID: "", Title: "", Description: "", Data: [], Width: 600, Height: 400,
  MarginTop: 20, MarginRight: 20, MarginBottom: 30, MarginLeft: 40,
  // colour
  ColourDomain: [], ColourRange: null, Palette: null, ColourOverrides: {}, Theme: "light",
  Background: null, FontFamily: null, FontSize: null,
  // heading
  ShowTitle: false, Subtitle: "", Caption: "", TitleAlign: "left",
  // axes
  XLabel: "", YLabel: "", XFormat: null, YFormat: null, XTicks: null, YTicks: null,
  XTickRotate: 0, ShowXAxis: true, ShowYAxis: true, Grid: "none", GridDash: "",
  // legend
  Legend: "top-right", LegendOrient: "vertical", LegendTitle: "", LegendInteractive: true,
  // tooltip and interaction
  Tooltip: "custom", TooltipFormat: null, TooltipHtml: false,
  OnClick: null, OnHover: null, HoverHighlight: false, Focusable: false,
  // motion
  Animate: true, Duration: 600, Stagger: 12, Ease: d3.easeCubicOut,
  // overlays
  RefLines: [], Annotations: [],
  // data preparation
  Filter: null, SortBy: null, SortOrder: "desc", Limit: null, EmptyText: "No data",
  // number format
  Locale: "en-US", ValueFormat: null, DataLabels: false, LabelFormat: null,
  // mark style
  MarkStroke: null, MarkStrokeWidth: null, MarkOpacity: null, MarkCornerRadius: null,
  AutoResize: false,
};

const defaultEmpty = (o) => Array.isArray(o.Data) && o.Data.length === 0;

function prepareData(state) {
  let data = state.Data;
  if (!Array.isArray(data)) return state;
  if (state.Filter) data = data.filter(state.Filter);
  if (state.SortBy) {
    const compare = state.SortOrder === "asc" ? d3.ascending : d3.descending;
    data = data.slice().sort((a, b) => compare(state.SortBy(a), state.SortBy(b)));
  }
  if (state.Limit != null) data = data.slice(0, state.Limit);
  return data === state.Data ? state : { ...state, Data: data };
}

// Space for the heading, axis labels and caption, added around the user's margins.
function marginsOf(o) {
  const m = { top: o.MarginTop, right: o.MarginRight, bottom: o.MarginBottom, left: o.MarginLeft };
  if (o.ShowTitle && o.Title) m.top += 24;
  if (o.Subtitle) m.top += 16;
  if (o.Caption) m.bottom += 16;
  if (o.XLabel) m.bottom += 18;
  if (o.YLabel) m.left += 18;
  return m;
}

export function makeChart(defaults, render, { empty = defaultEmpty } = {}) {
  const state = { ...commonDefaults, ...defaults };
  const watched = new WeakSet();
  var redraw_ = makeRedraw(chart);
  function chart(selection) {
    redraw_.mount(selection);
    selection.each(function () {
      const o = prepareData(state);
      const theme = resolveTheme(o.Theme);
      const m = marginsOf(o);
      const size = { width: Math.max(0, o.Width - m.left - m.right), height: Math.max(0, o.Height - m.top - m.bottom) };
      const root = getBaseSVG(this, o.SvgID, null, responsivefy, { title: o.Title, description: o.Description });
      // Scale the drawing to Width x Height, whatever size the container has.
      root.attr("viewBox", `0 0 ${o.Width} ${o.Height}`);
      applyFrame(root, o, o.Width, o.Height);
      const g = root.append("g").attr("transform", `translate(${m.left},${m.top})`);
      if (empty(o)) {
        g.append("text").attr("class", "empty-state").attr("x", size.width / 2).attr("y", size.height / 2)
          .attr("text-anchor", "middle").attr("fill", theme.muted).text(o.EmptyText);
      } else {
        // `set` changes an option and redraws. `setSilent` changes it without redrawing (used by zoom).
        ACTIVE = {
          o, theme, root, g, size, x: null, y: null,
          set: (key, value) => { state[key] = value; redraw_.schedule(); },
          setSilent: (key, value) => { state[key] = value; },
        };
        try {
          render.call(this, g, o, size);
          drawOverlays(ACTIVE);
          styleChart(root, o, theme);
        } finally {
          ACTIVE = null;
        }
        animate(g, o);
      }
      wireInteractions(root, o, theme);
      if (o.AutoResize && !watched.has(this)) {
        watched.add(this);
        observeResize(this, ({ width, height }) => {
          if (!state.AutoResize) return;
          state.Width = Math.round(width);
          state.Height = Math.round(height);
          redraw_.schedule();
        });
      }
    });
  }
  for (const key of Object.keys(state)) {
    chart[key] = function (value) {
      if (!arguments.length) return state[key];
      state[key] = value;
      redraw_.schedule();
      return chart;
    };
  }
  return chart;
}

function styleChart(root, o, theme) {
  root.selectAll("g.axis .domain, g.axis .tick line").attr("stroke", theme.axis);
  const marks = root.selectAll(".mark");
  if (o.MarkStroke != null) marks.attr("stroke", o.MarkStroke);
  if (o.MarkStrokeWidth != null) marks.attr("stroke-width", o.MarkStrokeWidth);
  if (o.MarkCornerRadius != null) root.selectAll("rect.mark").attr("rx", o.MarkCornerRadius);
}

function animate(g, o) {
  const base = o.MarkOpacity ?? 1;
  const marks = g.selectAll(".mark");
  if (!o.Animate || prefersReducedMotion()) {
    if (o.MarkOpacity != null) marks.style("opacity", base);
    return;
  }
  marks.style("opacity", 0).transition().duration(o.Duration)
    .delay((d, i) => Math.min(i * o.Stagger, 600)).ease(o.Ease).style("opacity", base);
}

// --- helpers ---------------------------------------------------------------------------

// Ordinal colour scale. ColourOverrides ({ key: colour }) wins over the scale.
export function colours(o, domain) {
  const scale = d3.scaleOrdinal(o.ColourDomain.length ? o.ColourDomain : domain, rangeOf(o));
  return (key) => (o.ColourOverrides && o.ColourOverrides[key]) || scale(key);
}
export const palette = () => rangeOf(ACTIVE.o);

// Value formatter for tooltips and labels. Plain numbers when ValueFormat is not set.
/** Format a number with the chart's ValueFormat and Locale, and a Date as a short date. Safe to call from event handlers. */
export function formatValue(o, value) {
  if (value instanceof Date) {
    return value.toLocaleDateString(typeof o.Locale === "string" ? o.Locale : "en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  const format = makeFormatter(o, o.ValueFormat);
  return format && typeof value === "number" ? format(value) : value;
}
// Same, for the chart being drawn. Only call it while drawing.
export const V = (value) => formatValue(ACTIVE.o, value);

// Tag marks that belong to a series, so the legend can highlight or hide them.
export const keyed = (selection, key) =>
  selection.attr("data-key", typeof key === "function" ? function (d, i, n) { return String(key.call(this, d, i, n)); } : String(key));

// Hover text. "custom" tooltips read data-tip. "native" ones use the browser's <title>.
export function tip(selection, text) {
  const mode = ACTIVE ? ACTIVE.o.Tooltip : "native";
  if (mode === "none") return selection;
  if (mode === "native") return selection.append("title").text(text);
  return selection.attr("data-tip", text);
}

function gridLines(g, scale, orient, ticks, ctx = ACTIVE) {
  const { o, theme, size } = ctx;
  const gen = orient === "x" ? d3.axisBottom(scale).tickSize(-size.height) : d3.axisLeft(scale).tickSize(-size.width);
  gen.tickFormat("");
  if (!scale.bandwidth && ticks != null) gen.ticks(ticks);
  const grid = g.insert("g", ":first-child").attr("class", `grid ${orient}-grid`).call(gen);
  if (orient === "x") grid.attr("transform", `translate(0,${size.height})`);
  grid.select(".domain").remove();
  grid.selectAll("line").attr("stroke", theme.grid).attr("stroke-dasharray", o.GridDash || null);
}

function rotateTicks(axis, degrees) {
  if (degrees) axis.selectAll("text").attr("transform", `rotate(${degrees})`).style("text-anchor", degrees < 0 ? "end" : "start");
}

// The bottom axis. "x" in every option name means this axis, even on a flipped bar chart.
export function axisBottom(g, scale, h, ticks = 6) {
  const { o, size } = ACTIVE;
  ACTIVE.x = scale;
  const count = o.XTicks ?? ticks;
  if (o.Grid === "x" || o.Grid === "both") gridLines(g, scale, "x", count);
  if (o.XLabel) {
    g.append("text").attr("class", "axis-label").attr("x", size.width / 2).attr("y", h + o.MarginBottom + 12)
      .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "currentColor").text(o.XLabel);
  }
  if (!o.ShowXAxis) {
    const ctx = ACTIVE;
    ctx.xAxis = (next) => { if (o.Grid === "x" || o.Grid === "both") { g.select("g.x-grid").remove(); gridLines(g, next, "x", count, ctx); } };
    return null;
  }
  const gen = d3.axisBottom(scale);
  if (!scale.bandwidth) gen.ticks(count);
  const format = axisFormatter(o, scale, o.XFormat);
  if (format) gen.tickFormat(format);
  const axis = g.append("g").attr("class", "axis x-axis").attr("transform", `translate(0,${h})`).call(gen);
  rotateTicks(axis, o.XTickRotate);
  // Redraw the axis and grid for a new scale, for example after a zoom.
  const ctx = ACTIVE;
  ctx.xAxis = (next) => {
    const nextGen = d3.axisBottom(next);
    if (!next.bandwidth) nextGen.ticks(count);
    const nextFormat = axisFormatter(o, next, o.XFormat);
    if (nextFormat) nextGen.tickFormat(nextFormat);
    axis.call(nextGen).selectAll(".domain, .tick line").attr("stroke", ctx.theme.axis);
    rotateTicks(axis, o.XTickRotate);
    if (o.Grid === "x" || o.Grid === "both") { g.select("g.x-grid").remove(); gridLines(g, next, "x", count, ctx); }
  };
  return axis;
}

// The left axis ("y" in every option name).
export function axisLeft(g, scale, ticks = 5) {
  const { o, size } = ACTIVE;
  ACTIVE.y = scale;
  const count = o.YTicks ?? ticks;
  if (o.Grid === "y" || o.Grid === "both") gridLines(g, scale, "y", count);
  if (o.YLabel) {
    g.append("text").attr("class", "axis-label").attr("transform", `translate(${-o.MarginLeft - 6},${size.height / 2}) rotate(-90)`)
      .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "currentColor").text(o.YLabel);
  }
  const ctx = ACTIVE;
  if (!o.ShowYAxis) {
    ctx.yAxis = (next) => { if (o.Grid === "y" || o.Grid === "both") { g.select("g.y-grid").remove(); gridLines(g, next, "y", count, ctx); } };
    return null;
  }
  const gen = d3.axisLeft(scale);
  if (!scale.bandwidth) gen.ticks(count);
  const format = axisFormatter(o, scale, o.YFormat);
  if (format) gen.tickFormat(format);
  const axis = g.append("g").attr("class", "axis y-axis").call(gen);
  ctx.yAxis = (next) => {
    const nextGen = d3.axisLeft(next);
    if (!next.bandwidth) nextGen.ticks(count);
    const nextFormat = axisFormatter(o, next, o.YFormat);
    if (nextFormat) nextGen.tickFormat(nextFormat);
    axis.call(nextGen).selectAll(".domain, .tick line").attr("stroke", ctx.theme.axis);
    if (o.Grid === "y" || o.Grid === "both") { g.select("g.y-grid").remove(); gridLines(g, next, "y", count, ctx); }
  };
  return axis;
}

// A scale type by name, for the YScale option.
export function valueScale(type) {
  return { linear: d3.scaleLinear, log: d3.scaleLog, sqrt: d3.scaleSqrt, symlog: d3.scaleSymlog }[type] || d3.scaleLinear;
}

// Time scale when the values are Dates, linear scale otherwise.
export function xScaleFor(values, range) {
  const first = values.find((v) => v != null);
  const scale = first instanceof Date ? d3.scaleTime() : d3.scaleLinear();
  return scale.domain(d3.extent(values)).range(range);
}

// Legend. Position, direction and title come from the Legend* options. Hover highlights a
// series and click hides it, when LegendInteractive is on.
export function legend(g, keys, colour, labelOf = (key) => key) {
  const { o, size, root } = ACTIVE;
  if (o.Legend === "none" || !keys.length) return;
  const horizontal = o.LegendOrient === "horizontal";
  const widths = keys.map((k) => 18 + String(labelOf(k)).length * 6);
  const titleHeight = o.LegendTitle ? 16 : 0;
  const blockWidth = horizontal ? d3.sum(widths) : d3.max(widths);
  const blockHeight = titleHeight + (horizontal ? 14 : keys.length * 16);
  const [vertical, side] = o.Legend.split("-");
  const x = side === "left" ? 0 : Math.max(0, size.width - blockWidth);
  const y = vertical === "bottom" ? Math.max(0, size.height - blockHeight) : 0;
  const lg = g.append("g").attr("class", "legend").attr("transform", `translate(${x},${y})`);
  if (o.LegendTitle) lg.append("text").attr("font-size", 10).attr("font-weight", 600).attr("y", 9).text(o.LegendTitle);
  const hidden = new Set();
  const marksOf = (key) => root.selectAll("[data-key]").filter(function () { return this.getAttribute("data-key") === String(key); });
  let cursor = 0;
  keys.forEach((key, i) => {
    const row = lg.append("g").attr("class", "legend-item")
      .attr("transform", horizontal ? `translate(${cursor},${titleHeight})` : `translate(0,${titleHeight + i * 16})`);
    cursor += widths[i];
    row.append("rect").attr("width", 10).attr("height", 10).attr("fill", colour(key));
    row.append("text").attr("x", 14).attr("y", 9).attr("font-size", 10).attr("fill", "currentColor").text(labelOf(key));
    if (!o.LegendInteractive) return;
    row.style("cursor", "pointer")
      .on("mouseenter", () => {
        root.selectAll("[data-key]").style("opacity", function () {
          return this.getAttribute("data-key") === String(key) ? null : 0.2;
        });
      })
      .on("mouseleave", () => root.selectAll("[data-key]").style("opacity", null))
      .on("click", () => {
        if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
        marksOf(key).style("display", hidden.has(key) ? "none" : null);
        row.attr("opacity", hidden.has(key) ? 0.4 : 1);
      });
  });
}

// Reference lines, bands and annotations, placed with the scales of the two axes.
export function position(scale, value) {
  if (!scale) return null;
  const v = scale.domain()[0] instanceof Date && typeof value === "string" ? new Date(value) : value;
  const p = scale(v);
  return p == null || Number.isNaN(p) ? null : p + (scale.bandwidth ? scale.bandwidth() / 2 : 0);
}

/** Draw (or redraw) reference lines and annotations with the scales in `ctx`. */
export function refreshOverlays(ctx) {
  ctx.g.selectAll("g.refline, g.annotation").remove();
  drawOverlays(ctx);
}

function drawOverlays(ctx) {
  const { g, o, size, theme, x, y } = ctx;
  for (const ref of o.RefLines || []) {
    const scale = ref.axis === "x" ? x : y;
    const vertical = ref.axis === "x";
    const layer = g.append("g").attr("class", "refline");
    const colour = ref.colour || theme.muted;
    if (ref.from != null && ref.to != null) {
      const a = position(scale, ref.from), b = position(scale, ref.to);
      if (a == null || b == null) continue;
      layer.append("rect").attr("fill", colour).attr("opacity", ref.opacity ?? 0.12)
        .attr(vertical ? "x" : "y", Math.min(a, b)).attr(vertical ? "width" : "height", Math.abs(b - a))
        .attr(vertical ? "y" : "x", 0).attr(vertical ? "height" : "width", vertical ? size.height : size.width);
    } else {
      const v = position(scale, ref.value);
      if (v == null) continue;
      layer.append("line").attr("stroke", colour).attr("stroke-width", ref.width ?? 1).attr("stroke-dasharray", ref.dash ?? "4 3")
        .attr(vertical ? "x1" : "y1", v).attr(vertical ? "x2" : "y2", v)
        .attr(vertical ? "y1" : "x1", 0).attr(vertical ? "y2" : "x2", vertical ? size.height : size.width);
    }
    if (ref.label) {
      const v = position(scale, ref.value ?? ref.from);
      if (v != null) {
        layer.append("text").attr("font-size", 10).attr("fill", colour)
          .attr("x", vertical ? v + 3 : size.width - 3).attr("y", vertical ? 10 : v - 3)
          .attr("text-anchor", vertical ? "start" : "end").text(ref.label);
      }
    }
  }
  for (const note of o.Annotations || []) {
    const px = position(x, note.x), py = position(y, note.y);
    if (px == null || py == null) continue;
    const dx = note.dx ?? 0, dy = note.dy ?? -24;
    const colour = note.colour || theme.text;
    const layer = g.append("g").attr("class", "annotation");
    layer.append("circle").attr("cx", px).attr("cy", py).attr("r", 3).attr("fill", "none").attr("stroke", colour);
    layer.append("line").attr("x1", px).attr("y1", py).attr("x2", px + dx).attr("y2", py + dy).attr("stroke", colour).attr("stroke-opacity", 0.6);
    layer.append("text").attr("x", px + dx).attr("y", py + dy + (dy < 0 ? -4 : 12)).attr("font-size", 10).attr("fill", colour)
      .attr("text-anchor", dx < 0 ? "end" : dx > 0 ? "start" : "middle").text(note.text);
  }
}

// Least-squares line through (x, y) pairs. Returns two end points, or null.
export function trendPoints(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = d3.mean(points, (p) => p[0]), my = d3.mean(points, (p) => p[1]);
  const denominator = d3.sum(points, (p) => (p[0] - mx) ** 2);
  if (!denominator) return null;
  const slope = d3.sum(points, (p) => (p[0] - mx) * (p[1] - my)) / denominator;
  const [lo, hi] = d3.extent(points, (p) => p[0]);
  return [[lo, my + slope * (lo - mx)], [hi, my + slope * (hi - mx)]];
}

// Label past the end of a bar-like mark, or inside it when the bar is long.
export function labelAt(g, text, x, y, anchor, fill) {
  return g.append("text").attr("class", "data-label").attr("x", x).attr("y", y).attr("text-anchor", anchor)
    .attr("font-size", 10).attr("fill", fill).text(text);
}
export const labelText = (o, value) => {
  const format = makeFormatter(o, o.LabelFormat || o.ValueFormat);
  return format ? format(value) : value;
};

// Swap (band, value) coordinates by orientation.
export const place = (orient) => (orient === "vertical" ? (b, v) => [v, b] : (b, v) => [b, v]);

// Value axis + band axis for a band/value chart. Returns the scales.
export function bandValueScales(g, o, { width: w, height: h }, bands, valueDomain, band = d3.scaleBand) {
  const vert = o.Orient === "vertical";
  const bandScale = band().domain(bands).range(vert ? [0, h] : [0, w]);
  if (bandScale.padding) bandScale.padding(o.Padding ?? 0.2);
  const val = d3.scaleLinear().domain(valueDomain).nice().range(vert ? [0, w] : [h, 0]);
  if (vert) {
    axisLeft(g, bandScale);
    axisBottom(g, val, h, 5);
  } else {
    axisBottom(g, bandScale, h);
    axisLeft(g, val);
  }
  return { bandScale, val };
}


/** The chart being drawn right now: `{ o, theme, root, g, size, x, y }`. Only valid inside a render function. */
export const active = () => ACTIVE;

// --- motion helpers --------------------------------------------------------------------

/** True when the chart being drawn animates (Animate is on and the system does not ask for reduced motion). */
export const isAnimated = () => !!ACTIVE && ACTIVE.o.Animate && !prefersReducedMotion();

/** Draw a line in from its start. Does nothing when animation is off. */
export function drawIn(path) {
  if (!isAnimated()) return path;
  const length = path.node().getTotalLength();
  const duration = ACTIVE.o.Duration * 1.6;
  return path.attr("stroke-dasharray", `${length} ${length}`).attr("stroke-dashoffset", length)
    .transition("draw").duration(duration).ease(d3.easeLinear).attr("stroke-dashoffset", 0)
    .on("end", function () { this.removeAttribute("stroke-dasharray"); this.removeAttribute("stroke-dashoffset"); });
}

/**
 * Grow bars from the baseline. `vertical` is true when the bars run left to right.
 * `base` is the pixel position of the zero line. Call after the final attributes are set.
 */
export function grow(rects, vertical, base) {
  if (!isAnimated()) return rects;
  const o = ACTIVE.o;
  const attr = vertical ? ["x", "width"] : ["y", "height"];
  rects.each(function () {
    this.__final = { pos: +this.getAttribute(attr[0]), size: +this.getAttribute(attr[1]) };
  });
  rects.attr(attr[0], base).attr(attr[1], 0)
    .transition("grow").duration(o.Duration).delay((d, i) => Math.min(i * o.Stagger, 600)).ease(o.Ease)
    .attr(attr[0], function () { return this.__final.pos; })
    .attr(attr[1], function () { return this.__final.size; });
  return rects;
}

// Linked charts. A chart can broadcast hover on document.body and others can listen by event name.
const bodyHandlers = new Map();
/** Listen for `name` on document.body. A later call with the same `key` replaces the earlier listener. */
export function linkEvent(name, key, handler) {
  const id = `${name}|${key}`;
  if (bodyHandlers.has(id)) document.body.removeEventListener(name, bodyHandlers.get(id));
  document.body.addEventListener(name, handler);
  bodyHandlers.set(id, handler);
}

export { showTooltip, hideTooltip, makeFormatter, rangeOf, resolveTheme, prefersReducedMotion };
