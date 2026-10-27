// Copyright © 2026 Christopher Snow.
// Shared by downloadable files, the browser download buttons and CPU validation.
export function pythonProgram(source) {
  if(!/^import torch\b/.test(source.trimStart()))throw new Error('A runnable PyTorch example must include its imports and setup.');
  const body=source.replaceAll('device="cuda"','device=_lab_device').replaceAll('.to("cuda")','.to(_lab_device)');
  const printResult=source.includes('print(')?'':`\nfor _lab_name in ("y_cpu", "y_gpu", "z", "total", "y", "out", "c", "x_gpu", "x"):\n    if _lab_name in globals():\n        print(_lab_name + ":", globals()[_lab_name].detach().cpu())\n        break\n`;
  return `# Generated from the displayed GPU Lab example; no GPU timings are measured.
# Run: python example.py --device cpu  (default; no CPU/GPU transfers)
# Or:  python example.py --device cuda (compatible NVIDIA GPU and PyTorch required)
# Explicit CPU-only calculations remain on CPU in either mode.
import argparse
import torch

_lab_parser = argparse.ArgumentParser(description="Run this GPU Lab PyTorch example.")
_lab_parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
_lab_device = _lab_parser.parse_args().device
if _lab_device == "cuda" and not torch.cuda.is_available():
    _lab_parser.error("CUDA mode needs an available NVIDIA GPU and compatible PyTorch installation.")
if _lab_device == "cpu":
    print("CPU mode checks values and layouts; it does not perform CPU-GPU transfers.")

# The displayed example, with its CUDA device requests selected by --device.
${body}
${printResult}`;
}
