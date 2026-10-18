# Copyright © 2026 Christopher Snow.
"""Run with an installed PyTorch: python tensor-layout.py [--device cuda]."""
import argparse
import torch

parser = argparse.ArgumentParser(description="Inspect tensor views, strides and packing.")
parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
args = parser.parse_args()

x = torch.arange(32 * 8, dtype=torch.float32, device=args.device).reshape(32, 8)
row = x[0, :]
column = x[:, 0]
packed_column = column.contiguous()

assert tuple(x.shape) == (32, 8)
assert x.stride() == (8, 1)
assert row.stride() == (1,)
assert column.stride() == (8,)
assert packed_column.stride() == (1,)
assert row.tolist() == list(range(8))
assert column.tolist() == list(range(0, 256, 8))
assert torch.equal(column, packed_column)
assert column.untyped_storage().data_ptr() == x.untyped_storage().data_ptr()
assert packed_column.untyped_storage().data_ptr() != x.untyped_storage().data_ptr()

print("x:", x.shape, "strides:", x.stride())
print("row:", row.tolist(), "stride:", row.stride())
print("column:", column.tolist(), "stride:", column.stride())
print("packed column stride:", packed_column.stride())
print("Verified values, element strides, shared views and the packed copy.")
