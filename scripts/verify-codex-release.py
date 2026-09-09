#!/usr/bin/env python3

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
NAME = "lachie-skills"


def run(*args, cwd, env):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{args}:\n{result.stdout}\n{result.stderr}")
    return result.stdout


def verify(marketplace):
    plugin = marketplace
    manifest = json.loads((plugin / ".codex-plugin/plugin.json").read_text())
    if manifest["name"] != NAME:
        raise RuntimeError("Expected a native Codex manifest")
    catalog = json.loads((marketplace / ".agents/plugins/marketplace.json").read_text())
    if catalog["plugins"][0]["source"] != {"source": "local", "path": "./"}:
        raise RuntimeError("Marketplace does not point to the release plugin")
    sources = {p.relative_to(ROOT / ".apm/skills"): p.read_bytes()
               for p in (ROOT / ".apm/skills").rglob("*") if p.is_file()}
    packaged = {p.relative_to(plugin / "skills"): p.read_bytes()
                for p in (plugin / "skills").rglob("*") if p.is_file()}
    if packaged != sources:
        raise RuntimeError("Released skills differ from canonical APM source")
    with tempfile.TemporaryDirectory(prefix="lachie-plugin-update-") as temp:
        scratch = Path(temp)
        remote = scratch / "remote"
        remote.mkdir()
        entries = json.loads((marketplace / "package.json").read_text())["files"] + ["package.json"]
        for entry in entries:
            source, destination = marketplace / entry, remote / entry
            destination.parent.mkdir(parents=True, exist_ok=True)
            if source.is_dir():
                shutil.copytree(source, destination)
            else:
                shutil.copyfile(source, destination)
        home = scratch / "codex-home"
        home.mkdir()
        consumer = scratch / "consumer"
        consumer.mkdir()
        git_config = scratch / "gitconfig"
        url = "https://github.com/lachieh/skills-release-test.git"
        git_config.write_text(f'[url "{remote.as_uri()}"]\n\tinsteadOf = {url}\n')
        env = {**os.environ, "CODEX_HOME": str(home), "GIT_CONFIG_GLOBAL": str(git_config),
               "GIT_CONFIG_NOSYSTEM": "1", "GIT_TERMINAL_PROMPT": "0"}
        run("git", "init", "--initial-branch=main", cwd=remote, env=env)
        run("git", "config", "user.name", "Release verification", cwd=remote, env=env)
        run("git", "config", "user.email", "release-verification@example.invalid", cwd=remote, env=env)
        run("git", "add", ".", cwd=remote, env=env)
        run("git", "commit", "-m", "First release fixture", cwd=remote, env=env)
        run("codex", "plugin", "marketplace", "add", url, cwd=consumer, env=env)
        run("codex", "plugin", "add", f"{NAME}@{NAME}", cwd=consumer, env=env)
        cache = home / "plugins/cache" / NAME / NAME

        def installed_files():
            matches = list(cache.glob("*/skills/lachie-mode/SKILL.md"))
            if len(matches) != 1:
                raise RuntimeError(f"Expected one installed Lachie mode, found {matches}")
            return matches[0].parents[1]

        installed = installed_files()
        for relative, content in sources.items():
            if (installed / relative).read_bytes() != content:
                raise RuntimeError(f"Codex did not install {relative} correctly")

        updated_plugin = remote
        updated_manifest = dict(manifest, version="999.0.0")
        (updated_plugin / ".codex-plugin/plugin.json").write_text(json.dumps(updated_manifest) + "\n")
        relative = Path("lachie-mode/SKILL.md")
        updated_content = sources[relative] + b"\nRelease update verification fixture.\n"
        (updated_plugin / "skills" / relative).write_bytes(updated_content)
        run("git", "add", ".", cwd=remote, env=env)
        run("git", "commit", "-m", "Second release fixture", cwd=remote, env=env)
        result = json.loads(run("codex", "plugin", "marketplace", "upgrade", NAME, "--json", cwd=consumer, env=env))
        if result.get("errors"):
            raise RuntimeError(f"Codex marketplace upgrade failed: {result['errors']}")
        # No reinstall: marketplace upgrade must refresh the already-installed plugin.
        candidates = list(cache.glob("*/skills/lachie-mode/SKILL.md"))
        if not any(p.read_bytes() == updated_content for p in candidates):
            raise RuntimeError("Marketplace upgrade did not update the installed plugin")
    print("Verified Codex native installation and installed-plugin update from the default branch.")



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("marketplace", type=Path)
    args = parser.parse_args()
    verify(args.marketplace.resolve())
