// Awkward data and sizes. A chart should draw something sensible and never throw or write
// NaN, Infinity or undefined into an attribute.
import { makeContainer } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import * as d3 from "d3";
import * as lib from "../d3-eazy.js";
import { classicConfigs } from "./classic-fixtures.js";
import { moreConfigs } from "./more-fixtures.js";

const all = { ...classicConfigs, ...Object.fromEntries(Object.entries(moreConfigs).map(([k, [fn]]) => [k, fn])) };

// Replace every number in a value (not Dates, not strings) with f(number).
function mapNumbers(value, f) {
  if (typeof value === "number") return f(value);
  if (Array.isArray(value)) {
    const copy = value.map((v) => mapNumbers(v, f));
    for (const key of Object.keys(value)) if (!/^\d+$/.test(key)) copy[key] = value[key]; // keep d3.stack's .key and .index
    return copy;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapNumbers(v, f)]));
  }
  return value;
}

const dataVariants = {
  "all zero": (n) => mapNumbers(n, () => 0),
  "all equal": (n) => mapNumbers(n, () => 5),
  negative: (n) => mapNumbers(n, (v) => -Math.abs(v) - 1),
  huge: (n) => mapNumbers(n, (v) => v * 1e12 + 1e12),
  tiny: (n) => mapNumbers(n, (v) => v * 1e-9),
  fractional: (n) => mapNumbers(n, (v) => v + 0.123456789),
};

const cells = (chart) => chart.Data();
const nodesWithBadValues = (el) => {
  const bad = [];
  for (const node of el.querySelectorAll("svg *")) {
    for (const attr of node.attributes) {
      if (/NaN|undefined|Infinity/.test(attr.value)) bad.push(`${node.tagName}[${attr.name}="${attr.value.slice(0, 50)}"]`);
    }
  }
  return bad;
};
let counter = 0;
const render = (chart) => {
  const el = makeContainer(`rob-${counter++}`);
  d3.select(el).call(chart);
  return el;
};
const configured = (name) => all[name](lib[name]().SvgID(`r${counter}`));

for (const name of Object.keys(all)) {
  for (const [label, variant] of Object.entries(dataVariants)) {
    test(`${name} copes with ${label} numbers`, () => {
      const chart = configured(name);
      const data = cells(chart);
      if (name === "SingleHorzBarChart") return; // its data is a d3.stack() result, covered by the size tests
      chart.Data(mapNumbers(data, variant === dataVariants["all zero"] ? () => 0 : (v) => variant(v)));
      let el;
      assert.doesNotThrow(() => { el = render(chart); });
      assert.deepEqual(nodesWithBadValues(el), []);
    });
  }

  test(`${name} copes with a single row`, () => {
    const chart = configured(name);
    const data = cells(chart);
    if (!Array.isArray(data) || name === "SingleHorzBarChart") return;
    chart.Data(data.slice(0, 1));
    let el;
    assert.doesNotThrow(() => { el = render(chart); });
    assert.deepEqual(nodesWithBadValues(el), []);
  });

  for (const [w, h] of [[0, 0], [1, 1], [30, 30], [4000, 40]]) {
    test(`${name} copes with a ${w}x${h} size`, () => {
      const chart = configured(name).Width(w).Height(h);
      let el;
      assert.doesNotThrow(() => { el = render(chart); });
      assert.deepEqual(nodesWithBadValues(el), []);
    });
  }

  test(`${name} copes with every legend position and the dark theme`, () => {
    for (const legend of ["top-left", "top-right", "bottom-left", "bottom-right", "none"]) {
      const chart = configured(name).Legend(legend).Theme("dark").Grid("both").XLabel("x").YLabel("y");
      let el;
      assert.doesNotThrow(() => { el = render(chart); }, legend);
      assert.deepEqual(nodesWithBadValues(el), [], legend);
    }
  });
}

test("rows with null and missing fields do not crash the line charts", () => {
  const rows = d3.range(10).map((i) => ({ x: i, y: i % 3 === 0 ? null : i, s: "a" }));
  assert.doesNotThrow(() => render(lib.LineChartSimple().Series((d) => d.s).Data(rows)));
  assert.doesNotThrow(() => render(lib.AreaChartSimple().Data(rows)));
  assert.doesNotThrow(() => render(lib.ScatterPlotSimple().Data(rows)));
});

for (const name of Object.keys(all)) {
  for (const [label, value] of [["null", null], ["undefined", undefined]]) {
    test(`${name} copes with Data(${label}), like data that has not loaded yet`, () => {
      const chart = configured(name).Data(value);
      let el;
      assert.doesNotThrow(() => { el = render(chart); });
      assert.deepEqual(nodesWithBadValues(el), []);
      assert.equal(el.querySelectorAll("svg").length, 1);
    });
  }
}

test("missing data shows the EmptyText message on every chart that needs data", () => {
  const withoutMessage = [];
  for (const name of Object.keys(all)) {
    const el = render(configured(name).Data(null));
    if (!el.querySelector("text.empty-state")) withoutMessage.push(name);
  }
  // A gauge shows its Value and needs no rows. A tree draws its root node.
  assert.deepEqual(withoutMessage.sort(), ["GaugeChartSimple", "TreeDiagramSimple"]);
});
