#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["jsonschema==4.25.1"]
# ///

import argparse
import json
from pathlib import Path

from jsonschema import Draft7Validator, Draft202012Validator, FormatChecker

SCHEMAS = Path(__file__).resolve().parent / "schemas"
PATH_FIELDS = ("skills", "agents", "rules", "commands", "hooks", "mcpServers", "logo")
AGENT_SUFFIXES = {".md", ".mdc", ".markdown"}


def load_json(path):
    return json.loads(path.read_text())


def referenced_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                yield item


def validator_for(schema):
    dialect = schema.get("$schema", "")
    if dialect.startswith("https://json-schema.org/draft/2020-12"):
        return Draft202012Validator
    return Draft7Validator


def validate(document, schema, label):
    checker = validator_for(schema)(schema, format_checker=FormatChecker())
    errors = sorted(checker.iter_errors(document), key=lambda error: list(error.absolute_path))
    if errors:
        details = "; ".join(
            f"{'/'.join(map(str, error.absolute_path)) or '/'}: {error.message}" for error in errors
        )
        raise RuntimeError(f"{label} failed schema validation: {details}")


def check_path(package, reference):
    if reference.startswith(("http://", "https://")):
        return
    path = Path(reference)
    if path.is_absolute() or ".." in path.parts:
        raise RuntimeError(f"Plugin path must stay inside the package: {reference}")
    target = (package / path).resolve()
    try:
        target.relative_to(package.resolve())
    except ValueError:
        raise RuntimeError(f"Plugin path must stay inside the package: {reference}") from None
    if not target.exists():
        raise RuntimeError(f"Plugin path does not exist: {reference}")
    return target


def check_agent(path, package):
    text = path.read_text()
    if not text.startswith("---\n"):
        raise RuntimeError(f"Agent is missing frontmatter: {path.relative_to(package)}")
    header = text.split("---", 2)[1]
    fields = {}
    for line in header.splitlines():
        if not line.strip() or line.lstrip().startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()
    if not fields.get("name") or not fields.get("description"):
        raise RuntimeError(f"Agent frontmatter needs name and description: {path.relative_to(package)}")


def verify(package):
    cursor_path = package / ".cursor-plugin/plugin.json"
    if not cursor_path.is_file():
        raise RuntimeError("Missing .cursor-plugin/plugin.json")
    cursor = load_json(cursor_path)
    validate(cursor, load_json(SCHEMAS / "cursor-plugin.schema.json"), ".cursor-plugin/plugin.json")
    for field in PATH_FIELDS:
        if field not in cursor:
            continue
        for reference in referenced_strings(cursor[field]):
            target = check_path(package, reference)
            if field != "agents" or target is None:
                continue
            agents = [target] if target.is_file() else [
                path for path in target.rglob("*") if path.is_file() and path.suffix in AGENT_SUFFIXES
            ]
            if not agents:
                raise RuntimeError(f"No agent files in {reference}")
            for agent in agents:
                check_agent(agent, package)
    print(f"Verified Cursor plugin manifest in {package}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    args = parser.parse_args()
    verify(args.package.resolve())
