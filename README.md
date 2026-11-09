# D3-Eazy

![All the example charts](docs/imgs/examples-all.png)

> **Status: alpha.** The API can change. Pin the version you use.

D3-Eazy is a set of ready-made [D3](https://d3js.org) charts. Each chart follows the
[reusable chart pattern](https://bost.ocks.org/mike/chart/) from Mike Bostock.
You configure a chart with chained setters, then draw it with `selection.call(chart)`.
You can change a setter later and the chart redraws. You still have the full D3 API.

## Install

```sh
npm install d3-eazy d3
```

D3-Eazy is an ES module. It needs `d3` v7 and `luxon` v3 (`luxon` installs with the package).
There is no build step for the library. Use any bundler that handles ES modules, such as esbuild or Vite.

## Quick start

```html
<div id="bars" style="height: 300px"></div>
```

```javascript
import * as d3 from "d3";
import { BarChartSimple } from "d3-eazy";

const data = [
  { name: "JS", value: 52 },
  { name: "GO", value: 301 },
  { name: "Rust", value: 31 },
];
const names = data.map((d) => d.name);
const { width, height } = document.getElementById("bars").getBoundingClientRect();

const bars = BarChartSimple()
  .SvgID("bars-svg")
  .Title("Language scores") // accessible name, see "Accessibility"
  .Band((d) => d.name) // which field is the category
  .Val((d) => d.value) // which field is the number
  .DomainBand(names)
  .DomainVal([0, d3.max(data, (d) => d.value)])
  .ColourDomain(names)
  .ColourRange(d3.schemeObservable10)
  .Orient("horizontal")
  .Width(width)
  .Height(height)
  .MarginLeft(40)
  .MarginBottom(24)
  .Data(data);

d3.select("#bars").call(bars);
```

Run the full demo: `npm install && npm run build`, then open `index.html`
(or serve the folder, for example `python3 -m http.server`).
Each card on that page shows its own source code.

## How it works

**Setters and getters.** Every option is one method. Call it with a value to set it.
The method returns the chart, so calls chain. Call it with no argument to read the value.

```javascript
bars.Orient("vertical"); // set
bars.Orient(); // "vertical"
```

**Draw.** Call the chart on a D3 selection. The chart adds one `<svg>` to each selected element.

```javascript
d3.select("#bars").call(bars);
```

**Update.** After the first draw, change any setter. The chart updates itself.
`BarChartSimple.Data()` and `DonutChartSimple.Data()` animate to the new data.
For every other setter and chart, the chart removes its `<svg>` and draws it again.
Several setter calls in a row cause one redraw.

```javascript
bars.Data(newRows).Orient("vertical"); // one update
```

**Size.** A chart does not measure its container. Pass `Width()` and `Height()`.
The `<svg>` gets a `viewBox` and scales down with its container when the window resizes.

**One chart, one instance.** Each chart call, such as `BarChartSimple()`, creates a new chart with its own state.
Two charts on one page do not share data.

## Charts

There are 38 charts. Every chart has `SvgID`, `Title`, `Description`, `Data`, `Width`, `Height`,
`MarginTop/Right/Bottom/Left`, `ColourDomain`, and `ColourRange`, unless a row says otherwise.
Each chart has a working card in the demo. The source is in `js/example.jsx` and `js/example-more.jsx`.

Orientation follows `BarChartSimple`: `"horizontal"` puts the categories on the x axis.
`"vertical"` puts them on the y axis.

### Comparison

| Chart | Use it for | Main setters |
| --- | --- | --- |
| `BarChartSimple` | Compare values per category | `Band`, `Val`, `DomainBand`, `DomainVal`, `Orient`, `WithText`, `CornerRadiusX`, `BarPadding` |
| `GroupedBarChartSimple` | Compare several fields per category | `Band` (array), `Subgroup` (array of fields), `DomainVal`, `Orient` |
| `StackedBarChartSimple` | Parts of a total per category | `Band`, `Keys`, `Orient`, `Normalize` |
| `LollipopChartSimple` | A lighter bar chart | `Band`, `Val`, `Orient`, `Radius` |
| `DumbbellChartSimple` | Change between two values per category | `Band`, `From`, `To` |
| `SlopeChartSimple` | Change of each item between two times | `Name`, `From`, `To`, `FromLabel`, `ToLabel` |
| `WaterfallChartSimple` | A running total built from steps | `Name`, `Val`, `ShowTotal`, `Up`, `Down`, `Total` |
| `RadarChartSimple` | Compare shapes over several axes | `Axes`, `Series`, `Value(row, axis)`, `Max`, `Levels` |
| `ParallelCoordinatesSimple` | Compare rows over many numeric fields | `Dimensions`, `Value(row, dim)`, `Group` |
| `HeatGridChartSimple` | Value per pair of categories | `X`, `Y`, `Value`, `Interpolator`, `ShowValues` |

### Trends over time or a number axis

| Chart | Use it for | Main setters |
| --- | --- | --- |
| `LineChartSimple` | One or more lines | `X`, `Y`, `Series`, `Curve`, `Points`, `DomainY` |
| `AreaChartSimple` | Lines with a filled area | same as `LineChartSimple`, plus `Opacity` |
| `StepLineChartSimple` | A value that holds until the next point | same as `LineChartSimple` |
| `StackedAreaChartSimple` | Parts of a total over time | `X`, `Keys`, `Offset`, `Order`, `Curve` |
| `StreamGraphSimple` | Stacked area on a wiggling baseline | same as `StackedAreaChartSimple` |
| `CandlestickChartSimple` | Open, high, low, close prices | `Date`, `Open`, `High`, `Low`, `Close` |
| `CalendarHeatmapSimple` | One square per day | `Date`, `Value`, `Interpolator` |
| `LineTimeChartSimple` | One line over time | `Time`, `Linear`, `DomainTime`, `DomainLinear`, `StrokeColour` |
| `MultiLineTimeChartSimple` | Several lines over time | `Time`, `LineKeys`, `DomainTime`, `DomainVal`, `WithLegend` |
| `LineLinearSpark` | One line over a number axis | `LinearAccessor`, `ValAccessor`, `DomainLinear`, `DomainVal`, `Curve`, `WithHover` |

### Distribution and relationship

| Chart | Use it for | Main setters |
| --- | --- | --- |
| `HistogramSimple` | Shape of one numeric field | `Value`, `Thresholds`, `Domain` |
| `BoxPlotSimple` | Median, quartiles, outliers per group | `Group`, `Value`, `Orient` |
| `ScatterPlotSimple` | Two numeric fields. Bubble chart when `R` is a function | `X`, `Y`, `R`, `Group`, `Opacity` |

### Part of a whole

| Chart | Use it for | Main setters |
| --- | --- | --- |
| `PieChartSimple` | Shares. Donut when `InnerRadius` > 0 | `Key`, `Val`, `InnerRadius`, `Labels` |
| `DonutChartSimple` | Shares, with a centre text | `Key`, `Val`, `ValText`, `CenterText`, `InnerRadiusArc`, `OuterRadiusArc` |
| `FunnelChartSimple` | Drop-off between stages | `Stage`, `Val` |
| `GaugeChartSimple` | One value against a range (no `Data`) | `Value`, `Min`, `Max`, `Thresholds`, `Label` |
| `TreemapChartSimple` | Hierarchy by area | `Children`, `Value`, `Name` |
| `SunburstChartSimple` | Hierarchy by rings | `Children`, `Value`, `Name` |
| `CirclePackChartSimple` | Hierarchy by nested circles | `Children`, `Value`, `Name` |

### Structure and flow

| Chart | Use it for | Main setters |
| --- | --- | --- |
| `TreeDiagramSimple` | A hierarchy as a tree | `Children`, `Name`, `LabelSpace` |
| `ForceNetworkSimple` | Nodes and links | `Group`, `NodeRadius`, `Charge`, `LinkDistance`, `Iterations` |
| `SankeyDiagramSimple` | Flow between stages | `NodeWidth`, `NodePadding` |
| `ChordDiagramSimple` | Flow between a few groups | `Names` |

### Other

| Chart | Use it for | Main setters |
| --- | --- | --- |
| `HeatMapBlockedSimple` | One block per record, coloured by `status` | `DateAccessor`, `DateExtent`, `ColourDomainZ`, `ColourRangeZ`, `DataAccessor`, `WithHover` |
| `CircularHeatChartSimple` | Cyclic data, such as hours of the day | `NumSegments`, `InnerRadius`, `SegmentHeight`, `ColourRange`, `DataAccessor`, `RadialLabels`, `SegmentLabels` |
| `SingleHorzBarChart` | One stacked bar | `DomainVal`, `ColourDomain`, `WithText`, `WithHover` |
| `LineAndBarChartSimple` | Bars with a line over them | `BandDomain`, `ValDomain`, `ThresholdBin`, `StrokeColour` |

### Data shapes

- Most charts take an array of objects. Accessor setters (`X`, `Y`, `Band`, `Val`, `Key`, `Name`) pick the fields.
  Setter defaults read `d.x`, `d.y`, `d.name`, and `d.value`, so data in that shape needs no accessors.
- `StackedBarChartSimple`, `StackedAreaChartSimple`, `StreamGraphSimple`: rows like `{ name: "Q1", web: 3, mobile: 4 }`. `Keys(["web", "mobile"])` picks the fields to stack.
- `LineChartSimple`, `AreaChartSimple`, `ScatterPlotSimple`: one flat array. `Series` or `Group` splits it into several lines or colours.
- `Treemap`, `Sunburst`, `CirclePack`, `TreeDiagram`: one nested object like `{ name, children: [{ name, value }] }`.
- `ForceNetworkSimple`: `{ nodes: [{ id, group }], links: [{ source, target }] }`.
- `SankeyDiagramSimple`: `{ nodes: [{ name }], links: [{ source: "A", target: "B", value: 3 }] }`.
- `ChordDiagramSimple`: a square matrix of numbers.
- `MultiLineTimeChartSimple`: rows like `{ day: Date, north: 1, south: 2 }`. `LineKeys(["north", "south"])` picks the lines.
- `HeatMapBlockedSimple`: rows like `{ date: Date, status: "pass" }`.
- `CircularHeatChartSimple`: an array of numbers. Item `i` goes to ring `floor(i / NumSegments)`.
- `SingleHorzBarChart`: the result of `d3.stack().keys([...])([row])`.
- `LineAndBarChartSimple`: rows like `{ key: 4, value: 7 }`. `BandDomain([0, max])` is the numeric x range.

`WithText(true)` prints the value on each bar of `BarChartSimple` and `GroupedBarChartSimple`.
The label sits inside a long bar and just past the end of a short bar.
`BarLength(percent)` sets the cut-off (default 50). `TextFill([outside, inside])` and `TextAnchor([outside, inside])`
override the automatic colours and alignment. `TextFormat(fn)` formats the number.

Each drawn mark also has a `<title>`, so the browser shows a tooltip on hover.
The charts from `LineChartSimple` onward draw every mark with the class `mark`.
Use it to style or select marks, for example `svg.selectAll(".mark")`.

## Accessibility

Call `Title("...")` and `Description("...")` on a chart. The `<svg>` then gets `role="img"`,
a `<title>`, a `<desc>`, and `aria-labelledby`. This follows the
[WAI-ARIA graphics approach](https://www.w3.org/TR/graphics-aria-1.0/).
Without `Title` and `Description`, the chart adds no ARIA markup.

Do not use colour as the only way to show a difference. Add labels as well.
Choose palettes that work for colour-blind readers. `d3.schemeObservable10` and `d3.schemeTableau10` are
reasonable defaults. Avoid red and green as the only difference between two series.

## Development

```sh
npm install
npm run lint     # eslint, catches undeclared variables
npm test         # node:test with jsdom, one render test per chart
npm run build    # bundles js/example.jsx to js/main.js for index.html
npm run check    # all three
```

Project layout:

| Path | Content |
| --- | --- |
| `d3-eazy.js` | Public entry point. Exports every chart. |
| `charts.js` | The first ten charts and the shared helpers. |
| `charts-more.js` | The other charts, built with one `makeChart` factory. |
| `events.js` | Small DOM event helpers (`ready`, `addEventListener`). |
| `js/example.jsx`, `js/example-more.jsx` | Source of the demo page. |
| `tests/` | Tests and the jsdom helper. |

To add a chart, write a render function in `charts-more.js` and export `() => makeChart(defaults, render)`.
Every key in `defaults` becomes a getter/setter. Then add a configuration and the expected number
of `.mark` elements to `tests/more-fixtures.js`. The tests fail if an exported chart has no configuration,
if a chart writes `NaN` or `undefined` into an attribute, or if the mark count is wrong.

## Known limits

- Charts are not tested in a real browser by the test suite. The suite uses jsdom, which has no layout engine.
  Check the demo page after a change.
- Most charts redraw instead of animating when you change a setter.
- `SingleHorzBarChart` and `LineAndBarChartSimple` have the least testing. Treat them as unstable.
- `ForceNetworkSimple` runs its layout once per draw, so it does not animate.
- `HeatMapBlockedSimple` reads the `status` field of each record. Use `ColourFnZ` for a custom colour function.

## Credits

Mike Bostock for [Towards Reusable Charts](https://bost.ocks.org/mike/chart/).

Rob Moore at Toptal for [Updatable Charts](https://www.toptal.com/d3-js/towards-reusable-d3-js-charts).

## Prior art

[D3-ez](https://github.com/jamesleesaunders/d3-ez). James Lee Saunders' use of events and generalized data format functions was a useful example.

[D3-Timeseries](https://github.com/mcaule/d3-timeseries) by mcaule.

## License

BSD-2-Clause.
