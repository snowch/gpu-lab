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
hardware. Future scheduling and tensor-core modules need their own architecture-specific
references and validation records before publication.
