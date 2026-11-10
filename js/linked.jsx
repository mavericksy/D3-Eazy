// Three charts that follow each other. Each one sends hover on one shared event and listens to it.
import * as d3 from "d3";
import { HeatMapBlockedSimple, LineLinearSpark } from "../d3-eazy.js";

const random = d3.randomLcg(11);
const days = d3.range(84).map((i) => {
  const date = new Date(2025, 0, 1 + i);
  const load = Math.round(40 + 25 * Math.sin(i / 6) + random() * 20);
  return { date, load, errors: Math.round(random() * 8 + (load > 70 ? 6 : 0)), status: load > 70 ? "busy" : load > 45 ? "ok" : "quiet" };
});

export function renderLinked(root) {
  const card = d3.select(root).append("section").attr("class", "card wide");
  card.append("h2").text("Linked charts");
  card.append("p").text("Move the pointer over any of the three charts. The other two show the same day. They share one event: WithHover(event) sends it and the same event makes them listen.");
  const heat = card.append("div").attr("class", "chart").style("height", "150px");
  const loadChart = card.append("div").attr("class", "chart short");
  const errorChart = card.append("div").attr("class", "chart short");
  const size = (el) => el.node().getBoundingClientRect();
  const hover = new CustomEvent("day-hover", { detail: {} });

  const blocks = HeatMapBlockedSimple().SvgID("linked-heat").Title("Daily status").WithHover(hover)
    .Width(size(heat).width).Height(size(heat).height).DateExtent(7).Orient("vertical")
    .ColourDomainZ(["quiet", "ok", "busy"]).ColourRangeZ(["#9ecae1", "#4e9f50", "#d1495b"]).Data(days);
  const sparkOf = (id, title, field, colour, el) => LineLinearSpark().SvgID(id).Title(title)
    .Width(size(el).width).Height(size(el).height).MarginLeft(70).MarginRight(70).ChartColour(colour)
    .LinearAccessor((d) => d.date).ValAccessor((d) => d[field]).WithHover(hover).Curve(d3.curveMonotoneX)
    .ValueFormat(",.0f").Data(days);
  heat.call(blocks);
  loadChart.call(sparkOf("linked-load", "Load per day", "load", "#4e79a7", loadChart));
  errorChart.call(sparkOf("linked-errors", "Errors per day", "errors", "#d1495b", errorChart));
  const details = card.append("details");
  details.append("summary").text("Show code");
  details.append("pre").append("code").text(`const hover = new CustomEvent("day-hover", { detail: {} });

HeatMapBlockedSimple().WithHover(hover).DateExtent(7).Orient("vertical").Data(days);
LineLinearSpark().LinearAccessor((d) => d.date).ValAccessor((d) => d.load).WithHover(hover).Data(days);
LineLinearSpark().LinearAccessor((d) => d.date).ValAccessor((d) => d.errors).WithHover(hover).Data(days);

// To only listen, without sending: .OnHover("day-hover")`);
}
