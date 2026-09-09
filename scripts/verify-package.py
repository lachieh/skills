#!/usr/bin/env python3

import json
from pathlib import Path
import subprocess
import tempfile
import tomllib
import zipfile


ROOT = Path(__file__).resolve().parents[1]


def run(*args, cwd=ROOT, quiet=False):
    result = subprocess.run(args, cwd=cwd, capture_output=quiet, text=True)
    if result.returncode and quiet:
        print(result.stdout + result.stderr)
    result.check_returncode()


def main():
    skills = ROOT / ".apm/skills"
    agent = ROOT / ".apm/agents/lachie.agent.md"
    source_files = {p.relative_to(skills): p.read_bytes() for p in skills.rglob("*") if p.is_file()}
    skill_names = {p.parent.name for p in skills.glob("*/SKILL.md")}
    if not skill_names or not agent.is_file():
        raise RuntimeError("Expected skills and the Lachie agent under .apm/")
    run("apm", "compile", "--validate", "--local-only", "--target", "codex")
    run("apm", "compile", "--dry-run", "--local-only", "--target", "codex")

    with tempfile.TemporaryDirectory(prefix="lachie-package-") as temp:
        scratch = Path(temp)
        output = scratch / "packed"
        run("apm", "pack", "--archive", "--marketplace=none", "--output", str(output))
        archives = list(output.glob("*.zip"))
        if len(archives) != 1:
            raise RuntimeError("Expected exactly one packed ZIP")
        with zipfile.ZipFile(archives[0]) as archive:
            prefix = archives[0].stem + "/"
            for relative, content in source_files.items():
                if archive.read(f"{prefix}skills/{relative.as_posix()}") != content:
                    raise RuntimeError(f"Packed skill differs from source: {relative}")
            if archive.read(prefix + "agents/lachie.agent.md") != agent.read_bytes():
                raise RuntimeError("Packed agent differs from source")
            if json.loads(archive.read(prefix + "plugin.json"))["name"] != "lachie-skills":
                raise RuntimeError("Unexpected packed identity")
            expected = {f"skills/{p.as_posix()}" for p in source_files}
            expected.update({"agents/lachie.agent.md", "plugin.json", "apm.lock.yaml"})
            actual = {entry.filename.removeprefix(prefix) for entry in archive.infolist() if not entry.is_dir()}
            if actual != expected:
                raise RuntimeError(f"Unexpected package contents: {actual ^ expected}")

        consumer = scratch / "consumer"
        consumer.mkdir()
        (consumer / "apm.yml").write_text(
            "name: verify-lachie\nversion: 0.0.0\ndependencies:\n  apm: []\n"
        )
        run("apm", "install", str(ROOT), "--target", "codex,opencode", cwd=consumer)
        deployed = consumer / ".agents/skills"
        for relative, content in source_files.items():
            if (deployed / relative).read_bytes() != content:
                raise RuntimeError(f"Installed skill differs from source: {relative}")
        if {p.parent.name for p in deployed.glob("*/SKILL.md")} != skill_names:
            raise RuntimeError("Installed skill inventory differs from source")

        source_body = agent.read_text().split("---", 2)[2].strip()
        codex = tomllib.loads((consumer / ".codex/agents/lachie.toml").read_text())
        if codex["name"] != "lachie" or codex["developer_instructions"].strip() != source_body:
            raise RuntimeError("Codex agent translation differs from source")
        if (consumer / ".opencode/agents/lachie.md").read_bytes() != agent.read_bytes():
            raise RuntimeError("OpenCode agent differs from source")
        if len(list((consumer / ".codex/agents").iterdir())) != 1:
            raise RuntimeError("Unexpected Codex agent artifacts")
        if len(list((consumer / ".opencode/agents").iterdir())) != 1:
            raise RuntimeError("Unexpected OpenCode agent artifacts")

        run("apm", "view", f"_local/{ROOT.name}", cwd=consumer)
        run("apm", "audit", cwd=consumer)

    print(f"Verified {len(skill_names)} skills, {len(source_files)} resources, and both agent projections.")


if __name__ == "__main__":
    main()
