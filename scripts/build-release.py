#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["PyYAML==6.0.3"]
# ///

import argparse
import copy
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

import yaml

ROOT = Path(__file__).resolve().parents[1]


def build(output, tag=None):
    apm_version = subprocess.check_output(["apm", "--version"], text=True).strip()
    if "CLI version 0.30.0 " not in apm_version:
        raise RuntimeError("Build releases with the APM 0.30.0 pinned in mise.toml")
    manifest = yaml.safe_load((ROOT / "apm.yml").read_text())
    version = manifest["version"]
    if not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", version):
        raise ValueError("Release version must be a stable major.minor.patch version")
    if tag is not None and tag != f"v{version}":
        raise ValueError(f"Tag {tag} does not match apm.yml version {version}")
    package = manifest["marketplace"]["packages"][0]
    if package["name"] != manifest["name"] or package["version"] != version:
        raise ValueError("Package and marketplace names and versions must match")
    if package["source"] != f"./plugins/{manifest['name']}":
        raise ValueError("Marketplace source must point to the generated release plugin")
    if output.exists():
        raise FileExistsError(f"Output already exists: {output}")

    with tempfile.TemporaryDirectory(prefix="lachie-release-") as temp:
        staging = Path(temp)
        shutil.copytree(ROOT / ".apm/skills", staging / ".apm/skills")
        # Codex plugins expose skills; standalone agents remain APM source primitives.
        manifest["includes"] = [".apm/skills/"]
        manifest["targets"] = ["codex"]
        manifest["description"] = "Lachie's engineering principles and workflows."
        package["description"] = manifest["description"]
        (staging / "apm.yml").write_text(yaml.safe_dump(manifest, sort_keys=False))
        shutil.copyfile(ROOT / "apm.lock.yaml", staging / "apm.lock.yaml")
        subprocess.run(
            ["apm", "pack", "--format", "agent-plugin", "--archive", "--marketplace=codex"],
            cwd=staging, check=True,
        )
        archive, = (staging / "build").glob("*.zip")
        extracted = staging / "extracted"
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(extracted)
        plugin, = extracted.iterdir()
        destination = output / "marketplace"
        shutil.copytree(plugin, destination / "plugins" / manifest["name"])
        shutil.copytree(staging / ".agents", destination / ".agents")
        shutil.copyfile(archive, output / f"{manifest['name']}-{version}-codex.zip")
        provenance = {
            "version": version,
            "source_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
            "apm_version": "0.30.0",
        }
        (destination / "release.json").write_text(json.dumps(provenance, indent=2) + "\n")
    build_native(output, yaml.safe_load((ROOT / "apm.yml").read_text()), provenance)
    print(f"Built Codex, Claude, and OpenCode 2 release {version}: {output}")


def build_native(output, manifest, provenance):
    name, version = manifest["name"], manifest["version"]
    with tempfile.TemporaryDirectory(prefix="lachie-native-") as temp:
        scratch = Path(temp)
        consumer = scratch / "consumer"
        consumer.mkdir()
        (consumer / "apm.yml").write_text("name: native-release\nversion: 0.0.0\ndependencies:\n  apm: []\n")
        subprocess.run(["apm", "install", str(ROOT), "--target", "claude,opencode"], cwd=consumer, check=True)
        claude_source = scratch / "claude"
        shutil.copytree(consumer / ".agents/skills", claude_source / ".apm/skills")
        shutil.copytree(consumer / ".claude/agents", claude_source / ".apm/agents")
        claude_manifest = copy.deepcopy(manifest)
        claude_manifest["marketplace"]["outputs"] = {"claude": {}}
        (claude_source / "apm.yml").write_text(yaml.safe_dump(claude_manifest, sort_keys=False))
        shutil.copyfile(ROOT / "apm.lock.yaml", claude_source / "apm.lock.yaml")
        subprocess.run(["apm", "pack", "--format", "claude-plugin", "--archive", "--marketplace=claude"], cwd=claude_source, check=True)
        archive, = (claude_source / "build").glob("*.zip")
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(scratch / "claude-extracted")
        plugin, = (scratch / "claude-extracted").iterdir()
        claude = output / "claude"
        shutil.copytree(plugin, claude / "plugins" / name)
        shutil.copytree(claude_source / ".claude-plugin", claude / ".claude-plugin")
        native_plugin = claude / "plugins" / name
        (native_plugin / ".claude-plugin").mkdir()
        (native_plugin / "plugin.json").rename(native_plugin / ".claude-plugin/plugin.json")
        (native_plugin / "apm.lock.yaml").unlink()
        shutil.make_archive(str(output / f"{name}-{version}-claude"), "zip", native_plugin)
        (claude / "release.json").write_text(json.dumps(provenance, indent=2) + "\n")

        opencode = output / "opencode2"
        shutil.copytree(consumer / ".agents/skills", opencode / "skills")
        agent = (consumer / ".opencode/agents/lachie.md").read_text()
        _, frontmatter, body = agent.split("---", 2)
        metadata = yaml.safe_load(frontmatter)
        (opencode / "agent.json").write_text(json.dumps({"name": metadata["name"], "description": metadata["description"], "system": body.strip()}, indent=2) + "\n")
        skills = []
        for file in sorted((opencode / "skills").glob("*/SKILL.md")):
            _, header, content = file.read_text().split("---", 2)
            info = yaml.safe_load(header)
            skills.append({"id": info["name"], "name": info["name"], "description": info["description"],
                           "location": file.relative_to(opencode).as_posix(), "content": content.strip()})
        (opencode / "skills.json").write_text(json.dumps(skills, indent=2) + "\n")
        shutil.copyfile(ROOT / "scripts/templates/opencode2.js", opencode / "index.js")
        (opencode / "package.json").write_text(json.dumps({
            "name": name, "version": version, "type": "module", "main": "./index.js",
            "exports": "./index.js", "description": manifest["description"],
            "repository": manifest["repository"], "license": manifest["license"],
            "files": ["index.js", "agent.json", "skills.json", "skills/"],
        }, indent=2) + "\n")
        (opencode / "release.json").write_text(json.dumps(provenance, indent=2) + "\n")
        shutil.make_archive(str(output / f"{name}-{version}-opencode2"), "zip", opencode)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build native releases from canonical APM source.")
    parser.add_argument("--output", type=Path, default=ROOT / "build/release")
    parser.add_argument("--tag")
    args = parser.parse_args()
    build(args.output.resolve(), args.tag)
