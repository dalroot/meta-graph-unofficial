#!/usr/bin/env python3
"""
qa/run_regression.py
Runner for the Ghost Mode regression tests using the Electron-bundled Node.js runtime.

Usage (from repo root):
    python qa/run_regression.py

The script:
 - Sets ELECTRON_RUN_AS_NODE=1 so Antigravity IDE.exe acts as a Node.js runtime
 - Runs qa/regression_f01_f11.mjs in offline (mock) mode
 - Streams output to console
 - Exits with code 1 on FAIL, 0 on all PASS/BLOCKED
"""
import subprocess
import os
import sys

NODE_EXE = r'C:\Users\Admin\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe'
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_SCRIPT = os.path.join(REPO_ROOT, 'qa', 'regression_f01_f11.mjs')

if not os.path.exists(NODE_EXE):
    print(f'ERROR: Node runtime not found at: {NODE_EXE}')
    print('Please update NODE_EXE path in qa/run_regression.py')
    sys.exit(2)

if not os.path.exists(TEST_SCRIPT):
    print(f'ERROR: Test script not found: {TEST_SCRIPT}')
    sys.exit(2)

env = os.environ.copy()
env['ELECTRON_RUN_AS_NODE'] = '1'
# Ensure offline mode for regression tests (no live Instagram)
env.pop('OFFLINE_MODE', None)  # let the test script control this per-test

print(f'Node runtime : {NODE_EXE}')
print(f'Test script  : {TEST_SCRIPT}')
print(f'Working dir  : {REPO_ROOT}')
print()

result = subprocess.run(
    [NODE_EXE, TEST_SCRIPT],
    env=env,
    cwd=REPO_ROOT,
    text=True
)

sys.exit(result.returncode)

