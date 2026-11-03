# Copyright © 2026 Christopher Snow.
"""Trace-reader checks need only Python; no measured GPU results are fabricated."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
READER = ROOT / "examples/inspect-pytorch-trace.py"
spec = importlib.util.spec_from_file_location("trace_reader", READER)
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)


class TraceReaderTests(unittest.TestCase):
    def test_multiple_launches_and_three_dimensional_counts(self):
        # Synthetic schema fixtures, not a hardware capture or promised launch.
        events = [
            {"cat": "cpu_op", "name": "aten::mul", "args": {}},
            {"cat": "kernel", "name": "first", "args": {
                "grid": [3, 2, 1], "block": [8, 4, 1], "correlation": 12}},
            {"cat": "Kernel", "name": "second", "args": {
                "grid": [1, 1, 2], "block": [4, 2, 2]}},
            {"cat": "gpu_memcpy", "name": "copy"},
        ]
        launches = list(reader.kernel_launches({"traceEvents": events}))
        self.assertEqual([r["name"] for r in launches], ["first", "second"])
        self.assertIn("6 blocks", reader.describe(launches[0]))
        self.assertIn("32 threads per block", reader.describe(launches[0]))
        self.assertIn("correlation: 12", reader.describe(launches[0]))
        self.assertIn("16 threads per block", reader.describe(launches[1]))

    def test_missing_or_malformed_dimensions_are_not_zero_launches(self):
        for value in [None, [], [1, 2], [1, 2, 3, 4], [0, 1, 1],
                      [True, 1, 1], [1.0, 1, 1], "[1,1,1]"]:
            with self.subTest(value=value):
                trace = {"traceEvents": [{"cat": "kernel", "args": {
                    "grid": value, "block": [32, 1, 1]}}]}
                record = list(reader.kernel_launches(trace))[0]
                self.assertIn("grid: unavailable", reader.describe(record))
                self.assertIn("32 threads per block", reader.describe(record))
        for args in [None, "unknown", []]:
            record = list(reader.kernel_launches({"traceEvents": [
                None, {"cat": "kernel", "args": args}]}))[0]
            self.assertIsNone(record["block"])
        for trace in [[], {}, {"traceEvents": {}}]:
            with self.assertRaises(ValueError):
                list(reader.kernel_launches(trace))

    def test_cli_distinguishes_no_cuda_events_and_invalid_json(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "trace.json"
            path.write_text(json.dumps({"traceEvents": [{"cat": "cpu_op"}]}))
            result = subprocess.run([sys.executable, str(READER), str(path)],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0)
            self.assertIn("does not prove no GPU work ran", result.stdout)
            path.write_text("{")
            result = subprocess.run([sys.executable, str(READER), str(path)],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Cannot read trace", result.stderr)

    def test_capture_and_reader_have_valid_python_syntax(self):
        for filename in ["profile-pytorch.py", "inspect-pytorch-trace.py"]:
            source = (ROOT / "examples" / filename).read_text()
            compile(source, filename, "exec")


if __name__ == "__main__":
    unittest.main()
