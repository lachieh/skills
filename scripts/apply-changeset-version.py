#!/usr/bin/env python3
"""Copy the version `changeset version` wrote to package.json into apm.yml."""

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

version = json.loads((ROOT / "package.json").read_text())["version"]
manifest = ROOT / "apm.yml"
text, count = re.subn(r"^(\s*version: )\S+$", rf"\g<1>{version}", manifest.read_text(), flags=re.MULTILINE)
if count != 2:
    raise SystemExit(f"Expected the package and marketplace versions in apm.yml, found {count} version fields")
manifest.write_text(text)
print(f"apm.yml version: {version}")
