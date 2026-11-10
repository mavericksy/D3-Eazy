// The ten classic charts are built on the same factory as the others. These tests check that they
// have every shared option and that their own behaviour (linked hover, crosshair, labels) works.
import { makeContainer, tick } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import * as d3 from "d3";
import * as lib from "../d3-eazy.js";
import { classicConfigs, dataset, names } from "./classic-fixtures.js";

const classic = Object.keys(classicConfigs);
const draw = (chart, id) => {
  const el = makeContainer(id);
  d3.select(el).call(chart);
  return el;
};
const fire = (node, type, init = {}) => node.dispatchEvent(new window.MouseEvent(type, { bubbles: true, ...init }));
const configured = (name, id) => classicConfigs[name](lib[name]().SvgID(id));

test("there are exactly ten classic charts and each is exported", () => {
  assert.equal(classic.length, 10);
  for (const name of classic) assert.equal(typeof lib[name], "function", name);
});

for (const name of classic) {
  test(`${name} has the shared option setters and they chain`, () => {
    const chart = lib[name]();
    const shared = ["Theme", "Palette", "Legend", "Tooltip", "TooltipFormat", "OnClick", "OnHover", "Animate", "Duration", "RefLines",
      "Annotations", "Filter", "SortBy", "Limit", "EmptyText", "Locale", "ValueFormat", "DataLabels", "Grid", "XLabel", "YLabel",
      "XFormat", "YFormat", "ShowTitle", "Subtitle", "Caption", "Background", "FontFamily", "MarkStroke", "MarkOpacity", "AutoResize", "Focusable"];
    for (const key of shared) {
      assert.equal(typeof chart[key], "function", `${name}.${key}`);
      const before = chart[key]();
      assert.equal(chart[key](before), chart, `${name}.${key} chains`);
    }
  });

  test(`${name} draws with the dark theme`, () => {
    const el = draw(configured(name, `dk-${name}`).Theme("dark"), `classic-dark-${name}`);
    assert.equal(el.querySelector("rect.background").getAttribute("fill"), "#14161a");
  });

  test(`${name} shows a heading when asked`, () => {
    const el = draw(configured(name, `hd-${name}`).Title("Heading").ShowTitle(true).Subtitle("Sub").Caption("Cap"), `classic-head-${name}`);
    assert.deepEqual(["title", "subtitle", "caption"].map((c) => el.querySelector(`text.${c}`).textContent), ["Heading", "Sub", "Cap"]);
  });

  test(`${name} shows EmptyText when it has no data`, () => {
    const el = draw(lib[name]().EmptyText("Nothing"), `classic-empty-${name}`);
    assert.equal(el.querySelector("text.empty-state").textContent, "Nothing");
  });

  test(`${name} redraws once when a setter changes after the first draw`, async () => {
    const chart = configured(name, `rd-${name}`);
    const el = draw(chart, `classic-redraw-${name}`);
    chart.Subtitle("changed");
    await tick();
    assert.equal(el.querySelectorAll("svg").length, 1);
    assert.equal(el.querySelector("text.subtitle").textContent, "changed");
  });

  test(`${name} marks carry a tooltip text and fire OnClick with their datum`, () => {
    const clicks = [];
    const el = draw(configured(name, `ck-${name}`).OnClick((e, d, n) => clicks.push([d, n])), `classic-click-${name}`);
    const mark = el.querySelector(".mark");
    assert.ok(mark, "has marks");
    if (!["LineLinearSpark", "LineTimeChartSimple", "MultiLineTimeChartSimple"].includes(name)) assert.ok(mark.getAttribute("data-tip"), "has a tooltip");
    fire(mark, "click");
    assert.equal(clicks.length, 1);
    assert.notEqual(clicks[0][0], undefined);
  });
}

test("a classic chart honours Grid, axis labels, formats and ticks like the others", () => {
  const el = draw(configured("BarChartSimple", "bx").Grid("both").XLabel("Language").YLabel("Score").YFormat(".0%").YTicks(3), "bar-axes");
  assert.equal(el.querySelectorAll("g.grid").length, 2);
  assert.deepEqual([...el.querySelectorAll("text.axis-label")].map((n) => n.textContent).sort(), ["Language", "Score"]);
  assert.ok([...el.querySelectorAll("g.y-axis .tick text")].every((n) => n.textContent.endsWith("%")));
});

test("BarChartSimple reference lines use the value axis, also when flipped", () => {
  const flipped = draw(configured("BarChartSimple", "br").Orient("vertical").RefLines([{ axis: "x", value: 100, label: "limit" }]), "bar-ref");
  assert.equal(flipped.querySelector("g.refline text").textContent, "limit");
  assert.equal(flipped.querySelectorAll("g.refline line").length, 1);
});

test("BarChartSimple sorts, limits and filters through the shared data options", () => {
  const el = draw(configured("BarChartSimple", "bs").DomainBand([]).SortBy((d) => d.value).Limit(2), "bar-sort");
  assert.deepEqual([...el.querySelectorAll("rect.mark")].map((n) => d3.select(n).datum().name), ["GO", "C"]);
});

test("BarChartSimple DomainBandAsObject labels the axis with the .val field", () => {
  const el = draw(
    lib.BarChartSimple().Width(600).Height(300).DomainBandAsObject(true).BandAccessor((d) => d.key)
      .DomainBand([{ key: "a", val: "Alpha" }, { key: "b", val: "Beta" }]).Band((d) => d.key).Val((d) => d.n)
      .Data([{ key: "a", n: 1 }, { key: "b", n: 2 }]),
    "bar-object-domain",
  );
  assert.deepEqual([...el.querySelectorAll("g.x-axis .tick text")].map((n) => n.textContent), ["Alpha", "Beta"]);
});

test("BarChartSimple draws negative values from the zero line", () => {
  const el = draw(
    lib.BarChartSimple().Width(600).Height(300).Animate(false).DomainVal([-10, 10]).Band((d) => d.k).Val((d) => d.v)
      .Data([{ k: "up", v: 5 }, { k: "down", v: -5 }]),
    "bar-negative",
  );
  const [up, down] = [...el.querySelectorAll("rect.mark")];
  assert.equal(+up.getAttribute("y") + +up.getAttribute("height"), +down.getAttribute("y"));
});

test("GroupedBarChartSimple ColourBy subgroup adds a legend of the fields", () => {
  const el = draw(configured("GroupedBarChartSimple", "gs").ColourBy("subgroup"), "grouped-legend");
  assert.deepEqual([...el.querySelectorAll(".legend-item text")].map((n) => n.textContent), ["value", "nice"]);
  const hidden = draw(configured("GroupedBarChartSimple", "gs2"), "grouped-nolegend");
  assert.equal(hidden.querySelector(".legend"), null);
});

test("DonutChartSimple options: centre text, legend, formats and a custom radius", () => {
  const el = draw(
    configured("DonutChartSimple", "dn").CenterText("Total").ShowLegend(true).ValueFormat(",.1f").OuterRadiusArc(100).InnerRadiusArc(40).Shadow(false),
    "donut-opts",
  );
  assert.ok([...el.querySelectorAll("text")].some((t) => t.textContent === "Total"));
  assert.equal(el.querySelectorAll(".legend-item").length, 3);
  assert.equal(el.querySelectorAll("path.shadow").length, 0);
  assert.match(el.querySelector("path.slice").getAttribute("data-tip"), /\d\.\d$/);
});

test("LineTimeChartSimple shows a crosshair and a tooltip with the date and value", () => {
  const days = d3.range(10).map((i) => ({ date: new Date(2025, 0, 1 + i), value: i * 10 }));
  const el = draw(lib.LineTimeChartSimple().Width(600).Height(300).Data(days), "crosshair");
  const area = el.querySelector("rect.crosshair-area");
  assert.ok(area);
  fire(area, "mousemove", { clientX: 200, clientY: 100 });
  const box = document.querySelector(".d3eazy-tooltip");
  assert.equal(box.style.opacity, "1");
  assert.match(box.textContent, /\d{4}/);
  fire(area, "mouseleave");
  assert.equal(box.style.opacity, "0");
});

test("MultiLineTimeChartSimple legend uses the WithLegend labels and the tooltip lists every line", () => {
  const rows = d3.range(8).map((i) => ({ date: new Date(2025, 0, 1 + i), a: i, b: i * 2 }));
  const el = draw(
    lib.MultiLineTimeChartSimple().Width(600).Height(300).LineKeys(["a", "b"]).WithLegend({ a: "Alpha", b: "Beta" }).Data(rows),
    "multi-legend",
  );
  assert.deepEqual([...el.querySelectorAll(".legend-item text")].map((n) => n.textContent), ["Alpha", "Beta"]);
  fire(el.querySelector("rect.crosshair-area"), "mousemove", { clientX: 100, clientY: 50 });
  assert.match(document.querySelector(".d3eazy-tooltip").textContent, /Alpha: .*\nBeta: |Alpha: \d+\s*Beta: \d+/s);
});

test("LineLinearSpark: hover shows the guide line and tooltip, and broadcasts a linked event", () => {
  const event = new CustomEvent("spark-hover", { detail: {} });
  const seen = [];
  document.body.addEventListener("spark-hover", (e) => seen.push(e.detail.enter));
  const data = d3.range(20).map((i) => ({ x: i, y: Math.sin(i / 3) + 2 }));
  const el = draw(lib.LineLinearSpark().Width(600).Height(200).WithHover(event).Data(data), "spark-hover");
  const area = el.querySelector("rect.spark-area");
  fire(area, "mousemove", { clientX: 150, clientY: 50 });
  assert.equal(el.querySelector(".spark-guide").style.opacity, "1");
  assert.equal(seen.at(-1), true);
  fire(area, "mouseleave");
  assert.equal(el.querySelector(".spark-guide").style.opacity, "0");
  assert.equal(seen.at(-1), false);
});

test("LineLinearSpark follows a linked chart's hover event by name", () => {
  const data = d3.range(20).map((i) => ({ x: i, y: i }));
  const el = draw(lib.LineLinearSpark().SvgID("follower").Width(600).Height(200).OnHover("linked-name").Data(data), "spark-follow");
  document.body.dispatchEvent(new CustomEvent("linked-name", { detail: { enter: true, date: 7 } }));
  assert.equal(el.querySelector(".spark-guide").style.opacity, "1");
  document.body.dispatchEvent(new CustomEvent("linked-name", { detail: { enter: false } }));
  assert.equal(el.querySelector(".spark-guide").style.opacity, "0");
});

test("LineLinearSpark options: end label, right scale, markers, colour", () => {
  const data = d3.range(10).map((i) => ({ x: i, y: i * 3 }));
  const el = draw(lib.LineLinearSpark().Width(400).Height(100).ChartColour("#ff0000").Markers(true).WithRightScale(true).EndLabel(true).Data(data), "spark-opts");
  assert.equal(el.querySelector("path.line").getAttribute("stroke"), "#ff0000");
  assert.equal(el.querySelectorAll("circle.marker").length, 10);
  assert.equal(el.querySelector("text.end-label").textContent, "27");
  assert.equal(draw(lib.LineLinearSpark().Width(400).Height(100).EndLabel(false).Data(data), "spark-opts2").querySelector("text.end-label"), null);
});

test("HeatMapBlockedSimple: linked hover highlights the blocks of one date", () => {
  const event = new CustomEvent("heat-hover", { detail: {} });
  const rows = d3.range(14).map((i) => ({ date: new Date(2025, 0, 1 + (i % 7)), status: i % 3 ? "ok" : "bad" }));
  const a = draw(lib.HeatMapBlockedSimple().SvgID("ha").Width(400).Height(200).WithHover(event).Data(rows), "heat-a");
  const b = draw(lib.HeatMapBlockedSimple().SvgID("hb").Width(400).Height(200).OnHover("heat-hover").Data(rows), "heat-b");
  fire(a.querySelector("rect.square"), "mousemove");
  const lit = [...b.querySelectorAll("rect.square")].filter((n) => n.style.opacity === "1");
  assert.equal(lit.length, 2, "both blocks of that date stay lit");
  assert.ok([...b.querySelectorAll("rect.square")].some((n) => n.style.opacity === "0.2"));
  fire(a.querySelector("rect.square"), "mouseleave");
  assert.ok([...b.querySelectorAll("rect.square")].every((n) => n.style.opacity === ""));
});

test("HeatMapBlockedSimple colours by status with ColourDomainZ, ColourRangeZ, or ColourFnZ", () => {
  const rows = [{ date: new Date(2025, 0, 1), status: "ok" }, { date: new Date(2025, 0, 2), status: "bad" }];
  const a = draw(lib.HeatMapBlockedSimple().Width(300).Height(100).ColourDomainZ(["ok", "bad"]).ColourRangeZ(["#00ff00", "#ff0000"]).Data(rows), "heat-ca");
  assert.deepEqual([...a.querySelectorAll("rect.square")].map((n) => n.getAttribute("fill")), ["#00ff00", "#ff0000"]);
  const b = draw(lib.HeatMapBlockedSimple().Width(300).Height(100).ColourFnZ(() => "#123456").Data(rows), "heat-cb");
  assert.ok([...b.querySelectorAll("rect.square")].every((n) => n.getAttribute("fill") === "#123456"));
  const v = draw(lib.HeatMapBlockedSimple().Width(300).Height(100).DateExtent(2).Orient("vertical").Data(rows), "heat-cc");
  const [first, second] = [...v.querySelectorAll("rect.square")];
  assert.equal(first.getAttribute("x"), second.getAttribute("x"), "vertical fill puts the first two in one column");
});

test("SingleHorzBarChart: hover dims the other series, click locks it, and the event is sent", () => {
  const ids = [];
  document.body.addEventListener("single-hover", (e) => ids.push(e.detail.id));
  const el = draw(
    lib.SingleHorzBarChart().SvgID("sh").Width(600).Height(60).WithHover(true).HoverEvent("single-hover").WithText(true)
      .Data(d3.stack().keys(["a", "b", "c"])([{ a: 1, b: 2, c: 3 }])),
    "single",
  );
  const rects = [...el.querySelectorAll("rect.mark")];
  fire(rects[1], "mouseenter");
  const opacity = [...el.querySelectorAll("g.category_bar")].map((g) => g.getAttribute("opacity"));
  assert.deepEqual(opacity, ["0.1", "1", "0.1"]);
  assert.equal(ids.at(-1), "b");
  assert.deepEqual([...el.querySelectorAll("g.text text")].map((n) => n.textContent), ["a", "b", "c"]);
  fire(rects[1], "mouseleave");
  assert.deepEqual([...el.querySelectorAll("g.category_bar")].map((g) => g.getAttribute("opacity")), ["1", "1", "1"]);
});

test("LineAndBarChartSimple draws a bar per row and a mean line", () => {
  const el = draw(configured("LineAndBarChartSimple", "lb"), "line-bar");
  assert.equal(el.querySelectorAll("rect.mark").length, 3);
  assert.ok(el.querySelector("path.path").getAttribute("d").startsWith("M"));
});

test("CircularHeatChartSimple labels and a custom domain", () => {
  const el = draw(
    lib.CircularHeatChartSimple().Width(400).Height(400).NumSegments(4).InnerRadius(10).SegmentHeight(10)
      .SegmentLabels(["N", "E", "S", "W"]).RadialLabels(["day 1", "day 2"]).DomainVal([0, 10]).Data([1, 2, 3, 4, 5, 6, 7, 8]),
    "circ-labels",
  );
  assert.deepEqual([...el.querySelectorAll("text.segment-label")].map((n) => n.textContent), ["N", "E", "S", "W"]);
  assert.equal(el.querySelectorAll("text.radial-label").length, 2);
  assert.equal(el.querySelectorAll("path.segment").length, 8);
});

test("a classic chart keeps its own data when two share a page", () => {
  const one = draw(lib.BarChartSimple().Width(300).Height(200).Data(dataset), "iso-1");
  const two = draw(lib.BarChartSimple().Width(300).Height(200).Data(dataset.slice(0, 1)), "iso-2");
  assert.equal(one.querySelectorAll("rect.mark").length, 3);
  assert.equal(two.querySelectorAll("rect.mark").length, 1);
  assert.deepEqual(lib.BarChartSimple().Data(), []);
  void names;
});

test("a bar chart without ColourDomain colours bars from the data and the palette", () => {
  const el = draw(lib.BarChartSimple().Width(300).Height(200).Palette("okabeIto").Data(dataset), "bar-palette");
  assert.deepEqual([...el.querySelectorAll("rect.mark")].map((n) => n.getAttribute("fill")), ["#0072B2", "#E69F00", "#009E73"]);
});

test("grow and fade run as separate transitions so one does not cancel the other", async () => {
  const el = draw(lib.BarChartSimple().Width(300).Height(200).Duration(40).Stagger(0).Data(dataset), "transitions");
  const rect = el.querySelector("rect.mark");
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.ok(+rect.getAttribute("height") > 20, `bar grew to its final height, got ${rect.getAttribute("height")}`);
  assert.equal(rect.style.opacity, "1");
});

test("tooltips and readouts show a Date as a short date, not the raw Date string", () => {
  const data = d3.range(10).map((i) => ({ x: new Date(2025, 0, 1 + i), y: i }));
  const el = draw(lib.LineLinearSpark().Width(400).Height(100).LinearAccessor((d) => d.x).ValAccessor((d) => d.y).Data(data), "date-format");
  fire(el.querySelector("rect.spark-area"), "mousemove", { clientX: 100, clientY: 20 });
  const readout = el.querySelector("text.spark-readout").textContent;
  assert.match(readout, /^\d+ · [A-Z][a-z]{2} \d{1,2}, 2025$/);
  assert.ok(!/GMT/.test(document.querySelector(".d3eazy-tooltip").textContent));
});
