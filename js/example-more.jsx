// Demo cards for the extra charts in charts-more.js. Same format as js/example.jsx.
import * as d3 from "d3";
import {
  LineChartSimple, AreaChartSimple, StepLineChartSimple, StackedAreaChartSimple, StreamGraphSimple,
  StackedBarChartSimple, LollipopChartSimple, DumbbellChartSimple, SlopeChartSimple, WaterfallChartSimple,
  HistogramSimple, ScatterPlotSimple, CandlestickChartSimple, BoxPlotSimple, PieChartSimple, FunnelChartSimple,
  GaugeChartSimple, RadarChartSimple, TreemapChartSimple, SunburstChartSimple, CirclePackChartSimple,
  TreeDiagramSimple, ChordDiagramSimple, ForceNetworkSimple, SankeyDiagramSimple, CalendarHeatmapSimple,
  HeatGridChartSimple, ParallelCoordinatesSimple,
} from "../d3-eazy.js";

// Seeded random numbers, so the page looks the same on every load.
const random = d3.randomLcg(42);
const normal = d3.randomNormal.source(random)(0, 1);

const days = d3.range(60).map((i) => new Date(2025, 0, 1 + i));
const trend = (i, k) => Math.round(50 + i * k + 12 * Math.sin(i / 5 + k));
const timeSeries = days.flatMap((day, i) => [
  { day, value: trend(i, 1), team: "north" },
  { day, value: trend(i, 0.5), team: "south" },
]);
const stackRows = days.map((day, i) => ({ day, web: trend(i, 0.6), mobile: trend(i, 0.3), api: trend(i, 0.1) }));
const quarters = [
  { name: "Q1", web: 30, mobile: 20, api: 10 },
  { name: "Q2", web: 40, mobile: 25, api: 15 },
  { name: "Q3", web: 35, mobile: 40, api: 20 },
  { name: "Q4", web: 50, mobile: 45, api: 25 },
];
const sales = [
  { name: "JS", value: 52 }, { name: "Go", value: 301 }, { name: "C", value: 182 },
  { name: "Rust", value: 31 }, { name: "Zig", value: 101 },
];
const tree = {
  name: "company",
  children: [
    { name: "Eng", children: [{ name: "Web", value: 40 }, { name: "Data", value: 25 }, { name: "Infra", value: 18 }] },
    { name: "Sales", children: [{ name: "EMEA", value: 30 }, { name: "AMER", value: 45 }] },
    { name: "Ops", children: [{ name: "Support", value: 22 }, { name: "Finance", value: 12 }] },
  ],
};
const set = (chart, { width, height }) => chart.Width(width).Height(height);

export const moreExamples = [
  { title: "Line chart (several series)", blurb: "Series splits one data array into a line per team. Scroll to zoom, drag to pan, double-click to reset. Hover for the crosshair.",
    make(el, s) {
      return set(LineChartSimple(), s).SvgID("line").Title("Value per team over time")
        .X((d) => d.day).Y((d) => d.value).Series((d) => d.team).Points(false).Zoom(true).Crosshair(true).Data(timeSeries);
    },
    actions: { "Show points": (c) => c.Points(true), "Smooth": (c) => c.Curve(d3.curveCatmullRom) } },
  { title: "Area chart", blurb: "Same setters as the line chart, with the area filled.",
    make(el, s) {
      return set(AreaChartSimple(), s).SvgID("area").Title("Value per team over time")
        .X((d) => d.day).Y((d) => d.value).Series((d) => d.team).Curve(d3.curveMonotoneX).Data(timeSeries);
    } },
  { title: "Step line", blurb: "A line that holds each value until the next point.",
    make(el, s) {
      return set(StepLineChartSimple(), s).SvgID("step").Title("Steps")
        .X((d) => d.day).Y((d) => d.value).Data(timeSeries.filter((d) => d.team === "north"));
    } },
  { title: "Stacked area", blurb: "Keys lists the fields to stack. Offset changes the baseline.",
    make(el, s) {
      return set(StackedAreaChartSimple(), s).SvgID("stacked-area").Title("Traffic by channel")
        .X((d) => d.day).Keys(["web", "mobile", "api"]).Curve(d3.curveMonotoneX).Data(stackRows);
    },
    actions: { "Normalise to 100%": (c) => c.Offset(d3.stackOffsetExpand), "Stack": (c) => c.Offset(d3.stackOffsetNone) } },
  { title: "Stream graph", blurb: "A stacked area centred on a wiggling baseline.",
    make(el, s) {
      return set(StreamGraphSimple(), s).SvgID("stream").Title("Traffic by channel, stream graph")
        .X((d) => d.day).Keys(["web", "mobile", "api"]).Data(stackRows);
    } },
  { title: "Stacked bar chart", blurb: "Normalize(true) turns every bar into a share of 100%.",
    make(el, s) {
      return set(StackedBarChartSimple(), s).SvgID("stacked-bar").Title("Revenue by product and quarter")
        .Band((d) => d.name).Keys(["web", "mobile", "api"]).Data(quarters);
    },
    actions: { "Share of 100%": (c) => c.Normalize(true), "Absolute": (c) => c.Normalize(false), "Flip": (c) => c.Orient(c.Orient() === "vertical" ? "horizontal" : "vertical") } },
  { title: "Lollipop chart", blurb: "A bar chart drawn with a stem and a dot.",
    make(el, s) {
      return set(LollipopChartSimple(), s).SvgID("lollipop").Title("Score per language").Data(sales);
    },
    actions: { "Flip": (c) => c.Orient(c.Orient() === "vertical" ? "horizontal" : "vertical") } },
  { title: "Dumbbell chart", blurb: "The change between two values for each category.",
    make(el, s) {
      return set(DumbbellChartSimple(), s).SvgID("dumbbell").Title("Score before and after")
        .Data(sales.map((d) => ({ name: d.name, from: d.value, to: Math.round(d.value * (0.6 + random())) })));
    } },
  { title: "Slope chart", blurb: "How each item moves between two points in time.",
    make(el, s) {
      return set(SlopeChartSimple(), s).SvgID("slope").Title("Rank change")
        .FromLabel("2024").ToLabel("2025").MarginLeft(20).MarginRight(20)
        .Data([{ name: "Go", from: 40, to: 62 }, { name: "Rust", from: 22, to: 55 }, { name: "C", from: 60, to: 51 }, { name: "JS", from: 70, to: 48 }]);
    } },
  { title: "Waterfall chart", blurb: "Positive and negative steps build up a running total.",
    make(el, s) {
      return set(WaterfallChartSimple(), s).SvgID("waterfall").Title("Profit build-up")
        .Data([{ name: "Sales", value: 120 }, { name: "Refunds", value: -20 }, { name: "Costs", value: -55 }, { name: "Grants", value: 15 }]);
    } },
  { title: "Histogram", blurb: "Thresholds is a bin count or a list of bin edges.",
    make(el, s) {
      return set(HistogramSimple(), s).SvgID("hist").Title("Distribution of 400 normal draws").Data(d3.range(400).map(normal));
    },
    actions: { "5 bins": (c) => c.Thresholds(5), "20 bins": (c) => c.Thresholds(20) } },
  { title: "Scatter and bubble", blurb: "R as a number gives fixed dots. R as a function sizes each dot. Group colours them. Scroll to zoom both axes, drag to pan, double-click to reset.",
    make(el, s) {
      return set(ScatterPlotSimple(), s).SvgID("scatter").Title("Height against weight by group")
        .Group((d) => d.group).R((d) => d.size).Zoom(true)
        .Data(d3.range(60).map((i) => ({ x: 20 + i, y: 30 + i * 0.8 + normal() * 6, size: 1 + random() * 10, group: ["a", "b", "c"][i % 3] })));
    },
    actions: { "Fixed size": (c) => c.R(5), "Trendline": (c) => c.Trendline(!c.Trendline()) } },
  { title: "Scatter, 100,000 points (canvas)", blurb: "Above CanvasOver points (20,000 by default) the chart draws on a canvas. Hover finds the nearest point. Zoom, pan and the legend work as usual.",
    make(el, s) {
      const groups = ["north", "south", "east"];
      return set(ScatterPlotSimple(), s).SvgID("scatter-canvas").Title("100,000 points in three clusters")
        .Group((d) => d.group).R(1.6).Opacity(0.35).Zoom(true).Trendline(true)
        .Data(d3.range(100000).map((i) => {
          const k = i % 3;
          return { x: normal() * 12 + [20, 50, 75][k], y: normal() * 10 + [60, 30, 55][k] + normal() * 3, group: groups[k] };
        }));
    },
    actions: { "Force SVG (slow)": (c) => c.Renderer("svg"), "Canvas": (c) => c.Renderer("canvas") } },
  { title: "Candlestick", blurb: "Open, high, low and close per day. Green is up, red is down.",
    make(el, s) {
      let price = 100;
      return set(CandlestickChartSimple(), s).SvgID("candles").Title("Price per day")
        .Data(days.slice(0, 30).map((date) => { const open = price; price += normal() * 3; return { date, open, close: price, high: Math.max(open, price) + random() * 2, low: Math.min(open, price) - random() * 2 }; }));
    } },
  { title: "Box plot", blurb: "Median, quartiles, whiskers and outliers per group.",
    make(el, s) {
      return set(BoxPlotSimple(), s).SvgID("box").Title("Spread per group")
        .Data(d3.range(150).map((i) => ({ group: ["north", "south", "east"][i % 3], value: 50 + (i % 3) * 10 + normal() * 8 })));
    },
    actions: { "Flip": (c) => c.Orient(c.Orient() === "vertical" ? "horizontal" : "vertical") } },
  { title: "Pie and donut", blurb: "InnerRadius is a fraction of the radius.",
    make(el, s) {
      return set(PieChartSimple(), s).SvgID("pie").Title("Share per language").Data(sales);
    },
    actions: { "Donut": (c) => c.InnerRadius(0.6), "Pie": (c) => c.InnerRadius(0) } },
  { title: "Funnel", blurb: "Stages from widest to narrowest.",
    make(el, s) {
      return set(FunnelChartSimple(), s).SvgID("funnel").Title("Sign-up funnel")
        .Data([{ name: "Visit", value: 1000 }, { name: "Sign up", value: 420 }, { name: "Trial", value: 210 }, { name: "Paid", value: 64 }]);
    } },
  { title: "Gauge", blurb: "One value on a half circle. Thresholds sets the colour bands.",
    make(el, s) {
      return set(GaugeChartSimple(), s).SvgID("gauge").Title("Uptime").Label("uptime %").Value(87);
    },
    actions: { "Low": (c) => c.Value(35), "Medium": (c) => c.Value(72), "High": (c) => c.Value(96) } },
  { title: "Radar chart", blurb: "Each row is one shape. Axes lists the fields to compare.",
    make(el, s) {
      return set(RadarChartSimple(), s).SvgID("radar").Title("Skills by person").Axes(["speed", "power", "range", "cost", "safety"])
        .Data([{ name: "Ann", speed: 8, power: 6, range: 7, cost: 4, safety: 9 }, { name: "Bo", speed: 5, power: 9, range: 4, cost: 7, safety: 6 }]);
    } },
  { title: "Treemap", blurb: "Area shows size. Colour shows the top-level group.",
    make(el, s) { return set(TreemapChartSimple(), s).SvgID("treemap").Title("Headcount").Data(tree); } },
  { title: "Sunburst", blurb: "The same hierarchy, drawn as rings.",
    make(el, s) { return set(SunburstChartSimple(), s).SvgID("sunburst").Title("Headcount, sunburst").Data(tree); } },
  { title: "Circle packing", blurb: "The same hierarchy, drawn as nested circles.",
    make(el, s) { return set(CirclePackChartSimple(), s).SvgID("pack").Title("Headcount, circles").Data(tree); } },
  { title: "Tree diagram", blurb: "A tidy tree of the same hierarchy.",
    make(el, s) { return set(TreeDiagramSimple(), s).SvgID("tree").Title("Organisation tree").Data(tree); } },
  { title: "Chord diagram", blurb: "Flows between a small set of groups. Data is a square matrix.",
    make(el, s) {
      return set(ChordDiagramSimple(), s).SvgID("chord").Title("Migration between regions")
        .Names(["North", "South", "East", "West"])
        .Data([[0, 12, 6, 3], [9, 0, 4, 8], [5, 7, 0, 10], [2, 6, 11, 0]]);
    } },
  { title: "Force network", blurb: "Nodes and links, laid out by a force simulation.",
    make(el, s) {
      const nodes = d3.range(24).map((i) => ({ id: `n${i}`, group: i % 4 }));
      const links = [
        ...d3.range(1, 24).map((i) => ({ source: `n${i}`, target: `n${Math.floor(i / 2)}` })),
        { source: "n5", target: "n17" }, { source: "n9", target: "n20" }, { source: "n3", target: "n12" },
      ];
      return set(ForceNetworkSimple(), s).SvgID("force").Title("Network of 24 nodes").Data({ nodes, links });
    } },
  { title: "Sankey diagram", blurb: "Flows between stages. Link width shows the amount.",
    make(el, s) {
      return set(SankeyDiagramSimple(), s).SvgID("sankey").Title("Visitors by channel and outcome").Data({
        nodes: ["Search", "Social", "Email", "Browse", "Sign up", "Leave"].map((name) => ({ name })),
        links: [
          { source: "Search", target: "Browse", value: 40 }, { source: "Social", target: "Browse", value: 25 },
          { source: "Email", target: "Browse", value: 15 }, { source: "Browse", target: "Sign up", value: 30 },
          { source: "Browse", target: "Leave", value: 50 },
        ],
      });
    } },
  { title: "Calendar heat map", blurb: "One square per day, one column per week.",
    make(el, s) {
      return set(CalendarHeatmapSimple(), s).SvgID("calendar").Title("Commits per day").MarginLeft(34)
        .Data(d3.range(150).map((i) => ({ date: new Date(2025, 0, 1 + i), value: Math.max(0, Math.round(3 + normal() * 3)) })));
    } },
  { title: "Heat grid", blurb: "A heat map on two categorical axes. ShowValues prints each number.",
    make(el, s) {
      const hours = ["Mon", "Tue", "Wed", "Thu", "Fri"], slots = ["AM", "Noon", "PM"];
      return set(HeatGridChartSimple(), s).SvgID("grid").Title("Visits by day and time")
        .Data(hours.flatMap((x) => slots.map((y) => ({ x, y, value: Math.round(random() * 100) }))));
    },
    actions: { "Show values": (c) => c.ShowValues(true), "Hide values": (c) => c.ShowValues(false) } },
  { title: "Parallel coordinates", blurb: "One line per row across several numeric fields.",
    make(el, s) {
      return set(ParallelCoordinatesSimple(), s).SvgID("parallel").Title("Cars compared on four measures")
        .Dimensions(["power", "weight", "economy", "price"]).Group((d) => d.kind)
        .Data(d3.range(40).map((i) => ({ kind: ["small", "family", "sport"][i % 3], power: 60 + (i % 3) * 50 + normal() * 10, weight: 900 + (i % 3) * 300 + normal() * 80, economy: 40 - (i % 3) * 8 + normal() * 3, price: 15 + (i % 3) * 14 + normal() * 3 })));
    } },
];
