import { makeContainer, tick } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import * as d3 from "d3";
import * as lib from "../d3-eazy.js";

const random = d3.randomLcg(5);
const points = d3.range(400).map((i) => ({ x: random() * 100, y: random() * 100, g: i % 2 ? "a" : "b" }));
const draw = (chart, id) => {
  const el = makeContainer(id);
  d3.select(el).call(chart);
  return el;
};
const scatter = (extra = (c) => c) =>
  extra(lib.ScatterPlotSimple().Width(600).Height(300).Animate(false).Group((d) => d.g).Data(points));
const fire = (node, type, init = {}) => node.dispatchEvent(new window.MouseEvent(type, { bubbles: true, ...init }));
const wheel = (node, deltaY, clientX = 300, clientY = 100) =>
  node.dispatchEvent(new window.WheelEvent("wheel", { deltaY, clientX, clientY, bubbles: true, cancelable: true }));
const ticks = (el, axis) => [...el.querySelectorAll(`g.${axis}-axis .tick text`)].map((n) => n.textContent).join("|");
const calls = (el) => el.querySelector("canvas").getContext("2d").calls;
const arcs = (el) => calls(el).filter((c) => c === "arc").length;
const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// --- zoom on the SVG renderer ---

test("scatter Zoom: the wheel zooms both axes and moves the dots in place", async () => {
  const domains = [];
  const el = draw(scatter((c) => c.Zoom(true).OnZoom((d) => domains.push(d))), "sz-1");
  const circle = el.querySelector("circle.mark");
  const before = { x: ticks(el, "x"), y: ticks(el, "y"), cx: circle.getAttribute("cx") };
  wheel(el.querySelector("rect.zoom-area"), -600);
  assert.notEqual(ticks(el, "x"), before.x);
  assert.notEqual(ticks(el, "y"), before.y);
  assert.notEqual(circle.getAttribute("cx"), before.cx, "the dot moved");
  assert.equal(el.querySelector("circle.mark"), circle, "the same element, not a redraw");
  await settle();
  assert.equal(domains.length, 1);
  assert.ok(domains[0].x.length === 2 && domains[0].y.length === 2);
  assert.ok(domains[0].x[1] - domains[0].x[0] < 100, "the x range is narrower");
});

test("scatter Zoom: ZoomAxis limits zooming to one axis", () => {
  const onlyX = draw(scatter((c) => c.Zoom(true).ZoomAxis("x")), "sz-2");
  const y = ticks(onlyX, "y");
  wheel(onlyX.querySelector("rect.zoom-area"), -600);
  assert.notEqual(ticks(onlyX, "x"), ticks(draw(scatter(), "sz-2b"), "x"));
  assert.equal(ticks(onlyX, "y"), y);
  const onlyY = draw(scatter((c) => c.Zoom(true).ZoomAxis("y")), "sz-3");
  const x = ticks(onlyY, "x");
  wheel(onlyY.querySelector("rect.zoom-area"), -600);
  assert.equal(ticks(onlyY, "x"), x);
});

test("scatter Zoom: the range survives a redraw, double-click resets, ZoomMax limits", async () => {
  const chart = scatter((c) => c.Zoom(true));
  const el = draw(chart, "sz-4");
  const full = ticks(el, "x");
  wheel(el.querySelector("rect.zoom-area"), -600);
  await settle();
  const zoomed = ticks(el, "x");
  assert.ok(chart.ZoomDomain() && chart.ZoomDomain().x && chart.ZoomDomain().y);
  chart.Subtitle("redrawn");
  await tick();
  assert.equal(ticks(el, "x"), zoomed);
  fire(el.querySelector("rect.zoom-area"), "dblclick");
  await tick();
  assert.equal(chart.ZoomDomain(), null);
  assert.equal(ticks(el, "x"), full);
  const capped = draw(scatter((c) => c.Zoom(true).ZoomMax(1)), "sz-5");
  const t = ticks(capped, "x");
  wheel(capped.querySelector("rect.zoom-area"), -2000);
  assert.equal(ticks(capped, "x"), t);
});

test("scatter Zoom: a clip path keeps dots inside the plot, the trendline follows, hover still works", () => {
  const el = draw(scatter((c) => c.Zoom(true).Trendline(true)), "sz-6");
  assert.ok(el.querySelector("clipPath"));
  assert.equal(draw(scatter(), "sz-6b").querySelector("clipPath"), null);
  const line = el.querySelector("line.trendline");
  const before = line.getAttribute("x1");
  wheel(el.querySelector("rect.zoom-area"), -600);
  assert.notEqual(line.getAttribute("x1"), before);
  fire(el.querySelector("circle.mark"), "mousemove", { clientX: 10, clientY: 10 });
  assert.match(document.querySelector(".d3eazy-tooltip").textContent, /^[ab]: \(/);
});

// --- canvas renderer ---

test("Renderer('canvas') draws one canvas and no dot elements", () => {
  const el = draw(scatter((c) => c.Renderer("canvas")), "sc-1");
  assert.equal(el.querySelectorAll("circle.mark").length, 0);
  assert.equal(el.querySelectorAll("foreignObject canvas").length, 1);
  assert.equal(arcs(el), points.length);
  assert.ok(calls(el).includes("clearRect"));
});

test("Renderer('auto') switches to canvas above CanvasOver, 'svg' never does", () => {
  assert.equal(draw(scatter((c) => c.CanvasOver(100)), "sc-2a").querySelectorAll("canvas").length, 1);
  assert.equal(draw(scatter((c) => c.CanvasOver(1000)), "sc-2b").querySelectorAll("canvas").length, 0);
  assert.equal(draw(scatter((c) => c.Renderer("svg").CanvasOver(1)), "sc-2c").querySelectorAll("canvas").length, 0);
  assert.equal(lib.ScatterPlotSimple().Renderer(), "auto");
  assert.equal(lib.ScatterPlotSimple().CanvasOver(), 20000);
});

test("Canvas hover and click find the nearest drawn point and pass its row", () => {
  const rows = [{ x: 50, y: 50 }, { x: 10, y: 10 }];
  const hovers = [], clicks = [];
  const el = draw(
    lib.ScatterPlotSimple().Width(600).Height(300).MarginLeft(0).MarginRight(0).MarginTop(0).MarginBottom(0).Animate(false)
      .DomainX([0, 100]).DomainY([0, 100]).Renderer("canvas").Data(rows)
      .OnHover((e, d) => hovers.push(d)).OnClick((e, d) => clicks.push(d)),
    "sc-3",
  );
  const area = el.querySelector("rect.scatter-area");
  fire(area, "mousemove", { clientX: 305, clientY: 152 }); // (50, 50) is at pixel (300, 150)
  assert.deepEqual(hovers.at(-1), rows[0]);
  const box = document.querySelector(".d3eazy-tooltip");
  assert.equal(box.style.opacity, "1");
  assert.equal(box.textContent, "(50, 50)");
  fire(area, "click", { clientX: 305, clientY: 152 });
  assert.deepEqual(clicks[0], rows[0]);
  fire(area, "mousemove", { clientX: 450, clientY: 40 }); // nothing near here
  assert.equal(hovers.at(-1), null);
  assert.equal(box.style.opacity, "0");
  fire(area, "click", { clientX: 450, clientY: 40 });
  assert.equal(clicks.length, 1, "a click on empty space does nothing");
});

test("Canvas legend: clicking an item hides that group and hovering dims the others", () => {
  const el = draw(scatter((c) => c.Renderer("canvas")), "sc-4");
  calls(el).length = 0;
  const first = el.querySelector(".legend-item");
  fire(first, "click");
  assert.equal(arcs(el), points.length / 2, "one group of two is gone");
  calls(el).length = 0;
  fire(first, "click");
  assert.equal(arcs(el), points.length);
  calls(el).length = 0;
  fire(first, "mouseenter");
  assert.equal(arcs(el), points.length, "all points are redrawn, the other group faded");
});

test("Canvas zoom redraws only the points in view", async () => {
  const domains = [];
  const el = draw(scatter((c) => c.Renderer("canvas").Zoom(true).OnZoom((d) => domains.push(d))), "sc-5");
  const first = arcs(el);
  wheel(el.querySelector("rect.zoom-area"), -1500, 100, 250);
  assert.ok(arcs(el) - first < first, "the second paint drew fewer points than the first");
  await settle();
  assert.equal(domains.length, 1);
  fire(el.querySelector("rect.zoom-area"), "dblclick");
  await tick();
  assert.equal(el.querySelectorAll("canvas").length, 1);
});

test("Export turns the canvas into an image", () => {
  const el = draw(scatter((c) => c.Renderer("canvas")), "sc-6");
  const text = lib.toSvgString(el);
  assert.ok(!text.includes("<canvas"));
  assert.match(text, /<image[^>]+href="data:image\/png;base64,AAAA"/);
  assert.match(text, /width="\d+"/);
});

test("Canvas copes with awkward data and the shared options", () => {
  for (const data of [null, [], [{ x: 1, y: 1 }], [{ x: NaN, y: 1 }, { x: 2, y: null }, { x: 3, y: 3 }]]) {
    assert.doesNotThrow(() => draw(lib.ScatterPlotSimple().Renderer("canvas").Zoom(true).Data(data), "sc-awkward"), JSON.stringify(data));
  }
  const el = draw(scatter((c) => c.Renderer("canvas").Theme("dark").Trendline(true).Grid("both").XLabel("x").RefLines([{ axis: "y", value: 50 }])), "sc-7");
  assert.equal(el.querySelectorAll("line.trendline").length, 1);
  assert.equal(el.querySelectorAll("g.refline").length, 1);
  assert.equal(el.querySelectorAll("rect.background").length, 1);
});

test("tooltip numbers are trimmed to 6 significant digits unless ValueFormat says otherwise", () => {
  const rows = [{ x: 1.23456789012, y: 2 }];
  const make = (extra = (c) => c) => extra(lib.ScatterPlotSimple().Width(600).Height(300).Animate(false).Data(rows));
  assert.equal(draw(make(), "fmt-1").querySelector("circle.mark").getAttribute("data-tip"), "(1.23457, 2)");
  assert.equal(draw(make((c) => c.ValueFormat(".1f")), "fmt-2").querySelector("circle.mark").getAttribute("data-tip"), "(1.2, 2.0)");
});

test("Canvas legend: hovering a hidden series does not dim the visible points", () => {
  const el = draw(scatter((c) => c.Renderer("canvas")), "sc-8");
  const item = el.querySelector(".legend-item");
  fire(item, "click"); // hide the first group
  const recorder = el.querySelector("canvas").getContext("2d");
  recorder.calls.length = 0;
  fire(item, "mouseenter");
  assert.equal(recorder.globalAlpha, 0.7, "the visible group is drawn at full opacity");
  assert.equal(arcs(el), points.length / 2);
});
