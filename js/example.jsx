// Demo page. Build with "npm run build", then open index.html.
// Each example is a plain function. The page prints its source under the chart,
// so the code you read is the code that ran.
import * as d3 from "d3";
import {
  BarChartSimple,
  GroupedBarChartSimple,
  DonutChartSimple,
  LineLinearSpark,
  LineTimeChartSimple,
  MultiLineTimeChartSimple,
  HeatMapBlockedSimple,
  CircularHeatChartSimple,
  ready,
} from "../d3-eazy.js";
import { moreExamples } from "./example-more.jsx";

// Shared sample data.
const languages = [
  { name: "JS", value: 52, nice: 46 },
  { name: "GO", value: 301, nice: 202 },
  { name: "C", value: 182, nice: 120 },
  { name: "Rust", value: 31, nice: 10 },
  { name: "Zig", value: 101, nice: 60 },
  { name: "Common Lisp", value: 400, nice: 350 },
];
const names = languages.map((d) => d.name);
const randomise = () =>
  languages.map((d) => ({ ...d, value: Math.round(Math.random() * 400) }));

const examples = [
  {
    title: "Bar chart",
    blurb:
      "Band is the category, Val is the number. Orient picks the direction. Data() on a drawn chart animates the bars.",
    make(el, { width, height }) {
      return BarChartSimple()
        .SvgID("bar")
        .Title("Language scores")
        .Description("Bar chart of a score for six programming languages")
        .Band((d) => d.name)
        .Val((d) => d.value)
        .DomainBand(names)
        .DomainVal([0, 400])
        .ColourDomain(names)
        .ColourRange(d3.schemeObservable10)
        .Orient("horizontal")
        .WithText(true)
        .Width(width)
        .Height(height)
        .MarginLeft(80)
        .MarginBottom(24)
        .MarginTop(16)
        .Data(languages);
    },
    actions: {
      "New random data": (chart) => chart.Data(randomise()),
      "Flip direction": (chart) =>
        chart.Orient(chart.Orient() === "vertical" ? "horizontal" : "vertical"),
    },
  },
  {
    title: "Grouped bar chart",
    blurb: "Subgroup lists the fields to draw side by side for each band.",
    make(el, { width, height }) {
      return GroupedBarChartSimple()
        .SvgID("grouped")
        .Title("Value and nice per language")
        .Band(names)
        .Subgroup(["value", "nice"])
        .WithText(true)
        .DomainVal([0, 400])
        .ColourDomain(["value", "nice"])
        .Width(width)
        .Height(height)
        .MarginTop(30)
        .MarginLeft(80)
        .MarginBottom(24)
        .Data(languages);
    },
    actions: {
      "Flip direction": (chart) =>
        chart.Orient(chart.Orient() === "vertical" ? "horizontal" : "vertical"),
    },
  },
  {
    title: "Donut chart",
    blurb: "Key names each slice, Val sizes it, ValText labels it.",
    make(el, { width, height }) {
      return DonutChartSimple()
        .SvgID("donut")
        .Title("Share of nice per language")
        .Key((d) => d.name)
        .Val((d) => d.nice)
        .ValText((d) => d.nice)
        .ColourDomain(names)
        .ColourRange(d3.schemeTableau10)
        .Width(width)
        .Height(height)
        .Data(languages);
    },
    actions: {
      "Show value instead": (chart) =>
        chart.Val((d) => d.value).ValText((d) => d.value),
      "Show nice": (chart) => chart.Val((d) => d.nice).ValText((d) => d.nice),
    },
  },
  {
    title: "Linear line (sparkline)",
    blurb:
      "A line over a numeric x axis. Here: a histogram of 150 random Beta(2.5, 2.5) draws.",
    make(el, { width, height }) {
      const bins = d3
        .bin()
        .thresholds(16)
        .value((d) => d)(d3.range(150).map(d3.randomBeta(2.5, 2.5)));
      const points = bins.map((b) => ({ x: (b.x0 + b.x1) / 2, n: b.length }));
      return LineLinearSpark()
        .SvgID("spark")
        .Title("Beta distribution histogram")
        .Width(width)
        .Height(height)
        .MarginLeft(30)
        .MarginRight(30)
        .MarginTop(10)
        .MarginBottom(20)
        .DomainLinear([0, 1])
        .LinearAccessor((d) => d.x)
        .DomainVal([0, d3.max(points, (d) => d.n)])
        .ValAccessor((d) => d.n)
        .Curve(d3.curveCatmullRom.alpha(0.5))
        .Data(points);
    },
  },
  {
    title: "Time line",
    blurb: "One series over time. Time and Linear read the date and the value.",
    make(el, { width, height }) {
      const days = d3.range(60).map((i) => ({
        day: new Date(2025, 0, 1 + i),
        users: Math.round(100 + i * 2 + 20 * Math.sin(i / 4)),
      }));
      return LineTimeChartSimple()
        .SvgID("time")
        .Title("Daily users")
        .Width(width)
        .Height(height)
        .MarginLeft(40)
        .MarginBottom(24)
        .MarginTop(8)
        .MarginRight(12)
        .Time((d) => d.day)
        .Linear((d) => d.users)
        .DomainTime(d3.extent(days, (d) => d.day))
        .DomainLinear([0, d3.max(days, (d) => d.users)])
        .StrokeColour("steelblue")
        .Data(days);
    },
  },
  {
    title: "Multi-line time chart",
    blurb: "LineKeys lists the fields to draw as lines. Each key gets its own colour from ColourDomain.",
    make(el, { width, height }) {
      const rows = d3.range(60).map((i) => ({
        day: new Date(2025, 0, 1 + i),
        north: 50 + i + 10 * Math.sin(i / 5),
        south: 80 + i / 2 + 15 * Math.cos(i / 7),
      }));
      return MultiLineTimeChartSimple()
        .SvgID("multi")
        .Title("Sales by region")
        .Width(width)
        .Height(height)
        .MarginLeft(40)
        .MarginBottom(24)
        .MarginTop(8)
        .MarginRight(12)
        .Time((d) => d.day)
        .LineKeys(["north", "south"])
        .ColourDomain(["north", "south"])
        .DomainTime(d3.extent(rows, (d) => d.day))
        .DomainVal([0, 130])
        .Data(rows);
    },
  },
  {
    title: "Status heat map",
    blurb:
      "One block per record, coloured by its status. DateExtent is the number of rows.",
    make(el, { width, height }) {
      const checks = d3.range(7 * 12).map((i) => ({
        date: new Date(2025, 0, 1 + i),
        status: Math.random() < 0.8 ? "pass" : "fail",
      }));
      return HeatMapBlockedSimple()
        .SvgID("heat")
        .Title("Daily check results")
        .Width(width)
        .Height(height)
        .DateAccessor((d) => d.date)
        .DateExtent(7)
        .ColourDomainZ(["pass", "fail"])
        .ColourRangeZ(["#4e9f50", "#d1495b"])
        .Data(checks);
    },
    actions: {
      "New random results": (chart) =>
        chart.Data(
          chart.Data().map((d) => ({
            ...d,
            status: Math.random() < 0.8 ? "pass" : "fail",
          })),
        ),
    },
  },
  {
    title: "Circular heat chart",
    blurb:
      "Each value is one arc. NumSegments sets arcs per ring. Rings grow outward.",
    make(el, { width, height }) {
      const size = Math.min(width, height);
      return CircularHeatChartSimple()
        .SvgID("circular")
        .Title("Load by hour over seven days")
        .Width(size)
        .Height(size)
        .InnerRadius(30)
        .SegmentHeight(14)
        .NumSegments(24)
        .ColourRange(["#fff5eb", "#d94801"])
        .Data(d3.range(24 * 7).map((i) => 50 + 40 * Math.sin(i / 3) + Math.random() * 10));
    },
    actions: {
      "48 segments": (chart) => chart.NumSegments(48),
      "24 segments": (chart) => chart.NumSegments(24),
    },
  },
];

function renderExample(example, index) {
  const card = d3.select("#examples").append("section").attr("class", "card");
  card.append("h2").text(example.title);
  card.append("p").text(example.blurb);
  const target = card.append("div").attr("class", "chart").attr("id", `chart-${index}`);
  const rect = target.node().getBoundingClientRect();
  const chart = example.make(target.node(), {
    width: rect.width,
    height: rect.height,
  });
  target.call(chart);
  //
  if (example.actions) {
    const controls = card.append("div").attr("class", "controls");
    for (const [label, run] of Object.entries(example.actions)) {
      controls.append("button").attr("type", "button").text(label).on("click", () => run(chart));
    }
  }
  const details = card.append("details");
  details.append("summary").text("Show code");
  details.append("pre").append("code").text(example.make.toString());
}

ready(() => [...examples, ...moreExamples].forEach(renderExample));
