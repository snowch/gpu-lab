# Validation layers

Copyright © 2026 Christopher Snow.

## Fast browser model

`npm run check` tests the complete supported address domain against an independent byte-level
oracle and builds the static site. `python tests/browser.py` checks the displayed values and
interactions at desktop and phone widths in both themes. The Pages workflow requires both.

## CUDA functional simulation in CI

The separate `CUDA examples in GPGPU-Sim` workflow builds a pinned GPGPU-Sim revision in the
same CUDA 12.8 toolchain image used by upstream's CUDA-samples CI. It runs on a standard
GitHub-hosted CPU runner without a GPU. It compiles the gather example with embedded PTX
for compute capability 7.0 and shared CUDA runtime linkage. GPGPU-Sim supplies that runtime.

Five small cases cover contiguous, strided, misaligned, tail-warp and multiple-block copies.
Each compares every output against a CPU reference. The job requires the simulator banner
and the example's success marker; merely exiting without error is insufficient. Logs, the
configuration, compiler version and simulator commit are uploaded as an Actions artifact.

This is **functional validation**, with `PTX_SIM_MODE_FUNC=1`. It does not validate timing or
prove the browser's sector count against GPGPU-Sim counters. It does check that a compiled
CUDA kernel computes the expected values in another implementation of CUDA execution.
The container image is version-tagged but not digest-pinned, so it is not a fully immutable
toolchain yet. Upstream compatibility must be rechecked when updating the simulator pin.

## Next validation steps

Add a small performance-mode run for a named configuration, then select and document exactly
which counter is comparable to the browser model. Separate the kernel's input reads from
output writes, and account for caching and multiple warps before comparing traffic. Never
assert that total DRAM transactions equal sectors from one source-level load.

Selected run results can become versioned, read-only lesson fixtures with code hashes,
configuration and simulator revision. The interactive browser remains the immediate feedback
loop; detailed CI results provide a deeper, reproducible experiment to inspect.

Real hardware measurements remain a third layer. Neither a functional pass nor cycle-level
simulation establishes measured performance on a current NVIDIA GPU. Accel-Sim SASS-trace
replay is a later option; generating fresh NVBit traces requires a suitable GPU, while replay
of existing traces can run on CPU.

References:
- [Upstream CUDA-samples CI](https://github.com/gpgpu-sim/gpgpu-sim_distribution/blob/c3eeb6d19016960ab66789efdd8a3200cc30222a/.github/workflows/cuda-samples.yml)
- [Upstream sample runner](https://github.com/gpgpu-sim/gpgpu-sim_distribution/blob/c3eeb6d19016960ab66789efdd8a3200cc30222a/regress/cuda-samples/run.sh)
- [GPGPU-Sim README](https://github.com/gpgpu-sim/gpgpu-sim_distribution)
