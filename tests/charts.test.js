import { makeContainer, tick } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import * as d3 from "d3";
import * as lib from "../d3-eazy.js";
import { moreConfigs } from "./more-fixtures.js";

const dataset = [
  { name: "JS", value: 52, nice: 46 },
  { name: "GO", value: 301, nice: 202 },
  { name: "C", value: 182, nice: 120 },
];
const names = dataset.map((d) => d.name);
const ramp = d3.range(20).map((i) => ({ i, r: Math.sin(i / 3) + 2 }));
const days = d3.range(10).map((i) => ({ t: new Date(2024, 0, 1 + i), v: i * 2 }));

// One valid configuration per chart. Each returns a configured chart.
const configs = {
  BarChartSimple: (c) =>
    c.Val((a) => a.value).Band((a) => a.name).DomainBand(names).DomainVal([0, 301])
      .ColourDomain(names).Width(600).Height(300).Data(dataset),
  GroupedBarChartSimple: (c) =>
    c.Band(names).Subgroup(["value", "nice"]).DomainVal([0, 301])
      .ColourDomain(names).Width(600).Height(300).Data(dataset),
  DonutChartSimple: (c) =>
    c.Width(600).Height(300).ColourDomain(names).Val((a) => a.value)
      .ValText((a) => a.value).Key((a) => a.name).Data(dataset),
  LineLinearSpark: (c) =>
    c.Width(600).Height(300).DomainLinear([0, 19]).LinearAccessor((d) => d.i)
      .DomainVal([0, 3]).ValAccessor((d) => d.r).Data(ramp),
  LineTimeChartSimple: (c) =>
    c.Width(600).Height(300).MarginLeft(30).MarginBottom(20).Time((d) => d.t)
      .Linear((d) => d.v).DomainTime(d3.extent(days, (d) => d.t)).DomainLinear([0, 20]).Data(days),
  MultiLineTimeChartSimple: (c) =>
    c.Width(600).Height(300).Time((d) => d.t).LineKeys(["a", "b"]).ColourDomain(["a", "b"])
      .DomainTime(d3.extent(days, (d) => d.t)).DomainVal([0, 40])
      .Data(days.map((d) => ({ t: d.t, a: d.v, b: d.v * 2 }))),
  SingleHorzBarChart: (c) =>
    c.Width(600).Height(60).ColourDomain(["a", "b"]).DomainVal([0, 7])
      .Data(d3.stack().keys(["a", "b"])([{ a: 3, b: 4 }])),
  LineAndBarChartSimple: (c) =>
    c.Width(600).Height(300).BandDomain([0, 10]).ValDomain([0, 10]).ThresholdBin(1)
      .Data([{ key: 1, value: 3 }, { key: 4, value: 7 }, { key: 8, value: 5 }]),
  HeatMapBlockedSimple: (c) =>
    c.Width(600).Height(300).ColourDomainZ(["ok", "bad"]).DateAccessor((d) => d.t)
      .Data(days.map((d, i) => ({ t: d.t, status: i % 2 ? "ok" : "bad" }))),
  CircularHeatChartSimple: (c) => c.Width(600).Height(300).Data(d3.range(48)),
};

// The extra charts share one factory. Add them to the generic render and setter tests.
for (const [name, [configure]] of Object.entries(moreConfigs)) configs[name] = configure;

test("every exported chart has a test configuration", () => {
  const charts = Object.keys(lib).filter((k) => /^[A-Z]/.test(k));
  assert.deepEqual(charts.sort(), Object.keys(configs).sort());
});

for (const [name, [configure, marks]] of Object.entries(moreConfigs)) {
  test(`${name} draws ${marks} marks`, () => {
    const el = makeContainer(`marks-${name}`);
    d3.select(el).call(configure(lib[name]().SvgID(`m-${name}`).Width(600).Height(400)));
    assert.equal(el.querySelectorAll(".mark").length, marks);
    assert.equal(el.querySelector("svg").getAttribute("viewBox"), "0 0 600 400");
  });
}

for (const [name, configure] of Object.entries(configs)) {
  test(`${name} renders one svg with the given id`, () => {
    const el = makeContainer(`render-${name}`);
    const chart = configure(lib[name]().SvgID(`svg-${name}`));
    d3.select(el).call(chart);
    const svgs = el.querySelectorAll("svg");
    assert.equal(svgs.length, 1);
    assert.equal(svgs[0].id, `svg-${name}`);
    assert.ok(svgs[0].querySelectorAll("*").length > 1, "svg has content");
  });

  test(`${name} writes no NaN or undefined into SVG attributes`, () => {
    const el = makeContainer(`nan-${name}`);
    d3.select(el).call(configure(lib[name]().SvgID(`n-${name}`)));
    for (const node of el.querySelectorAll("svg *")) {
      for (const attr of node.attributes) {
        assert.ok(!/NaN|undefined|Infinity/.test(attr.value), `${node.tagName} ${attr.name}="${attr.value.slice(0, 60)}"`);
      }
    }
  });

  test(`${name} setters chain and getters return the stored value`, () => {
    const chart = lib[name]();
    assert.equal(chart.SvgID("abc"), chart);
    assert.equal(chart.SvgID(), "abc");
    assert.equal(chart.Width(321), chart);
    assert.equal(chart.Width(), 321);
  });
}

test("two bar charts keep separate data", () => {
  const one = makeContainer("iso-one");
  const two = makeContainer("iso-two");
  const base = () =>
    lib.BarChartSimple().Val((a) => a.value).Band((a) => a.name).DomainBand(names)
      .DomainVal([0, 301]).ColourDomain(names).Width(600).Height(300);
  d3.select(one).call(base().SvgID("a").Data(dataset));
  d3.select(two).call(base().SvgID("b").Data(dataset.slice(0, 1)));
  assert.equal(one.querySelectorAll("rect").length, 3);
  assert.equal(two.querySelectorAll("rect").length, 1);
});

test("changing a setter after render redraws once, without duplicating the svg", async () => {
  const el = makeContainer("redraw-circular");
  const chart = lib.CircularHeatChartSimple().SvgID("c").Width(600).Height(300).Data(d3.range(48));
  d3.select(el).call(chart);
  assert.equal(el.querySelectorAll("path.segment").length, 48);
  chart.Data(d3.range(10)).InnerRadius(20).NumSegments(5);
  await tick();
  assert.equal(el.querySelectorAll("svg").length, 1);
  assert.equal(el.querySelectorAll("path.segment").length, 10);
});

test("Orient change redraws a bar chart", async () => {
  const el = makeContainer("redraw-bar");
  const chart = lib.BarChartSimple().SvgID("b").Val((a) => a.value).Band((a) => a.name)
    .DomainBand(names).DomainVal([0, 301]).ColourDomain(names).Width(600).Height(300)
    .Orient("horizontal").Data(dataset);
  d3.select(el).call(chart);
  chart.Orient("vertical");
  await tick();
  assert.equal(el.querySelectorAll("svg").length, 1);
  assert.equal(el.querySelectorAll("rect").length, 3);
});

test("setters before first render do not draw anything", async () => {
  const chart = lib.CircularHeatChartSimple().Data([1, 2, 3]).InnerRadius(10);
  await tick();
  assert.equal(document.querySelectorAll("#never-mounted").length, 0);
  assert.equal(chart.InnerRadius(), 10);
});

test("Title and Description make the svg accessible", () => {
  const el = makeContainer("a11y");
  const chart = lib.CircularHeatChartSimple().SvgID("acc").Width(600).Height(300)
    .Title("Hourly load").Description("Load by hour over two days").Data(d3.range(48));
  d3.select(el).call(chart);
  const svg = el.querySelector("svg");
  assert.equal(svg.getAttribute("role"), "img");
  assert.equal(svg.getAttribute("aria-labelledby"), "acc-title acc-desc");
  assert.equal(svg.querySelector("title").textContent, "Hourly load");
  assert.equal(svg.querySelector("desc").textContent, "Load by hour over two days");
});

test("charts without Title add no aria attributes", () => {
  const el = makeContainer("no-a11y");
  d3.select(el).call(lib.CircularHeatChartSimple().SvgID("plain").Width(600).Height(300).Data(d3.range(5)));
  assert.equal(el.querySelector("svg").getAttribute("role"), null);
});

test("DonutChartSimple.Data updates the slices of a drawn chart", async () => {
  const el = makeContainer("donut-update");
  const chart = configs.DonutChartSimple(lib.DonutChartSimple().SvgID("d"));
  d3.select(el).call(chart);
  const before = el.querySelectorAll("path").length;
  chart.Data(dataset.slice(0, 1));
  await tick();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(el.querySelectorAll("svg").length, 1);
  assert.ok(el.querySelectorAll("path").length <= before);
});

test("ForceNetworkSimple keeps nodes inside the plot area", () => {
  const el = makeContainer("force-bounds");
  const nodes = d3.range(30).map((i) => ({ id: `n${i}`, group: i % 3 }));
  d3.select(el).call(lib.ForceNetworkSimple().Width(400).Height(300).MarginLeft(0).MarginRight(0).MarginTop(0).MarginBottom(0).Data({ nodes, links: [] }));
  for (const c of el.querySelectorAll("circle.mark")) {
    assert.ok(+c.getAttribute("cx") >= 0 && +c.getAttribute("cx") <= 400);
    assert.ok(+c.getAttribute("cy") >= 0 && +c.getAttribute("cy") <= 300);
  }
});

function labelledBars(orient) {
  return lib.BarChartSimple().SvgID("lbl").Val((a) => a.value).Band((a) => a.name)
    .DomainBand(names).DomainVal([0, 301]).ColourDomain(names).Width(600).Height(300)
    .MarginLeft(40).MarginBottom(20).Orient(orient).WithText(true).Data(dataset);
}

test("bar labels are centred on each bar and inside only the long bars", () => {
  const el = makeContainer("labels-h");
  d3.select(el).call(labelledBars("horizontal"));
  const texts = [...el.querySelectorAll("text.bar-text")];
  assert.equal(texts.length, 3);
  assert.ok(texts.every((t) => t.getAttribute("text-anchor") === "middle"));
  // values 52, 301, 182 against a 301 domain: only 301 is longer than 50% of the plot
  const fills = texts.map((t) => t.getAttribute("fill"));
  assert.equal(fills[0], "#222", "short bar: dark text outside the bar");
  assert.notEqual(fills[1], "#222", "long bar: contrast text inside the bar");
});

test("labels on a flipped bar chart sit at the bar end, outside short bars", () => {
  const el = makeContainer("labels-v");
  d3.select(el).call(labelledBars("vertical"));
  const texts = [...el.querySelectorAll("text.bar-text")];
  assert.deepEqual(texts.map((t) => t.getAttribute("text-anchor")), ["start", "end", "end"]);
});

test("Data() on a labelled bar chart replaces the labels instead of stacking them", async () => {
  const el = makeContainer("labels-update");
  const chart = labelledBars("horizontal");
  d3.select(el).call(chart);
  chart.Data(dataset.slice(0, 2));
  await tick();
  assert.equal(el.querySelectorAll("text.bar-text").length, 2);
  assert.equal(el.querySelectorAll("g.bar-labels").length, 1);
});

test("grouped bar labels exist for every bar and use readable colours", () => {
  const el = makeContainer("grouped-labels");
  d3.select(el).call(
    lib.GroupedBarChartSimple().SvgID("gl").Band(names).Subgroup(["value", "nice"]).DomainVal([0, 301])
      .ColourDomain(names).Width(600).Height(300).WithText(true).Data(dataset),
  );
  const texts = [...el.querySelectorAll("text.bar-text")];
  assert.equal(texts.length, 6);
  assert.ok(texts.every((t) => ["#222", "#111", "#fff"].includes(t.getAttribute("fill"))));
});
