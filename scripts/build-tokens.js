import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const base = JSON.parse(
  readFileSync(resolve(root, "tokens/base.json"), "utf-8"),
);
const dark = JSON.parse(
  readFileSync(resolve(root, "tokens/dark.json"), "utf-8"),
);
const light = JSON.parse(
  readFileSync(resolve(root, "tokens/light.json"), "utf-8"),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten a nested token object into [cssVarName, value] pairs */
function flatten(obj, prefix = "") {
  const entries = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${key}` : key;
    if (val.$value !== undefined) {
      entries.push([`--${path}`, val.$value]);
    } else {
      entries.push(...flatten(val, path));
    }
  }
  return entries;
}

/** Format CSS variable declarations with indentation */
function toCssBlock(entries, indent = "  ") {
  return entries
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const baseEntries = flatten(base);
const darkEntries = flatten(dark);
const lightEntries = flatten(light);

// --- CSS -------------------------------------------------------------------

const css = `/* ==========================================================================
   Ash Lumen Design Tokens (generated — do not edit)
   Source: tokens/*.json
   Run: pnpm build:tokens
   ========================================================================== */

:root {
${toCssBlock(baseEntries)}
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
${toCssBlock(darkEntries, "    ")}
  }
}

@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
${toCssBlock(lightEntries, "    ")}
  }
}

[data-theme="dark"] {
  color-scheme: dark;
${toCssBlock(darkEntries)}
}

[data-theme="light"] {
  color-scheme: light;
${toCssBlock(lightEntries)}
}
`;

writeFileSync(resolve(root, "src/tokens.css"), css);

const count = baseEntries.length + darkEntries.length + lightEntries.length;
console.log(`Generated ${count} token declarations → src/tokens.css`);
