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

D3-Eazy is an ES module. It needs `d3` v7. `d3-sankey` installs with the package.
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

**Update.** After the first draw, change any setter. The chart removes its `<svg>` and draws it again.
Several setter calls in a row cause one redraw. Only the first draw of a chart animates.

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
| `HeatMapBlockedSimple` | One block per record, coloured by `status` | `DateAccessor`, `StatusAccessor`, `DateExtent`, `ColourDomainZ`, `ColourRangeZ`, `DataAccessor`, `WithHover`, `OnHover` |
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

Hover any mark to see a tooltip (see `Tooltip` below).
Every chart draws its marks with the class `mark`.
Use it to style or select marks, for example `svg.selectAll(".mark")`.

## Options on every chart

All 38 charts share these setters, because every chart is built by the same factory.
Each setter returns the chart, so calls chain. After the first draw, a change redraws the chart.

### Look and feel

| Setter | Default | What it does |
| --- | --- | --- |
| `Theme(name \| object)` | `"light"` | `"light"`, `"dark"`, `"minimal"`, `"highContrast"`, `"colourBlind"`, `"auto"` (follows the operating system), or an object like `{ extends: "dark", background: "#012" }`. |
| `Palette(name)` | theme palette | A named colour list. See `palettes` below. |
| `ColourRange(list)` | from palette | An explicit colour list. It beats `Palette`. |
| `ColourDomain(keys)` | from data | Fixes which key gets which colour. |
| `ColourOverrides({ key: colour })` | `{}` | Colour single keys. |
| `Background(colour)` | theme | Fill behind the chart. |
| `FontFamily(css)`, `FontSize(px)` | theme | Text style for the whole chart. |
| `ShowTitle(true)` | `false` | Draw `Title` as a visible heading. Without it, `Title` is only the accessible name. |
| `Subtitle(text)`, `Caption(text)`, `TitleAlign("left" \| "middle" \| "right")` | empty | Text above and below the plot. The chart adds room for them. |
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
| `OnClick((event, datum, node) => ...)` | unset | Runs when a mark is clicked. |
| `OnHover((event, datum, node) => ...)` | unset | Runs when the pointer enters a mark. `datum` is `null` when it leaves. |
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

### Zoom and pan

```javascript
LineChartSimple().Zoom(true).Crosshair(true).OnZoom((domain) => console.log(domain));
```

`Zoom(true)` works on the line, area, step, time line and multi-line charts.
Scroll to zoom in around the pointer, drag to pan, and double-click to reset.
Only the x axis zooms. The y axis refits to the visible points unless you call `ZoomFitY(false)`.
The chart updates in place, so the entry animation does not replay.
Reference lines, annotations, the grid and the crosshair follow the new scales.

| Setter | Default | What it does |
| --- | --- | --- |
| `Zoom(bool)` | `false` | Turn on wheel zoom, drag pan and double-click reset. |
| `ZoomMax(n)` | `40` | The most you can zoom in. `1` allows no zoom. |
| `ZoomFitY(bool)` | `true` | Refit the y axis to the visible points. |
| `ZoomDomain([lo, hi])` | `null` | The visible x range. Set it to start zoomed. It holds the zoomed range after a gesture, and a redraw keeps it. `null` shows everything. |
| `OnZoom((domain) => ...)` | unset | Runs after each gesture with the new `[lo, hi]`, or `null` after a reset. |

### Options for one chart

| Chart | Setters |
| --- | --- |
| Line, area, step, time line, multi-line | `Curve`, `Points`, `PointSize`, `Dash` (string or one per series), `Trendline`, `DomainX`, `DomainY`, `Opacity`, `Crosshair`, `LegendLabels`, `DateOptions`, and the zoom setters below. Area only: `Gradient`. Gaps in the data (`null` values) break the line. |
| Scatter | `R` (number or accessor), `MaxRadius`, `Group`, `Opacity`, `Trendline`, `DomainX`, `DomainY` |
| Pie | `InnerRadius`, `PadAngle`, `CornerRadius`, `StartAngle`, `EndAngle`, `Labels`, `ShowPercent`, `CentreText`, `ShowLegend` |
| Funnel | `ShowPercent` |
| Gauge | `Value`, `Min`, `Max`, `Thresholds`, `Label`, `Format` |
| Treemap | `Tile` (`"squarify"`, `"binary"`, `"slice"`, `"dice"`, `"sliceDice"`), `Padding` |
| Sankey | `Align` (`"justify"`, `"left"`, `"right"`, `"center"`), `NodeWidth`, `NodePadding` |
| Force network | `Charge`, `LinkDistance`, `Iterations`, `NodeRadius`, `Group` |

## Linked charts

`LineLinearSpark`, `HeatMapBlockedSimple` and `SingleHorzBarChart` can follow each other's hover.
They talk through events on `document.body`, so the charts need no reference to each other.

```javascript
const hover = new CustomEvent("day-hover", { detail: {} });

HeatMapBlockedSimple().WithHover(hover).Data(days);                     // sends and listens
LineLinearSpark().LinearAccessor((d) => d.date).WithHover(hover).Data(days); // sends and listens
LineLinearSpark().OnHover("day-hover").Data(days);                      // only listens
```

The sparkline shows a guide line and dot at the same date. The heat map highlights every block of that date.
`SingleHorzBarChart` sends `{ detail: { id } }` on the event named by `HoverEvent("name")`. The Linked charts card in the demo shows three charts together.

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
| `chart-kit.js` | The `makeChart` factory and the helpers every chart uses (axes, legend, tooltips, grow animation). |
| `charts-classic.js` | `BarChartSimple`, `GroupedBarChartSimple`, `DonutChartSimple`, `LineLinearSpark`, `LineTimeChartSimple`, `MultiLineTimeChartSimple`, `SingleHorzBarChart`, `LineAndBarChartSimple`, `HeatMapBlockedSimple`, `CircularHeatChartSimple`. |
| `charts-more.js` | The other 28 charts. |
| `features.js` | Themes, palettes, number formats, tooltip, events, export, resize. |
| `events.js` | Small DOM event helpers (`ready`, `addEventListener`). |
| `js/example.jsx`, `js/example-more.jsx`, `js/playground.jsx` | Source of the demo page and the playground. |
| `tests/` | Tests and the jsdom helper. |

To add a chart, write a render function in `charts-more.js` and export `() => makeChart(defaults, render)`.
Inside the render function, use the helpers from `chart-kit.js` (`axisBottom`, `axisLeft`, `legend`, `tip`, `colours`, `V`) so the chart gets the shared options for free.
Every key in `defaults` becomes a getter/setter. Then add a configuration and the expected number
of `.mark` elements to `tests/more-fixtures.js` (or `tests/classic-fixtures.js` for the first ten charts). The tests fail if an exported chart has no configuration,
if a chart writes `NaN` or `undefined` into an attribute, or if the mark count is wrong.

## Known limits

- Charts are not tested in a real browser by the test suite. The suite uses jsdom, which has no layout engine.
  Check the demo page after a change.
- Every chart redraws when you change a setter. There is no animated transition between two states of the data.
- `ForceNetworkSimple` runs its layout once per draw, so it does not animate.
- `HeatMapBlockedSimple` reads the `status` field of each record by default. Change it with `StatusAccessor`, or colour with `ColourFnZ`.

## Changes for code written against the first ten charts

The first ten charts were rebuilt on the shared factory. Their setter names are the same.
These things changed:

- Setters redraw the chart. `BarChartSimple.Data()` and `DonutChartSimple.Data()` no longer animate between states.
- Default margins are now `40 / 20 / 30 / 20` (left, right, bottom, top) instead of `0`, so axes are visible without setting margins.
- `ColourDomain` defaults to the keys in the data. `ColourRange` defaults to the theme palette (Tableau 10 in the light theme).
- `BarChartSimple` text labels (`WithText`) pick a contrasting colour. `TextFill` and `TextAnchor` default to automatic.
- `BaselineOffset` is now the value where bars start and defaults to `0`.
- `OnHover` accepts a function (called with the event, datum and node) or, on `LineLinearSpark` and `HeatMapBlockedSimple`, an event name for linked hover.
- `MultiLineTimeChartSimple` shows a crosshair and a tooltip that lists every line. The fixed "Passed / Connected / Fibre Km" tooltip is gone.
- `LineLinearSpark` draws the last value next to the line (`EndLabel(false)` hides it) and has no axes unless you turn them on with `ShowXAxis(true)` and `ShowYAxis(true)`.
- `HeatMapBlockedSimple` fills row by row, with `Orient("vertical")` for column by column.
- Removed because they had no effect: `WithSubmit` and `ColourFnZ` on `LineLinearSpark`, `WithTime` and `DomainZ` on `HeatMapBlockedSimple`.

## Credits

Mike Bostock for [Towards Reusable Charts](https://bost.ocks.org/mike/chart/).

Rob Moore at Toptal for [Updatable Charts](https://www.toptal.com/d3-js/towards-reusable-d3-js-charts).

## Prior art

[D3-ez](https://github.com/jamesleesaunders/d3-ez). James Lee Saunders' use of events and generalized data format functions was a useful example.

[D3-Timeseries](https://github.com/mcaule/d3-timeseries) by mcaule.

## License

BSD-2-Clause.
