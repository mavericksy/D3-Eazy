# Changelog

## Unreleased (branch `feat/harden-library-docs`)

This branch rebuilds the library on one shared chart factory. The first ten charts keep their setter
names. Read "Breaking changes" before you upgrade.

### Added

- 28 chart types: line, area, step, stacked area, stream graph, stacked bar, lollipop, dumbbell, slope,
  waterfall, histogram, scatter and bubble, candlestick, box plot, pie, funnel, gauge, radar, treemap, sunburst,
  circle packing, tree, chord, force network, Sankey, calendar heat map, heat grid, parallel coordinates.
  The library now has 38 charts.
- One set of options on every chart: themes (light, dark, minimal, high contrast, colour blind, auto), named
  and colour-blind safe palettes, legend position and toggling, custom tooltips, axis labels, formats, ticks and
  grid, reference lines, annotations, `Filter`, `SortBy`, `Limit`, locale number formats, data labels, mark
  styling, click and hover callbacks, keyboard access, fade-in animation that respects reduced motion,
  `AutoResize`, and export to SVG and PNG.
- Accessible names: `Title` and `Description` write `role="img"`, `<title>`, `<desc>` and `aria-labelledby`.
- Zoom, pan and double-click reset for the line, area and scatter charts, and a crosshair tooltip for line charts.
- Canvas renderer for scatter charts above 20,000 rows, with hit-testing and export.
- Line decimation for dense lines, and visible-slice drawing while zoomed.
- Linked hover between `LineLinearSpark`, `HeatMapBlockedSimple` and `SingleHorzBarChart` through document events.
- A demo page with a card for every chart, a playground with a control for most options, and page-wide
  theme and palette selectors.
- Tests: 837 with `node:test` and jsdom, including render, option, event, zoom, canvas, performance-shape and
  robustness suites. Lint with eslint.

### Fixed

- Two charts on one page shared data, because chart state was stored in implicit globals.
- Value labels on bar charts were off-centre, straddled the bar tops and used low-contrast colours.
- `MultiLineTimeChartSimple` drew nothing and ignored margins. `LineTimeChartSimple` ignored margins.
- `d3-eazy.js` exported nothing, and `package.json` listed files that did not exist, so the package held no chart code.
- A right-hand legend covered the plot. It now sits beside the plot.
- 37 charts threw on `Data(null)` or `Data(undefined)`. Zero, negative and tiny values broke circle packing,
  Sankey and chord diagrams. Missing data now shows `EmptyText`.
- Grow, draw-in and arc animations were cancelled by the fade transition on the same element.

### Breaking changes

- Setters redraw the chart. `Data()` on `BarChartSimple` and `DonutChartSimple` no longer animates between states.
- Default margins changed from `0` to `40 / 20 / 30 / 20` (left, right, bottom, top).
- `ColourDomain` defaults to the keys in the data. `ColourRange` defaults to the theme palette.
- `BaselineOffset` on `BarChartSimple` is now the value where bars start, and defaults to `0`.
- Bar label `TextFill` and `TextAnchor` default to automatic.
- Removed setters that had no effect: `WithSubmit` and `ColourFnZ` on `LineLinearSpark`, `WithTime` and
  `DomainZ` on `HeatMapBlockedSimple`.
- `MultiLineTimeChartSimple` no longer has a fixed "Passed / Connected / Fibre Km" tooltip. It lists every line.
- A scatter chart with more than 20,000 rows uses a canvas. Set `Renderer("svg")` to keep SVG elements.
- The `luxon` dependency is gone. `d3-sankey` is a new dependency.
