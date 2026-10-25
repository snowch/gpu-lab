# Copyright © 2026 Christopher Snow.
import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('verify_cuda', Path(__file__).resolve().parents[1]/'scripts/verify-cuda-output.py')
checker=importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)

class OutputChecks(unittest.TestCase):
    def test_correct_values_with_simulator_logs(self):
        self.assertEqual(checker.verify('GPGPU-Sim\nOutput: [-0.5, -1, -1.5]\ndone\n',[-.5,-1,-1.5]),3)
    def test_wrong_missing_nonfinite_and_unwritten_values_fail(self):
        for output in ['Output: [2, 9]', 'Output: [2]', 'Output: [2, nan]', 'Output: [2, inf]', 'Output: [2, unwritten]', 'no output', 'Output: [2, 4]\nOutput: [2, 4]']:
            with self.subTest(output=output), self.assertRaises(ValueError):
                checker.verify(output,[2,4])
if __name__ == '__main__': unittest.main()
