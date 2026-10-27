# Validation layers

Copyright © 2026 Christopher Snow.

The browser models, real PyTorch calculations, functional CUDA simulation and
physical GPU measurements answer different questions. Passing one layer does not
establish the others. Desktop commands and prerequisites are documented in
[Run the examples on your desktop](run-cuda.md), with runnable downloads in the
[in-book desktop appendix](https://snowch.github.io/gpu-lab/lessons/desktop.html).

## Browser models and interface

`npm run check` tests the specified numerical models and builds the static site.
Memory-address tests compare the supported domain with an independent byte-level
oracle; later models have checks for their own arithmetic, masks, ordering and
accounting assumptions. These checks are not a validation of a complete GPU.

`python tests/browser.py` checks displayed values and interactions across the
supported layouts and themes. `python tests/offline.py` checks offline use and
state restoration. The Pages workflow requires these checks. Screenshots help
review layout, but automated passes do not establish that newcomers understand
the explanations; learner observation is a separate activity.

## Real PyTorch calculations on a CPU

The Pages workflow installs CPU PyTorch 2.5.1 and checks the tensor-layout and
book-opening companions. It also runs `tests/chapter_examples.py`, which obtains
chapter source and model references from `scripts/chapter-examples.mjs`, substitutes
CPU placement for CUDA placement and executes the examples. Covered comparisons
include branch outputs, reductions, matrix results, input conversions, the declared
sequential accumulation and attention results. The inference opening checks its
small cache/result shapes and finite output, not an executed full decoder.

Runnable Python downloads are generated from chapter source and offer explicit
`--device cpu` (the default) and `--device cuda` modes. The desktop export script
regenerates them for local use; the site build publishes them alongside the appendix.
CPU execution checks values and supported
layout behaviour. It does not exercise CPU–GPU transfers, establish which CUDA
kernel PyTorch would choose, or reproduce tensor-core accumulation. Small numerical
differences between browser double arithmetic and PyTorch FP32 are accounted for
where appropriate. GPGPU-Sim does not execute these PyTorch programs. Physical
GPU validation of the new downloads remains outstanding.

## CUDA functional simulation in CI

The separate `CUDA examples in GPGPU-Sim` workflow builds
`docker/cuda-sim.Dockerfile` on a GitHub-hosted CPU runner. The base image is
Ubuntu 24.04 with CUDA 12.8, pinned by digest:

```text
ghcr.io/accel-sim/accel-sim-framework:ubuntu-24.04-cuda-12.8-minimal@sha256:1ae7da75d01d7b1317621c7a8f8b0f507a6e26182232f0ebfc38beb45ed3362d
```

The GPGPU-Sim checkout is pinned to
`c3eeb6d19016960ab66789efdd8a3200cc30222a`. Programs contain PTX for
`compute_70`, use shared CUDA runtime linkage supplied by GPGPU-Sim, and run
with the `SM7_QV100` configuration and `PTX_SIM_MODE_FUNC=1`. Both the desktop
runner and CI check that the linked CUDA runtime is the simulator's runtime.
Recheck compatibility when changing either pin.

The configured suite covers:

| Source | Cases and reference |
| --- | --- |
| Chapter 1 download generator | Four multipliers: 2, −0.5, 0 and 3.25. Each has five values, eight launched threads and a guarded tail. JSON references use independent scalar arithmetic. |
| Repair-workshop download generator | Twelve safe cases: multiplication, addition and vector addition at block sizes 8, 16, 32 and 64, with 35 inputs. Each uses global indexing and a bounds check. Expected values come from the documented input formulae and selected arithmetic. |
| `examples/gather.cu` | Five cases: contiguous, strided, misaligned, tail-warp and multiple-block copies. Every output is compared with a CPU reference. |
| `examples/ai-kernels.cu` | Naive matmul, shared-memory tiled matmul and barrier-based tree reduction, checked against CPU references. |
| `examples/shared-memory.cu` | All 32 values of a padded shared-memory column read, compared with independent row-major offsets. |

The workshop's safe addition variant is checked for arithmetic correctness, not
labelled a successful repair of the multiplication exercise. Unsafe configurations
are excluded. The shared-memory check establishes output correctness; it does not
measure conflict multiplicity or validate the browser's service-round counts.
Tensor-core and attention CUDA kernels are outside this suite's coverage.

CI generates the download cases with `node scripts/generate-cuda-cases.mjs`, then
runs `scripts/cuda-sim.sh` inside the same image available to desktop users. It
also checks the documented single-file command. The scripts require the simulator
banner and the appropriate output comparison or success marker; a zero exit status
alone is insufficient. For generated `Output` arrays, the verifier checks length,
finite values and numerical agreement. Compiler/runtime failures, missing markers,
timeouts and mismatches fail the check.

Compiler information, simulator revision, generated sources/references, simulator
configuration and execution logs are retained in Actions artifacts. This section
describes the configured coverage; use the relevant workflow run and its artifacts
to establish whether a particular revision passed, including newly added cases.
A build that runs out of disk space before execution supplies no kernel validation.

This is **functional validation**. It checks that supported compiled CUDA programs
produce expected values under simulated execution. It does not validate timings,
the teaching scheduler, a real GPU's occupancy, or sector counts against simulator
traffic counters. Physical NVIDIA GPU compatibility and performance remain
unvalidated by these checks.

## Further validation

Real hardware correctness runs should record GPU model, driver, toolkit, compiler,
source revision and expected outputs. Performance measurements additionally need
a defined scope, warm-up, appropriate synchronisation, repeated runs and matching
input shapes and formats. Neither a functional simulator pass nor a CPU PyTorch
pass supplies those measurements.

A later performance-mode simulator experiment must name its configuration and
choose a counter that can be compared with a specific model quantity. Separate
kernel input reads from output writes and account for caches and multiple warps.
Do not equate total DRAM transactions with sectors addressed by one source-level
load. Even cycle-level simulation does not establish measured performance on a
current NVIDIA GPU.

Versioned fixtures can preserve a run's code hashes, configuration, tool versions
and results. Accel-Sim SASS-trace replay is a later option: generating fresh NVBit
traces needs suitable GPU hardware, while replaying existing traces can run on a
CPU.

References:

- [Upstream CUDA-samples CI at the pinned revision](https://github.com/gpgpu-sim/gpgpu-sim_distribution/blob/c3eeb6d19016960ab66789efdd8a3200cc30222a/.github/workflows/cuda-samples.yml)
- [Upstream sample runner at the pinned revision](https://github.com/gpgpu-sim/gpgpu-sim_distribution/blob/c3eeb6d19016960ab66789efdd8a3200cc30222a/regress/cuda-samples/run.sh)
- [GPGPU-Sim README](https://github.com/gpgpu-sim/gpgpu-sim_distribution)
