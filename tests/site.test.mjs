import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const data = JSON.parse(readFileSync(join(root, "data.json"), "utf8"));
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");
const js = readFileSync(join(root, "app.js"), "utf8");

const allAssets = [
  ...data.hardware_registry,
  ...data.display_assets,
  ...data.peripherals,
  ...data.power_assets
];

test("scheduling truth is active 2, transferred 2, excluded 1", () => {
  assert.equal(data.hardware_registry.filter((item) => item.status === "active" && item.schedulable).length, 2);
  assert.equal(data.hardware_registry.filter((item) => item.status === "transferred" && !item.schedulable).length, 2);
  assert.equal(data.hardware_registry.filter((item) => item.status === "excluded" && !item.schedulable).length, 1);
  assert.deepEqual(
    data.hardware_registry.filter((item) => item.schedulable).map((item) => item.id),
    ["AI_STATION_01", "DESKTOP_PC_02"]
  );
});

test("registry contains 22 unique assets and every referenced image exists", () => {
  assert.equal(allAssets.length, 22);
  assert.equal(new Set(allAssets.map((item) => item.id)).size, allAssets.length);
  for (const item of allAssets) {
    assert.match(item.id, /^[A-Z0-9]+(?:_[A-Z0-9]+)*_[0-9]{2}$/);
    assert.ok(existsSync(join(root, item.image_path)), `missing image: ${item.image_path}`);
  }
});

test("summary and support counts match the registry", () => {
  const supporting = [...data.display_assets, ...data.peripherals, ...data.power_assets];
  assert.equal(data.registry_summary.active_nodes, 2);
  assert.equal(data.registry_summary.supporting_assets, 17);
  assert.equal(supporting.length, 17);
  assert.ok(supporting.every((item) => item.status === "supporting" && item.schedulable === false));
  assert.equal(data.last_updated, "2026-09-25");
});

test("page contains semantic landmarks, skip navigation, and evidence language", () => {
  for (const snippet of [
    'lang="en"',
    'class="skip-link"',
    'aria-label="Primary navigation"',
    '<main id="main-content">',
    '<time id="last-updated"',
    'Content-Security-Policy',
    'Hardware snapshot'
  ]) assert.ok(html.includes(snippet), `missing: ${snippet}`);
  assert.ok(!html.includes("System Sync Active"));
  assert.ok(!html.includes("High Performance Asset Database"));
});

test("interaction code avoids HTML injection and inline error handlers", () => {
  assert.ok(!js.includes("innerHTML"));
  assert.ok(!html.includes("onerror="));
  assert.ok(!html.includes("onclick="));
});

test("responsive and accessibility CSS has required gates", () => {
  assert.ok(css.includes(":focus-visible"));
  assert.ok(css.includes("prefers-reduced-motion: reduce"));
  assert.ok(css.includes("@media (max-width: 430px)"));
  assert.ok(!css.includes("overflow-x: hidden"));
  assert.ok(css.includes("minmax(0, 1fr)"));
});

test("language toggle HUD and default English contract are present", () => {
  assert.ok(html.includes('id="languageToggle"'));
  assert.ok(html.includes('class="language-toggle"'));
  assert.ok(html.includes('data-lang-option="en"'));
  assert.ok(html.includes('data-lang-option="zh"'));
  assert.ok(html.includes('data-language="en"'));
  assert.ok(js.includes('switchLanguage'));
  assert.ok(js.includes('currentLang'));
});
