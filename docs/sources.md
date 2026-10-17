# Sources and verification boundaries

Copyright © 2026 Christopher Snow.

The teaching model is based on NVIDIA's documented coalescing rules. These are primary
references for the implemented lab, not evidence that this browser model reproduces a whole GPU.

- [CUDA C++ Best Practices Guide: coalesced access to global memory](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#coalesced-access-to-global-memory).
  Documents 32-byte transaction accounting on compute capability 6.0 or newer, sequential
  accesses, misalignment and strided accesses. The course calls these addressed units sectors
  to distinguish them from physical DRAM transactions.
- [CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html).
  Thread hierarchy, block/grid indexing, warp size, global memory and kernel launches.
- [CUDA Runtime API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html).
  Allocation, copies, error handling and synchronisation in the optional CUDA example.

The CUDA example has not yet been compiled or run on a real GPU in this project.
The model tests establish its specified address arithmetic, not performance agreement with
hardware. Future tensor-core modules need their own architecture-specific
references and validation records before publication.

## Labs 02–04

- [Hardware multithreading](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#hardware-multithreading):
  resident warps, readiness, scheduling and block residency. The course's one-issue-slot machine
  and numeric latencies are explicit teaching assumptions, not NVIDIA specifications.
- [Branching and divergence](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#branching-and-divergence):
  different paths within a warp and predication. The course's positive-first path order and
  unoptimised operation counts are assumptions; no compiled instruction count is asserted.
- [Shared memory and banks](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-and-memory-banks):
  bank conflicts, 32 banks, successive 32-bit words, read broadcasts and padding.
- [Synchronisation functions](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#synchronization-functions):
  block barriers, memory visibility and conditions for using `__syncthreads()` in conditional code.

The lesson CUDA fragments are illustrative source, not recorded compiler output or standalone
benchmarks. The separately downloadable gather program passed the GPGPU-Sim functional workflow
in [run 39041106905](https://github.com/snowch/gpu-lab/actions/runs/39041106905). That result does
not validate the new scheduling assumptions, compiler lowering, or bank model against hardware.
