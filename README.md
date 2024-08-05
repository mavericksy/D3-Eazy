# D3-Eazy

_*THIS SOFTWARE IS ALPHA QUALITY*_

_*EXPECT THE API TO CHANGE*_

Wrapper around D3 charts using the general update pattern.

This library attempts to insulate the user from the complexities of the D3 library while still making the D3 API accessible with much of the power available and a few extras on top.

The General Update Pattern allows the user to change the charts in real-time and create beautiful, dynamic charts easily.

A simple bar chart can be created like this:

```javascript
var el = "barChartSimpleOne";
var dataset = [
  { key: "JS", value: 32 },
  { key: "GO", value: 301 },
  { key: "Rust", value: 71 },
  { key: "C", value: 182 },
  { key: "Zig", value: 101 },
  { key: "Common Lisp", value: 400 },
];
//
const rect = document.getElementById(el).getBoundingClientRect();
const width = rect.width;
const height = rect.height;
//
var max = d3.max(dataset, (d) => d.value);
var domain = d3.sort(dataset, (d) => -d.value).map((d) => d.key);
//
var TheBar = BarChartSimple()
  .SvgID("thebar")
  .Val(function (a) {
    return a.value;
  })
  .Band(function (a) {
    return a.key;
  })
  .Orient("vertical")
  .DomainBand(domain)
  .DomainVal([0, max])
  .ColourDomain(domain)
  .ColourRange(d3.schemeObservable10)
  .Width(width)
  .Height(height)
  .MarginTop(0)
  .MarginBottom(0)
  .MarginLeft(80)
  .MarginRight(0)
  .CornerRadiusX(2)
  .Data(dataset);
//
d3.select("#" + el).call(TheBar);
```

Creating this chart:

![Simple Bar Chart One](docs/imgs/barChartSimpleOne.png)

One change to the chained functions (Orient("horizontal")) will produce this chart:

![Simple Bar Chart Horizontal](docs/imgs/barChartSimpleTwo.png)

## Charts

Grouped Bar Chart:

![Simple Grouped Bar Chart Horizontal](docs/imgs/groupedBarChartSimpleOne.png)

## CREDITS

Many thanks to Rob Moore at Toptal for his [Updatable Charts](https://www.toptal.com/d3-js/towards-reusable-d3-js-charts) article.
