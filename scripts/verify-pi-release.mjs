import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const output = resolve(process.argv[2]);
const piRoot = resolve(process.argv[3]);
const { DefaultResourceLoader } = await import(pathToFileURL(join(piRoot, "dist/core/resource-loader.js")));
const scratch = mkdtempSync(join(tmpdir(), "lachie-pi-"));
try {
  const cwd = join(scratch, "project");
  const agentDir = join(scratch, "agent");
  mkdirSync(cwd);
  mkdirSync(agentDir);
  writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ skills: ["!**"] }));
  const env = { ...process.env, PI_CODING_AGENT_DIR: agentDir };
  execFileSync("pi", ["install", output], { cwd, env, stdio: "pipe" });
  const loader = new DefaultResourceLoader({ cwd, agentDir });
  await loader.reload();
  const skills = loader.getSkills().skills.filter(s => s.filePath.startsWith(join(output, "skills") + "/"));
  const expected = readdirSync(join(output, "skills")).sort();
  assert.deepEqual(skills.map(s => s.name).sort(), expected);
  assert.equal(loader.getExtensions().extensions.length, 0);
  console.log(`Verified Pi native package installation and discovery of ${skills.length} skills.`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
