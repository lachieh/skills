#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


def run(*args, cwd):
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{args}:\n{result.stdout}\n{result.stderr}")
    return result.stdout.strip()


def publish(marketplace, remote, tag):
    release = json.loads((marketplace / "release.json").read_text())
    version = release["version"]
    if tag != f"v{version}":
        raise ValueError("Source tag and release version differ")
    with tempfile.TemporaryDirectory(prefix="lachie-publish-") as temp:
        repo = Path(temp)
        run("git", "init", "--initial-branch=codex", cwd=repo)
        run("git", "remote", "add", "origin", remote, cwd=repo)
        run("git", "config", "user.name", "github-actions[bot]", cwd=repo)
        run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com", cwd=repo)
        refs = run("git", "ls-remote", "origin", "refs/heads/codex", f"refs/tags/codex-{tag}", cwd=repo)
        if f"refs/tags/codex-{tag}" in refs:
            run("git", "fetch", "origin", f"refs/tags/codex-{tag}", cwd=repo)
            published = json.loads(run("git", "show", "FETCH_HEAD:release.json", cwd=repo))
            if published != release:
                raise ValueError("Release tag already exists for different source; publish a new version")
            for source in marketplace.rglob("*"):
                if source.is_file():
                    relative = source.relative_to(marketplace).as_posix()
                    blob = subprocess.check_output(["git", "show", f"FETCH_HEAD:{relative}"], cwd=repo)
                    if blob != source.read_bytes():
                        raise ValueError(f"Existing release differs: {relative}")
            print(f"codex-{tag} is already published; leaving the release channel unchanged")
            return
        if "refs/heads/codex" in refs:
            run("git", "fetch", "origin", "refs/heads/codex", cwd=repo)
            run("git", "reset", "--hard", "FETCH_HEAD", cwd=repo)
            previous = json.loads((repo / "release.json").read_text())
            if tuple(map(int, previous["version"].split("."))) >= tuple(map(int, version.split("."))):
                raise ValueError("Refusing to replace the release channel with an older or equal version")
            run("git", "rm", "-r", ".", cwd=repo)
        shutil.copytree(marketplace, repo, dirs_exist_ok=True)
        run("git", "add", ".", cwd=repo)
        run("git", "commit", "-m", f"Release Codex plugin {tag} from {release['source_commit']}", cwd=repo)
        run("git", "tag", f"codex-{tag}", cwd=repo)
        run("git", "push", "--atomic", "origin", "HEAD:refs/heads/codex", f"refs/tags/codex-{tag}", cwd=repo)
    print(f"Published codex-{tag} and advanced the codex release channel")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("marketplace", type=Path)
    parser.add_argument("--remote", required=True)
    parser.add_argument("--tag", required=True)
    args = parser.parse_args()
    publish(args.marketplace.resolve(), args.remote, args.tag)
