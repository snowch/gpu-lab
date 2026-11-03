# Copyright © 2026 Christopher Snow.
"""Capture one multiplication, or mark it for an external NVIDIA profiler."""
import argparse

import torch
from torch.profiler import ProfilerActivity, profile, record_function

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--external", action="store_true")
args = parser.parse_args()

if not torch.cuda.is_available():
    raise SystemExit("This example needs CUDA-enabled PyTorch and an NVIDIA GPU.")
if not args.external and ProfilerActivity.CUDA not in torch.profiler.supported_activities():
    raise SystemExit("CUDA profiling is unavailable. Check the PyTorch/CUPTI setup.")

print("PyTorch:", torch.__version__)
print("PyTorch CUDA build:", torch.version.cuda)
print("GPU:", torch.cuda.get_device_name())
x = torch.arange(
    1, 4097, dtype=torch.float32, device="cuda",
)
for _ in range(5):
    y = x * 2
torch.cuda.synchronize()

if args.external:
    # NVTX names this range in Nsight; no nested PyTorch profiler.
    with torch.cuda.nvtx.range("gpu_lab_multiply"):
        y = x * 2
        torch.cuda.synchronize()
else:
    activities = [ProfilerActivity.CPU, ProfilerActivity.CUDA]
    with profile(activities=activities) as prof:
        with record_function("gpu_lab_multiply"):
            y = x * 2
            torch.cuda.synchronize()
    prof.export_chrome_trace("trace.json")
    print("Saved trace.json")

torch.testing.assert_close(y, x + x)
print("Verified multiplication output")
