#!/usr/bin/env node
// Copy the Vite build into demo/ and fail if the result is not a relative-path
// static bundle. The gallery serves demo/index.html from a sub-path, so an
// absolute "/assets/..." reference would break it.
import { cpSync, existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const demo = join(root, "demo");

if (!existsSync(join(dist, "index.html"))) {
  console.error("build failed: dist/index.html missing");
  process.exit(1);
}

rmSync(demo, { recursive: true, force: true });
cpSync(dist, demo, { recursive: true });

const html = readFileSync(join(demo, "index.html"), "utf8");
const absolute = [...html.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)].map((match) => match[1]);
if (absolute.length) {
  console.error(`demo/index.html still uses absolute paths: ${absolute.join(", ")}`);
  process.exit(1);
}
if (!html.includes("app.js")) {
  console.error("demo/index.html does not reference app.js");
  process.exit(1);
}
const appBytes = statSync(join(demo, "app.js")).size;
if (appBytes < 100_000) {
  console.error(`demo/app.js looks too small for the built app (${appBytes} bytes)`);
  process.exit(1);
}
if (!html.includes("demo-banner")) {
  console.error("demo/index.html lost the gallery banner");
  process.exit(1);
}

console.log(`vite build copied to demo/ (app.js ${(appBytes / 1024).toFixed(0)} kB, relative assets)`);
