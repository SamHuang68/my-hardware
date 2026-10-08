import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scriptPath = join(root, "scripts", "verify_asset_contrast.py");

test("asset visibility and contrast gate against light background (Rule 0003)", () => {
  const result = spawnSync("python", [scriptPath], {
    cwd: root,
    encoding: "utf8"
  });

  if (result.error) {
    throw new Error(`Failed to execute verify_asset_contrast.py: ${result.error.message}`);
  }

  assert.equal(
    result.status,
    0,
    `Asset contrast gate failed:\n${result.stdout}\n${result.stderr}`
  );
  assert.ok(result.stdout.includes("SUCCESS: All registered image assets passed"));
});
