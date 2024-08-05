import * as d3 from "d3";
import { DateTime } from "luxon";
import { addEventListener } from "./events.js";
//
const isUndef = (a, fn) => fn(a) === undefined;
//
const debugLog = (l) => console.debug(l);
//
// TODO test and tweak responsive charts
function responsivefy(svg) {
  var container = d3.select(svg.node().parentNode),
    parent = container._groups[0][0].getBoundingClientRect(),
    width = parseInt(parent.width, 10),
    height = parseInt(parent.height, 10),
    aspect = width / height;
  svg
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("perserveAspectRatio", "xMinYMid meet")
    .call(resize);
  function resize(evt) {
    var base = container._groups[0][0];
    var parent = base.getBoundingClientRect();
    var targetWidth = parseInt(parent.width, 10);
    var targetHeight = Math.round(targetWidth / aspect);
    base.setAttribute("width", targetWidth);
    base.setAttribute("height", targetHeight);
    svg.attr("width", targetWidth);
    svg.attr("height", targetHeight);
    //svg.attr("viewBox", "0 0 " + targetWidth + " " + targetHeight);
  }
  d3.select(window).on("resize." + container.attr("id"), resize);
}
//
// TODO objects parameters for more configurability
function getBaseSVG(_selection, _svg_id, _dimensions, _responsivefy) {
  const _d = _dimensions;
  return d3
    .select(_selection)
    .append("svg")
    .attr("id", _svg_id)
    .attr("style", "max-width: 100%;overflow:visible;")
    .call(_responsivefy);
}
//
const base_variables = {
  //
  svgID: undefined,
  value: undefined,
  /*
   * TODO: compass orientation
   *
   * Horizontal or Vertical along the baseline
   */
  orientation: "horizontal",
  //
  baseline_offset: 1,
  /*
   *
   */
  data: [],
  data_domain: [],
  data_max: [],
  //
};
//
const base_update = {};
//
// TODO: ALL VARIABLES BETTER NAMES
function BarChartSimple(name) {
  //
  var band,
    val,
    svg_id,
    // vertical or horizontal
    // Horizontal: Band is X axis, Val is Y axis
    // Vertical:   Band is Y Axis, Val is X axis
    orient = "horizontal",
    //
    band_domain = [],
    band_accessor = (d) => d.key,
    val_domain = [],
    colour = d3.scaleOrdinal(),
    colourDomain = ["A", "B"],
    colourRange = d3.schemeTableau10,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      width: width,
      height: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    withText = false,
    textFill = ["black", "lightgrey"],
    textAnchor = ["end", "end"],
    textDeltaY = 0,
    textDeltaX = 0,
    textFormat = (d) => d,
    fontDividend = 4,
    domainRound = false,
    barLengthPercentage = 50,
    domainAsObj = false,
    debug = false,
    baseline_offset = 1,
    corner_radius_x = 3,
    barPadding = 0.1;
  //
  //
  var updateData,
    updateDataMax,
    updateDataDomain,
    updateDataSort,
    updateDomain,
    updateOrient,
    updateWidth,
    updateHeight,
    updateMarginLeft,
    updateMarginRight,
    updateMarginBottom,
    updateMarginTop,
    updateDomainVal,
    updateDomainBand,
    updateBandAccessor,
    updateColour,
    updateColourRange,
    updateColourDomain,
    updateWithText,
    updateTextFill,
    updateTextAnchor,
    updateTextDeltaY,
    updateTextDeltaX,
    updateTextFormat,
    updateDomainRound,
    updateBarLength,
    updateCornerRadiusX;
  //

  // BarChartSimple
  function chart(selection) {
    //
    selection.each(function () {
      //
      var boundedWidth = dims.width - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.height - dims.marginTop - dims.marginBottom,
        barSpacing = boundedHeight / data.length,
        barHeight = barSpacing - barPadding,
        widthScale = boundedWidth / val_domain[1];
      //
      if (debug) {
        console.log(dims);
        console.log(boundedHeight, boundedWidth);
      }
      //
      var chartColour = colour.domain(colourDomain).range(colourRange);
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      svg
        .append("g")
        .attr("width", svg.attr("width"))
        .attr("transform", `translate(${dims.marginLeft},${dims.marginTop})`);

      //
      var quant_band = d3
        .scaleBand()
        .domain(
          // TODO: match object or default
          domainAsObj ? band_domain.map((d) => band_accessor(d)) : band_domain,
        )
        .rangeRound(
          orient == "vertical" ? [0, boundedHeight] : [0, boundedWidth],
        )
        .padding(barPadding);
      //
      var val_linear = d3.scaleLinear().domain(val_domain);
      //
      domainRound
        ? val_linear.rangeRound(
            orient === "vertical" ? [0, boundedWidth] : [boundedHeight, 0],
          )
        : val_linear.range(
            orient === "vertical" ? [0, boundedWidth] : [boundedHeight, 0],
          );
      //
      var bottomAxis = svg
        .select("g")
        .append("g")
        .attr("transform", `translate(0,${boundedHeight})`);
      var leftAxis = svg
        .select("g")
        .append("g")
        .attr("transform", `translate(0,0)`);
      //
      //
      function transitionDims(svg) {
        if (orient === "vertical") {
          svg
            .attr("height", 0)
            .attr("y", (d) => quant_band(band(d)) + quant_band.bandwidth() / 2)
            .transition()
            .ease(d3.easeLinear)
            .duration(500)
            .delay(function (d, i) {
              return i * 50;
            })
            .attr("height", quant_band.bandwidth())
            .attr("y", (d) => quant_band(band(d)))
            .attr("width", (d) => val_linear(val(d)) - val_linear(0));
        } else {
          svg
            .attr("width", 0)
            .attr("x", (d) => quant_band(band(d)) + quant_band.bandwidth() / 2)
            .attr("y", boundedHeight)
            .attr("height", 0)
            .transition()
            .ease(d3.easeLinear)
            .duration(500)
            .delay(function (d, i) {
              return i * 50;
            })
            .attr("width", quant_band.bandwidth())
            .attr("y", (d) => val_linear(val(d)))
            .attr("x", (d) => quant_band(band(d)))
            .attr("height", (d) => boundedHeight - val_linear(val(d)));
        }
      }
      //
      svg
        .select("g")
        .append("g")
        .selectAll()
        .data(data)
        .join("rect")
        .attr("fill", (d) => chartColour(band(d)))
        .attr("x", (d) =>
          orient == "vertical"
            ? val_linear(baseline_offset)
            : quant_band(band(d)),
        )
        .attr("y", (d) =>
          orient == "vertical" ? quant_band(band(d)) : val_linear(val(d)),
        )
        .attr("rx", corner_radius_x)
        .call(transitionDims);
      //
      if (withText) {
        svg
          .select("g")
          .append("g")
          .attr("fill", textFill[0])
          .attr("text-anchor", textAnchor[0])
          .selectAll()
          .data(data)
          .join("text")
          .attr("class", "bar-text")
          .attr("x", (d) =>
            orient == "vertical"
              ? val_linear(0)
              : quant_band(band(d)) + quant_band.bandwidth() / 2,
          )
          .attr("y", (d) =>
            orient == "vertical"
              ? quant_band(band(d)) + quant_band.bandwidth() / 2
              : boundedHeight,
          )
          .attr("dy", textDeltaY)
          .attr("dx", textDeltaX)
          .attr("font-size", (d) => quant_band.bandwidth() / fontDividend)
          .attr("opacity", 0)

          .text((d) => textFormat(val(d)))
          .call((text) =>
            text
              .filter(function (d) {
                var dimm = Math.abs(val_linear(val(d)) - val_linear(0));
                var is =
                  dimm >
                  (orient === "vertical" ? boundedWidth : boundedHeight) *
                    (barLengthPercentage / 100);
                return is;
              })
              .attr("dx", orient == "vertical" ? textDeltaX * -1 : textDeltaX)
              .attr(
                "dy",
                orient == "vertical" ? textDeltaY : textDeltaY * 2 * -1,
              )
              .attr("fill", textFill[1])
              .attr("text-anchor", textAnchor[1]),
          )

          .transition()
          .duration(500)
          .ease(d3.easeLinear)
          .attr("x", (d) =>
            orient == "vertical"
              ? val_linear(val(d))
              : quant_band(band(d)) + quant_band.bandwidth() / 2,
          )
          .attr("y", (d) =>
            orient == "vertical"
              ? quant_band(band(d)) + quant_band.bandwidth() / 2
              : val_linear(val(d)),
          )
          .attr("opacity", 1);
      }
      //
      //
      var bottomGen = d3
        .axisBottom(orient === "vertical" ? val_linear : quant_band)
        .ticks(4);
      var leftGen = d3
        .axisLeft(orient === "vertical" ? quant_band : val_linear)
        .ticks(5);
      orient === "vertical"
        ? leftGen.tickFormat((d, i) =>
            domainAsObj ? band_domain[i].val : band_domain[i],
          )
        : bottomGen.tickFormat((d, i) =>
            domainAsObj ? band_domain[i].val : band_domain[i],
          );
      //
      bottomAxis.call(bottomGen);
      leftAxis.call(leftGen);
      //
      //
      // Duplication
      updateData = function () {
        //
        quant_band.domain(data.map((d) => band(d)));
        val_linear.domain([0, d3.max(data, (d) => val(d))]);
        //
        var bottomGen = d3
          .axisBottom(orient === "vertical" ? val_linear : quant_band)
          .ticks(4);
        orient == "vertical"
          ? true
          : bottomGen.tickFormat((d, i) =>
              domainAsObj ? band_domain[i].val : band_domain[i],
            );
        bottomAxis.transition().duration(800).call(bottomGen);
        //
        var leftGen = d3
          .axisLeft(orient === "vertical" ? quant_band : val_linear)
          .ticks(5);
        leftAxis.transition().duration(800).call(leftGen);
        //
        function updateDims(svg) {
          if (orient === "vertical") {
            svg
              .attr("height", quant_band.bandwidth())
              .attr("y", (d) => quant_band(band(d)))
              .attr("x", (d) => val_linear(0))
              .transition()
              .ease(d3.easeLinear)
              .duration(500)
              .delay(function (d, i) {
                return i * 50;
              })
              .attr("width", (d) => val_linear(val(d)) - val_linear(0));
          } else {
            svg
              .attr("width", quant_band.bandwidth())
              .transition()
              .ease(d3.easeLinear)
              .duration(500)
              .delay(function (d, i) {
                return i * 50;
              })
              .attr("x", (d) => quant_band(band(d)))
              .attr("y", (d) => val_linear(val(d)))
              .attr("height", (d) => boundedHeight - val_linear(val(d)));
          }
        }

        svg
          .selectAll("rect")
          .data(data)
          .join("rect")
          .attr("fill", (d) => chartColour(band(d)))
          .call(updateDims);

        if (withText) {
          svg.selectAll("text.bar-text").remove();
          svg
            .append("g")
            .attr("fill", textFill[0])
            .attr("text-anchor", textAnchor[0])
            .selectAll()
            .data(data)
            .join("text")
            .attr("class", "bar-text")
            .attr("x", (d) =>
              orient == "vertical"
                ? val_linear(val(d))
                : quant_band(band(d)) + quant_band.bandwidth() / 2,
            )
            .attr("y", (d) =>
              orient == "vertical"
                ? quant_band(band(d)) + quant_band.bandwidth() / 2
                : boundedHeight,
            )
            .attr("dy", textDeltaY)
            .attr("dx", textDeltaX)
            .attr("font-size", (d) => quant_band.bandwidth() / fontDividend)
            .attr("opacity", 0)

            .text((d) => textFormat(val(d)))
            .call((text) =>
              // Is the bar larger than a % of range extent?
              text
                .filter(function (d) {
                  var dimm = Math.abs(val_linear(val(d)) - val_linear(0));
                  var is =
                    dimm >
                    (orient === "vertical" ? boundedWidth : boundedHeight) *
                      (barLengthPercentage / 100);
                  return is;
                })
                .attr("dx", orient == "vertical" ? textDeltaX * -1 : textDeltaX)
                .attr(
                  "dy",
                  orient == "vertical"
                    ? textDeltaY
                    : // offset to account for height of font
                      textDeltaY * 2 * -1,
                )
                .attr("fill", textFill[1])
                .attr("text-anchor", textAnchor[1]),
            )

            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", (d) =>
              orient == "vertical"
                ? val_linear(val(d))
                : quant_band(band(d)) + quant_band.bandwidth() / 2,
            )
            .attr("y", (d) =>
              orient == "vertical"
                ? quant_band(band(d)) + quant_band.bandwidth() / 2
                : val_linear(val(d)),
            )
            .attr("opacity", 1);
        }
      };
      updateDebug = function () {};
      updateBaselineOffset = function () {};
      updateCornerRadiusX = function () {};
      updateOrient = function () {};
      updateWidth = function () {};
      updateHeight = function () {};
      updateMarginLeft = function () {};
      updateMarginRight = function () {};
      updateMarginTop = function () {};
      updateMarginBottom = function () {};
      updateDomainVal = function () {};
      updateDomainBand = function () {};
      updateBandAccessor = function () {};
      updateColour = function () {};
      updateColourDomain = function () {};
      updateColourRange = function () {};
      updateWithText = function () {};
      updateTextFill = function () {};
      updateTextAnchor = function () {};
      updateTextDeltaY = function () {};
      updateTextDeltaX = function () {};
      updateTextFormat = function () {};
      updateDomainRound = function () {};
      updateBarLength = function () {};
      updateBarPadding = function () {};
    });
  }
  //
  chart.Debug = function (bool) {
    if (!arguments.length) return debug;
    debug = bool;
    if (typeof updateDebug === "function") updateDebug();
    return chart;
  };
  chart.BaselineOffset = function (val) {
    if (!arguments.length) return baseline_offset;
    baseline_offset = val;
    if (typeof updateBaselineOffset === "function") updateBaselineOffset();
    return chart;
  };
  chart.BarPadding = function (val) {
    if (!arguments.length) return barPadding;
    barPadding = val;
    if (typeof updateBarPadding === "function") updateBarPadding();
    return chart;
  };
  chart.CornerRadiusX = function (val) {
    if (!arguments.length) return corner_radius_x;
    corner_radius_x = val;
    if (typeof updateCornerRadiusX === "function") updateCornerRadiusX();
    return chart;
  };
  //
  chart.SvgID = function (val) {
    if (!arguments.length) return svg_id;
    svg_id = val;
    return chart;
  };
  //
  chart.WithText = function (bool) {
    if (!arguments.length) return withText;
    withText = bool;
    if (typeof updateWithText === "function") updateWithText();
    return chart;
  };
  //
  chart.TextFormat = function (val) {
    if (!arguments.length) return textFormat;
    textFormat = val;
    if (typeof updateTextFormat === "function") updateTextFormat();
    return chart;
  };
  //
  chart.FontDividend = function (val) {
    if (!arguments.length) return fontDividend;
    fontDividend = val;
    return chart;
  };
  //
  chart.TextFill = function (val) {
    if (!arguments.length) return textFill;
    textFill = val;
    if (typeof updateTextFill === "function") updateTextFill();
    return chart;
  };
  //
  chart.TextAnchor = function (val) {
    if (!arguments.length) return textAnchor;
    textAnchor = val;
    if (typeof updateTextAnchor === "function") updateTextAnchor();
    return chart;
  };
  //
  chart.TextDeltaY = function (val) {
    if (!arguments.length) return textDeltaY;
    textDeltaY = val;
    if (typeof updateTextDeltaY === "function") updateTextDeltaY();
    return chart;
  };
  //
  chart.TextDeltaX = function (val) {
    if (!arguments.length) return textDeltaX;
    textDeltaX = val;
    if (typeof updateTextDeltaX === "function") updateTextDeltaX();
    return chart;
  };
  //
  chart.Band = function (val) {
    if (!arguments.length) return band;
    band = val;
    return chart;
  };
  //
  chart.Val = function (v) {
    if (!arguments.length) return val;
    val = v;
    return chart;
  };
  //
  chart.Colour = function (val) {
    if (!arguments.length) return colour;
    colour = val;
    if (typeof updateColour === "function") updateColour();
    return chart;
  };
  //
  chart.ColourDomain = function (val) {
    if (!arguments.length) return colourDomain;
    colourDomain = val;
    if (typeof updateColourDomain === "function") updateColourDomain();
    return chart;
  };
  //
  chart.ColourRange = function (val) {
    if (!arguments.length) return colourRange;
    colourRange = val;
    if (typeof updateColourRange === "function") updateColourRange();
    return chart;
  };
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.DomainBand = function (val) {
    if (!arguments.length) return band_domain;
    band_domain = val;
    if (typeof updateDomainBand === "function") updateDomainBand();
    return chart;
  };
  //
  chart.BandAccessor = function (val) {
    if (!arguments.length) return band_accessor;
    band_accessor = val;
    if (typeof updateBandAccessor === "function") updateBandAccessor();
    return chart;
  };
  //
  chart.DomainBandAsObject = function (val) {
    if (!arguments.length) return domainAsObj;
    domainAsObj = val;
    return chart;
  };
  //
  chart.DomainRound = function (val) {
    if (!arguments.length) return domainRound;
    domainRound = val;
    if (typeof updateDomainRound === "function") updateDomainRound();
    return chart;
  };
  //
  chart.DomainVal = function (val) {
    if (!arguments.length) return val_domain;
    val_domain = val;
    if (typeof updateDomainVal === "function") updateDomainVal();
    return chart;
  };
  //
  chart.Orient = function (val) {
    if (!arguments.length) return orient;
    orient = val;
    if (typeof updateOrient === "function") updateOrient();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.width = width;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.height = height;
    if (typeof updateHeight === "function") updateHeight();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  chart.BarLength = function (val) {
    if (!arguments.length) return barLengthPercentage;
    barLengthPercentage = val;
    if (typeof updateBarLength === "function") updateBarLength();
    return chart;
  };
  //
  return chart;
}
//
//
function GroupedBarChartSimple() {
  //
  var data = [],
    svg_id = "",
    band_domain,
    subGroup_domain,
    group_accessor = (g) => g.name,
    val_domain,
    orient = "horizontal",
    colourDomain = ["A", "B"],
    colourRange = d3.schemeTableau10,
    colour = d3.scaleOrdinal(),
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    barPadding = 0.1,
    barGroupPadding = 0.1,
    subGroup_padding = 0.1,
    withText = false;
  //
  var updateData,
    updateDomain,
    updateOrient,
    updateColour,
    updateWidth,
    updateHeight,
    updateMarginLeft,
    updateMarginRight,
    updateMarginBottom,
    updateMarginTop,
    updateBarPadding,
    updateDomainVal,
    updateDomainBand,
    updateDomainSubgroup,
    updateColourRange,
    updateColourDomain,
    updateText,
    updateTextFill,
    updateTextAnchor,
    updateTextDeltaY,
    updateTextDeltaX;
  //
  // GroupedBarChartSimple
  function chart(selection) {
    selection.each(function () {
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom,
        barSpacing = boundedHeight / data.length,
        barHeight = barSpacing - barPadding;
      //
      var chartColour = colour.domain(colourDomain).range(colourRange);
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      svg
        .append("g")
        .attr("width", svg.attr("width"))
        .attr("transform", `translate(${dims.marginLeft},${dims.marginTop})`);
      //
      var groupBand = d3
        .scaleBand()
        .domain(band_domain)
        .rangeRound([0, boundedWidth])
        .paddingInner(barGroupPadding);
      //
      var subGroupBand = d3
        .scaleBand()
        .domain(subGroup_domain)
        .rangeRound([0, groupBand.bandwidth()])
        .padding(subGroup_padding);
      //
      var val_linear = d3
        .scaleLinear()
        .domain(val_domain)
        .nice()
        .rangeRound([boundedHeight, 0]);
      //
      //
      let groupedBarsData = svg
        .select("g")
        .append("g")
        .selectAll("g")
        // Enter in data = loop group per group
        .data(data)
        .join("g")
        .attr(
          "transform",
          (d) => `translate(${groupBand(group_accessor(d))}, 0)`,
        )
        .selectAll("rect")
        .data(function (d) {
          return subGroup_domain.map(function (key) {
            return { key: key, value: d[key], name: group_accessor(d) };
          });
        });

      var groupBarsRect = groupedBarsData
        .join("rect")
        .attr("x", (d) => subGroupBand(d.key) + subGroupBand.bandwidth() / 2)
        .attr("y", (d) => boundedHeight)
        .attr("width", 0)
        .attr("fill", (d) => chartColour(d.name))
        .transition()
        .duration(700)
        .ease(d3.easeLinear)
        .attr("height", (d) => boundedHeight - val_linear(d.value))
        .attr("y", (d) => val_linear(d.value))
        .attr("width", subGroupBand.bandwidth())
        .attr("x", (d) => subGroupBand(d.key));
      //
      if (withText) {
        var groupBarsText = groupedBarsData
          .join("text")
          .attr("x", (d) => subGroupBand(d.key))
          .attr("y", (d) => boundedHeight)
          .attr("dy", "2em")
          .attr("dx", (d) => subGroupBand.bandwidth() / 2)
          .attr("fill", "lightgrey")
          .attr("font-size", 0)
          .attr("text-anchor", "middle")
          .attr("opacity", 0)
          .text((d) => d.value)
          .transition()
          .duration(700)
          .ease(d3.easeLinear)
          .attr("y", (d) => val_linear(d.value) + subGroupBand.bandwidth() / 2)
          .attr("dy", "-2.5em")
          .attr("opacity", 1)
          .attr("font-size", (d) => subGroupBand.bandwidth() / 4);
      }
      //
      svg
        .select("g")
        .append("g")
        .attr("transform", `translate(0,${boundedHeight})`)
        .call(d3.axisBottom(groupBand).tickSizeOuter(0));
      //
      svg
        .select("g")
        .append("g")
        .attr("transform", `translate(0,0)`)
        .call(d3.axisLeft(val_linear));
      //
      //
      updateData = function () {};
      //
      updateColour = function () {};
      //
      updateColourDomain = function () {};
      //
      updateWidth = function () {};
      //
      updateHeight = function () {};
      //
      updateMarginTop = function () {};
      //
      updateMarginRight = function () {};
      //
      updateMarginBottom = function () {};
      //
      updateMarginLeft = function () {};
      //
    });
  }
  //
  chart.SvgID = function (val) {
    if (!arguments.length) return svg_id;
    svg_id = val;
    return chart;
  };
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.WithText = function (val) {
    if (!arguments.length) return withText;
    withText = val;
    if (typeof updateWithText === "function") updateWithText();
    return chart;
  };

  //
  chart.Band = function (val) {
    if (!arguments.length) return band_domain;
    band_domain = val;
    if (typeof updateDomainBand === "function") updateDomainBand();
    return chart;
  };
  //
  chart.Subgroup = function (val) {
    if (!arguments.length) return subGroup_domain;
    subGroup_domain = val;
    if (typeof updateDomainSubgroup === "function") updateDomainSubgroup();
    return chart;
  };
  //
  chart.DomainVal = function (val) {
    if (!arguments.length) return val_domain;
    val_domain = val;
    if (typeof updateDomainVal === "function") updateDomainVal();
    return chart;
  };
  //
  chart.Colour = function (val) {
    if (!arguments.length) return colour;
    colour = val;
    if (typeof updateColour === "function") updateColour();
    return chart;
  };
  //
  chart.ColourDomain = function (val) {
    if (!arguments.length) return colourDomain;
    colourDomain = val;
    if (typeof updateColourDomain === "function") updateColourDomain();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = width;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.h = height;
    if (typeof updateHeight === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  return chart;
}

//
function DonutChartSimple() {
  var svg_id = "",
    svg,
    pie,
    arc,
    data = [],
    val,
    key,
    valtext = (d) => d,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    colour = d3.scaleOrdinal(),
    colourDomain = ["A", "B"],
    colourRange = d3.schemePaired,
    chartColour,
    outerRadiusArc = dims.w / 3,
    innerRadiusArc = dims.w / 8,
    shadowWidth = 10,
    outerRadiusArcShadow = innerRadiusArc + 1,
    innerRadiusArcShadow = innerRadiusArc - shadowWidth,
    centerText;

  var updateData,
    createChart,
    updateWidth,
    updateHeight,
    updateMarginLeft,
    updateMarginRight,
    updateMarginBottom,
    updateMarginTop,
    updateCenterText,
    updateColourDomain,
    updateColourRange,
    updateVal,
    updateKey,
    updateValText;
  //
  //
  createChart = function (svg, dt, fn, outRad, inRad, fillFunc, clsName) {
    var arcIn = d3.arc().innerRadius(outRad).outerRadius(inRad);

    var path = svg
      .selectAll("." + clsName)
      .data(fn(dt))
      .join("path")
      .attr("class", clsName)
      .attr("d", arcIn)
      .attr("fill", fillFunc);

    path
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arcIn(interpolate(t));
        };
      });
  };
  //

  function chart(selection) {
    //
    selection.each(function () {
      //
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom,
        outerRadiusArcShadow = innerRadiusArc + 1,
        innerRadiusArcShadow = innerRadiusArc - shadowWidth;
      //
      svg = getBaseSVG(
        this,
        svg_id,
        (function (_d) {
          return {
            marginLeft: boundedWidth / 2 + _d.marginLeft,
            marginTop: boundedHeight / 2 + _d.marginTop,
          };
        })(dims),
        responsivefy,
      );
      //
      chartColour = colour.domain(colourDomain).range(colourRange);
      //
      pie = d3
        .pie()
        .value((d) => val(d))
        .padAngle(1 / outerRadiusArc)
        .sort((a, b) => d3.ascending(val(a), val(b)));

      arc = d3.arc().innerRadius(outerRadiusArc).outerRadius(innerRadiusArc);

      createChart(
        svg,
        data,
        pie,
        outerRadiusArc,
        innerRadiusArc,
        function (d, i) {
          return chartColour(key(d.data));
        },
        "path1",
      );

      createChart(
        svg,
        data,
        pie,
        outerRadiusArcShadow,
        innerRadiusArcShadow,
        function (d, i) {
          var c = d3.hsl(chartColour(key(d.data)));
          return d3.hsl(c.h + 5, c.s - 0.07, c.l - 0.15);
        },
        "path2",
      );
      //
      svg
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
        .selectAll()
        .data(pie(data))
        .join("text")
        .attr("class", "donut-text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .call((text) =>
          text
            .append("tspan")
            .attr("y", "-0.4em")
            .attr("font-weight", "bold")
            .attr("fill-opacity", 0)
            .text((d) => key(d.data))
            .transition()
            .duration(1000)
            .attr("fill-opacity", 1),
        )
        .call((text) =>
          text
            .filter((d) => d.endAngle - d.startAngle > 0.25)
            .append("tspan")
            .attr("x", 0)
            .attr("y", "0.7em")
            .attr("fill-opacity", 0)
            .text((d) => valtext(d.data).toLocaleString("en-US"))
            .transition()
            .duration(1000)
            .attr("fill-opacity", 1),
        );
      //
      svg
        .append("text")
        .text(centerText)
        .attr("text-anchor", "middle")
        .attr("fill", "#929DAF")
        .attr("font-size", "15px");
      //
      //
      updateData = function () {
        createChart(
          svg,
          data,
          pie,
          outerRadiusArc,
          innerRadiusArc,
          function (d, i) {
            return chartColour(key(d.data));
          },
          "path1",
        );

        createChart(
          svg,
          data,
          pie,
          outerRadiusArcShadow,
          innerRadiusArcShadow,
          function (d, i) {
            var c = d3.hsl(chartColour(key(d.data)));
            return d3.hsl(c.h + 5, c.s - 0.07, c.l - 0.15);
          },
          "path2",
        );
        //
        svg.selectAll("text.donut-text").remove();
        svg
          .append("g")
          .attr("font-family", "sans-serif")
          .attr("font-size", 12)
          .attr("text-anchor", "middle")
          .selectAll()
          .data(pie(data))
          .join("text")
          .attr("class", "donut-text")
          .attr("transform", (d) => `translate(${arc.centroid(d)})`)
          .call((text) =>
            text
              .append("tspan")
              .attr("y", "-0.4em")
              .attr("font-weight", "bold")
              .attr("fill-opacity", 0)
              .text((d) => key(d.data))
              .transition()
              .duration(1000)
              .attr("fill-opacity", 1),
          )
          .call((text) =>
            text
              .filter((d) => d.endAngle - d.startAngle > 0.25)
              .append("tspan")
              .attr("class", "donut-text")
              .attr("x", 0)
              .attr("y", "0.7em")
              .attr("fill-opacity", 0)
              .text((d) => valtext(d.data).toLocaleString("en-US"))
              .transition()
              .duration(1000)
              .attr("fill-opacity", 1),
          );
      };
      updateVal = function () {};
      updateValText = function () {};
      updateKey = function () {};
      updateWidth = function () {};
      updateHeight = function () {};
      updateCenterText = function () {};
    });
  }
  //
  chart.SvgID = function (val) {
    if (!arguments.length) return svg_id;
    svg_id = val;
    return chart;
  };
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.Val = function (v) {
    if (!arguments.length) return val;
    val = v;
    if (typeof updateVal === "function") updateVal();
    return chart;
  };
  //
  chart.ValText = function (val) {
    if (!arguments.length) return valtext;
    valtext = val;
    if (typeof updateValText === "function") updateValText();
    return chart;
  };
  //
  chart.Key = function (val) {
    if (!arguments.length) return key;
    key = val;
    if (typeof updateKey === "function") updateKey();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = val;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return width;
    height = val;
    dims.h = val;
    if (typeof updateHeight === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return dims.marginTop;
    marginTop = val;
    dims.marginTop = val;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return dims.marginRight;
    marginRight = val;
    dims.marginRight = val;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return dims.marginBottom;
    marginTop = val;
    dims.marginBottom = val;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  chart.MarginLeft = function (val) {
    if (!arguments.length) return dims.marginLeft;
    marginTop = val;
    dims.marginLeft = val;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.CenterText = function (val) {
    if (!arguments.length) return centerText;
    centerText = val;
    if (typeof updateCenterText === "function") updateCenterText();
    return chart;
  };
  //
  chart.OuterRadiusArc = function (val) {
    if (!arguments.length) return outerRadiusArc;
    outerRadiusArc = val;
    if (typeof updateOuterRadiusArc === "function") updateOuterRadiusArc();
    return chart;
  };
  //
  chart.InnerRadiusArc = function (val) {
    if (!arguments.length) return innerRadiusArc;
    innerRadiusArc = val;
    if (typeof updateInnerRadiusArc === "function") updateInnerRadiusArc();
    return chart;
  };
  //
  chart.ColourDomain = function (val) {
    if (!arguments.length) return colourDomain;
    colourDomain = val;
    if (typeof updateColourDomain === "function") updateColourDomain();
    return chart;
  };
  //
  chart.ColourRange = function (val) {
    if (!arguments.length) return colourRange;
    colourRange = val;
    if (typeof updateColourRange === "function") updateColourRange();
    return chart;
  };
  //
  return chart;
}
//
//
function LineLinearSpark() {
  var data = [],
    svg_id,
    linear_domain,
    val_domain,
    linear_accessor,
    val_accessor,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    chartColour,
    on_hover,
    with_hover = false;
  //
  var updateData;
  //
  //
  function chart(selection) {
    selection.each(function () {
      //
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom;
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      //
      var linear = d3
        .scaleTime()
        .domain(linear_domain)
        .range([0, boundedWidth]);
      //
      var val = d3.scaleLinear().domain(val_domain).range([boundedHeight, 0]);
      //
      var line = d3
        .line()
        .x((d, i) => linear(linear_accessor(d)))
        .y((d) => val(val_accessor(d)));
      //
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", chartColour)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "geometricPrecision")
        .attr("d", line);
      //
      var circle = svg
        .datum(data)
        .append("circle")
        .attr("id", (d, i) => "legend" + svg_id)
        .attr("class", "tooltip_circle" + svg_id)
        .style("fill", "lightgrey")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .attr("stroke", "lightgrey")
        .attr("r", 2);
      //
      var bar = svg
        .append("line")
        .attr("style", "stroke:#999; stroke-width:0.5; stroke-dasharray: 5 3;")
        .style("opacity", 0)
        .attr("y2", boundedHeight)
        .attr("x1", (d) => 0)
        .attr("x2", (d) => 0);
      //
      var top_left_text = svg
        .append("text")
        .style("opacity", 0)
        .attr("x", 0)
        .attr("y", 0)
        .text("0")
        .style("font-size", "2rem")
        .attr("alignment-baseline", "start");
      //
      var right_text_marker = svg
        .append("text")
        .attr("fill", "#999")
        .attr("x", boundedWidth + 5)
        .attr("y", val(val_accessor(data[0])))
        .text(val_accessor(data[0]).toFixed(0));
      //
      //
      var bisect = d3.bisector((d) => linear_accessor(d));
      //
      function makeHoverLook(date) {
        date = new Date(date.toJSDate().setUTCHours(0, 0, 0, 0));
        var ii = data.reduce(
          function (acc, c, i, arr) {
            if (c[0].getTime() === date.getTime()) {
              acc.y = c[1].length;
              acc.date = c[0];
            }
            return acc;
          },
          { date: date, y: 0 },
        );
        circle
          .attr("cx", linear(date))
          .attr("cy", val(ii.y))
          .style("opacity", 1);
        //
        bar
          .attr(
            "style",
            "stroke:#999; stroke-width:0.5; stroke-dasharray: 5 3;",
          )
          .style("opacity", 1)
          .attr("y2", boundedHeight)
          .attr("x1", (d) => linear(date))
          .attr("x2", (d) => linear(date));
        //
        top_left_text
          .style("opacity", 1)
          .text(ii.y.toFixed(0))
          .attr("fill", chartColour);
      }
      function clearHoverLook() {
        circle.style("opacity", 0);
        bar.style("opacity", 0);
        top_left_text.style("opacity", 0);
      }
      //
      if (typeof with_hover === "object") {
        //
        svg
          .append("rect")
          .style("fill", "none")
          .style("z-index", 1001)
          .style("pointer-events", "all")
          .attr("width", boundedWidth + 6)
          .attr("height", boundedHeight)
          .attr("transform", "translate(0,0)")
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseout", mouseout);

        //
        function mouseover(e) {}
        //
        function mousemove(e) {
          //
          var pos = d3.pointer(e),
            x0 = DateTime.fromJSDate(linear.invert(pos[0]));
          //
          var hover = with_hover;
          hover.detail.date = x0;
          hover.detail.obj = e.srcElement.__data__;
          hover.detail.originalEvent = e;
          hover.detail.posX = pos[0];
          hover.detail.posY = pos[1];
          hover.detail.enter = true;
          //
          //
          document.body.dispatchEvent(hover);
        }
        //
        function mouseout(e) {
          var hover = with_hover;
          hover.detail.enter = false;
          document.body.dispatchEvent(hover);
        }
        //
        function selfEvent(e) {
          if (e.detail.enter) {
            makeHoverLook(e.detail.date);
          } else {
            clearHoverLook();
          }
        }
        try {
          document.body.removeEventListener(with_hover.type, selfEvent);
        } catch (err) {
          console.error("Event Listener Error", err);
        } finally {
          addEventListener(document.body, with_hover.type, selfEvent);
        }
      }
      //
      if (typeof on_hover === "string") {
        //
        function hoverFn(e) {
          if (e.detail.enter) {
            var date = e.detail.date;
            makeHoverLook(date);
            //
          } else {
            clearHoverLook();
          }
        }
        //
        try {
          document.body.removeEventListener(on_hover, hoverFn);
        } catch (err) {
          console.error("Event Listener Error", err);
        } finally {
          addEventListener(document.body, on_hover, hoverFn);
        }
      }
      //
      updateData = function () {};
    });
  }
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.SvgID = function (val) {
    if (!arguments.length) return svg_id;
    svg_id = val;
    return chart;
  };
  //
  chart.OnHover = function (val) {
    if (!arguments.length) return on_hover;
    on_hover = val;
    return chart;
  };
  //
  chart.WithHover = function (val) {
    if (!arguments.length) return with_hover;
    with_hover = val;
    return chart;
  };
  //
  chart.ChartColour = function (val) {
    if (!arguments.length) return chartColour;
    chartColour = val;
    if (typeof updateChartColour === "function") updateChartColour();
    return chart;
  };
  //
  chart.DomainLinear = function (val) {
    if (!arguments.length) return linear_domain;
    linear_domain = val;
    if (typeof updateDomainLinear === "function") updateDomainLinear();
    return chart;
  };
  //
  chart.LinearAccessor = function (val) {
    if (!arguments.length) return linear_accessor;
    linear_accessor = val;
    if (typeof updateLinearAccessor === "function") updateLinearAccessor();
    return chart;
  };
  //
  chart.DomainVal = function (val) {
    if (!arguments.length) return val_domain;
    val_domain = val;
    if (typeof updateDomainVal === "function") updateDomainVal();
    return chart;
  };
  //
  chart.ValAccessor = function (val) {
    if (!arguments.length) return val_accessor;
    val_accessor = val;
    if (typeof updateValAccessor === "function") updateValAccessor();
    return chart;
  };
  //
  chart.ColourFnZ = function (val) {
    if (!arguments.length) return chartColour;
    chartColour = val;
    if (typeof updateColourFnZ === "function") updateColourFnZ();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = val;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return width;
    height = val;
    dims.h = val;
    if (typeof updateHeight === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return dims.marginTop;
    marginTop = val;
    dims.marginTop = val;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return dims.marginRight;
    marginRight = val;
    dims.marginRight = val;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return dims.marginBottom;
    marginTop = val;
    dims.marginBottom = val;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  chart.MarginLeft = function (val) {
    if (!arguments.length) return dims.marginLeft;
    marginTop = val;
    dims.marginLeft = val;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  return chart;
}
//
//
function LineTimeChartSimple() {
  var data = [],
    svg_id = "",
    time,
    linear,
    time_domain,
    linear_domain,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    colour = d3.scaleOrdinal(),
    colourDomain = ["A", "B"],
    colourRange = d3.schemeTableau10,
    strokeColour = "green",
    strokeWidth = 1.5;
  //
  var updateData,
    updateWidth,
    updateHeight,
    updateMarginLeft,
    updateMarginRight,
    updateMarginBottom,
    updateMarginTop,
    updateStrokeColour,
    updateStrokeWidth,
    updateTime,
    updateLinear,
    updateDomainTime,
    updateDomainLinear;
  //
  function chart(selection) {
    selection.each(function () {
      //
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom;
      //
      var chartColour = colour.domain(colourDomain).range(colourRange);
      //
      var val_time = d3
        .scaleTime()
        .domain(time_domain)
        .range([0, boundedWidth]);
      //
      var val_linear = d3
        .scaleLinear()
        .domain(linear_domain)
        .range([boundedHeight, 0]);
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      //
      svg.append("g").call(d3.axisLeft(val_linear).ticks(5));
      //
      svg
        .append("g")
        .attr("transform", `translate(0,${boundedHeight})`)
        .call(d3.axisBottom(val_time).ticks(5));
      //
      var xAxisGrid = d3
        .axisBottom(val_time)
        .tickSize(-boundedHeight)
        .tickFormat("")
        .ticks(5);
      var yAxisGrid = d3
        .axisLeft(val_linear)
        .tickSize(-boundedWidth)
        .tickFormat("")
        .ticks(5);
      svg
        .append("g")
        .attr("class", "x axis-grid")
        .attr("style", "opacity:20%;")
        .attr("transform", `translate(0,${boundedHeight})`)
        .call(xAxisGrid);
      svg
        .append("g")
        .attr("class", "y axis-grid")
        .attr("style", "opacity:20%;")
        .call(yAxisGrid);
      //
      let pathLength;
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", strokeColour)
        .attr("stroke-width", strokeWidth)
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return val_time(time(d));
            })
            .y(function (d) {
              return val_linear(linear(d));
            }),
        )
        .attr("stroke-dasharray", function () {
          return (pathLength = this.getTotalLength());
        })
        .attr("stroke-dashoffset", pathLength)
        .transition()
        .duration(1000)
        .on("start", function repeat() {
          d3.active(this).attr("stroke-dashoffset", 0);
        });
    });
  }
  //
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.h = val;
    if (typeof updateHeight === "function") updateHeight();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = val;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  chart.StrokeColour = function (val) {
    if (!arguments.length) return strokeColour;
    strokeColour = val;
    if (typeof updateStrokeColour === "function") updateStrokeColour();
    return chart;
  };
  //
  chart.StrokeWidth = function (val) {
    if (!arguments.length) return strokeWidth;
    strokeWidth = val;
    if (typeof updateStrokeWidth === "function") updateStrokeWidth();
    return chart;
  };
  //
  chart.Time = function (val) {
    if (!arguments.length) return time;
    time = val;
    if (typeof updateTime === "function") updateTime();
    return chart;
  };
  //
  chart.Linear = function (_) {
    if (!arguments.length) return linear;
    linear = _;
    if (typeof updateLinear === "function") updateLinear();
    return chart;
  };
  //
  chart.DomainLinear = function (val) {
    if (!arguments.length) return linear_domain;
    linear_domain = val;
    if (typeof updateDomainLinear === "function") updateDomainLinear();
    return chart;
  };
  //
  chart.DomainTime = function (val) {
    if (!arguments.length) return time_domain;
    time_domain = val;
    if (typeof updateTimeDomain === "function") updateTimeDomain();
    return chart;
  };
  //
  return chart;
}
//
function MultiLineTimeChartSimple() {
  //
  var data = [],
    svg_id = "",
    time,
    lineKeys,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    colour = d3.scaleOrdinal(),
    colourDomain = ["A", "B", "C"],
    colourRange = d3.schemeTableau10,
    withLegend = {},
    val_domain,
    time_domain,
    strokeWidth = 1.5,
    date_options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
  //
  var updateData,
    updateTime,
    updateLineKeys,
    updateLegend,
    updateColourDomain,
    updateColourRange,
    updateColour,
    updateDateOptions;
  //
  function chart(selection) {
    selection.each(function () {
      //
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom;
      //
      var chartColour = colour.domain(colourDomain).range(colourRange);
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      //
      const val_linear = d3
        .scaleLinear()
        .domain(val_domain)
        .range([boundedHeight, 0]);

      const val_time = d3
        .scaleTime()
        .domain(time_domain)
        .range([0, boundedWidth]);
      //
      svg
        .append("g")
        .attr("transform", `translate(0, ${boundedHeight})`)
        .call(d3.axisBottom(val_time).ticks(5));
      //
      svg.append("g").call(d3.axisLeft(val_linear).ticks(8));

      const xAxisGrid = d3
        .axisBottom(val_time)
        .tickSize(-boundedHeight)
        .tickFormat("")
        .ticks(5);
      const yAxisGrid = d3
        .axisLeft(val_linear)
        .tickSize(-boundedWidth)
        .tickFormat("")
        .ticks(8);
      svg
        .append("g")
        .attr("class", "x axis-grid")
        .attr("style", "opacity:20%;")
        .attr("transform", `translate(0,${boundedHeight})`)
        .call(xAxisGrid);
      svg
        .append("g")
        .attr("class", "y axis-grid")
        .attr("style", "opacity:20%;")
        .call(yAxisGrid);
      //
      // Data format: [{a:1,b:1,c:1,date:new Date()},...]
      // Needs to be: [
      //    [{key:"a",value:1,date:new Date()},...],
      //    [{key:"b",value:1,date:new Date()},...],
      //    [{key:"c",value:1,date:new Date()},...],
      //    ]
      //
      var map = d3.map(data, function (a) {
          return lineKeys.map(function (key) {
            return { key: key, value: a[key], date: time(a) };
          });
        }),
        trans_data = d3.transpose(map);
      //
      svg
        .append("g")
        .selectAll("path")
        .data(trans_data)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", (d) => chartColour(d[0].key))
        .attr("stroke-width", strokeWidth)
        .attr("shape-rendering", "geometricPrecision")
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return val_time(time(d));
            })
            .y(function (d) {
              return val_linear(d.value);
            }),
        )
        .attr("stroke-dasharray", function () {
          return this.getTotalLength();
        })
        .attr("stroke-dashoffset", function () {
          return this.getTotalLength();
        })
        .transition()
        .duration(1000)
        .on("start", function repeat() {
          d3.active(this).attr("stroke-dashoffset", 0);
        });
      //
      var legendItems = Object.keys(withLegend);
      if (legendItems.length) {
        var map = d3.map(legendItems, function (key) {
          return { key: key, value: withLegend[key] };
        });
        //
        var lx = 20;
        var lxt = lx + 15;
        var lyi = 30;
        var circle_rad = 6;
        svg
          .append("g")
          .datum(map)
          .selectAll("circle")
          .data((d) => d)
          .join("circle")
          .attr("cx", lx)
          .attr("cy", (d, i) => i * lyi + lx)
          .attr("r", circle_rad)
          .style("fill", (d) => chartColour(d.key));
        svg
          .append("g")
          .datum(map)
          .selectAll("circle")
          .data((d) => d)
          .join("text")
          .attr("x", lxt)
          .attr("y", (d, i) => i * lyi + lx)
          .text((d) => d.value)
          .style("font-size", "15px")
          .attr("fill", "lightgrey")
          .attr("alignment-baseline", "middle");

        var tooltip = d3
          .select("body")
          .append("div")
          .style("position", "absolute")
          .style("pointer-events", "none")
          .style("opacity", 0)
          .style("background-color", "#29384D")
          .style("border", "solid")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("padding", "10px")
          .style("z-index", "201");

        var circles = svg
          .append("g")
          .attr("class", "tooltip_circles")
          .datum(map)
          .selectAll("circle")
          .data((d) => d)
          .join("circle")
          .attr("id", (d) => "legend" + d.key)
          .style("fill", "lightgrey")
          .style("pointer-events", "none")
          .style("opacity", 0)
          .attr("stroke", "lightgrey")
          .attr("r", 3);

        svg
          .append("rect")
          .style("fill", "none")
          .style("z-index", 1001)
          .style("pointer-events", "all")
          .attr("width", boundedWidth)
          .attr("height", boundedHeight)
          .attr("transform", "translate(0,0)")
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseout", mouseout);
        //
        function mouseover(e) {
          tooltip.style("opacity", 1);
          d3.selectAll("g.tooltip_circles circle").style("opacity", 1);
        }
        //
        var bisect = d3.bisector(function (d) {
          return d.date;
        }).left;
        //
        function mousemove(e) {
          // TODO hardcoded tooltip not good. Add WithToolTip
          var x0 = val_time.invert(d3.pointer(e)[0]);
          var tooltip_units = {};
          var selectedData = {};
          trans_data.forEach(function (d) {
            var i = bisect(d, x0, 1);
            selectedData = d[i];
            d3.select("g.tooltip_circles circle#legend" + selectedData.key)
              .attr("cx", val_time(selectedData.date))
              .attr("cy", val_linear(selectedData.value));
            tooltip_units[selectedData.key] = selectedData.value;
          });
          tooltip
            .style("top", e.clientY - 180 + "px")
            .style("left", e.clientX - 120 + "px")
            .html(
              selectedData.date.toLocaleString("en-US", date_options) +
                "<br>Passed: " +
                tooltip_units.pass +
                "<br>Connected: " +
                tooltip_units.conn +
                "<br>Fibre Km: " +
                tooltip_units.f,
            );
        }
        //
        function mouseout(e) {
          tooltip.style("opacity", 0);
          d3.selectAll("g.tooltip_circles circle").style("opacity", 0);
        }
      }
    });
  }
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.Time = function (val) {
    if (!arguments.length) return time;
    time = val;
    if (typeof updateTime === "function") updateTime();
    return chart;
  };
  //
  chart.WithDateOptions = function (val) {
    if (!arguments.length) return date_options;
    date_options = val;
    if (typeof updateDateOptions === "function") updateDateOptions();
    return chart;
  };
  //
  chart.Colour = function (val) {
    if (!arguments.length) return colour;
    colour = val;
    if (typeof updateColour === "function") updateColour();
    return chart;
  };
  //
  chart.ColourDomain = function (val) {
    if (!arguments.length) return colourDomain;
    colourDomain = val;
    if (typeof updateColourDomain === "function") updateColourDomain();
    return chart;
  };
  //
  chart.ColourRange = function (val) {
    if (!arguments.length) return colourRange;
    colourRange = val;
    if (typeof updateColourRange === "function") updateColourRange();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.h = val;
    if (typeof updateHeight === "function") updateHeight();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = val;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  chart.LineKeys = function (val) {
    if (!arguments.length) return lineKeys;
    lineKeys = val;
    if (typeof updateLineKeys === "function") updateLineKeys();
    return chart;
  };
  //
  chart.WithLegend = function (val) {
    if (!arguments.length) return withLegend;
    withLegend = val;
    if (typeof updateLegend === "function") updateLegend();
    return chart;
  };
  //
  chart.DomainVal = function (val) {
    if (!arguments.length) return val_domain;
    val_domain = val;
    if (typeof updateDomainVal === "function") updateDomainVal();
    return chart;
  };
  //
  chart.DomainTime = function (val) {
    if (!arguments.length) return time_domain;
    time_domain = val;
    if (typeof updateDomainTime === "function") updateDomainTime();
    return chart;
  };
  //
  return chart;
}
//
//
function SingleHorzBarChart() {
  var data = [],
    svg_id = "",
    val,
    val_domain,
    band_domain,
    colour = d3.scaleOrdinal(),
    colourDomain = ["A", "B", "C"],
    colourRange = d3.schemeSet1,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    withHover = false,
    hoverEvent = "",
    inClick = false,
    inBar = false,
    withText = false;
  //
  var updateData,
    updateDomain,
    updateWidth,
    updateHeight,
    updateMarginLeft,
    updateMarginRight,
    updateMarginBottom,
    updateMarginTop,
    updateDomainVal,
    updateDomainBand,
    updateColour,
    updateColourRange,
    updateColourDomain,
    updateHover,
    updateHoverEvent,
    updateWithText;
  //
  //
  function chart(selection) {
    //
    selection.each(function () {
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom,
        barPadding = 0.1,
        barSpacing = boundedHeight / data.length,
        barHeight = barSpacing - barPadding;
      //
      var chartColour = colour.domain(colourDomain).range(colourRange);
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      //
      // Single band horizontally
      var yScale = d3.scaleBand().domain([""]);
      var yAxisGen = d3.axisLeft().tickValues("").scale(yScale);
      //
      var xScale = d3.scaleLinear().domain(val_domain).range([0, boundedWidth]);
      var xAxisGen = d3.axisBottom().scale(xScale);
      //
      var bars = svg
        .append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("fill", function (d) {
          return chartColour(d.key);
        })
        .attr("class", "category_bar")
        .attr("id", (d) => "bar" + d.key)
        .selectAll("rect")
        .data(function (d) {
          return d;
        })
        .join("rect")
        .attr("opacity", 1)
        .attr("x", (d) => xScale(d[0]))
        .attr("y", 0)
        .attr("width", 0)
        .attr("height", boundedHeight);
      //
      if (withHover) {
        if (data.length > 1) {
          //
          addEventListener(document.body, "click", function (d) {
            if (!inBar) {
              if (inClick) {
                inClick = !inClick;
                mouseleave();
              }
            }
          });

          function mouseover(e) {
            inBar = true;
            if (!inClick) {
              var subgroupName = d3.select(this.parentNode).datum().key;
              d3.selectAll(".category_bar").attr("opacity", 0.1);
              d3.selectAll("#bar" + subgroupName).attr("opacity", 1);
              if (hoverEvent !== "") {
                var event = new CustomEvent(hoverEvent, {
                  detail: { id: subgroupName },
                });
                document.body.dispatchEvent(event);
              }
            }
          }
          function mouseleave(e) {
            inBar = false;
            if (!inClick) {
              d3.selectAll(".category_bar").attr("opacity", 1);
              if (hoverEvent !== "") {
                var event = new CustomEvent(hoverEvent, { detail: { id: "" } });
                document.body.dispatchEvent(event);
              }
            }
          }
          function barClicked(e) {
            inClick = !inClick;
          }
          bars
            .on("mouseenter", mouseover)
            .on("mouseleave", mouseleave)
            .on("click", barClicked);
        }
      }
      //
      bars
        .transition()
        .duration(1000)
        .attr("width", (d) => xScale(d[1]) - xScale(d[0]));
      //
      if (withText) {
        svg
          .append("g")
          .attr("class", "text")
          .attr("fill", "lightgrey")
          .attr("text-anchor", "middle")
          .selectAll()
          .data(data)
          .join("text")
          .attr(
            "x",
            (d) => xScale(d[0][0]) + (xScale(d[0][1]) - xScale(d[0][0])) / 2,
          )
          .attr("y", boundedHeight)
          .attr("dy", "1em")
          .text((d) => d.key);
      }
      //
      //
      //
      updateData = function () {
        //
        svg
          .selectAll("g.category_bar")
          .data(data)
          .join("g")
          .attr("fill", function (d) {
            return chartColour(d.key);
          })
          .selectAll("rect")
          .data(function (d) {
            return d;
          })
          .join("rect")
          .transition()
          .duration(1000)
          .attr("x", (d) => xScale(d[0]))
          .attr("width", (d) => xScale(d[1]) - xScale(d[0]));
        //
        if (withText) {
          svg
            .selectAll("g.text")
            .attr("fill", "lightgrey")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(data)
            .join("text")
            .transition()
            .duration(1000)
            .attr(
              "x",
              (d) => xScale(d[0][0]) + (xScale(d[0][1]) - xScale(d[0][0])) / 2,
            )
            .attr("y", boundedHeight)
            .attr("dy", "1em")
            .text((d) => d.key);
        }
      };
      //
      updateColourDomain = function () {};
      //
      updateDomainVal = function () {
        xScale.domain(val_domain);
      };
    });
  }
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.Colour = function (val) {
    if (!arguments.length) return colour;
    colour = val;
    if (typeof updateColour === "function") updateColour();
    return chart;
  };
  //
  chart.ColourDomain = function (val) {
    if (!arguments.length) return colourDomain;
    colourDomain = val;
    if (typeof updateColourDomain === "function") updateColourDomain();
    return chart;
  };
  //
  chart.ColourRange = function (val) {
    if (!arguments.length) return colourRange;
    colourRange = val;
    if (typeof updateColourRange === "function") updateColourRange();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.h = val;
    if (typeof updateHeight === "function") updateHeight();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = val;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  chart.DomainVal = function (val) {
    if (!arguments.length) return val_domain;
    val_domain = val;
    if (typeof updateDomainVal === "function") updateDomainVal();
    return chart;
  };
  //
  chart.WithHover = function (val) {
    if (!arguments.length) return withHover;
    withHover = val;
    if (typeof updateHover === "function") updateHover();
    return chart;
  };
  //
  chart.HoverEvent = function (val) {
    if (!arguments.length) return hoverEvent;
    hoverEvent = val;
    if (typeof updateHoverEvent === "function") updateHoverEvent();
    return chart;
  };
  //
  chart.WithText = function (val) {
    if (!arguments.length) return withText;
    withText = val;
    if (typeof updateWithText === "function") updateWithText();
    return chart;
  };
  //
  return chart;
}
//
//
//
function LineAndBarChartSimple() {
  var data = [],
    svg,
    svg_id = "",
    orient = "horizontal",
    band,
    val,
    band_domain = [],
    val_domain = [],
    colour = d3.scaleOrdinal(),
    colourDomain = ["A", "B"],
    colourRange = d3.schemeTableau10,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    strokeColour = "green",
    strokeWidth = 1.5,
    threshold_bin = 0.3;
  //
  var updateData,
    updateBandDomain,
    updateValDomain,
    updateWidth,
    updateHeight,
    updateMarginLeft,
    updateMarginRight,
    updateMarginBottom,
    updateThresholdBin;
  //
  function chart(selection) {
    //
    selection.each(function () {
      //
      //
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom,
        barPadding = 0.1,
        barSpacing = boundedHeight / data.length,
        barHeight = barSpacing - barPadding;
      //
      var chartColour = colour.domain(colourDomain).range(colourRange);
      //
      svg = getBaseSVG(this, svg_id, dims, responsivefy);
      //
      var x = d3.scaleLinear().range([0, boundedWidth]);
      x.domain(band_domain);
      //
      var bottomGen = d3.axisBottom(x).tickFormat(function (d, i) {
        return d;
      });
      var bottomAxis = svg
        .append("g")
        .attr("transform", `translate(0, ${boundedHeight})`)
        .call(bottomGen);
      //
      var y = d3.scaleLinear().range([boundedHeight, 0]);
      y.domain(val_domain);
      //
      var leftGen = d3.axisLeft(y).ticks(5);
      var leftAxis = svg.append("g").call(leftGen);
      //
      //
      var bars = svg
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", 1)
        .attr("transform", function (d) {
          return `translate(${x(d.key)},${y(d.value)})`;
        })
        .attr("width", function (d) {
          return x(band_domain[1]) / band_domain[1] / 2;
        })
        .transition()
        .duration(1000)
        .attr("height", function (d) {
          return boundedHeight - y(d.value);
        })
        .style("fill", "#69b3a2");
      //
      var bins = d3
        .bin()
        .value((d) => d.key)
        .domain(x.domain())
        .thresholds(x.ticks(band_domain[1] * threshold_bin))(data);
      //
      var line = d3
        .line()
        .x(function (d, i) {
          return x(i == 0 ? bins[i].x0 : bins[i].x1);
        })
        .y(function (d) {
          return d.length
            ? y(d.map((d) => d.value).reduce((a, b) => a + b) / d.length)
            : y(0);
        })
        .curve(d3.curveMonotoneX);
      //
      var pathLength;
      var path = svg
        .append("path")
        .datum(bins)
        .attr("class", "path")
        .attr("fill", "none")
        .attr("stroke", strokeColour)
        .attr("stroke-width", strokeWidth)
        .attr("d", line)
        .attr("stroke-dasharray", function () {
          return (pathLength = this.getTotalLength());
        })
        .attr("stroke-dashoffset", pathLength);
      //
      path
        .transition()
        .duration(1000)
        .on("start", function repeat() {
          d3.active(this).attr("stroke-dashoffset", 0);
        });

      //
      //
      updateData = function () {
        //
        band_domain = [0, d3.max(data, (d) => parseInt(d.key))];
        x.domain(band_domain);
        var bottomGen = d3.axisBottom(x).tickFormat(function (d, i) {
          return d;
        });
        bottomAxis.transition().duration(800).call(bottomGen);
        //
        val_domain = [0, d3.max(data, (d) => d.value)];
        y.domain(val_domain);
        var leftGen = d3.axisLeft(y).ticks(5);
        leftAxis.transition().duration(800).call(leftGen);
        //
        bins = d3
          .bin()
          .value((d) => d.key)
          .domain(x.domain())
          .thresholds(x.ticks(band_domain[1] * threshold_bin))(data);
        //
        svg
          .selectAll("rect")
          .data(data)
          .join("rect")
          .transition()
          .duration(1000)
          .attr("transform", function (d) {
            return `translate(${x(d.key)},${y(d.value)})`;
          })
          .attr("width", function (d) {
            return x(band_domain[1]) / band_domain[1] / 2;
          })
          .attr("height", function (d) {
            return boundedHeight - y(d.value);
          })
          .style("fill", "#69b3a2");
        //
        line = d3
          .line()
          .x(function (d, i) {
            return x(i == 0 ? bins[i].x0 : bins[i].x1);
          })
          .y(function (d) {
            return d.length
              ? y(d.map((d) => d.value).reduce((a, b) => a + b) / d.length)
              : y(0);
          })
          .curve(d3.curveMonotoneX);
        //
        path
          .datum(bins)
          .join("path")
          .transition()
          .duration(800)
          .attr("d", line);
      };
    });
  }
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  chart.StrokeColour = function (val) {
    if (!arguments.length) return strokeColour;
    strokeColour = val;
    if (typeof updateStrokeColour === "function") updateStrokeColour();
    return chart;
  };
  //
  chart.StrokeWidth = function (val) {
    if (!arguments.length) return strokeWidth;
    strokeWidth = val;
    if (typeof updateStrokeWidth === "function") updateStrokeWidth();
    return chart;
  };
  //
  chart.BandDomain = function (val) {
    if (!arguments.length) return band_domain;
    band_domain = val;
    if (typeof updateBandDomain === "function") updateBandDomain();
    return chart;
  };
  //
  chart.ValDomain = function (val) {
    if (!arguments.length) return val_domain;
    val_domain = val;
    if (typeof updateValDomain === "function") updateValDomain();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.h = val;
    if (typeof updateHeight === "function") updateHeight();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = val;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  chart.ThresholdBin = function (val) {
    if (!arguments.length) return threshold_bin;
    threshold_bin = val;
    if (typeof updateThresholdBin === "function") updateThresholdBin();
    return chart;
  };
  //
  return chart;
}
//
// TODO newer version of data used here, with {Data:...,Summary:...} format
// TODO change all other functions to new format
//
function HeatMapBlockedSimple() {
  //
  var data = [],
    svg,
    svg_id = "",
    orient = "horizontal",
    data_accessor,
    date_accessor = (d) => d,
    chartColour,
    domain_z,
    sortFn = (a, b) => {
      return 0;
    },
    hover,
    on_hover,
    //
    extent = [],
    with_time = false,
    date_extent = 0,
    height_percentage = 0.2,
    width = 800,
    height = 600,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    marginTop = 0,
    dims = {
      w: width,
      h: height,
      marginRight: marginRight,
      marginLeft: marginLeft,
      marginTop: marginTop,
      marginBottom: marginBottom,
    },
    cell_spacing = 0.1;
  //
  var updateData;
  //
  function getData() {
    return data_accessor(data);
  }
  function getSummary() {
    return summary_accessor(data);
  }
  //
  function chart(selection) {
    selection.each(function () {
      //
      var boundedWidth = dims.w - dims.marginRight - dims.marginLeft,
        boundedHeight = dims.h - dims.marginTop - dims.marginBottom;
      //
      if (!data) {
        return;
      }
      if (svg_id == "") {
        return;
      }
      //
      var svg = getBaseSVG(this, svg_id, dims, responsivefy);
      //
      var thisData = getData();
      var data_length = thisData.length;
      //
      var updateDuration = 800,
        updateDelay = updateDuration / data_length;
      //
      //
      //
      var bandScaleSymarginLeftog = d3
        .scaleSymlog()
        .domain(with_time ? [0, date_extent] : extent)
        .constant(0.1)
        .range([boundedHeight * 0.05, boundedHeight * 0.95]);
      //
      //
      var _w_num = Math.ceil(data_length / date_extent),
        _h_num = date_extent,
        _block_height = boundedHeight / _h_num - cell_spacing * 2,
        _block_width = boundedWidth / _w_num - cell_spacing * 2;
      //
      var cell = svg
        .append("g")
        .attr("class", "cells")
        .attr("transform", `translate(0,0)`);
      //
      var day_marker = new Set();
      //
      cell
        .selectAll(".square")
        .data(thisData, (d) => d)
        .join("rect")
        .sort(sortFn)
        .attr("width", _block_width)
        .attr("height", 0)
        .attr("x", function (d, i) {
          var x0 = Math.floor(i % _w_num),
            ret = x0 + (cell_spacing + _block_width) * x0;
          return ret;
        })
        .attr("y", function (d, i) {
          var y0 = Math.floor(i / _w_num) % _h_num,
            ret = y0 + (cell_spacing + _block_height) * y0;
          return ret;
        })
        .style("fill", function (d) {
          return chartColour(d.status);
        })
        .style("stroke", "#111")
        .attr(
          "class",
          (d) => "a" + date_accessor(d).toLocaleString().replaceAll("/", "-"),
        )
        .classed("square", true)
        .attr("extra", (d) => date_accessor(d).toLocaleString())
        .attr("stroke-width", function (d, i) {
          var loc_date = date_accessor(d).toLocaleString();
          if (!day_marker.has(loc_date)) {
            day_marker.add(loc_date);
            return 2;
          }
          return 0.1;
        })
        .transition()
        .delay(function (d, i) {
          return (i - _h_num) * updateDelay;
        })
        .duration(updateDuration)
        .attr("height", _block_height);
      //
      //
      function makeHoverLook(date) {
        //
        var sq = document.querySelectorAll(".square");
        sq.forEach((d) => (d.style.opacity = 0.2));
        // TODO bad class names and mangling.
        var cl = document.querySelectorAll(
          ".a" + date.toLocaleString().replaceAll("/", "-"),
        );
        cl.forEach((d) => (d.style.opacity = 1));
      }
      function clearHoverLook() {
        var sq = document.querySelectorAll(".square");
        sq.forEach((d) => (d.style.opacity = 1));
      }
      //
      //
      if (typeof hover === "object") {
        var bisect = d3.bisector(date_accessor);
        cell.on("mousemove", (e) => {
          //
          var [posX, posY] = d3.pointer(e),
            event = hover,
            date = date_accessor(e.srcElement.__data__);
          event.detail.date = date;
          event.detail.obj = e.srcElement.__data__;
          event.detail.originalEvent = e;
          event.detail.posX = posX;
          event.detail.posY = posY;
          event.detail.enter = true;
          //
          document.body.dispatchEvent(event);
        });
        //
        cell.on("mouseleave", (e) => {
          var event = hover;
          event.detail.enter = false;
          document.body.dispatchEvent(event);
        });
        //
        function selfEvent(e) {
          if (e.detail.enter) {
            makeHoverLook(e.detail.date);
          } else {
            clearHoverLook();
          }
        }
        try {
          document.body.removeEventListener(hover.type, selfEvent);
        } catch (err) {
          console.error("Event Listener Error", err);
        } finally {
          addEventListener(document.body, hover.type, selfEvent);
        }
      }
      //
      if (typeof on_hover === "string") {
        //
        function hoverFn(e) {
          if (e.detail.enter) {
            var date = e.detail.date;
            makeHoverLook(date);
          } else {
            clearHoverLook();
          }
        }
        //
        try {
          document.body.removeEventListener(on_hover, hoverFn);
        } catch (err) {
          console.error("Event Listener Error", err);
        } finally {
          addEventListener(document.body, on_hover, hoverFn);
        }
      }
      //
      //
      updateData = function () {};
    });
  }
  //
  //
  chart.SvgID = function (val) {
    if (!arguments.length) return svg_id;
    svg_id = val;
    return chart;
  };
  //
  chart.Data = function (val) {
    if (!arguments.length) return data;
    data = val;
    if (typeof updateData === "function") updateData();
    return chart;
  };
  //
  chart.DateAccessor = function (val) {
    if (!arguments.length) return date_accessor;
    date_accessor = val;
    if (typeof updateDateAccessor === "function") updateDateAccessor();
    return chart;
  };
  //
  chart.SortFn = function (val) {
    if (!arguments.length) return sortFn;
    sortFn = val;
    if (typeof updateSortFn === "function") updateSortFn();
    return chart;
  };
  //
  chart.WithHover = function (val) {
    if (!arguments.length) return hover;
    hover = val;
    if (typeof updateHover === "function") updateHover();
    return chart;
  };
  //
  chart.OnHover = function (val) {
    if (!arguments.length) return on_hover;
    on_hover = val;
    if (typeof updateOnHover === "function") updateOnHover();
    return chart;
  };
  //
  chart.DataAccessor = function (val) {
    if (!arguments.length) return data_accessor;
    data_accessor = val;
    if (typeof updateDataAccessor === "function") updateDataAccessor();
    return chart;
  };
  //
  chart.DomainZ = function (val) {
    if (!arguments.length) return domain_z;
    domain_z = val;
    if (typeof updateDomainZ === "function") updateDomainZ();
    return chart;
  };
  //
  chart.ColourFnZ = function (val) {
    if (!arguments.length) return chartColour;
    chartColour = val;
    if (typeof updateColourFnZ === "function") updateColourFnZ();
    return chart;
  };
  //
  chart.ColourDomainZ = function (val) {
    if (!arguments.length) return colour_domain_z;
    colour_domain_z = val;
    if (typeof updateColourDomainZ === "function") updateColourDomainZ();
    return chart;
  };
  //
  chart.ColourRangeZ = function (val) {
    if (!arguments.length) return colour_range_z;
    colour_range_z = val;
    if (typeof updateColourRangeZ === "function") updateColourRangeZ();
    return chart;
  };
  //
  chart.Orient = function (val) {
    if (!arguments.length) return orient;
    orient = val;
    if (typeof updateOrient === "function") updateOrient();
    return chart;
  };
  //
  chart.WithTime = function (val) {
    if (!arguments.length) return with_time;
    with_time = val;
    if (typeof updateWithTime === "function") updateWithTime();
    return chart;
  };
  //
  chart.DateExtent = function (val) {
    if (!arguments.length) return date_extent;
    date_extent = val;
    if (typeof updateDateExtent === "function") updateDateExtend();
    return chart;
  };
  //
  chart.Width = function (val) {
    if (!arguments.length) return width;
    width = val;
    dims.w = width;
    if (typeof updateWidth === "function") updateWidth();
    return chart;
  };
  //
  chart.Height = function (val) {
    if (!arguments.length) return height;
    height = val;
    dims.h = height;
    if (typeof updateHeight === "function") updateWidth();
    return chart;
  };
  //
  chart.MarginLeft = function (val) {
    if (!arguments.length) return marginLeft;
    marginLeft = val;
    dims.marginLeft = marginLeft;
    if (typeof updateMarginLeft === "function") updateMarginLeft();
    return chart;
  };
  //
  chart.MarginRight = function (val) {
    if (!arguments.length) return marginRight;
    marginRight = val;
    dims.marginRight = marginRight;
    if (typeof updateMarginRight === "function") updateMarginRight();
    return chart;
  };
  //
  chart.MarginTop = function (val) {
    if (!arguments.length) return marginTop;
    marginTop = val;
    dims.marginTop = marginTop;
    if (typeof updateMarginTop === "function") updateMarginTop();
    return chart;
  };
  //
  chart.MarginBottom = function (val) {
    if (!arguments.length) return marginBottom;
    marginBottom = val;
    dims.marginBottom = marginBottom;
    if (typeof updateMarginBottom === "function") updateMarginBottom();
    return chart;
  };
  //
  //
  return chart;
}
//
//

//
//
//
export {
  BarChartSimple,
  GroupedBarChartSimple,
  DonutChartSimple,
  LineTimeChartSimple,
  MultiLineTimeChartSimple,
  SingleHorzBarChart,
  LineAndBarChartSimple,
  HeatMapBlockedSimple,
  LineLinearSpark,
};
