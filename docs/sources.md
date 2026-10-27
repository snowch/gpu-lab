# Sources and verification boundaries

Copyright © 2026 Christopher Snow.

Lab 01's PyTorch bridge uses the documented [tensor stride](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.stride.html),
[tensor view](https://docs.pytorch.org/docs/stable/tensor_view.html), and
[contiguous](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.contiguous.html) semantics.
Its self-checking optional script is `examples/tensor-layout.py`. PyTorch is not a browser or
course-build dependency. Browser checks verify that row and column buttons select the correct
stride and active-lane counts; they do not execute PyTorch or assert its kernel mapping.

The teaching model is based on NVIDIA's documented coalescing rules. These are primary
references for the implemented lab, not evidence that this browser model reproduces a whole GPU.

- [CUDA C++ Best Practices Guide: coalesced access to global memory](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#coalesced-access-to-global-memory).
  Documents 32-byte transaction accounting on compute capability 6.0 or newer, sequential
  accesses, misalignment and strided accesses. The course calls these addressed units sectors
  to distinguish them from physical DRAM transactions.
- [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/index.html).
  Thread hierarchy, block/grid indexing, warp size, global memory and kernel launches.
- [CUDA Runtime API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html).
  Allocation, copies, error handling and synchronisation in the optional CUDA example.

The CUDA example has not yet been compiled or run on a real GPU in this project.
The model tests establish its specified address arithmetic, not performance agreement with
hardware. Each additional teaching model distinguishes its assumptions from hardware claims.

## Labs 02–04

- [Hardware multithreading](https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html#hardware-multithreading):
  resident warps, readiness, scheduling and block residency. The course's one-issue-slot machine
  and numeric latencies are explicit teaching assumptions, not NVIDIA specifications.
- [Branching and divergence](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#branching-and-divergence):
  different paths within a warp and predication. The course's positive-first path order and
  unoptimised operation counts are assumptions; no compiled instruction count is asserted.
- [Shared memory and banks](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-and-memory-banks):
  bank conflicts, 32 banks, successive 32-bit words, read broadcasts and padding.
- [Synchronisation functions](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#thread-block-synchronization-functions):
  block barriers, memory visibility and conditions for using `__syncthreads()` in conditional code.

The lesson CUDA fragments are illustrative source, not recorded compiler output or standalone
benchmarks. The separately downloadable gather program passed the GPGPU-Sim functional workflow
in [run 39041106905](https://github.com/snowch/gpu-lab/actions/runs/39041106905). That result does
not validate the new scheduling assumptions, compiler lowering, or bank model against hardware.

## Labs 04B–08

- [CUDA Best Practices: matrix multiplication](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-in-matrix-multiplication-c-ab):
  shared-memory tile reuse and synchronisation. Traffic counts in the lesson are derived from
  the implemented tile loops, not measured HBM transactions.
- [CUDA Programming Guide: warp matrix functions](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#warp-matrix-functions):
  cooperative WMMA calls, fragment types, alignment and target-dependent support. The lesson's
  chosen sequential accumulation is not asserted to match tensor-core hardware.
- [CUDA Math API: half precision](https://docs.nvidia.com/cuda/cuda-math-api/cuda_math_api/group__CUDA__MATH__INTRINSIC__HALF.html):
  FP16 conversions; the browser implements explicit nearest-even arithmetic for its examples.
- [FlashAttention](https://arxiv.org/abs/2205.14135), Dao et al., 2022:
  IO-aware exact attention and tiled online softmax. The course is an original small recurrence
  experiment, not an implementation of the production kernel.
- [Roofline](https://doi.org/10.1145/1498765.1498785), Williams, Waterman and Patterson, 2009:
  relating arithmetic intensity to compute and bandwidth limits. Inference byte/FLOP formulae
  are explicit teaching assumptions documented in `model.md`, not benchmark results.

`examples/ai-kernels.cu` provides runnable naive/tiled matmul and reduction correctness exercises.
CI compiles and runs them through GPGPU-Sim with CPU-reference checks. This checks those kernels'
outputs, not tensor-core lowering, attention-kernel correctness or inference performance. No real
GPU validation or performance measurement is claimed by this revision.

## CUDA introduction and repair workshop

The introduction and repair workshop use the CUDA Programming Guide and Runtime
API linked above: thread/block indexing, kernel launches, device allocation, copies,
synchronisation and error handling. PyTorch snippets describe equivalent operations;
they are not claims about the framework's internal kernel implementation.

Browser tests exercise supported CUDA expressions in an explicit CPU teaching model,
including the concept-first thread mapping, prediction/repair checks, invalid accesses, generated downloads and
offline use. There is no in-browser CUDA compiler. CI compiles chapter 1 downloads with nvcc and checks their output in GPGPU-Sim
using the shared desktop runner. Physical NVIDIA GPU execution remains unvalidated.
Workshop downloads are not yet included in these compilation checks. The previous WGSL/WebGPU prototype and its
software-adapter execution tests have been retired rather than treated as CUDA evidence.


## Reference-reading practice

`src/reference-tasks.mjs` records the official links and short original questions.
The opening points directly to `torch.tensor` (device/dtype) and CUDA’s built-in
variables; Lab 01 uses `Tensor.stride`. Subsequent guided checks cover readiness,
divergence and block synchronisation. Reduction, matmul, tensor-core, attention and
inference tasks begin at a guide’s contents/search and ask learners to locate the
relevant contract themselves. Comparison disclosures include direct section links.

The official PyTorch tensor/stride, scaled-dot-product-attention and CUDA-semantics
pages were read on 2026-10-24 (stable resolved to PyTorch 2.14). The timing comparison
links to that verified version’s asynchronous-execution section. Learners are asked
to check their installed version. CUDA links use the reorganised Programming Guide;
its old `cuda-c-programming-guide` URLs now redirect to the front page and lose the
intended sections. NVIDIA page and fragment targets were checked against current HTML.
The guide links document contracts, not measured validation of the course’s models.

No external documentation is fetched while using the course: links open on demand.
Questions and local comparisons are built into the offline app. These conceptual
reference checks do not claim to execute PyTorch or CUDA or validate GPU timing.

## Book opening: device copies and layout

The chapter 2 copy rules follow [Tensor.to](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.to.html)
and [Tensor.cpu](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.cpu.html).
The chapter 3 packing rule follows [Tensor.contiguous](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.contiguous.html),
alongside the stride and tensor-view references above. These pages were checked
on 2026-10-24; stable resolved to PyTorch 2.14. Device/dtype-preserving `to()` and
already-contiguous `contiguous()` can return the existing tensor. The teaching
examples explicitly choose cases that do allocate copies.

The five-thread load uses the same CUDA coalescing source and sector model as the
memory-access lab, with a declared aligned base and equal useful byte counts.
It does not claim to reproduce PyTorch's kernel selection. CI checks the optional
book companion with CPU PyTorch 2.5.1; CUDA-mode transfer behaviour has not yet
been executed on a GPU. No performance measurements are inferred from that check.


## Chapter references and documentation exercises

Every available chapter, lab, workshop and desktop appendix has an explicit
entry in `chapterReferences` (`src/reference-tasks.mjs`). References are annotated by
what they support, followed by at least two questions applying the documentation to
that page’s examples. The answer disclosures are local and available offline. Tests
cover all published pages, link roles, ordering, keyboard use and JavaScript-free access.

The opening’s distinction between framework and developer responsibilities is supported by:

- [PyTorch dispatcher explanation](https://docs.pytorch.org/docs/2.14/notes/extending.html#extending-torch-native-api):
  selecting the appropriate backend implementation from an operation and its inputs.
- [PyTorch CUDA semantics](https://docs.pytorch.org/docs/2.14/notes/cuda.html):
  tensor-device placement, result placement and asynchronous execution.
- [PyTorch compiler getting started](https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/torch.compiler_get_started.html):
  optional later reading about code generation and operation fusion. This is not the
  execution path of the opening’s ordinary PyTorch snippet.

`runKernel` is a handwritten teaching function name. Its qualifiers, indexing variables
and launch syntax have official CUDA documentation; the function name itself does not.
Documentation links do not imply that the browser runs an installed toolkit version.

## Continuing chapters review (2026-10-26)

The learner-facing references now connect PyTorch `torch.where`, `Tensor.sum`,
`torch.matmul`, `torch.softmax`, `torch.cat` and scaled dot-product attention to
chapters 6–12. Official stable pages were checked (redirecting to PyTorch 2.14).
The reference catalogue keeps the CUDA mechanisms distinct from framework APIs:
`torch.where` does not promise a divergent branch, `@` does not select a tile size,
and the sequential precision model does not establish tensor-core execution.

## GPU device and chip boundaries

The map uses a simplified discrete NVIDIA GPU hierarchy. The
[NVIDIA Ampere tuning guide](https://docs.nvidia.com/cuda/ampere-tuning-guide/index.html)
describes per-SM unified L1/shared-memory capacity, the shared L2 cache, and
HBM2 device memory. These are hardware resources, distinct from CUDA’s
block-scoped programming model. Packaging and cache details vary by architecture;
the map does not represent an integrated GPU with shared system memory.
