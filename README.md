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
Each chart has a working card in the demo. The Playground card at the top of the demo has a control for most options below. The source is in `js/example.jsx` and `js/example-more.jsx`.

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

## Options on every chart

All 28 charts from `LineChartSimple` onward share these setters. Each one returns the chart, so calls chain.
After the first draw, a change redraws the chart. The older ten charts support the rows marked "older charts".

### Look and feel

| Setter | Default | What it does |
| --- | --- | --- |
| `Theme(name \| object)` | `"light"` | `"light"`, `"dark"`, `"minimal"`, `"highContrast"`, `"colourBlind"`, `"auto"` (follows the operating system), or an object like `{ extends: "dark", background: "#012" }`. Older charts: yes. |
| `Palette(name)` | theme palette | A named colour list. See `palettes` below. |
| `ColourRange(list)` | from palette | An explicit colour list. It beats `Palette`. |
| `ColourDomain(keys)` | from data | Fixes which key gets which colour. |
| `ColourOverrides({ key: colour })` | `{}` | Colour single keys. |
| `Background(colour)` | theme | Fill behind the chart. Older charts: yes. |
| `FontFamily(css)`, `FontSize(px)` | theme | Text style for the whole chart. Older charts: yes. |
| `ShowTitle(true)` | `false` | Draw `Title` as a visible heading. Without it, `Title` is only the accessible name. Older charts: yes. |
| `Subtitle(text)`, `Caption(text)`, `TitleAlign("left" \| "middle" \| "right")` | empty | Text above and below the plot. The chart adds room for them. Older charts: yes, but set `MarginTop` yourself. |
| `MarkStroke`, `MarkStrokeWidth`, `MarkOpacity`, `MarkCornerRadius` | unset | Style every mark (the `.mark` elements) at once. |

Built-in theme names are in the `themes` export. Add one with `registerTheme("brand", { background: "#fff8f0", text: "#222", palette: [...] })`.
Palette names (the `palettes` export): `tableau10`, `observable10`, `category10`, `set1`, `set2`, `set3`, `dark2`, `accent`, `paired`,
`pastel1`, `pastel2`, `okabeIto`, `tolBright`, `tolMuted` (colour-blind safe), `viridis`, `plasma`, `cividis`, `blues`, `greens`, `warm`, `cool`.
Add one with `registerPalette(name, colours)`. The heat charts take `Interpolator(name)` with a name from `interpolators`
(`blues`, `viridis`, `rdylgn`, `turbo`, and more) or any `d3.interpolate*` function.

### Axes and grid

`X...` options act on the bottom axis and `Y...` options act on the left axis, also on a flipped bar chart.

| Setter | Default | What it does |
| --- | --- | --- |
| `XLabel(text)`, `YLabel(text)` | empty | Axis titles. The chart adds room for them. |
| `XFormat(spec)`, `YFormat(spec)` | automatic | A d3 number format (`",.0f"`, `"$,.2s"`, `".0%"`), a time format for date axes (`"%b %d"`), or a function. |
| `XTicks(n)`, `YTicks(n)` | automatic | Approximate tick count. |
| `XTickRotate(deg)` | `0` | Rotate bottom tick labels, for example `-40`. |
| `ShowXAxis(false)`, `ShowYAxis(false)` | `true` | Hide an axis. |
| `Grid("none" \| "x" \| "y" \| "both")`, `GridDash("3 3")` | `"none"` | Grid lines behind the marks. |
| `YScale("linear" \| "log" \| "sqrt" \| "symlog")` | `"linear"` | Value scale. Line, area, step and scatter charts. Scatter also has `XScale`. |

### Legend

| Setter | Default | What it does |
| --- | --- | --- |
| `Legend(position)` | `"top-right"` | `"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"`, or `"none"`. |
| `LegendOrient("vertical" \| "horizontal")` | `"vertical"` | Layout of the legend items. |
| `LegendTitle(text)` | empty | Heading over the legend. |
| `LegendInteractive(bool)` | `true` | Hover an item to highlight its series. Click an item to hide or show it. |

### Tooltips, events and keyboard

| Setter | Default | What it does |
| --- | --- | --- |
| `Tooltip("custom" \| "native" \| "none")` | `"custom"` | `"custom"` shows a styled box that follows the pointer and uses the theme colours. `"native"` uses the browser tooltip. |
| `TooltipFormat((text, datum, node) => string)` | unset | Rewrite the tooltip text. With `TooltipHtml(true)` the result is HTML. Escape any untrusted data yourself. |
| `OnClick((event, datum, node) => ...)` | unset | Runs when a mark is clicked. Older charts: yes. |
| `OnHover((event, datum, node) => ...)` | unset | Runs when the pointer enters a mark. `datum` is `null` when it leaves. Older charts: yes. |
| `HoverHighlight(true)` | `false` | Dim every mark except the one under the pointer. |
| `Focusable(true)` | `false` | Marks get `tabindex`, `role="img"`, and an `aria-label` from the tooltip text. Enter or Space calls `OnClick`. |

### Motion

| Setter | Default | What it does |
| --- | --- | --- |
| `Animate(bool)` | `true` | Fade the marks in. The chart skips the animation when the system asks for reduced motion. |
| `Duration(ms)`, `Stagger(ms)`, `Ease(fn)` | `600`, `12`, `d3.easeCubicOut` | Timing of the fade. |

### Overlays

```javascript
chart
  .RefLines([
    { axis: "y", value: 3000, label: "target", colour: "#d1495b", dash: "4 3" },
    { axis: "y", from: 1000, to: 2000, label: "low", colour: "#4e79a7" }, // a shaded band
    { axis: "x", value: new Date(2025, 0, 20), label: "launch" }, // or an ISO string on a date axis
  ])
  .Annotations([{ x: new Date(2025, 1, 1), y: 3300, text: "peak", dx: -30, dy: -30 }]);
```

`axis` picks the bottom (`"x"`) or left (`"y"`) scale. Reference lines need a chart with these two axes.

### Data preparation

| Setter | Default | What it does |
| --- | --- | --- |
| `Filter(fn)` | unset | Keep only rows where `fn(row)` is true. |
| `SortBy(accessor)`, `SortOrder("asc" \| "desc")` | unset, `"desc"` | Sort rows before drawing. |
| `Limit(n)` | unset | Keep the first `n` rows after filter and sort. |
| `EmptyText(text)` | `"No data"` | Message drawn when there are no rows. |

`Data()` still returns the rows you set. The chart works on a copy.

### Numbers and labels

| Setter | Default | What it does |
| --- | --- | --- |
| `Locale("en-US" \| "en-GB" \| "de-DE" \| "fr-FR" \| "nb-NO" \| "ja-JP" \| object)` | `"en-US"` | Decimal and thousands marks for every number format. An object is a d3 locale definition. |
| `ValueFormat(spec \| fn)` | unset | Format numbers in tooltips and labels. |
| `DataLabels(true)`, `LabelFormat(spec \| fn)` | `false` | Print values on stacked bars, lollipops, waterfalls and histograms. |

### Layout, resize and export

| Setter | Default | What it does |
| --- | --- | --- |
| `Width(px)`, `Height(px)`, `Margin*` | `600`, `400`, ... | Size and margins. The `<svg>` scales to its container. |
| `AutoResize(true)` | `false` | Watch the container with `ResizeObserver` and redraw at its new size. |

```javascript
import { downloadSvg, downloadPng, toSvgString } from "d3-eazy";

downloadSvg(document.getElementById("chart"), "sales.svg");
await downloadPng(document.getElementById("chart"), "sales.png", { scale: 3 });
const markup = toSvgString(document.getElementById("chart")); // a standalone SVG string
```

PNG export needs a browser. Fonts that are not installed on the viewer's machine fall back to the default font.

### Options for one chart

| Chart | Setters |
| --- | --- |
| Line, area, step | `Curve`, `Points`, `PointSize`, `Dash` (string or one per series), `Trendline`, `DomainY`, `Opacity`; area only: `Gradient`. Gaps in the data (`null` values) break the line. |
| Scatter | `R` (number or accessor), `MaxRadius`, `Group`, `Opacity`, `Trendline`, `DomainX`, `DomainY` |
| Pie | `InnerRadius`, `PadAngle`, `CornerRadius`, `StartAngle`, `EndAngle`, `Labels`, `ShowPercent`, `CentreText`, `ShowLegend` |
| Funnel | `ShowPercent` |
| Gauge | `Value`, `Min`, `Max`, `Thresholds`, `Label`, `Format` |
| Treemap | `Tile` (`"squarify"`, `"binary"`, `"slice"`, `"dice"`, `"sliceDice"`), `Padding` |
| Sankey | `Align` (`"justify"`, `"left"`, `"right"`, `"center"`), `NodeWidth`, `NodePadding` |
| Force network | `Charge`, `LinkDistance`, `Iterations`, `NodeRadius`, `Group` |

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
| `features.js` | Themes, palettes, number formats, tooltip, events, export, resize. |
| `events.js` | Small DOM event helpers (`ready`, `addEventListener`). |
| `js/example.jsx`, `js/example-more.jsx`, `js/playground.jsx` | Source of the demo page and the playground. |
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
