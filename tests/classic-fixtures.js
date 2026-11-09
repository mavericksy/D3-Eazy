// A valid configuration for each of the ten classic charts. Each returns a configured chart.
import * as d3 from "d3";

export const dataset = [
  { name: "JS", value: 52, nice: 46 },
  { name: "GO", value: 301, nice: 202 },
  { name: "C", value: 182, nice: 120 },
];
export const names = dataset.map((d) => d.name);
const ramp = d3.range(20).map((i) => ({ i, r: Math.sin(i / 3) + 2 }));
const days = d3.range(10).map((i) => ({ t: new Date(2024, 0, 1 + i), v: i * 2 }));

// One valid configuration per chart. Each returns a configured chart.
export const classicConfigs = {
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

