#!/usr/bin/env python3
"""
Portable runner for Ghost Mode offline regression tests.

Usage:
    python3 qa/run_regression.py

Requirements:
    Node.js available on PATH
    Project built with: npm run build

Exit codes:
    0 = all tests passed
    1 = test failures or blocked tests
    2 = missing runtime or test script
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEST_SCRIPT = REPO_ROOT / "qa" / "regression_f01_f11.mjs"

def main():
    node = shutil.which("node")

    if not node:
        print("ERROR: Node.js not found on PATH.", file=sys.stderr)
        return 2

    if not TEST_SCRIPT.is_file():
        print(f"ERROR: Test script not found: {TEST_SCRIPT}", file=sys.stderr)
        return 2

    env = os.environ.copy()
    env.pop("ELECTRON_RUN_AS_NODE", None)

    print(f"Node runtime : {node}")
    print(f"Test script  : {TEST_SCRIPT}")
    print(f"Working dir  : {REPO_ROOT}", flush=True)

    result = subprocess.run(
        [node, str(TEST_SCRIPT)],
        cwd=REPO_ROOT,
        env=env,
        check=False,
    )

    return result.returncode

if __name__ == "__main__":
    sys.exit(main())
