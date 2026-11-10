// Bundles js/example.jsx (the demo page) into js/main.js for index.html.
import { build } from "esbuild";

await build({
  entryPoints: ["js/example.jsx"],
  bundle: true,
  format: "iife",
  outfile: "js/main.js",
  target: "es2020",
  sourcemap: true,
  logLevel: "info",
});
