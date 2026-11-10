// A valid configuration and the expected number of ".mark" elements for each extra chart.
import * as d3 from "d3";

const days = d3.range(12).map((i) => new Date(2025, 0, 1 + i * 3));
const series = days.flatMap((t, i) => [
  { x: t, y: i * 2, s: "a" },
  { x: t, y: 20 - i, s: "b" },
]);
const stackRows = days.map((t, i) => ({ x: t, a: i + 1, b: 12 - i, c: 3 }));
const bars = [
  { name: "Q1", a: 3, b: 4 },
  { name: "Q2", a: 5, b: 2 },
  { name: "Q3", a: 1, b: 6 },
];
const tree = {
  name: "root",
  children: [
    { name: "A", children: [{ name: "a1", value: 5 }, { name: "a2", value: 3 }] },
    { name: "B", children: [{ name: "b1", value: 8 }] },
  ],
};
const net = {
  nodes: [{ id: "x", group: 1 }, { id: "y", group: 1 }, { id: "z", group: 2 }],
  links: [{ source: "x", target: "y" }, { source: "y", target: "z" }],
};
const flow = {
  nodes: [{ name: "A" }, { name: "B" }, { name: "C" }],
  links: [{ source: "A", target: "B", value: 3 }, { source: "A", target: "C", value: 2 }],
};
const cal = d3.range(30).map((i) => ({ date: new Date(2025, 0, 1 + i), value: i % 7 }));
const named = [{ name: "a", value: 3 }, { name: "b", value: -2 }, { name: "c", value: 4 }];
const box = d3.range(40).map((i) => ({ group: i % 2 ? "x" : "y", value: (i % 2 ? 10 : 20) + (i % 7) }));

export const moreConfigs = {
  LineChartSimple: [(c) => c.Series((d) => d.s).Data(series), 2],
  AreaChartSimple: [(c) => c.Series((d) => d.s).Data(series), 2],
  StepLineChartSimple: [(c) => c.Data(series.filter((d) => d.s === "a")), 1],
  StackedAreaChartSimple: [(c) => c.Keys(["a", "b", "c"]).Data(stackRows), 3],
  StreamGraphSimple: [(c) => c.Keys(["a", "b", "c"]).Data(stackRows), 3],
  StackedBarChartSimple: [(c) => c.Keys(["a", "b"]).Data(bars), 6],
  LollipopChartSimple: [(c) => c.Data(named), 3],
  DumbbellChartSimple: [(c) => c.Data([{ name: "a", from: 1, to: 4 }, { name: "b", from: 2, to: 3 }]), 2],
  SlopeChartSimple: [(c) => c.Data([{ name: "a", from: 1, to: 4 }, { name: "b", from: 2, to: 3 }]), 2],
  WaterfallChartSimple: [(c) => c.Data(named), 4],
  HistogramSimple: [(c) => c.Thresholds(5).Data(d3.range(50)), 5],
  ScatterPlotSimple: [(c) => c.R((d) => d.y).Group((d) => d.s).Data(series), 24],
  CandlestickChartSimple: [(c) => c.Data(days.map((t, i) => ({ date: t, open: i, close: i + 2, high: i + 3, low: i - 1 }))), 12],
  BoxPlotSimple: [(c) => c.Data(box), 2],
  PieChartSimple: [(c) => c.Data(named.map((d) => ({ ...d, value: Math.abs(d.value) }))), 3],
  FunnelChartSimple: [(c) => c.Data([{ name: "visit", value: 100 }, { name: "buy", value: 20 }]), 2],
  GaugeChartSimple: [(c) => c.Value(72), 1],
  RadarChartSimple: [(c) => c.Axes(["p", "q", "r"]).Data([{ name: "s1", p: 1, q: 2, r: 3 }, { name: "s2", p: 3, q: 1, r: 2 }]), 2],
  TreemapChartSimple: [(c) => c.Data(tree), 3],
  SunburstChartSimple: [(c) => c.Data(tree), 5],
  CirclePackChartSimple: [(c) => c.Data(tree), 5],
  TreeDiagramSimple: [(c) => c.Data(tree), 6],
  ChordDiagramSimple: [(c) => c.Names(["a", "b"]).Data([[1, 2], [3, 1]]), 2],
  ForceNetworkSimple: [(c) => c.Data(net), 3],
  SankeyDiagramSimple: [(c) => c.Data(flow), 3],
  CalendarHeatmapSimple: [(c) => c.Data(cal), 30],
  HeatGridChartSimple: [(c) => c.Data([{ x: "a", y: "p", value: 1 }, { x: "b", y: "p", value: 2 }, { x: "a", y: "q", value: 3 }]), 3],
  ParallelCoordinatesSimple: [(c) => c.Dimensions(["u", "v"]).Group((d) => d.g).Data([{ u: 1, v: 2, g: "a" }, { u: 2, v: 1, g: "b" }]), 2],
};
