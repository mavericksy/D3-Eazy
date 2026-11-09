import { makeContainer, tick } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import * as d3 from "d3";
import * as lib from "../d3-eazy.js";
import { moreConfigs } from "./more-fixtures.js";
import { classicConfigs } from "./classic-fixtures.js";

const everyChart = [...Object.keys(classicConfigs), ...Object.keys(moreConfigs)];

const rows = [
  { name: "a", value: 10 }, { name: "b", value: 40 }, { name: "c", value: 25 }, { name: "d", value: 5 },
];
const days = d3.range(10).map((i) => ({ x: new Date(2025, 0, 1 + i), y: 100 + i * 50, s: i % 2 ? "p" : "q" }));

const big = days.map((d) => ({ ...d, y: d.y * 100 }));
const lollipop = (id) => lib.LollipopChartSimple().SvgID(id).Width(600).Height(300).Data(rows);
const line = (id, data = days) => lib.LineChartSimple().SvgID(id).Width(600).Height(300).Series((d) => d.s).Data(data);
const draw = (chart, id) => {
  const el = makeContainer(id);
  d3.select(el).call(chart);
  return el;
};
const click = (node) => node.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const fire = (node, type, init = {}) => node.dispatchEvent(new window.MouseEvent(type, { bubbles: true, ...init }));

test("every chart renders its default state without throwing", () => {
  for (const name of everyChart) {
    const el = makeContainer(`default-${name}`);
    assert.doesNotThrow(() => d3.select(el).call(lib[name]().SvgID(`d-${name}`)), name);
    assert.equal(el.querySelectorAll("svg").length, 1);
  }
});

test("empty data shows the EmptyText message", () => {
  const el = draw(lib.LollipopChartSimple().EmptyText("Nothing yet"), "empty");
  assert.equal(el.querySelector("text.empty-state").textContent, "Nothing yet");
  assert.equal(el.querySelectorAll(".mark").length, 0);
});

test("themes set the background, text colour and font", () => {
  const el = draw(lollipop("t").Theme("dark"), "theme-dark");
  assert.equal(el.querySelector("rect.background").getAttribute("fill"), "#14161a");
  assert.equal(el.querySelector("svg").style.color, "rgb(232, 234, 237)");
  const light = draw(lollipop("t2"), "theme-light");
  assert.equal(light.querySelector("rect.background"), null);
});

test("a partial theme object extends a built-in theme", () => {
  const el = draw(lollipop("t3").Theme({ extends: "dark", background: "#001122" }), "theme-obj");
  assert.equal(el.querySelector("rect.background").getAttribute("fill"), "#001122");
});

test("registerTheme and registerPalette make names usable", () => {
  lib.registerTheme("brand", { background: "#ffeedd" });
  lib.registerPalette("brand", ["#111111", "#222222"]);
  const el = draw(lib.LineChartSimple().Theme("brand").Palette("brand").Series((d) => d.s).Data(days), "brand");
  assert.equal(el.querySelector("rect.background").getAttribute("fill"), "#ffeedd");
  assert.equal(el.querySelector("path.line").getAttribute("stroke"), "#111111");
});

test("Palette picks the colours, and an explicit ColourRange wins", () => {
  const a = draw(line("p1").Palette("okabeIto"), "pal-1");
  assert.equal(a.querySelector("path.line").getAttribute("stroke"), "#0072B2");
  const b = draw(line("p2").Palette("okabeIto").ColourRange(["#abcdef"]), "pal-2");
  assert.equal(b.querySelector("path.line").getAttribute("stroke"), "#abcdef");
});

test("ColourOverrides recolours single keys", () => {
  const el = draw(line("o").ColourOverrides({ p: "#ff0000" }), "overrides");
  const strokes = [...el.querySelectorAll("path.line")].map((n) => n.getAttribute("stroke"));
  assert.ok(strokes.includes("#ff0000"));
});

test("title, subtitle and caption draw as headings and make room for themselves", () => {
  const plain = draw(lollipop("h0"), "head-0");
  const el = draw(lollipop("h1").Title("T").ShowTitle(true).Subtitle("S").Caption("C"), "head-1");
  assert.equal(el.querySelector("text.title").textContent, "T");
  assert.equal(el.querySelector("text.subtitle").textContent, "S");
  assert.equal(el.querySelector("text.caption").textContent, "C");
  const top = (e) => +/translate\([^,]+,([\d.]+)\)/.exec(e.querySelector("svg > g").getAttribute("transform"))[1];
  assert.equal(top(el) - top(plain), 40);
  assert.equal(plain.querySelector("text.title"), null, "Title alone is only the accessible name");
});

test("Tooltip modes: custom uses data-tip, native uses <title>, none uses neither", () => {
  const custom = draw(lollipop("tc"), "tip-custom");
  const mark = custom.querySelector(".mark");
  assert.ok(mark.getAttribute("data-tip"));
  assert.equal(mark.querySelector("title"), null);
  const native = draw(lollipop("tn").Tooltip("native"), "tip-native");
  assert.ok(native.querySelector(".mark title"));
  const none = draw(lollipop("tx").Tooltip("none"), "tip-none");
  assert.equal(none.querySelector(".mark").getAttribute("data-tip"), null);
  assert.equal(none.querySelector(".mark title"), null);
});

test("the custom tooltip shows on hover and TooltipFormat rewrites the text", () => {
  const el = draw(lollipop("th").TooltipFormat((text, d) => `<b>${d.name}</b>`).TooltipHtml(true), "tip-hover");
  const mark = el.querySelector(".mark");
  mark.dispatchEvent(new window.MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 10 }));
  const box = document.querySelector(".d3eazy-tooltip");
  assert.equal(box.style.opacity, "1");
  assert.equal(box.innerHTML, "<b>a</b>");
  el.querySelector("svg").dispatchEvent(new window.MouseEvent("mouseleave"));
  assert.equal(box.style.opacity, "0");
});

test("OnClick and OnHover receive the event, the datum and the mark", () => {
  const clicks = [], hovers = [];
  const el = draw(lollipop("e").OnClick((e, d, n) => clicks.push([d, n])).OnHover((e, d) => hovers.push(d)), "events");
  const mark = el.querySelectorAll(".mark")[1];
  mark.dispatchEvent(new window.MouseEvent("mousemove", { bubbles: true }));
  click(mark);
  assert.deepEqual(clicks[0][0], rows[1]);
  assert.equal(clicks[0][1], mark);
  assert.deepEqual(hovers[0], rows[1]);
  el.querySelector("svg").dispatchEvent(new window.MouseEvent("mouseleave"));
  assert.equal(hovers[hovers.length - 1], null);
});

test("axis ticks and legend rows do not fire OnClick", () => {
  let count = 0;
  const el = draw(line("e2").OnClick(() => count++), "events-ticks");
  click(el.querySelector(".tick text"));
  click(el.querySelector(".legend-item text"));
  assert.equal(count, 0);
});

test("HoverHighlight dims the other marks", () => {
  const el = draw(lollipop("hh").HoverHighlight(true).Animate(false), "highlight");
  const marks = [...el.querySelectorAll(".mark")];
  marks[0].dispatchEvent(new window.MouseEvent("mousemove", { bubbles: true }));
  assert.equal(marks[0].style.opacity, "1");
  assert.equal(marks[1].style.opacity, "0.35");
  el.querySelector("svg").dispatchEvent(new window.MouseEvent("mouseleave"));
  assert.equal(marks[1].style.opacity, "1");
});

test("Focusable makes marks keyboard reachable and Enter acts like a click", () => {
  const got = [];
  const el = draw(lollipop("f").Focusable(true).OnClick((e, d) => got.push(d)), "focus");
  const mark = el.querySelector(".mark");
  assert.equal(mark.getAttribute("tabindex"), "0");
  assert.ok(mark.getAttribute("aria-label"));
  mark.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.deepEqual(got[0], rows[0]);
});

test("Legend: none, position, horizontal layout and title", () => {
  assert.equal(draw(line("l0").Legend("none"), "legend-none").querySelector(".legend"), null);
  const bottom = draw(line("l1").Legend("bottom-left"), "legend-bottom");
  const [x, y] = /translate\(([\d.]+),([\d.]+)\)/.exec(bottom.querySelector(".legend").getAttribute("transform")).slice(1).map(Number);
  assert.equal(x, 0);
  assert.ok(y > 100, "bottom legend sits low in the plot");
  const row = draw(line("l2").LegendOrient("horizontal").LegendTitle("Team"), "legend-row");
  assert.equal(row.querySelectorAll(".legend-item").length, 2);
  assert.ok(row.querySelector(".legend text").textContent === "Team");
});

test("clicking a legend item hides that series and a second click shows it again", () => {
  const el = draw(line("lh"), "legend-click");
  const item = el.querySelector(".legend-item");
  const key = item.querySelector("text").textContent;
  const marks = () => [...el.querySelectorAll("[data-key]")].filter((n) => n.getAttribute("data-key") === key);
  click(item);
  assert.ok(marks().every((n) => n.style.display === "none"));
  click(item);
  assert.ok(marks().every((n) => n.style.display === ""));
});

test("axis labels, grid, formats, tick count, rotation and visibility", () => {
  const el = draw(
    line("ax", big).XLabel("Day").YLabel("Users").Grid("both").GridDash("2 2").YFormat(",.0f").YTicks(4).XTickRotate(-40),
    "axes",
  );
  const labels = [...el.querySelectorAll("text.axis-label")].map((n) => n.textContent);
  assert.deepEqual(labels.sort(), ["Day", "Users"]);
  assert.equal(el.querySelectorAll("g.grid").length, 2);
  assert.equal(el.querySelector("g.x-grid line").getAttribute("stroke-dasharray"), "2 2");
  const yTicks = [...el.querySelectorAll("g.y-axis .tick text")].map((n) => n.textContent);
  assert.ok(yTicks.some((t) => /^\d{1,3}(,\d{3})+$/.test(t)), `thousands separators in ${yTicks}`);
  assert.ok(el.querySelector("g.x-axis .tick text").getAttribute("transform").includes("rotate(-40)"));
  const hidden = draw(line("ax2").ShowXAxis(false).ShowYAxis(false), "axes-hidden");
  assert.equal(hidden.querySelector("g.axis"), null);
});

test("Locale changes the number format, and XFormat on a date axis is a time format", () => {
  const de = draw(line("lo", big).Locale("de-DE").YFormat(",.0f"), "locale-de");
  const yTicks = [...de.querySelectorAll("g.y-axis .tick text")].map((n) => n.textContent);
  assert.ok(yTicks.some((t) => /^\d{1,3}(\.\d{3})+$/.test(t)), `German grouping in ${yTicks}`);
  const dates = draw(line("lo2").XFormat("%d/%m"), "xformat-time");
  assert.match(dates.querySelector("g.x-axis .tick text").textContent, /^\d\d\/\d\d$/);
});

test("ValueFormat formats tooltip values", () => {
  const el = draw(lollipop("vf").ValueFormat("$,.2f"), "valueformat");
  assert.equal(el.querySelector(".mark").getAttribute("data-tip"), "a: $10.00");
});

test("RefLines draw lines and shaded bands with labels on either axis", () => {
  const el = draw(
    line("r").RefLines([{ axis: "y", value: 300, label: "target" }, { axis: "y", from: 100, to: 200 }, { axis: "x", value: "2025-01-05", label: "launch" }]),
    "refs",
  );
  assert.equal(el.querySelectorAll("g.refline").length, 3);
  assert.equal(el.querySelectorAll("g.refline line").length, 2);
  assert.equal(el.querySelectorAll("g.refline rect").length, 1);
  assert.deepEqual([...el.querySelectorAll("g.refline text")].map((n) => n.textContent).sort(), ["launch", "target"]);
});

test("Annotations place text at data coordinates", () => {
  const el = draw(line("an").Annotations([{ x: new Date(2025, 0, 5), y: 300, text: "peak" }]), "annotations");
  assert.equal(el.querySelector("g.annotation text").textContent, "peak");
});

test("Filter, SortBy, SortOrder and Limit prepare the data before drawing", () => {
  const el = draw(lollipop("s").SortBy((d) => d.value).Limit(2), "sort-limit");
  assert.deepEqual([...el.querySelectorAll(".mark")].map((n) => d3.select(n).datum().name), ["b", "c"]);
  const asc = draw(lollipop("s2").SortBy((d) => d.value).SortOrder("asc").Limit(1), "sort-asc");
  assert.equal(d3.select(asc.querySelector(".mark")).datum().name, "d");
  const filtered = draw(lollipop("s3").Filter((d) => d.value > 20), "filter");
  assert.equal(filtered.querySelectorAll(".mark").length, 2);
  assert.equal(lollipop("s4").Data().length, 4, "the stored data is not changed");
});

test("mark style options reach the marks", () => {
  const el = draw(
    lib.StackedBarChartSimple().Keys(["a", "b"]).Data([{ name: "x", a: 1, b: 2 }]).MarkStroke("#123456").MarkStrokeWidth(2).MarkCornerRadius(5),
    "mark-style",
  );
  const mark = el.querySelector("rect.mark");
  assert.equal(mark.getAttribute("stroke"), "#123456");
  assert.equal(mark.getAttribute("stroke-width"), "2");
  assert.equal(mark.getAttribute("rx"), "5");
});

test("Animate fades marks in, and Animate(false) does not", () => {
  const on = draw(lollipop("an1"), "anim-on");
  assert.equal(on.querySelector(".mark").style.opacity, "0");
  const off = draw(lollipop("an2").Animate(false), "anim-off");
  assert.equal(off.querySelector(".mark").style.opacity, "");
  const faded = draw(lollipop("an3").Animate(false).MarkOpacity(0.5), "anim-opacity");
  assert.equal(faded.querySelector(".mark").style.opacity, "0.5");
});

test("prefers-reduced-motion turns the animation off", () => {
  const original = window.matchMedia;
  window.matchMedia = (query) => ({ matches: /reduce/.test(query) });
  try {
    const el = draw(lollipop("rm"), "reduced-motion");
    assert.equal(el.querySelector(".mark").style.opacity, "");
  } finally {
    window.matchMedia = original;
  }
});

test("Theme auto follows the operating system colour scheme", () => {
  const original = window.matchMedia;
  window.matchMedia = (query) => ({ matches: /dark/.test(query) });
  try {
    assert.equal(draw(lollipop("au"), "auto").querySelector("rect.background"), null);
    assert.equal(draw(lollipop("au2").Theme("auto"), "auto-dark").querySelector("rect.background").getAttribute("fill"), "#14161a");
  } finally {
    window.matchMedia = original;
  }
});

test("Trendline adds a regression line to line and scatter charts", () => {
  assert.equal(draw(line("tr").Trendline(true), "trend-line").querySelectorAll("line.trendline").length, 2);
  const scatter = lib.ScatterPlotSimple().X((d) => d.i).Y((d) => d.i * 2 + 1).Trendline(true).Data(d3.range(10).map((i) => ({ i })));
  assert.equal(draw(scatter, "trend-scatter").querySelectorAll("line.trendline").length, 1);
});

test("YScale log works and gaps (null values) break the line", () => {
  const log = draw(line("lg").YScale("log"), "log");
  assert.ok(!/NaN/.test(log.querySelector("path.line").getAttribute("d")));
  const gap = days.map((d, i) => (i === 4 ? { ...d, y: null } : { ...d, s: "p" }));
  const el = draw(lib.LineChartSimple().Data(gap).X((d) => d.x).Y((d) => d.y), "gap");
  assert.equal((el.querySelector("path.line").getAttribute("d").match(/M/g) || []).length, 2);
});

test("Dash, Gradient and Points options", () => {
  const el = draw(lib.AreaChartSimple().Dash("4 2").Gradient(true).Points(true).PointSize(5).Data(days), "line-extras");
  assert.equal(el.querySelector("path.line").getAttribute("stroke-dasharray"), "4 2");
  assert.ok(el.querySelector("linearGradient"));
  assert.match(el.querySelector("path.area").getAttribute("fill"), /^url\(#/);
  assert.equal(el.querySelectorAll("circle.point").length, 10);
  assert.equal(el.querySelector("circle.point").getAttribute("r"), "5");
});

test("DataLabels print values on stacked bars, lollipops, waterfalls and histograms", () => {
  const stacked = draw(lib.StackedBarChartSimple().Keys(["a", "b"]).DataLabels(true).Data([{ name: "x", a: 1, b: 2 }, { name: "y", a: 3, b: 4 }]), "dl-stack");
  assert.equal(stacked.querySelectorAll("text.data-label").length, 4);
  assert.equal(draw(lollipop("dl2").DataLabels(true).LabelFormat(".1f"), "dl-lolli").querySelector("text.data-label").textContent, "10.0");
  assert.equal(draw(lib.WaterfallChartSimple().DataLabels(true).Data(rows), "dl-water").querySelectorAll("text.data-label").length, 5);
  assert.ok(draw(lib.HistogramSimple().DataLabels(true).Data(d3.range(30)), "dl-hist").querySelectorAll("text.data-label").length > 0);
});

test("Pie options: percent labels, centre text, angles and a legend", () => {
  const el = draw(
    lib.PieChartSimple().ShowPercent(true).CentreText("Total").InnerRadius(0.5).ShowLegend(true).StartAngle(-Math.PI / 2).EndAngle(Math.PI / 2).Data(rows),
    "pie-opts",
  );
  assert.match(el.querySelector("svg g g text").textContent, /%$/);
  assert.ok([...el.querySelectorAll("text")].some((t) => t.textContent === "Total"));
  assert.equal(el.querySelectorAll(".legend-item").length, 4);
});

test("Treemap Tile and Sankey Align options", () => {
  const tree = { name: "r", children: [{ name: "a", value: 3 }, { name: "b", value: 5 }] };
  for (const tile of ["squarify", "binary", "slice", "dice", "sliceDice"]) {
    assert.equal(draw(lib.TreemapChartSimple().Tile(tile).Data(tree), `tile-${tile}`).querySelectorAll(".mark").length, 2);
  }
  const flow = { nodes: [{ name: "A" }, { name: "B" }, { name: "C" }], links: [{ source: "A", target: "B", value: 1 }, { source: "B", target: "C", value: 1 }] };
  for (const align of ["justify", "left", "right", "center"]) {
    assert.equal(draw(lib.SankeyDiagramSimple().Align(align).Data(flow), `align-${align}`).querySelectorAll("rect.mark").length, 3);
  }
});

test("heat charts accept a named colour scale", () => {
  const cells = [{ x: "a", y: "p", value: 1 }, { x: "b", y: "p", value: 9 }];
  const a = draw(lib.HeatGridChartSimple().Interpolator("viridis").Data(cells), "interp-a");
  const b = draw(lib.HeatGridChartSimple().Interpolator("blues").Data(cells), "interp-b");
  assert.notEqual(a.querySelector("rect.mark").getAttribute("fill"), b.querySelector("rect.mark").getAttribute("fill"));
});

test("AutoResize redraws at the container size when it changes", async () => {
  let notify;
  globalThis.ResizeObserver = class { constructor(cb) { notify = cb; } observe() {} };
  try {
    const el = makeContainer("resize");
    d3.select(el).call(lollipop("rs").AutoResize(true));
    el.getBoundingClientRect = () => ({ width: 800, height: 500 });
    notify(); // first call is the starting size and is ignored
    notify();
    await tick();
    assert.equal(el.querySelectorAll("svg").length, 1);
    assert.equal(el.querySelector("svg").getAttribute("viewBox"), "0 0 800 500");
  } finally {
    delete globalThis.ResizeObserver;
  }
});

test("toSvgString returns a standalone svg at design size", () => {
  const el = draw(lollipop("ex").Width(500).Height(250), "export");
  const text = lib.toSvgString(el);
  assert.match(text, /^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(text, /width="500"/);
  assert.match(text, /height="250"/);
  assert.throws(() => lib.toSvgString(makeContainer("no-svg")), /no <svg>/);
});

test("BarChartSimple takes theme, heading and click callbacks", () => {
  const names = rows.map((d) => d.name);
  const got = [];
  const chart = lib.BarChartSimple().SvgID("old").Val((a) => a.value).Band((a) => a.name).DomainBand(names)
    .DomainVal([0, 40]).ColourDomain(names).Width(600).Height(300).MarginTop(40)
    .Theme("dark").Title("Legacy").ShowTitle(true).Subtitle("sub").OnClick((e, d) => got.push(d)).Data(rows);
  const el = draw(chart, "legacy");
  assert.equal(el.querySelector("rect.background").getAttribute("fill"), "#14161a");
  assert.equal(el.querySelector("text.title").textContent, "Legacy");
  click(el.querySelector("svg g rect:not(.background)"));
  assert.deepEqual(got[0], rows[0]);
});

test("the extra feature setters exist on every chart and chain", () => {
  const keys = ["Theme", "Palette", "Legend", "Tooltip", "OnClick", "Animate", "RefLines", "SortBy", "Locale", "Grid", "AutoResize"];
  for (const name of everyChart) {
    const chart = lib[name]();
    for (const key of keys) assert.equal(typeof chart[key], "function", `${name}.${key}`);
    assert.equal(chart.Theme("dark"), chart);
    assert.equal(chart.Theme(), "dark");
  }
});

const wheel = (node, deltaY, clientX = 300, clientY = 100) =>
  node.dispatchEvent(new window.WheelEvent("wheel", { deltaY, clientX, clientY, bubbles: true, cancelable: true }));
const ticks = (el) => [...el.querySelectorAll("g.x-axis .tick text")].map((n) => n.textContent).join("|");
const yTicks = (el) => [...el.querySelectorAll("g.y-axis .tick text")].map((n) => n.textContent).join("|");
const slope = d3.range(100).map((i) => ({ x: new Date(2025, 0, 1 + i), y: i < 50 ? i : 50 + (i - 50) * 20 }));
const zoomable = (id, extra = (c) => c) => extra(lib.LineChartSimple().SvgID(id).Width(600).Height(300).Zoom(true).Data(slope));

test("Zoom: the wheel narrows the x axis, the y axis refits, and OnZoom reports the domain", async () => {
  const domains = [];
  const el = draw(zoomable("z1", (c) => c.OnZoom((d) => domains.push(d))), "zoom-wheel");
  const area = el.querySelector("rect.zoom-area");
  assert.ok(area);
  const [beforeX, beforeY] = [ticks(el), yTicks(el)];
  const before = el.querySelector("path.line").getAttribute("d");
  wheel(area, -600);
  assert.notEqual(ticks(el), beforeX, "x ticks changed");
  assert.notEqual(yTicks(el), beforeY, "y axis refit to the visible points");
  assert.notEqual(el.querySelector("path.line").getAttribute("d"), before, "the line was repainted");
  await new Promise((resolve) => setTimeout(resolve, 250)); // d3 ends a wheel gesture after 150 ms
  assert.equal(domains.length, 1);
  const [lo, hi] = domains[0];
  assert.ok(hi - lo < slope[99].x - slope[0].x, "the domain is narrower than the data");
  assert.equal(el.querySelectorAll("svg").length, 1, "zoom updates in place, no redraw");
});

test("Zoom: Zoom(false) draws no zoom area and no clip path", () => {
  const el = draw(zoomable("z2", (c) => c.Zoom(false)), "zoom-off");
  assert.equal(el.querySelector("rect.zoom-area"), null);
  assert.equal(el.querySelector("clipPath"), null);
  assert.ok(draw(zoomable("z2b"), "zoom-on").querySelector("clipPath"));
});

test("Zoom: ZoomFitY(false) keeps the y axis, ZoomMax limits how far you can zoom in", () => {
  const el = draw(zoomable("z3", (c) => c.ZoomFitY(false)), "zoom-nofit");
  const before = yTicks(el);
  wheel(el.querySelector("rect.zoom-area"), -600);
  assert.equal(yTicks(el), before);
  const capped = draw(zoomable("z3b", (c) => c.ZoomMax(1)), "zoom-capped");
  const t = ticks(capped);
  wheel(capped.querySelector("rect.zoom-area"), -2000);
  assert.equal(ticks(capped), t, "a ZoomMax of 1 allows no zoom");
});

test("Zoom: reference lines follow the refitted y axis", () => {
  const el = draw(zoomable("z4", (c) => c.RefLines([{ axis: "y", value: 30, label: "mark" }])), "zoom-refs");
  const y = () => el.querySelector("g.refline line").getAttribute("y1");
  const before = y();
  wheel(el.querySelector("rect.zoom-area"), -800, 100, 100);
  assert.notEqual(y(), before);
  assert.equal(el.querySelectorAll("g.refline").length, 1, "the overlay is replaced, not stacked");
});

test("Zoom: the zoomed domain survives a redraw and double-click resets it", async () => {
  const chart = zoomable("z5");
  const el = draw(chart, "zoom-keep");
  wheel(el.querySelector("rect.zoom-area"), -600);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const zoomed = ticks(el);
  const stored = chart.ZoomDomain();
  assert.ok(stored && stored.length === 2);
  chart.Subtitle("redrawn");
  await tick();
  assert.equal(el.querySelector("text.subtitle").textContent, "redrawn");
  assert.equal(ticks(el), zoomed, "the redraw starts from the zoomed domain");
  fire(el.querySelector("rect.zoom-area"), "dblclick");
  await tick();
  assert.equal(chart.ZoomDomain(), null);
  assert.notEqual(ticks(el), zoomed, "reset shows the full range again");
});

test("Zoom works together with the crosshair, and on the time line charts", async () => {
  const el = draw(lib.LineTimeChartSimple().Width(600).Height(300).Zoom(true).Data(slope.map((d) => ({ date: d.x, value: d.y }))), "zoom-time");
  assert.equal(el.querySelector("rect.zoom-area"), null, "the crosshair area takes the zoom");
  const area = el.querySelector("rect.crosshair-area");
  const before = ticks(el);
  wheel(area, -600);
  assert.notEqual(ticks(el), before);
  fire(area, "mousemove", { clientX: 200, clientY: 100 });
  assert.ok(document.querySelector(".d3eazy-tooltip").textContent.length > 0);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const multi = draw(lib.MultiLineTimeChartSimple().Width(600).Height(300).Zoom(true).LineKeys(["a"]).Data(slope.map((d) => ({ date: d.x, a: d.y }))), "zoom-multi");
  assert.ok(multi.querySelector("rect.crosshair-area"));
});

test("Zoom hides the crosshair dots and guide until the pointer moves again", () => {
  const el = draw(lib.LineChartSimple().Width(600).Height(300).Zoom(true).Crosshair(true).Data(slope), "zoom-hide");
  const area = el.querySelector("rect.crosshair-area");
  fire(area, "mousemove", { clientX: 200, clientY: 100 });
  assert.equal(el.querySelector("line.crosshair").style.opacity, "1");
  wheel(area, -600);
  assert.equal(el.querySelector("line.crosshair").style.opacity, "0");
});

const grows = {
  HistogramSimple: (c) => c.Thresholds(5).Data(d3.range(50)),
  WaterfallChartSimple: (c) => c.Data(rows),
  StackedBarChartSimple: (c) => c.Keys(["a", "b"]).Data([{ name: "x", a: 3, b: 4 }, { name: "y", a: 5, b: 1 }]),
};
for (const [name, setup] of Object.entries(grows)) {
  test(`${name} bars grow from the baseline to their final size`, async () => {
    const make = (animate) => setup(lib[name]().Width(600).Height(300).Duration(40).Stagger(0).Animate(animate));
    const sizes = (el) => [...el.querySelectorAll("rect.mark")].map((n) => +n.getAttribute("height"));
    const off = draw(make(false), `grow-off-${name}`);
    const final = sizes(off);
    assert.ok(final.some((v) => v > 10), "final bars have height");
    const on = draw(make(true), `grow-on-${name}`);
    assert.ok(sizes(on).every((v) => v === 0), "bars start collapsed");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.deepEqual(sizes(on).map((v) => Math.round(v)), final.map((v) => Math.round(v)));
  });
}

test("data labels fade in with the bars", () => {
  const el = draw(lib.HistogramSimple().Width(600).Height(300).DataLabels(true).Data(d3.range(30)), "labels-fade");
  assert.equal(el.querySelector("text.data-label").style.opacity, "0");
  const still = draw(lib.HistogramSimple().Width(600).Height(300).Animate(false).DataLabels(true).Data(d3.range(30)), "labels-still");
  assert.equal(still.querySelector("text.data-label").style.opacity, "");
});

const stacked = (id) => lib.StackedBarChartSimple().SvgID(id).Width(600).Height(300).Keys(["a", "b"]).Animate(false)
  .Data([{ name: "x", a: 3, b: 4 }, { name: "y", a: 5, b: 1 }]);
// Width of the plot: the x axis line runs from 0 to the plot width (d3 adds a 0.5px offset).
const plotWidth = (el) => +el.querySelector("g.x-axis path.domain").getAttribute("d").match(/H([\d.]+)/)[1];
const legendX = (el) => +/translate\(([\d.-]+),/.exec(el.querySelector(".legend").getAttribute("transform"))[1];

test("a right-hand legend sits beside the plot and the plot gets narrower to make room", () => {
  const outside = draw(stacked("lo1"), "legend-outside");
  const inside = draw(stacked("lo2").LegendInside(true), "legend-inside");
  const none = draw(stacked("lo3").Legend("none"), "legend-none-width");
  assert.ok(plotWidth(outside) < plotWidth(none), "the plot gave up width for the legend");
  assert.equal(plotWidth(inside), plotWidth(none), "an inside legend takes no width");
  assert.ok(legendX(outside) >= plotWidth(outside), "outside legend starts past the plot edge");
  assert.ok(legendX(inside) < plotWidth(inside), "inside legend is within the plot");
});

test("left and horizontal legends stay inside the plot, and charts without a legend reserve no room", () => {
  const none = plotWidth(draw(stacked("lp0").Legend("none"), "legend-ref"));
  const left = draw(stacked("lp1").Legend("top-left"), "legend-left");
  assert.equal(plotWidth(left), none);
  assert.equal(legendX(left), 0);
  const row = draw(stacked("lp2").LegendOrient("horizontal"), "legend-row-inside");
  assert.equal(plotWidth(row), none);
  const single = draw(lib.LineChartSimple().Width(600).Height(300).Data(days.map((d) => ({ x: d.x, y: d.y }))), "legend-single");
  assert.equal(single.querySelector(".legend"), null);
  assert.equal(plotWidth(single), plotWidth(draw(lib.LineChartSimple().Width(600).Height(300).Legend("none").Data(days), "legend-single-none")));
});

test("legend labels from LegendLabels decide the room reserved", () => {
  const short = draw(lib.LineChartSimple().Width(600).Height(300).Series((d) => d.s).Data(days), "legend-short");
  const long = draw(lib.LineChartSimple().Width(600).Height(300).Series((d) => d.s).LegendLabels({ p: "A very long series name", q: "Another long series name" }).Data(days), "legend-long");
  assert.ok(plotWidth(long) < plotWidth(short));
});
