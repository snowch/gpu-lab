# Copyright © 2026 Christopher Snow.
"""Check one generated CUDA program's printed outputs against a CPU reference."""
import json
import math
import re
import sys
from pathlib import Path

def verify(log, expected):
    matches = re.findall(r'^Output: \[(.*?)\]\s*$', log, re.MULTILINE)
    if len(matches) != 1:
        raise ValueError('Expected exactly one Output array')
    actual = [float(value.strip()) for value in matches[0].split(',')]
    if len(actual) != len(expected):
        raise ValueError('Output length differs from reference')
    for index, (got, want) in enumerate(zip(actual, expected)):
        if not math.isfinite(got) or not math.isclose(got, want, rel_tol=1e-6, abs_tol=1e-6):
            raise ValueError(f'Output {index}: expected {want}, got {got}')
    return len(actual)

if __name__ == '__main__':
    try:
        count = verify(Path(sys.argv[1]).read_text(), json.loads(sys.argv[2]))
    except (ValueError, IndexError) as error:
        sys.exit(f'FAIL: {error}')
    print(f'PASS: verified {count} output values against the CPU reference')
