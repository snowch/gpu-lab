// Copyright © 2026 Christopher Snow.
import {tensorSetup} from './foundations-model.mjs';
export const deviceOpening='import torch\nx_cpu = torch.tensor(\n    [1.0, 2.0, 3.0, 4.0, 5.0],\n    dtype=torch.float32,\n)\nx_gpu = x_cpu.to("cuda")\ny_gpu = x_gpu * 2\ny_cpu = y_gpu.cpu()';
export const readingOpening=part=>tensorSetup+(part==='selection'?'\ny = x[0, :] * 2':'\nvalues = x[:, 0]\ny = values * 2');
export const memorySetup=`import torch

x = torch.arange(32 * 8, dtype=torch.float32).reshape(32, 8)
print(x.shape, x.stride())   # shape (32, 8), strides (8, 1)`;
export const memoryExample=`import torch

x = torch.arange(32 * 8, dtype=torch.float32).reshape(32, 8)
row = x[0, :]       # features of example 0: 0, 1, ..., 7
column = x[:, 0]   # feature 0 of each example: 0, 8, ..., 248

print(x.shape, x.stride())   # shape [32, 8], strides (8, 1)
print(row.stride())          # (1,)
print(column.stride())       # (8,)

packed_column = column.contiguous()
print(packed_column.stride())  # (1,)`;
