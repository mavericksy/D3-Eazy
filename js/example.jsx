import * as d3 from "d3";
import * as luxon from "luxon";
import {
  BarChartSimple,
  GroupedBarChartSimple,
  DonutChartSimple,
  LineLinearSpark,
} from "../charts.js";
import { ready } from "../events.js";

ready(function () {
  //
  const dashBoardID = "showcaseall";
  //
  var dataset = [
    { name: "JS", value: 52, nice: 46 },
    { name: "GO", value: 301, nice: 202 },
    { name: "C", value: 182, nice: 120 },
    { name: "Rust", value: 31, nice: 10 },
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
    .MarginTop(5)
    .MarginBottom(15)
    .MarginLeft(80)
    .MarginRight(5)
    .CornerRadiusX(2)
    .Data(dataset);
  // TODO think about dataset stats functions
  //.DataMax((d) => d.value)
  //.DataDomain((d) => d.key)
  //.DataSort((d) => -d.value)
  //
  d3.select("#" + elone).call(TheBarOne);
  //
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
    .Data(dataset);
  //
  d3.select("#" + elGroupedBar).call(TheGroupedBarOne);
 //
  //
  //
  const elGroupedBarTwo = "groupedBarChartSimpleTwo";
  const groupedTwo = document
    .getElementById(elGroupedBarTwo)
    .getBoundingClientRect();
  const widthGroupedTwo = groupedTwo.width;
  const heightGroupedTwo = groupedTwo.height;
  //
  var TheGroupedBarTwo = GroupedBarChartSimple()
    .SvgID("groupedBarTwo")
    .Orient("vertical")
    .Band(domainGrouped)
    .Subgroup(["value", "nice"])
    .DomainVal([0, maxGrouped])
    .Width(widthGroupedTwo)
    .Height(heightGroupedTwo)
    .MarginTop(40)
    .MarginBottom(0)
    .MarginLeft(80)
    .MarginRight(0)
    .ColourDomain(domainGrouped)
    .Data(dataset);
  //
  d3.select("#" + elGroupedBarTwo).call(TheGroupedBarTwo);
  //
  //
  //
  const elDonut = "donutChartSimpleOne";
  const donutOne = document.getElementById(elDonut).getBoundingClientRect();
  const widthDonut = donutOne.width;
  const heightDonut = donutOne.height;

  const domainDonut = d3.sort(dataset, (d) => -d.nice).map((d) => d.name);

  var TheDonutOne = DonutChartSimple()
    .SvgID("donutChartOne")
    .Width(widthDonut)
    .Height(heightDonut)
    .ColourRange(d3.schemeTableau10)
    .ColourDomain(domainDonut)
    .Val((a) => a.nice)
    .ValText((a)=> a.nice)
    .Key((a) => a.name)
    .Data(dataset);
  //
  d3.select("#" + elDonut).call(TheDonutOne);
  //
  //
  const elDonutTwo = "donutChartSimpleTwo";
  const donutTwo = document.getElementById(elDonutTwo).getBoundingClientRect();
  const widthDonutTwo = donutTwo.width;
  const heightDonutTwo = donutTwo.height;

  const domainDonutTwo = d3.sort(dataset, (d) => -d.value).map((d) => d.name);

  var TheDonutTwo = DonutChartSimple().
      SvgID("donutChartTwo").
      Width(widthDonutTwo).
      Height(heightDonutTwo).
      ColourRange(d3.schemeTableau10).
      ColourDomain(domainDonutTwo).
      Val((a) => a.value).
      ValText((a)=> a.value).
      Key((a) => a.name).
      Data(dataset);
  //
  d3.select("#" + elDonutTwo).call(TheDonutTwo);
  //
  //
  var rampUp = d3.randomBeta(2.55, 2.55);
  var ramp = [];
  for(let i = 0; i<150;i++){
    ramp.push({i:i, r: +rampUp().toFixed(3)});
  }
  const betaDist = d3.bin().thresholds(16).value((d)=>d.r)(ramp);
  //
  console.log(ramp, betaDist);
  //
  const elSparkOne = "sparkLineChartSimpleOne";
  const lineOne = document.getElementById(elSparkOne).getBoundingClientRect();
  const widthSparkOne = lineOne.width;
  const heightSparkOne = lineOne.height;
  //
  var updateHoverEvent = (d) => new CustomEvent(d,{detail:{date:'',value:0}});
  //
  var LineSparkOne = LineLinearSpark().
      SvgID("linesparkone").
      Width(widthSparkOne).
      Height(heightSparkOne).
      MarginLeft(25).
      MarginRight(80).
      DomainLinear([0,ramp.length-1]).
      LinearAccessor((d)=>d.i).
      DomainVal([0,d3.max(ramp,(d)=>d.r)]).
      ValAccessor((d)=>d.r).
      WithHover(updateHoverEvent("lineSparkOneHoverlinesparkone")).
      WithSubmit(true).
      Curve(d3.curveCatmullRom.alpha(0.46)).
      Data(ramp);
  //
  d3.select("#" + elSparkOne).call(LineSparkOne);
  //
  const showBeta = [];
  betaDist.reduce(function(p, c, i, arr){
    let total = c.reduce(function(p,c){p.r = p.r + 1;return p},{r:0});
    p.push({
      i: +((c["x1"] + c["x0"]) / 2).toFixed(3),
      r: total.r,
    });
    return p;
  }, showBeta);
  //
  console.log(showBeta);
  //
  const elSparkTwo = "sparkLineChartSimpleTwo";
  const lineTwo = document.getElementById(elSparkTwo).getBoundingClientRect();
  const widthSparkTwo = lineTwo.width;
  const heightSparkTwo = lineTwo.height;
  //
  var LineSparkTwo = LineLinearSpark().
      SvgID("linesparktwo").
      Width(widthSparkTwo).
      Height(heightSparkTwo).
      MarginLeft(25).
      MarginRight(80).
      DomainLinear([0,1]).
      LinearAccessor((d)=>d.i).
      DomainVal([0,d3.max(showBeta,(d)=>d.r)]).
      ValAccessor((d)=>d.r).
      WithHover(updateHoverEvent("lineSparkTwoHoverlinesparktwo")).
      WithSubmit(true).
      Curve(d3.curveCatmullRom.alpha(0.46)).
      Data(showBeta);
  //
  d3.select("#" + elSparkTwo).call(LineSparkTwo);
  //
  //
  var rampUpG = d3.randomGamma(2, 1);
  var rampG = [];
  for(let i = 0; i<150;i++){
    rampG.push({i:i, r: +rampUpG().toFixed(3)});
  }
  const gammaDist = d3.bin().thresholds(16).value((d)=>d.r)(rampG);
  //
  console.log(rampG, gammaDist);
  //
  const elSparkThree = "sparkLineChartSimpleThree";
  const lineThree = document.getElementById(elSparkThree).getBoundingClientRect();
  const widthSparkThree = lineThree.width;
  const heightSparkThree = lineThree.height;
  //
  var LineSparkThree = LineLinearSpark().
      SvgID("linesparkthree").
      Width(widthSparkThree).
      Height(heightSparkThree).
      MarginLeft(25).
      MarginRight(80).
      DomainLinear([0,ramp.length - 1]).
      LinearAccessor((d)=>d.i).
      DomainVal([0,d3.max(rampG,(d)=>d.r)]).
      ValAccessor((d)=>d.r).
      WithHover(updateHoverEvent("lineSparkThreeHoverlinesparkthree")).
      WithSubmit(true).
      Curve(d3.curveCatmullRom.alpha(0.46)).
      Data(rampG);
  //
  d3.select("#" + elSparkThree).call(LineSparkThree);
  //
  //
  const showGamma = [];
  gammaDist.reduce(function(p, c, i, arr){
    let total = c.reduce(function(p,c){p.r = p.r + 1;return p},{r:0});
    p.push({
      i: +((c["x1"] + c["x0"]) / 2).toFixed(3),
      r: total.r,
    });
    return p;
  }, showGamma);
  //
  console.log(showGamma);
  //
  const elSparkFour = "sparkLineChartSimpleFour";
  const lineFour = document.getElementById(elSparkFour).getBoundingClientRect();
  const widthSparkFour = lineFour.width;
  const heightSparkFour = lineFour.height;
  //
  var LineSparkFour = LineLinearSpark().
      SvgID("linesparkfour").
      Width(widthSparkFour).
      Height(heightSparkFour).
      MarginLeft(25).
      MarginRight(80).
      MarginTop(20).
      DomainLinear([0,d3.max(showGamma, (d)=>d.i)]).
      LinearAccessor((d)=>d.i).
      DomainVal([0,d3.max(showGamma,(d)=>d.r)]).
      ValAccessor((d)=>d.r).
      WithHover(updateHoverEvent("lineSparkFourHoverlinesparkfour")).
      WithSubmit(true).
      Curve(d3.curveCatmullRom.alpha(0.46)).
      Data(showGamma);
  //
  d3.select("#" + elSparkFour).call(LineSparkFour);

});
