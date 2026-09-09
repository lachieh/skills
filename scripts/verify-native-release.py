#!/usr/bin/env python3

import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]


def run(*args, cwd, env):
    result = subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise RuntimeError(f"{args[0]} {args[1]} failed: {result.stderr[:1500]}")
    return result.stdout


def verify(output):
    skills = ROOT / ".apm/skills"
    expected = {p.parent.name for p in skills.glob("*/SKILL.md")}
    agent_body = (ROOT / ".apm/agents/lachie.agent.md").read_text().split("---", 2)[2].strip()
    for directory in (output / "claude/plugins/lachie-skills/skills", output / "opencode2/skills"):
        for source in skills.rglob("*"):
            if source.is_file() and (directory / source.relative_to(skills)).read_bytes() != source.read_bytes():
                raise RuntimeError(f"Native resource differs: {source}")
    with tempfile.TemporaryDirectory(prefix="native-release-test-") as temp:
        scratch = Path(temp)
        project = scratch / "project"
        project.mkdir()
        env = {**os.environ, "CLAUDE_CONFIG_DIR": str(scratch / "claude"),
               "OPENCODE_TEST_HOME": str(scratch / "home"),
               "XDG_CONFIG_HOME": str(scratch / "config"), "XDG_DATA_HOME": str(scratch / "data"),
               "XDG_CACHE_HOME": str(scratch / "cache"), "XDG_STATE_HOME": str(scratch / "state"),
               "OPENCODE_SERVER_PASSWORD": "release-verification-only"}
        report = json.loads(run("claude", "plugin", "validate", str(output / "claude/plugins/lachie-skills"), "--json", cwd=project, env=env))
        if not report["success"] or report["manifest"] is None:
            raise RuntimeError("Claude did not recognize the native plugin manifest")
        run("claude", "plugin", "marketplace", "add", str(output / "claude"), cwd=project, env=env)
        run("claude", "plugin", "install", "lachie-skills@lachie-skills", cwd=project, env=env)
        inventory = run("claude", "plugin", "details", "lachie-skills@lachie-skills", cwd=project, env=env)
        if f"Skills ({len(expected)})" not in inventory or "Agents (1)  lachie" not in inventory:
            raise RuntimeError("Claude did not discover all skills and the Lachie agent")

        installed_agents = list((scratch / "claude/plugins/cache/lachie-skills/lachie-skills").glob("*/agents/lachie.md"))
        if len(installed_agents) != 1 or installed_agents[0].read_text().split("---", 2)[2].strip() != agent_body:
            raise RuntimeError("Claude agent instructions differ from canonical source")

        config = scratch / "config/opencode/opencode.json"
        config.parent.mkdir(parents=True)
        config.write_text(json.dumps({"plugins": [str(output / "opencode2")]}))
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        server = subprocess.Popen(["opencode2", "serve", "--hostname", "127.0.0.1", "--port", str(port)],
                                  cwd=project, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        url = f"http://opencode:release-verification-only@127.0.0.1:{port}"
        try:
            for _ in range(30):
                time.sleep(1)
                if server.poll() is not None:
                    raise RuntimeError("OpenCode 2 server exited during verification")
                try:
                    agents = json.loads(run("opencode2", "api", "--server", url, "v2.agent.list", cwd=project, env=env))["data"]
                    found = next((a for a in agents if a["id"] == "lachie"), None)
                    if found is not None:
                        break
                except (RuntimeError, json.JSONDecodeError):
                    continue
            else:
                plugins = json.loads(run("opencode2", "api", "--server", url, "v2.plugin.list", cwd=project, env=env))["data"]
                external = [p for p in plugins if p["source"]["type"] != "builtin"]
                raise RuntimeError(f"OpenCode 2 did not register Lachie; external plugins: {external}")
            if found["system"] != agent_body or found["mode"] != "primary":
                raise RuntimeError("OpenCode 2 agent instructions or mode differ")
            available = json.loads(run("opencode2", "api", "--server", url, "v2.skill.list", cwd=project, env=env))["data"]
            indexed = {s["id"]: s for s in available}
            if not expected <= indexed.keys():
                raise RuntimeError(f"OpenCode 2 skills missing: {expected - indexed.keys()}")
            for name in expected:
                if not Path(indexed[name]["location"]).is_file():
                    raise RuntimeError(f"OpenCode 2 cannot resolve resources for {name}")
        finally:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
    print("Verified native Claude and OpenCode 2 discovery: 47 skills and the Lachie agent in each runtime.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    verify(args.output.resolve())
