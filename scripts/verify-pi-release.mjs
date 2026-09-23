import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const output = resolve(process.argv[2]);
const pi = execFileSync("mise", ["which", "pi"], { encoding: "utf8" }).trim();
const manifest = JSON.parse(readFileSync(join(output, "package.json"), "utf8"));
const expected = readdirSync(join(output, "skills")).sort();
const scratch = mkdtempSync(join(tmpdir(), "lachie-pi-"));
try {
  const cwd = join(scratch, "project");
  const agentDir = join(scratch, "agent");
  mkdirSync(cwd);
  mkdirSync(agentDir);
  writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ skills: ["!**"] }));
  const env = { ...process.env, PI_CODING_AGENT_DIR: agentDir };
  execFileSync(pi, ["install", output], { cwd, env, stdio: "pipe" });
  const inventory = execFileSync(pi, ["list"], { cwd, env, encoding: "utf8" });
  const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"));
  assert.equal(settings.packages.length, 1);
  assert.equal(resolve(agentDir, settings.packages[0]), output);
  assert.match(inventory, new RegExp(output.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.deepEqual(manifest.pi.skills, ["./skills"]);
  assert.equal(manifest.pi.extensions, undefined);
  assert.equal(manifest.pi.prompts, undefined);
  assert.equal(manifest.pi.themes, undefined);
  console.log(`Verified Pi native package installation and skill manifest with ${expected.length} skills.`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
