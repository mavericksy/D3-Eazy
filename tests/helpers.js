// Shared jsdom setup. Import this file before charts.js.
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
  pretendToBeVisual: true,
});

for (const key of ["window", "document", "CustomEvent", "Event"]) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  });
}

// jsdom has no layout engine, so give every element a fixed size.
dom.window.Element.prototype.getBoundingClientRect = function () {
  return { x: 0, y: 0, top: 0, left: 0, right: 600, bottom: 300, width: 600, height: 300 };
};

dom.window.SVGElement.prototype.getTotalLength = () => 100;

/** Create a fresh container div, attach it to the page, and return it. */
export function makeContainer(id) {
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  return el;
}

/** Wait one macrotask so queued microtask redraws and zero-delay timers run. */
export const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
