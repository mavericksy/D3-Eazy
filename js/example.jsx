import * as d3 from "d3";
import { BarChartSimple, GroupedBarChartSimple } from "../charts.js";
import { ready } from "../events.js";

ready(function () {
  //
  var dataset = [
    { name: "JS", value: 32, nice: 16 },
    { name: "GO", value: 301, nice: 202 },
    { name: "C", value: 182, nice: 120 },
    { name: "Rust", value: 71, nice: 10 },
    { name: "Zig", value: 101, nice: 60 },
    { name: "Common Lisp", value: 400, nice: 350 },
  ];
  //
  var max = d3.max(dataset, (d) => d.value);
  var domain = d3.sort(dataset, (d) => -d.value).map((d) => d.name);
  //
  const elone = "barChartSimpleOne";
  const rect = document.getElementById(elone).getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  console.log("BARONE", width, height, rect);
  //
  var TheBarOne = BarChartSimple()
    .SvgID("thebarone")
    .Val(function (a) {
      return a.value;
    })
    .Band(function (a) {
      return a.name;
    })
    .Orient("vertical")
    .DomainBand(domain)
    .DomainVal([0, max])
    .ColourDomain(domain)
    .ColourRange(d3.schemeTableau10)
    .Width(width)
    .Height(height)
    .MarginTop(0)
    .MarginBottom(0)
    .MarginLeft(80)
    .MarginRight(0)
    .CornerRadiusX(2)
    .Data(dataset);
  //.DataMax((d) => d.value)
  //.DataDomain((d) => d.key)
  //.DataSort((d) => -d.value)
  //
  d3.select("#" + elone).call(TheBarOne);
  //
  //
  var eltwo = "barChartSimpleTwo";
  const recttwo = document.getElementById(eltwo).getBoundingClientRect();
  const widthtwo = recttwo.width;
  const heighttwo = recttwo.height;

  var TheBarTwo = BarChartSimple()
    .SvgID("thebartwo")
    .Val(function (a) {
      return a.value;
    })
    .Band(function (a) {
      return a.name;
    })
    .Orient("horizontal")
    .DomainBand(domain)
    .DomainVal([0, max])
    .ColourDomain(domain)
    .ColourRange(d3.schemeTableau10)
    .Width(widthtwo)
    .Height(heighttwo)
    .MarginTop(0)
    .MarginBottom(0)
    .MarginLeft(80)
    .MarginRight(0)
    .CornerRadiusX(2)
    .Data(dataset);
  //
  d3.select("#" + eltwo).call(TheBarTwo);
  //
  //
  const elGroupedBar = "groupedBarChartSimple";
  const groupedOne = document
    .getElementById(elGroupedBar)
    .getBoundingClientRect();
  const widthGrouped = groupedOne.width;
  const heightGrouped = groupedOne.height;
  //
  console.log(widthGrouped, heightGrouped);
  //
  const domainGrouped = d3.sort(dataset, (d) => -d.value).map((d) => d.name);
  const maxGrouped = d3.max(dataset, (d) => d.value);
  //
  var TheGroupedBarOne = GroupedBarChartSimple()
    .SvgID("groupedBarOne")
    .Band(domainGrouped)
    .Subgroup(["value", "nice"])
    .DomainVal([0, maxGrouped])
    .Width(widthGrouped)
    .Height(heightGrouped)
    .MarginTop(40)
    .MarginBottom(0)
    .MarginLeft(80)
    .MarginRight(0)
    .ColourDomain(domainGrouped)
    .WithText(true)
    .Data(dataset);
  //
  d3.select("#" + elGroupedBar).call(TheGroupedBarOne);
  //
  //
});
