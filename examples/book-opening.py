# Copyright © 2026 Christopher Snow.
"""Companion to chapters 1–3. Requires PyTorch; no timing claims."""
import argparse
import torch

parser = argparse.ArgumentParser(description="Follow tensor values, devices and layouts.")
parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
args = parser.parse_args()
if args.device == "cuda" and not torch.cuda.is_available():
    parser.error("CUDA mode needs an available NVIDIA GPU and a compatible PyTorch installation.")

# Chapters 1–2: copy, calculate, copy back.
x_cpu = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0], dtype=torch.float32)
x_device = x_cpu.to(args.device)
y_device = x_device * 2
y_cpu = y_device.cpu()
assert x_cpu.tolist() == [1, 2, 3, 4, 5]
assert y_cpu.tolist() == [2, 4, 6, 8, 10]
assert x_cpu.device.type == y_cpu.device.type == "cpu"
assert x_device.device.type == y_device.device.type == args.device
assert y_device.data_ptr() != x_device.data_ptr()
if args.device == "cuda":
    assert x_device is not x_cpu and y_cpu is not y_device
else:
    assert x_device is x_cpu and y_cpu is y_device
    print("CPU mode: values/layouts only; no CPU–GPU transfers occur.")
assert x_device.to(args.device) is x_device
print("Input:", x_cpu.tolist(), "output:", y_cpu.tolist())
print("Calculation device:", y_device.device)

# Chapter 3: equal-length row/column reads, packing and transpose.
x = torch.arange(1, 26, dtype=torch.float32, device=args.device).reshape(5, 5)
assert x.stride() == (5, 1)
for index in range(5):
    row, column = x[index, :], x[:, index]
    packed = column.contiguous()
    assert row.tolist() == list(range(index * 5 + 1, index * 5 + 6))
    assert column.tolist() == list(range(index + 1, 26, 5))
    assert row.stride() == packed.stride() == (1,)
    assert column.stride() == (5,)
    assert column.untyped_storage().data_ptr() == x.untyped_storage().data_ptr()
    assert packed.untyped_storage().data_ptr() != x.untyped_storage().data_ptr()
    assert torch.equal(column * 2, packed * 2)
    assert row.contiguous() is row
transposed = x.T
assert transposed.stride() == (1, 5)
assert transposed.untyped_storage().data_ptr() == x.untyped_storage().data_ptr()
assert torch.equal(transposed[0, :], x[:, 0])
print("Row 0:", x[0, :].tolist(), "column 0:", x[:, 0].tolist())
print("Verified values, devices, element strides, shared views and packed copies.")
