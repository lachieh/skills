#!/usr/bin/env python3

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
NAME = "lachie-skills"


def run(*args, cwd, env):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{args}:\n{result.stdout}\n{result.stderr}")
    return result.stdout


def verify(marketplace):
    plugin = marketplace / "plugins" / NAME
    manifest = json.loads((plugin / "plugin.json").read_text())
    if manifest["name"] != NAME or manifest["$schema"] != "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json":
        raise RuntimeError("Expected an APM-generated Agent Plugins v1 manifest")
    catalog = json.loads((marketplace / ".agents/plugins/marketplace.json").read_text())
    if catalog["plugins"][0]["source"] != {"source": "local", "path": f"./plugins/{NAME}"}:
        raise RuntimeError("Marketplace does not point to the release plugin")
    sources = {p.relative_to(ROOT / ".apm/skills"): p.read_bytes()
               for p in (ROOT / ".apm/skills").rglob("*") if p.is_file()}
    packaged = {p.relative_to(plugin / "skills"): p.read_bytes()
                for p in (plugin / "skills").rglob("*") if p.is_file()}
    if packaged != sources:
        raise RuntimeError("Released skills differ from canonical APM source")
    if (plugin / "agents").exists() or (plugin / ".codex").exists():
        raise RuntimeError("Codex plugins cannot register standalone agents")

    with tempfile.TemporaryDirectory(prefix="lachie-plugin-update-") as temp:
        scratch = Path(temp)
        remote = scratch / "remote"
        shutil.copytree(marketplace, remote)
        home = scratch / "codex-home"
        home.mkdir()
        consumer = scratch / "consumer"
        consumer.mkdir()
        git_config = scratch / "gitconfig"
        url = "https://github.com/lachieh/skills-release-test.git"
        git_config.write_text(f'[url "{remote.as_uri()}"]\n\tinsteadOf = {url}\n')
        env = {**os.environ, "CODEX_HOME": str(home), "GIT_CONFIG_GLOBAL": str(git_config),
               "GIT_CONFIG_NOSYSTEM": "1", "GIT_TERMINAL_PROMPT": "0"}
        run("git", "init", "--initial-branch=codex", cwd=remote, env=env)
        run("git", "config", "user.name", "Release verification", cwd=remote, env=env)
        run("git", "config", "user.email", "release-verification@example.invalid", cwd=remote, env=env)
        run("git", "add", ".", cwd=remote, env=env)
        run("git", "commit", "-m", "First release fixture", cwd=remote, env=env)
        run("git", "branch", "main", cwd=remote, env=env)
        run("codex", "plugin", "marketplace", "add", url, "--ref", "main", cwd=consumer, env=env)
        run("codex", "plugin", "marketplace", "remove", NAME, cwd=consumer, env=env)
        run("codex", "plugin", "marketplace", "add", url, "--ref", "codex", cwd=consumer, env=env)
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

        updated_plugin = remote / "plugins" / NAME
        updated_manifest = dict(manifest, version="999.0.0")
        (updated_plugin / "plugin.json").write_text(json.dumps(updated_manifest) + "\n")
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
        publication = scratch / "published.git"
        run("git", "init", "--bare", str(publication), cwd=scratch, env=env)
        version = json.loads((marketplace / "release.json").read_text())["version"]
        publish = (sys.executable, str(ROOT / "scripts/publish-release.py"))
        run(*publish, str(marketplace), "--remote", str(publication), "--tag", f"v{version}", cwd=scratch, env=env)
        run(*publish, str(marketplace), "--remote", str(publication), "--tag", f"v{version}", cwd=scratch, env=env)
        second = scratch / "second-release"
        shutil.copytree(marketplace, second)
        metadata = json.loads((second / "release.json").read_text())
        metadata["version"] = "999.0.0"
        (second / "release.json").write_text(json.dumps(metadata) + "\n")
        run(*publish, str(second), "--remote", str(publication), "--tag", "v999.0.0", cwd=scratch, env=env)
        latest = run("git", "rev-parse", "refs/heads/codex", cwd=publication, env=env)
        run(*publish, str(marketplace), "--remote", str(publication), "--tag", f"v{version}", cwd=scratch, env=env)
        if run("git", "rev-parse", "refs/heads/codex", cwd=publication, env=env) != latest:
            raise RuntimeError("Retrying an old release rewound the release channel")
        metadata["version"] = "998.0.0"
        (second / "release.json").write_text(json.dumps(metadata) + "\n")
        rejected = subprocess.run(
            [*publish, str(second), "--remote", str(publication), "--tag", "v998.0.0"],
            cwd=scratch, env=env, capture_output=True, text=True,
        )
        if rejected.returncode == 0 or "older or equal" not in rejected.stderr:
            raise RuntimeError("An older release was not rejected")
    print("Verified Codex plugin installation and automatic installed-plugin refresh, and safe release publication.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("marketplace", type=Path)
    args = parser.parse_args()
    verify(args.marketplace.resolve())
