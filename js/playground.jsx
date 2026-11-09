// A chart with many controls. Every control calls one setter on the live chart.
import * as d3 from "d3";
import { LineChartSimple, palettes, themes } from "../d3-eazy.js";

const days = d3.range(48).map((i) => new Date(2025, 0, 1 + i));
const rand = d3.randomLcg(7);
const wave = (k, shift) => (i) => Math.round(2000 + i * 25 * k + 600 * Math.sin(i / 5 + shift) + rand() * 200);
const data = days.flatMap((day, i) => [
  { day, users: wave(1, 0)(i), team: "north" },
  { day, users: wave(0.6, 2)(i), team: "south" },
  { day, users: wave(0.3, 4)(i), team: "east" },
]);

const curves = { linear: d3.curveLinear, smooth: d3.curveMonotoneX, step: d3.curveStepAfter, catmull: d3.curveCatmullRom, basis: d3.curveBasis };

// Each control: label, kind, options, and how it changes the chart.
const controls = [
  { label: "Theme", options: Object.keys(themes).concat("auto"), set: (c, v) => c.Theme(v), start: "light" },
  { label: "Palette", options: ["(theme)"].concat(Object.keys(palettes)), set: (c, v) => c.Palette(v === "(theme)" ? null : v) },
  { label: "Curve", options: Object.keys(curves), set: (c, v) => c.Curve(curves[v]) },
  { label: "Grid", options: ["none", "x", "y", "both"], set: (c, v) => c.Grid(v), start: "y" },
  { label: "Legend", options: ["top-right", "top-left", "bottom-right", "bottom-left", "none"], set: (c, v) => c.Legend(v) },
  { label: "Legend layout", options: ["vertical", "horizontal"], set: (c, v) => c.LegendOrient(v) },
  { label: "Y scale", options: ["linear", "sqrt", "symlog"], set: (c, v) => c.YScale(v) },
  { label: "Value format", options: ["(none)", ",.0f", ".2s", "$,.0f"], set: (c, v) => c.YFormat(v === "(none)" ? null : v) },
  { label: "Locale", options: ["en-US", "en-GB", "de-DE", "fr-FR", "nb-NO"], set: (c, v) => c.Locale(v) },
  { label: "Tooltip", options: ["custom", "native", "none"], set: (c, v) => c.Tooltip(v) },
  { label: "Points", kind: "check", set: (c, v) => c.Points(v) },
  { label: "Trendline", kind: "check", set: (c, v) => c.Trendline(v) },
  { label: "Heading", kind: "check", set: (c, v) => c.ShowTitle(v).Subtitle(v ? "Daily users per team" : "").Caption(v ? "Source: demo data" : "") },
  { label: "Axis labels", kind: "check", set: (c, v) => c.XLabel(v ? "Day" : "").YLabel(v ? "Users" : "") },
  { label: "Target line", kind: "check", set: (c, v) => c.RefLines(v ? [{ axis: "y", value: 3000, label: "target", colour: "#d1495b" }] : []) },
  { label: "Annotation", kind: "check", set: (c, v) => c.Annotations(v ? [{ x: days[30], y: 3300, text: "launch", dx: -30, dy: -30 }] : []) },
  { label: "Hover highlight", kind: "check", set: (c, v) => c.HoverHighlight(v) },
  { label: "Animate", kind: "check", start: true, set: (c, v) => c.Animate(v) },
];

export function renderPlayground(root, onTheme) {
  const card = d3.select(root).append("section").attr("class", "card wide");
  card.append("h2").text("Playground");
  card.append("p").text("Every control below is one setter call on a live LineChartSimple. Hover the lines, click a legend item to hide a series.");
  const form = card.append("div").attr("class", "knobs");
  const target = card.append("div").attr("class", "chart tall");
  const { width, height } = target.node().getBoundingClientRect();
  const chart = LineChartSimple().SvgID("playground").Title("Daily users per team").Width(width).Height(height)
    .X((d) => d.day).Y((d) => d.users).Series((d) => d.team).Grid("y").MarginLeft(56).Curve(curves.smooth).Data(data);
  target.call(chart);
  for (const control of controls) {
    const label = form.append("label").attr("class", "knob").text(control.label + " ");
    if (control.kind === "check") {
      const box = label.append("input").attr("type", "checkbox").property("checked", !!control.start);
      box.on("change", () => control.set(chart, box.property("checked")));
    } else {
      const select = label.append("select");
      select.selectAll("option").data(control.options).join("option").attr("value", (d) => d).text((d) => d);
      if (control.start) select.property("value", control.start);
      select.on("change", () => {
        control.set(chart, select.property("value"));
        if (control.label === "Theme") onTheme(select.property("value"));
      });
    }
  }
  const details = card.append("details");
  details.append("summary").text("Show code");
  details.append("pre").append("code").text(
`LineChartSimple()
  .X((d) => d.day).Y((d) => d.users).Series((d) => d.team)
  .Theme("dark").Palette("okabeIto").Grid("y").Legend("bottom-left")
  .Curve(d3.curveMonotoneX).YFormat(",.0f").Locale("de-DE")
  .Points(true).Trendline(true)
  .Title("Daily users per team").ShowTitle(true).Subtitle("Daily users per team")
  .XLabel("Day").YLabel("Users")
  .RefLines([{ axis: "y", value: 3000, label: "target" }])
  .Annotations([{ x: new Date(2025, 1, 1), y: 3300, text: "launch" }])
  .HoverHighlight(true).Tooltip("custom")
  .Data(data);`);
  return chart;
}
