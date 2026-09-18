#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["PyYAML==6.0.3"]
# ///

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

import yaml

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ("skills", "agents", ".codex-plugin", ".claude-plugin", ".agents/plugins",
             "package.json", "index.js", "agent.json", "skills.json")


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n")


def build(output, tag=None):
    if "CLI version 0.30.0 " not in subprocess.check_output(["apm", "--version"], text=True):
        raise RuntimeError("Use APM 0.30.0 from mise.toml")
    manifest = yaml.safe_load((ROOT / "apm.yml").read_text())
    name, version = manifest["name"], manifest["version"]
    package = manifest["marketplace"]["packages"][0]
    if package["version"] != version or package["name"] != name:
        raise ValueError("Package and marketplace names and versions must match")
    if tag is not None and tag != f"v{version}":
        raise ValueError("Release tag must match apm.yml")
    if output.exists():
        raise FileExistsError(output)
    with tempfile.TemporaryDirectory(prefix="lachie-build-") as temp:
        scratch = Path(temp)
        # Install from a copy holding only the canonical APM source. Installing
        # from ROOT would let APM read the generated root `skills/` instead of
        # `.apm/skills/`, so the build would regenerate its own output and the
        # drift check could never fail.
        source = scratch / "source"
        source.mkdir()
        for entry in ("apm.yml", "apm.lock.yaml"):
            shutil.copyfile(ROOT / entry, source / entry)
        shutil.copytree(ROOT / ".apm", source / ".apm")
        consumer = scratch / "consumer"
        consumer.mkdir()
        (consumer / "apm.yml").write_text("name: release-build\nversion: 0.0.0\ndependencies:\n  apm: []\n")
        subprocess.run(["apm", "install", str(source), "--target", "claude,opencode"], cwd=consumer, check=True)
        staging = scratch / "staging"
        shutil.copytree(consumer / ".agents/skills", staging / ".apm/skills")
        shutil.copytree(consumer / ".claude/agents", staging / ".apm/agents")
        (staging / "apm.yml").write_text(yaml.safe_dump(manifest, sort_keys=False))
        shutil.copyfile(ROOT / "apm.lock.yaml", staging / "apm.lock.yaml")
        subprocess.run(["apm", "pack", "--format", "claude-plugin", "--archive", "--marketplace=claude,codex"], cwd=staging, check=True)
        archive, = (staging / "build").glob("*.zip")
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(scratch / "extracted")
        packed, = (scratch / "extracted").iterdir()
        shutil.copytree(packed / "skills", output / "skills")
        shutil.copytree(packed / "agents", output / "agents")
        native = json.loads((packed / "plugin.json").read_text())
        write_json(output / ".claude-plugin/plugin.json", native)
        codex = dict(native, skills="./skills/")
        codex["description"] = "Lachie's engineering principles and workflows."
        write_json(output / ".codex-plugin/plugin.json", codex)
        for catalog in (".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json"):
            (output / catalog).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(staging / catalog, output / catalog)
        _, header, body = (consumer / ".opencode/agents/lachie.md").read_text().split("---", 2)
        agent = yaml.safe_load(header)
        write_json(output / "agent.json", {"name": agent["name"], "description": agent["description"], "system": body.strip()})
        skills = []
        for file in sorted((output / "skills").glob("*/SKILL.md")):
            _, header, content = file.read_text().split("---", 2)
            info = yaml.safe_load(header)
            skills.append({"id": info["name"], "name": info["name"], "description": info["description"],
                           "location": file.relative_to(output).as_posix(), "content": content.strip()})
        write_json(output / "skills.json", skills)
        shutil.copyfile(ROOT / "scripts/templates/opencode2.js", output / "index.js")
        write_json(output / "package.json", {
            "name": name, "version": version, "type": "module", "main": "./index.js", "exports": "./index.js",
            "description": manifest["description"], "repository": manifest["repository"], "license": manifest["license"],
            "pi": {"skills": ["./skills"]},
            "files": ["index.js", "agent.json", "skills.json", "skills/", "agents/", ".codex-plugin/", ".claude-plugin/", ".agents/plugins/"],
        })
    print(f"Built combined native package {version}: {output}")


def file_map(root):
    return {p.relative_to(root): p.read_bytes() for p in root.rglob("*") if p.is_file()}


def sync(check=False):
    with tempfile.TemporaryDirectory(prefix="lachie-sync-") as temp:
        output = Path(temp) / "package"
        build(output)
        expected = file_map(output)
        actual = {}
        for entry in GENERATED:
            path = ROOT / entry
            if path.is_dir():
                actual.update({p.relative_to(ROOT): p.read_bytes() for p in path.rglob("*") if p.is_file()})
            elif path.is_file():
                actual[path.relative_to(ROOT)] = path.read_bytes()
        if check:
            if actual != expected:
                changed = sorted(str(p) for p in actual.keys() | expected.keys() if actual.get(p) != expected.get(p))
                raise RuntimeError("Generated files are stale; run build-release.py --sync: " + ", ".join(changed))
            print("Root native package matches canonical APM source")
            return
        for entry in GENERATED:
            destination = ROOT / entry
            if destination.is_dir():
                shutil.rmtree(destination)
            elif destination.exists():
                destination.unlink()
            source = output / entry
            destination.parent.mkdir(parents=True, exist_ok=True)
            if source.is_dir():
                shutil.copytree(source, destination)
            else:
                shutil.copyfile(source, destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate the combined native package from APM source")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--sync", action="store_true", help="Regenerate tracked native files at repository root")
    mode.add_argument("--check", action="store_true", help="Check root generated files without writing")
    parser.add_argument("--output", type=Path, default=ROOT / "build/release")
    parser.add_argument("--tag")
    args = parser.parse_args()
    if args.sync or args.check:
        sync(args.check)
    else:
        build(args.output.resolve(), args.tag)
