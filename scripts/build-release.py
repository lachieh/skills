#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["PyYAML==6.0.3"]
# ///

import argparse
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
    print(f"Built Codex marketplace release {version}: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the Codex release marketplace from canonical APM source.")
    parser.add_argument("--output", type=Path, default=ROOT / "build/release")
    parser.add_argument("--tag")
    args = parser.parse_args()
    build(args.output.resolve(), args.tag)
