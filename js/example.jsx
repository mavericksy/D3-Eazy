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
  // //
  /*
import { fakerEN, fakerDE, fakerZH_CN } from '@faker-js/faker';
function createRandomUser() {
  return {
    userId: fakerEN.string.uuid(),
    username: fakerEN.internet.userName(),
    email: fakerEN.internet.email(),
    avatar: fakerEN.image.avatar(),
    password: fakerEN.internet.password(),
    birthdate: fakerEN.date.birthdate(),
    registeredAt: fakerEN.date.past(),
  };
}
function createRandomTime() {
  return {
    date: fakerEN.date.past(),
    point: fakerEN.number.int(),
    value: fakerEN.string.hexadecimal(),
    color: fakerEN.color.hsl(),
  };
}

const appDiv: HTMLElement = document.querySelector('#app');
fakerEN.seed(123);
for (var i = 0; i < 200; i++) {
  const fullName = fakerEN.person.fullName();

  //const user = createRandomUser();
  const user = createRandomTime();
  appDiv.innerHTML += `
${JSON.stringify(user)},
`;
}
*/
  //
  // <line>s/T\d\d:\d\d:\d\d.\d\d\dZ//g
  const timeData = [{"date":"2024-01-14","point":8833938556766555,"value":"0xe","color":[173,0.39,0.34]}, {"date":"2023-10-18","point":1580328927214693,"value":"0xb","color":[191,0.64,0.85]}, {"date":"2023-11-04","point":2645540939740425,"value":"0xd","color":[33,0.43,0.43]}, {"date":"2024-02-12","point":5620068562375346,"value":"0x2","color":[114,0.41,0.87]}, {"date":"2024-06-09","point":5431882739186912,"value":"0xb","color":[123,0.3,0.42]}, {"date":"2024-03-28","point":6077058717239443,"value":"0xC","color":[30,0.77,0.24]}, {"date":"2024-05-02","point":145278978522919,"value":"0xd","color":[200,0.16,0.15]}, {"date":"2024-07-15","point":7581089368930071,"value":"0x7","color":[15,0.3,0.4]}, {"date":"2024-04-21","point":1361235076160533,"value":"0x8","color":[86,0.34,0.51]}, {"date":"2024-06-16","point":4983299143732937,"value":"0xC","color":[138,0.31,0.35]}, {"date":"2024-02-19","point":24211933230517,"value":"0xE","color":[326,0.2,0.29]}, {"date":"2024-05-05","point":1450780706728690,"value":"0xd","color":[312,0.99,0.08]}, {"date":"2023-11-29","point":8354936076607912,"value":"0xc","color":[165,0.76,0.74]}, {"date":"2023-12-02","point":5992142574905565,"value":"0x2","color":[240,0.89,0.7]}, {"date":"2024-03-12","point":7339459593431910,"value":"0x7","color":[334,0.75,0.57]}, {"date":"2023-09-11","point":1246736644002883,"value":"0x8","color":[153,0.56,0.12]}, {"date":"2024-03-01","point":8394098549625427,"value":"0xc","color":[74,0.72,0.38]}, {"date":"2024-02-01","point":1096665739878359,"value":"0xb","color":[24,0.65,1]}, {"date":"2023-08-30","point":7136397681106405,"value":"0xb","color":[153,0.79,0.41]}, {"date":"2024-01-12","point":8908430877924065,"value":"0x5","color":[330,0.92,0.09]}, {"date":"2023-09-16","point":2145964373174947,"value":"0xB","color":[323,0.04,0.3]}, {"date":"2024-08-07","point":3379370803532665,"value":"0x2","color":[166,0.97,0.34]}, {"date":"2024-01-09","point":1720437706062803,"value":"0xE","color":[234,0.87,0.02]}, {"date":"2023-12-27","point":1927647960468149,"value":"0x2","color":[83,0.3,0.64]}, {"date":"2023-10-11","point":5381199048381164,"value":"0x6","color":[228,0.02,0.89]}, {"date":"2024-08-01","point":7851421865769832,"value":"0xe","color":[346,0.43,0.88]}, {"date":"2023-09-27","point":5372676346206459,"value":"0x0","color":[260,0,0.08]}, {"date":"2023-11-03","point":5153439942192106,"value":"0xe","color":[107,0.42,0.45]}, {"date":"2023-08-14","point":4331463437603667,"value":"0xE","color":[71,0.05,0.41]}, {"date":"2024-07-07","point":5472135393929145,"value":"0xB","color":[121,0.35,0.39]}, {"date":"2024-03-31","point":2466551364718209,"value":"0x4","color":[121,0.33,0.89]}, {"date":"2023-11-30","point":1308419396359565,"value":"0x2","color":[217,0.36,0.57]}, {"date":"2024-03-04","point":3015938288435963,"value":"0xb","color":[250,0.92,0.58]}, {"date":"2024-05-23","point":2139013646095526,"value":"0x7","color":[344,0.66,0.78]}, {"date":"2023-08-15","point":787298954481098,"value":"0x7","color":[340,0.49,0.27]}, {"date":"2023-11-23","point":8402740957894049,"value":"0x6","color":[328,0.04,0.71]}, {"date":"2024-07-23","point":5563386485550784,"value":"0x8","color":[220,0.2,0.16]}, {"date":"2023-12-08","point":8755882589952599,"value":"0xE","color":[147,0.66,0.4]}, {"date":"2023-10-19","point":8591232411492395,"value":"0x2","color":[225,0.44,0.42]}, {"date":"2023-11-22","point":4715156655139295,"value":"0x2","color":[33,0.84,0.41]}, {"date":"2024-04-27","point":8327623047681196,"value":"0xa","color":[135,0.54,0.86]}, {"date":"2024-03-23","point":2150769717852423,"value":"0xe","color":[126,0.28,1]}, {"date":"2023-09-14","point":5840715761844186,"value":"0xA","color":[244,0.05,0.29]}, {"date":"2024-08-07","point":8129506581829341,"value":"0x4","color":[0,0.99,0.89]}, {"date":"2024-06-18","point":1149428730872397,"value":"0xD","color":[179,0.43,0.3]}, {"date":"2023-12-14","point":5359948975554070,"value":"0x9","color":[336,0.4,0.48]}, {"date":"2023-10-05","point":2560019277455681,"value":"0xB","color":[188,0.03,0.99]}, {"date":"2024-03-05","point":6548953988310714,"value":"0xe","color":[89,0.53,0.54]}, {"date":"2024-02-28","point":7763413983625285,"value":"0xc","color":[63,0.51,0.76]}, {"date":"2023-11-11","point":5831553648667341,"value":"0x0","color":[274,0.53,0.88]}, {"date":"2024-01-21","point":2868205525506970,"value":"0x6","color":[348,0.43,0.89]}, {"date":"2024-06-01","point":6603429033099964,"value":"0xd","color":[258,0.72,0.04]}, {"date":"2024-01-06","point":1097432903704623,"value":"0xb","color":[161,0.67,0.55]}, {"date":"2024-01-30","point":5637664665588187,"value":"0xa","color":[80,0.38,0.1]}, {"date":"2023-10-07","point":2689362206954112,"value":"0xE","color":[328,0.16,0.99]}, {"date":"2024-04-08","point":5831127000738609,"value":"0x7","color":[64,0.47,0.26]}, {"date":"2024-08-10","point":5933651090186012,"value":"0x4","color":[35,0.95,0.95]}, {"date":"2023-12-24","point":2469999318836245,"value":"0x2","color":[41,0.96,0.81]}, {"date":"2024-08-06","point":2051858597437565,"value":"0xc","color":[212,0.97,0.66]}, {"date":"2024-07-25","point":4491509079164945,"value":"0x7","color":[132,0.81,0.38]}, {"date":"2024-01-30","point":2380854778266760,"value":"0xE","color":[326,0.44,0.09]}, {"date":"2024-06-25","point":8969204637703179,"value":"0x4","color":[220,0.85,0.95]}, {"date":"2024-05-06","point":8958653935352030,"value":"0xb","color":[75,0.6,0.63]}, {"date":"2024-04-18","point":1766168078663326,"value":"0x0","color":[198,0.82,0.86]}, {"date":"2023-09-07","point":4677261681887299,"value":"0xe","color":[88,0.34,0.56]}, {"date":"2024-05-19","point":5573310627399831,"value":"0xb","color":[215,0.76,0.54]}, {"date":"2023-12-31","point":2522015350572348,"value":"0xe","color":[117,0.76,0.11]}, {"date":"2024-03-02","point":8788065503167675,"value":"0xA","color":[196,0.17,0.91]}, {"date":"2024-06-18","point":7454853733089575,"value":"0x7","color":[95,0.12,0.99]}, {"date":"2023-12-11","point":8289599590114519,"value":"0xE","color":[303,0.16,0.42]}, {"date":"2023-09-18","point":4906792229205994,"value":"0x7","color":[141,0.31,0.39]}, {"date":"2023-11-18","point":8919279984743717,"value":"0x8","color":[250,0.69,0.43]}, {"date":"2023-11-28","point":7462710679003126,"value":"0x8","color":[30,0.19,0.86]}, {"date":"2024-01-11","point":8270049331735749,"value":"0x6","color":[339,0.5,0.35]}, {"date":"2024-05-13","point":4269339320274816,"value":"0xc","color":[210,0.98,0.67]}, {"date":"2024-06-04","point":7075666218204033,"value":"0x1","color":[343,0.53,0.6]}, {"date":"2024-06-07","point":405680505806850,"value":"0xe","color":[236,0.1,0.85]}, {"date":"2023-08-20","point":3292737342654084,"value":"0xd","color":[118,0.31,0.75]}, {"date":"2024-05-10","point":8135101706846751,"value":"0x8","color":[154,0.74,0.66]}, {"date":"2023-09-11","point":7618273129575129,"value":"0x8","color":[21,0.9,0.22]}, {"date":"2024-06-21","point":2183769355667154,"value":"0xe","color":[253,0.46,0.87]}, {"date":"2024-01-25","point":194977606957615,"value":"0xb","color":[152,0.15,0.12]}, {"date":"2024-01-15","point":141822291233402,"value":"0x0","color":[122,0.82,0.46]}, {"date":"2023-12-19","point":3173028654831918,"value":"0xB","color":[143,0.73,0.58]}, {"date":"2024-08-09","point":3277692323273225,"value":"0x5","color":[126,0.34,0.64]}, {"date":"2024-01-23","point":4480819511272122,"value":"0x7","color":[163,0.4,0.52]}, {"date":"2024-02-18","point":2155361947275170,"value":"0x8","color":[298,0.32,0.48]}, {"date":"2023-11-27","point":8596275573830483,"value":"0x1","color":[167,0.05,0.54]}, {"date":"2023-08-14","point":2656175403296197,"value":"0x1","color":[178,0.29,0.64]}, {"date":"2023-09-20","point":5854420922736178,"value":"0x7","color":[66,0.81,0.06]}, {"date":"2024-04-04","point":7736401416564773,"value":"0xd","color":[143,0.45,0.88]}, {"date":"2023-10-22","point":406496132730126,"value":"0x3","color":[116,0.58,0.67]}, {"date":"2024-04-16","point":2767487095339564,"value":"0xe","color":[106,0.91,0.88]}, {"date":"2024-05-10","point":398453336611629,"value":"0x4","color":[25,0.18,0.38]}, {"date":"2023-11-25","point":8932726947253907,"value":"0xc","color":[284,0.03,0.08]}, {"date":"2024-08-08","point":7823057514221501,"value":"0x3","color":[66,0.68,0.07]}, {"date":"2024-03-09","point":2429091019359117,"value":"0x9","color":[48,0.52,0.05]}, {"date":"2023-10-20","point":5163997479229149,"value":"0x6","color":[164,0.14,0.12]}, {"date":"2023-10-13","point":1221546940396322,"value":"0xa","color":[310,0.77,0.56]}, {"date":"2024-03-13","point":6486395649523551,"value":"0xe","color":[59,0.33,0.41]}, {"date":"2024-03-07","point":3647290241846816,"value":"0xE","color":[215,0.98,0.87]}, {"date":"2024-05-30","point":805270183629930,"value":"0xE","color":[220,0.16,0.03]}, {"date":"2024-06-26","point":6922701337795850,"value":"0xC","color":[169,0.72,0.32]}, {"date":"2023-08-20","point":69623985946937,"value":"0xe","color":[36,0.07,0.5]}, {"date":"2023-10-27","point":901212232452032,"value":"0x0","color":[102,0.16,0.01]}, {"date":"2023-08-22","point":8662990062368341,"value":"0x3","color":[259,0.38,0.87]}, {"date":"2024-03-16","point":2067363426197148,"value":"0xe","color":[104,0.85,0.98]}, {"date":"2023-11-09","point":872371459583134,"value":"0xC","color":[269,0.86,0.38]}, {"date":"2024-05-13","point":7780904983494589,"value":"0xC","color":[272,0.33,0.71]}, {"date":"2023-11-10","point":7602624782714762,"value":"0xA","color":[118,0.52,0.19]}, {"date":"2024-01-13","point":3423113127676741,"value":"0x3","color":[56,0.17,0.6]}, {"date":"2024-03-18","point":3721385706141758,"value":"0xd","color":[48,0.48,0.98]}, {"date":"2024-02-27","point":100898736366264,"value":"0xA","color":[353,0.72,0.81]}, {"date":"2023-10-07","point":4332246673992152,"value":"0x6","color":[302,0.35,0.08]}, {"date":"2024-01-04","point":3856828169128605,"value":"0xC","color":[94,0.3,0.74]}, {"date":"2024-04-24","point":7156258696976431,"value":"0xE","color":[111,0.55,0.14]}, {"date":"2023-09-27","point":2558270477633892,"value":"0xE","color":[163,0.62,0.01]}, {"date":"2024-07-22","point":2240973193913904,"value":"0x0","color":[292,0.85,0.54]}, {"date":"2024-07-01","point":5461976967411160,"value":"0x1","color":[250,0.68,0.16]}, {"date":"2024-08-01","point":6529887265888152,"value":"0xB","color":[277,0.96,0.82]}, {"date":"2024-07-19","point":8571813252001240,"value":"0x1","color":[23,0.86,0.56]}, {"date":"2024-06-02","point":8630516547144810,"value":"0xe","color":[31,0.59,0.13]}, {"date":"2024-02-27","point":975822223899718,"value":"0xe","color":[204,0.35,0.41]}, {"date":"2023-09-02","point":8605173155550377,"value":"0xC","color":[300,0.92,0.93]}, {"date":"2024-06-11","point":2459337380758707,"value":"0xA","color":[290,0.08,0.92]}, {"date":"2023-10-05","point":4502764532900054,"value":"0xB","color":[201,0.13,0.83]}, {"date":"2023-12-29","point":751912813566411,"value":"0xC","color":[1,0.34,0.33]}, {"date":"2024-02-25","point":2755805121331967,"value":"0xa","color":[98,0.46,0.77]}, {"date":"2024-05-03","point":3677060386228878,"value":"0xe","color":[324,0.74,0.94]}, {"date":"2023-08-25","point":4752355033975057,"value":"0xB","color":[146,0,0.17]}, {"date":"2024-02-07","point":1211294946853575,"value":"0x8","color":[360,0.56,0.46]}, {"date":"2023-11-22","point":1881804646983009,"value":"0xA","color":[337,0.42,0.63]}, {"date":"2023-10-22","point":1197022296030502,"value":"0xE","color":[128,0.46,0.09]}, {"date":"2023-10-30","point":7710875908985868,"value":"0xd","color":[69,0.19,0.35]}, {"date":"2024-04-25","point":3534877270702874,"value":"0x5","color":[345,0.04,0.62]}, {"date":"2024-07-05","point":984052671981975,"value":"0x4","color":[219,0.14,0.57]}, {"date":"2024-06-23","point":2639578114507343,"value":"0x7","color":[283,0.13,0.06]}, {"date":"2023-11-30","point":6567045993475457,"value":"0x2","color":[358,0.31,0.55]}, {"date":"2024-05-07","point":6434985385487827,"value":"0x4","color":[172,0.69,0.74]}, {"date":"2024-03-03","point":7740593429000819,"value":"0xe","color":[253,0.21,0.35]}, {"date":"2024-04-22","point":3902145618639980,"value":"0x2","color":[360,0.73,0.62]}, {"date":"2024-02-26","point":5691734666864056,"value":"0xa","color":[45,0.07,0.67]}, {"date":"2024-01-08","point":3003710022844118,"value":"0x1","color":[3,0.24,0.25]}, {"date":"2023-09-24","point":6480766440639749,"value":"0xE","color":[132,0.76,0.74]}, {"date":"2024-03-12","point":2540508357926237,"value":"0x4","color":[266,0.41,0.44]}, {"date":"2024-03-17","point":7540737931896887,"value":"0xA","color":[319,0.03,0.69]}, {"date":"2024-06-14","point":8518276678540753,"value":"0xb","color":[114,0.39,0.87]}, {"date":"2024-06-30","point":4870838255654750,"value":"0xc","color":[354,0.96,0.8]}, {"date":"2023-09-19","point":102037494020359,"value":"0x0","color":[266,0.45,0.49]}, {"date":"2024-07-12","point":3046126018299925,"value":"0xE","color":[22,0.31,0.59]}, {"date":"2024-08-09","point":2892056883502773,"value":"0x7","color":[193,0.63,0.31]}, {"date":"2024-07-23","point":6923933163091091,"value":"0x3","color":[102,0.67,0.31]}, {"date":"2024-02-22","point":5989820372634551,"value":"0x0","color":[91,0.57,0.83]}, {"date":"2023-11-23","point":1037190979166734,"value":"0x2","color":[317,0.49,0.67]}, {"date":"2024-07-03","point":7807918621963680,"value":"0x5","color":[212,0.26,0.64]}, {"date":"2023-12-05","point":6391918532492231,"value":"0xC","color":[44,0.41,0.2]}, {"date":"2023-09-09","point":4781176170713840,"value":"0x7","color":[79,0.94,0.32]}, {"date":"2023-11-30","point":2136225164320513,"value":"0xE","color":[100,0.17,0.45]}, {"date":"2023-10-11","point":2331454261745278,"value":"0xe","color":[314,0.96,0.38]}, {"date":"2024-06-28","point":1582206786554825,"value":"0xA","color":[359,0.23,0.74]}, {"date":"2023-11-28","point":811129264984778,"value":"0x5","color":[284,0.26,0.51]}, {"date":"2024-04-25","point":5705486833689453,"value":"0xa","color":[323,0.98,0.73]}, {"date":"2024-03-04","point":8509391289872778,"value":"0xd","color":[314,0.71,0.86]}, {"date":"2024-03-25","point":6991948504791992,"value":"0xe","color":[158,0.93,0.16]}, {"date":"2024-05-25","point":7362901299812720,"value":"0x3","color":[291,0.33,0.57]}, {"date":"2024-04-07","point":1724573167435511,"value":"0xe","color":[334,0.43,0.65]}, {"date":"2023-09-15","point":3166889291395850,"value":"0xb","color":[88,0.84,0.29]}, {"date":"2023-11-26","point":3602907495052273,"value":"0xD","color":[119,0.91,0.97]}, {"date":"2023-08-23","point":5552861563181944,"value":"0xa","color":[94,0.78,0.54]}, {"date":"2024-06-27","point":2625576301074656,"value":"0x1","color":[4,0.43,0]}, {"date":"2024-07-26","point":2162652585819347,"value":"0xD","color":[354,0,0.43]}, {"date":"2024-06-12","point":3669304914784986,"value":"0xe","color":[345,0.24,0.49]}, {"date":"2024-01-31","point":5988117603886953,"value":"0xd","color":[220,0.09,0.49]}, {"date":"2023-12-02","point":750923175737377,"value":"0x9","color":[107,0.57,0.22]}, {"date":"2023-09-21","point":2978952280285518,"value":"0xd","color":[81,0.92,0.71]}, {"date":"2024-05-12","point":1270005620762167,"value":"0x0","color":[321,0.33,0.33]}, {"date":"2024-05-20","point":6218820885460403,"value":"0x4","color":[264,0.27,0.72]}, {"date":"2024-05-23","point":5996281654901051,"value":"0x7","color":[182,0.13,0.16]}, {"date":"2024-04-15","point":395269969979883,"value":"0xE","color":[305,0.94,0.17]}, {"date":"2024-02-02","point":2119932689760066,"value":"0xc","color":[204,0.08,0.63]}, {"date":"2024-07-20","point":5633223492702875,"value":"0x8","color":[307,0.21,0.49]}, {"date":"2024-01-27","point":7403404018945059,"value":"0xe","color":[336,0.22,0.15]}, {"date":"2023-09-11","point":6665421350768448,"value":"0x6","color":[79,0.26,0.9]}, {"date":"2024-06-04","point":1801303077772345,"value":"0xA","color":[42,0.83,0.67]}, {"date":"2024-06-16","point":5687371418924502,"value":"0xe","color":[135,0.05,0.43]}, {"date":"2023-08-20","point":4763356457493030,"value":"0xC","color":[123,0.66,0.86]}, {"date":"2024-01-20","point":2737371985217500,"value":"0x5","color":[57,0.41,0.54]}, {"date":"2023-09-23","point":6371085721850380,"value":"0xE","color":[179,0.49,0.73]}, {"date":"2023-10-15","point":4151479329562810,"value":"0x6","color":[314,0.44,0.69]}, {"date":"2024-07-02","point":5089380809951384,"value":"0xa","color":[65,0.91,0.64]}, {"date":"2024-01-30","point":2011137730299084,"value":"0xa","color":[158,0.72,0.64]}, {"date":"2024-08-08","point":3686035143694513,"value":"0xA","color":[29,0.43,0.33]}, {"date":"2024-06-26","point":5213796465281543,"value":"0xB","color":[360,0.64,0.34]}, {"date":"2024-02-07","point":6864746137517011,"value":"0xE","color":[242,0.02,0.46]}, {"date":"2024-02-13","point":4380090672313011,"value":"0xe","color":[164,0.57,0.29]}, {"date":"2024-01-10","point":2570896828527265,"value":"0xe","color":[126,0.59,0.16]}, {"date":"2023-09-07","point":2793917841615742,"value":"0xD","color":[152,0.33,0.29]}, {"date":"2023-10-21","point":1818088126138008,"value":"0x0","color":[341,0.96,0.1]}, {"date":"2023-11-24","point":4821610005732839,"value":"0x2","color":[350,0.25,0.53]}, {"date":"2023-12-18","point":2913753221174039,"value":"0xE","color":[223,0.41,0.77]}];
  //
  const elSparkOne = "sparkLineChartSimpleOne";
  const lineOne = document.getElementById(elSparkOne).getBoundingClientRect();
  const widthSparkOne = lineOne.width;
  const heightSparkOne = lineOne.height;
  //
  const timeMap = new Map();
  const newTime = timeData.map(function(d){
    return {date: luxon.DateTime.fromISO(d.date), value: Number(d.value)};
    //
  }).sort((a,b)=>a.date - b.date);
  //
  newTime.forEach((obj) => {
    timeMap.set(obj.date.toString(), obj);
  });
  const lineData = Array.from(timeMap, ([date, value]) => (value));
  //
  const domainExtent = d3.extent(newTime, (d)=>d.date);
  const valMax = d3.max(newTime, (d)=>d.value);
  //
  var updateHoverEvent = (d) => new CustomEvent(d,{detail:{date:'',value:0}});
  //
  var LineSparkOne = LineLinearSpark().
      SvgID("linesparkone").
      Width(widthSparkOne).
      Height(heightSparkOne).
      DomainLinear(domainExtent).
      LinearAccessor((d)=>d.date).
      DomainVal([0,valMax]).
      ValAccessor((d)=>d.value).
      WithHover(updateHoverEvent("lineSparkOneHover")).
      WithSubmit(true).
      Curve(d3.curveCardinal).
      Data(lineData);
  //
  d3.select("#" + elSparkOne).call(LineSparkOne);
});
