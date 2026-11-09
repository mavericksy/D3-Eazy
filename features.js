// Cross-cutting features shared by every chart: themes, palettes, number formats, tooltips,
// events, heading/background, export and auto-resize. Nothing here draws a chart.
import * as d3 from "d3";

// --- palettes and colour scales -------------------------------------------------------------

/** Named colour lists for `Palette("name")`. Add your own with `registerPalette`. */
export const palettes = {
  tableau10: d3.schemeTableau10,
  observable10: d3.schemeObservable10,
  category10: d3.schemeCategory10,
  set1: d3.schemeSet1,
  set2: d3.schemeSet2,
  set3: d3.schemeSet3,
  dark2: d3.schemeDark2,
  accent: d3.schemeAccent,
  paired: d3.schemePaired,
  pastel1: d3.schemePastel1,
  pastel2: d3.schemePastel2,
  // Colour-blind safe lists.
  okabeIto: ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#56B4E9", "#CC79A7", "#F0E442", "#000000"],
  tolBright: ["#4477AA", "#EE6677", "#228833", "#CCBB44", "#66CCEE", "#AA3377", "#BBBBBB"],
  tolMuted: ["#CC6677", "#332288", "#DDCC77", "#117733", "#88CCEE", "#882255", "#44AA99", "#999933", "#AA4499"],
  // Sampled from continuous scales.
  viridis: d3.quantize(d3.interpolateViridis, 8),
  plasma: d3.quantize(d3.interpolatePlasma, 8),
  cividis: d3.quantize(d3.interpolateCividis, 8),
  blues: d3.quantize(d3.interpolateBlues, 8).slice(2),
  greens: d3.quantize(d3.interpolateGreens, 8).slice(2),
  warm: d3.quantize(d3.interpolateWarm, 8),
  cool: d3.quantize(d3.interpolateCool, 8),
};
export const registerPalette = (name, colours) => {
  palettes[name] = colours;
};

/** Named continuous colour scales for the heat map charts (`Interpolator("viridis")`). */
export const interpolators = {
  blues: d3.interpolateBlues, greens: d3.interpolateGreens, oranges: d3.interpolateOranges,
  reds: d3.interpolateReds, purples: d3.interpolatePurples, greys: d3.interpolateGreys,
  viridis: d3.interpolateViridis, plasma: d3.interpolatePlasma, inferno: d3.interpolateInferno,
  magma: d3.interpolateMagma, cividis: d3.interpolateCividis, turbo: d3.interpolateTurbo,
  ylorrd: d3.interpolateYlOrRd, ylgnbu: d3.interpolateYlGnBu, rdylgn: d3.interpolateRdYlGn,
  rdbu: d3.interpolateRdBu, spectral: d3.interpolateSpectral, cool: d3.interpolateCool, warm: d3.interpolateWarm,
};
export function resolveInterpolator(value) {
  if (typeof value === "function") return value;
  return interpolators[String(value).toLowerCase()] || d3.interpolateBlues;
}

// --- themes ---------------------------------------------------------------------------------

const light = {
  name: "light",
  background: null,
  text: "#1c1e21",
  muted: "#5b6168",
  axis: "#8b9096",
  grid: "#e3e6ea",
  palette: d3.schemeTableau10,
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  tooltipBackground: "rgba(28, 30, 33, 0.93)",
  tooltipText: "#ffffff",
};

/** Built-in themes. A theme is a plain object. Add your own with `registerTheme`. */
export const themes = {
  light,
  dark: {
    ...light, name: "dark", background: "#14161a", text: "#e8eaed", muted: "#a0a6ad",
    axis: "#6b7178", grid: "#2b2f35", palette: d3.schemeObservable10,
    tooltipBackground: "rgba(240, 242, 245, 0.96)", tooltipText: "#111111",
  },
  minimal: { ...light, name: "minimal", axis: "transparent", grid: "#eeeeee", muted: "#777777" },
  highContrast: {
    ...light, name: "highContrast", background: "#ffffff", text: "#000000", muted: "#000000",
    axis: "#000000", grid: "#8a8a8a", palette: palettes.okabeIto, tooltipBackground: "#000000",
  },
  colourBlind: { ...light, name: "colourBlind", palette: palettes.okabeIto },
};
export const registerTheme = (name, theme) => {
  themes[name] = { ...light, ...theme, name };
};

const darkMode = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Turn a theme name, "auto" (follow the operating system), or a partial object into a full theme. */
export function resolveTheme(value) {
  if (value === "auto") return darkMode() ? themes.dark : themes.light;
  if (value && typeof value === "object") return { ...(themes[value.extends] || light), ...value };
  return themes[value] || light;
}

/** The colour list a chart uses: explicit ColourRange, else the named Palette, else the theme palette. */
export function rangeOf(o) {
  if (o.ColourRange) return o.ColourRange;
  if (o.Palette) return palettes[o.Palette] || (Array.isArray(o.Palette) ? o.Palette : resolveTheme(o.Theme).palette);
  return resolveTheme(o.Theme).palette;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- number formats -------------------------------------------------------------------------

/** Number format presets for `Locale("de-DE")`. A `Locale` can also be a d3 locale definition object. */
export const locales = {
  "en-US": { decimal: ".", thousands: ",", grouping: [3], currency: ["$", ""] },
  "en-GB": { decimal: ".", thousands: ",", grouping: [3], currency: ["£", ""] },
  "de-DE": { decimal: ",", thousands: ".", grouping: [3], currency: ["", " €"] },
  "fr-FR": { decimal: ",", thousands: " ", grouping: [3], currency: ["", " €"] },
  "nb-NO": { decimal: ",", thousands: " ", grouping: [3], currency: ["", " kr"] },
  "ja-JP": { decimal: ".", thousands: ",", grouping: [3], currency: ["¥", ""] },
};
const localeCache = new Map();
function localeOf(locale) {
  const def = typeof locale === "string" ? locales[locale] || locales["en-US"] : locale || locales["en-US"];
  if (!localeCache.has(def)) localeCache.set(def, d3.formatLocale(def));
  return localeCache.get(def);
}

/** A format function from a d3 format string (like ",.1f" or "$,.0f") or a function. Returns null for no format. */
export function makeFormatter(o, spec) {
  if (!spec) return null;
  if (typeof spec === "function") return spec;
  return localeOf(o.Locale).format(spec);
}

/** Like makeFormatter, but for an axis. Dates use d3 time formats. Band axes keep their labels. */
export function axisFormatter(o, scale, spec) {
  if (!spec || scale.bandwidth) return typeof spec === "function" ? spec : null;
  if (typeof spec === "function") return spec;
  const first = scale.domain()[0];
  return first instanceof Date ? d3.timeFormat(spec) : localeOf(o.Locale).format(spec);
}

// --- frame: background, fonts, heading ------------------------------------------------------

/**
 * Apply theme, background, font and the visible heading (title, subtitle, caption) to an <svg>.
 * `f` can be a chart's option object or a legacy chart's frame object.
 */
export function applyFrame(svg, f, width, height) {
  const theme = resolveTheme(f.Theme);
  svg.style("color", theme.text).style("font-family", f.FontFamily || theme.font);
  if (f.FontSize) svg.style("font-size", typeof f.FontSize === "number" ? `${f.FontSize}px` : f.FontSize);
  const background = f.Background === undefined || f.Background === null ? theme.background : f.Background;
  if (background) {
    svg.insert("rect", ":first-child").attr("class", "background").attr("width", width).attr("height", height).attr("fill", background);
  }
  const title = f.Title ?? f.title;
  const anchor = { left: "start", middle: "middle", centre: "middle", center: "middle", right: "end" }[f.TitleAlign || "left"] || "start";
  const x = anchor === "start" ? 8 : anchor === "middle" ? width / 2 : width - 8;
  let y = 20;
  if (f.ShowTitle && title) {
    svg.append("text").attr("class", "heading title").attr("x", x).attr("y", y).attr("text-anchor", anchor)
      .attr("font-size", 16).attr("font-weight", 600).attr("fill", theme.text).text(title);
    y += 16;
  }
  if (f.Subtitle) {
    svg.append("text").attr("class", "heading subtitle").attr("x", x).attr("y", y).attr("text-anchor", anchor)
      .attr("font-size", 12).attr("fill", theme.muted).text(f.Subtitle);
  }
  if (f.Caption) {
    svg.append("text").attr("class", "heading caption").attr("x", x).attr("y", height - 6).attr("text-anchor", anchor)
      .attr("font-size", 10).attr("fill", theme.muted).text(f.Caption);
  }
  return theme;
}

// --- tooltip, events, keyboard --------------------------------------------------------------

let tooltipNode = null;
function tooltipElement(theme) {
  if (!tooltipNode || !tooltipNode.isConnected) {
    tooltipNode = document.createElement("div");
    tooltipNode.className = "d3eazy-tooltip";
    tooltipNode.setAttribute("role", "tooltip");
    Object.assign(tooltipNode.style, {
      position: "fixed", pointerEvents: "none", zIndex: "9999", padding: "6px 9px", borderRadius: "6px",
      font: "12px/1.35 system-ui, sans-serif", opacity: "0", transition: "opacity 0.1s", maxWidth: "280px",
      whiteSpace: "pre-line", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    });
    document.body.appendChild(tooltipNode);
  }
  tooltipNode.style.background = theme.tooltipBackground;
  tooltipNode.style.color = theme.tooltipText;
  return tooltipNode;
}

/** Show the shared tooltip box at a viewport position. `o.TooltipHtml` makes `text` HTML. */
export function showTooltip(o, theme, text, x, y) {
  const el = tooltipElement(theme);
  if (o.TooltipHtml) el.innerHTML = text;
  else el.textContent = text;
  el.style.opacity = "1";
  const w = el.offsetWidth || 0, h = el.offsetHeight || 0;
  const vw = window.innerWidth || 1e9, vh = window.innerHeight || 1e9;
  el.style.left = `${Math.max(4, Math.min(x + 14, vw - w - 4))}px`;
  el.style.top = `${Math.max(4, Math.min(y + 14, vh - h - 4))}px`;
}

/** Hide the shared tooltip box. */
export function hideTooltip() {
  if (tooltipNode) tooltipNode.style.opacity = "0";
}

const MARK_TAGS = /^(rect|path|circle|line|polygon|ellipse|text)$/i;
/** The data-bound mark under an event target, or null. Axis ticks and legend rows do not count. */
function markOf(target, root) {
  for (let n = target; n && n !== root; n = n.parentNode) {
    if (n.__data__ !== undefined && n.tagName && MARK_TAGS.test(n.tagName) && !n.closest(".tick, .legend, .domain")) return n;
  }
  return null;
}

/** Hover tooltip, click and hover callbacks, hover highlight and keyboard access for one <svg>. */
export function wireInteractions(svg, o, theme) {
  const root = svg.node();
  const base = o.MarkOpacity ?? 1;
  const tooltip = o.Tooltip === "custom";
  const text = (node) => {
    const source = node.closest("[data-tip]");
    let value = source ? source.getAttribute("data-tip") : null;
    if (value && o.TooltipFormat) value = o.TooltipFormat(value, d3.select(source).datum(), source);
    return value;
  };
  const show = (value, x, y) => showTooltip(o, theme, value, x, y);
  const hide = hideTooltip;
  let current = null;
  const setHighlight = (node) => {
    if (!o.HoverHighlight) return;
    svg.selectAll(".mark").style("opacity", function () {
      return node && this !== node ? 0.35 : base;
    });
  };

  root.addEventListener("mousemove", (event) => {
    const node = markOf(event.target, root);
    if (node !== current) {
      current = node;
      setHighlight(node);
      if (typeof o.OnHover === "function") o.OnHover(event, node ? d3.select(node).datum() : null, node);
    }
    // An overlay that shows its own tooltip (a crosshair) marks itself with data-self-tooltip.
    if (event.target.closest && event.target.closest("[data-self-tooltip]")) return;
    const value = tooltip && node ? text(node) : null;
    if (value) show(value, event.clientX, event.clientY);
    else hide();
  });
  root.addEventListener("mouseleave", (event) => {
    if (current && typeof o.OnHover === "function") o.OnHover(event, null, null);
    current = null;
    setHighlight(null);
    hide();
  });
  if (o.OnClick) {
    root.style.cursor = "pointer";
    root.addEventListener("click", (event) => {
      const node = markOf(event.target, root);
      if (node) o.OnClick(event, d3.select(node).datum(), node);
    });
  }
  if (o.Focusable) {
    svg.selectAll(".mark")
      .attr("tabindex", 0)
      .attr("role", "img")
      .attr("aria-label", function () {
        return this.getAttribute("data-tip") || (this.querySelector("title") || {}).textContent || null;
      })
      .on("focus", function (event) {
        this.style.outline = `2px solid ${theme.text}`;
        const value = tooltip ? text(this) : null;
        const box = this.getBoundingClientRect();
        if (value) show(value, box.left + box.width / 2, box.top);
        setHighlight(this);
      })
      .on("blur", function () {
        this.style.outline = "";
        hide();
        setHighlight(null);
      })
      .on("keydown", function (event) {
        if ((event.key === "Enter" || event.key === " ") && o.OnClick) {
          event.preventDefault();
          o.OnClick(event, d3.select(this).datum(), this);
        }
      });
  }
}

// --- export ---------------------------------------------------------------------------------

const svgOf = (el) => (el && el.tagName && el.tagName.toLowerCase() === "svg" ? el : el.querySelector("svg"));

function sizeOf(svg) {
  const box = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
  return box.length === 4 && box[2] > 0 ? { width: box[2], height: box[3] } : { width: +svg.getAttribute("width") || 600, height: +svg.getAttribute("height") || 400 };
}

/** The chart inside `element` (or the <svg> itself) as a standalone SVG string at its design size. */
export function toSvgString(element) {
  const svg = svgOf(element);
  if (!svg) throw new Error("toSvgString: no <svg> found");
  const clone = svg.cloneNode(true);
  const { width, height } = sizeOf(svg);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  clone.style.maxWidth = "";
  return new XMLSerializer().serializeToString(clone);
}

function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download the chart as an .svg file. */
export function downloadSvg(element, filename = "chart.svg") {
  save(new Blob([toSvgString(element)], { type: "image/svg+xml;charset=utf-8" }), filename);
}

/** Render the chart to a PNG Blob. `scale` multiplies the pixel size. */
export function toPngBlob(element, { scale = 2, background = null } = {}) {
  const svg = svgOf(element);
  const { width, height } = sizeOf(svg);
  const fill = background || (svg.querySelector("rect.background") || {}).getAttribute?.("fill") || "#ffffff";
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
    };
    image.onerror = () => reject(new Error("PNG export failed: the SVG could not be loaded as an image"));
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(toSvgString(svg));
  });
}

/** Download the chart as a .png file. */
export async function downloadPng(element, filename = "chart.png", options) {
  save(await toPngBlob(element, options), filename);
}

// --- resize ---------------------------------------------------------------------------------

/** Call `callback({width, height})` when `element` changes size. Does nothing without ResizeObserver. */
export function observeResize(element, callback) {
  if (typeof ResizeObserver === "undefined") return null;
  let first = true;
  const observer = new ResizeObserver(() => {
    if (first) { first = false; return; } // the first call only reports the starting size
    const { width, height } = element.getBoundingClientRect();
    if (width > 0 && height > 0) callback({ width, height });
  });
  observer.observe(element);
  return observer;
}
