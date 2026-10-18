# GPU Lab

Copyright © 2026 Christopher Snow.

An interactive course for AI practitioners who want to understand how GPUs execute tensor
operations. Familiarity with Python, arrays and basic tensor shapes is enough to start.
CUDA arrives through small programs tied to the hardware model.

Course URL: <https://snowch.github.io/gpu-lab/>

## Current scope

All eight labs are available as working drafts, with a reduction workshop extending Lab 04:

1. [Reading a tensor](https://snowch.github.io/gpu-lab/lessons/memory.html): addresses, stride, alignment and coalescing.
2. [Keeping the GPU busy](https://snowch.github.io/gpu-lab/lessons/scheduling.html): ready/waiting warps and latency hiding.
3. [Taking different paths](https://snowch.github.io/gpu-lab/lessons/divergence.html): branch masks and useful lane slots.
4. [Sharing work within a block](https://snowch.github.io/gpu-lab/lessons/shared-memory.html): shared-memory banks, broadcasts and padding.
   [Reduction workshop](https://snowch.github.io/gpu-lab/lessons/reduction.html): tree sums, barriers and an unsafe interleaving.
5. [Reusing data](https://snowch.github.io/gpu-lab/lessons/matmul.html): computed matrix tiles, traffic and teaching resource budgets.
6. [Using tensor cores](https://snowch.github.io/gpu-lab/lessons/tensor-cores.html): cooperative matrix operations, input rounding and FP32 accumulation.
7. [Moving less data in attention](https://snowch.github.io/gpu-lab/lessons/attention.html): stable softmax, online normalisation and intermediate traffic.
8. [Explaining inference](https://snowch.github.io/gpu-lab/lessons/inference.html): prefill/decode, batching, KV caches, roofline bounds and measurement comparison.

Each has predictions, a computed view, CUDA or algorithm connections and exercises. Labs 02–08
and the reduction workshop have step/replay controls. These are teaching models with explicit
limits, not complete GPU or transformer simulators. The reduction workshop detects one chosen
unsafe schedule; it is not a general race detector.

The teaching models do not interpret CUDA. Their counts and toy scheduling cycles do not
predict physical DRAM traffic, measured elapsed time, or speedups on a particular GPU.
See [the model contract](docs/model.md) and [course plan](docs/plan.md).

[The visual review](docs/visual-review.md) records where each lesson needed a layout,
dependency, sequence or data-flow diagram. Those diagrams are linked to model state and trace
positions, alongside the existing experiment views.

## Develop

Node.js 22 or newer. The application and model tests have no package dependencies.

```sh
npm run dev      # http://localhost:5173/gpu-lab/
npm run check    # model tests and static build
```

`npm run dev` builds once before serving. Re-run `npm run build` after changing lesson content.

Browser checks run against the built site at `/gpu-lab/`, at desktop and phone sizes, in both themes:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/browser.py
```

CI runs both commands before deploying `dist/` from `main` through GitHub Pages Actions.
Pull requests run checks without deployment. All application assets use relative paths.

A separate workflow compiles and runs small CUDA examples in GPGPU-Sim on a CPU runner.
It validates outputs against a CPU reference and saves logs; it does not yet compare timing
or memory counters. See [validation layers](docs/validation.md).

## Try CUDA

The browser needs no GPU. [examples/gather.cu](examples/gather.cu) is an optional standalone
CUDA program with input bounds, runtime error checks and CPU-result comparison:

```sh
nvcc -O2 examples/gather.cu -o /tmp/gpu-lab-gather
/tmp/gpu-lab-gather 8 0 32
```

It requires the CUDA toolkit and an NVIDIA GPU. It is a correctness exercise, not a benchmark.
The initial implementation has not been validated on GPU hardware.

`examples/ai-kernels.cu` adds self-checking naive matmul, tiled matmul and block reduction.
The GPGPU-Sim workflow compiles and checks those kernels as well as gather. The WMMA sketch
and online-attention pseudocode in the lessons are illustrations rather than executable examples.

## Repository layout

- `src/model.mjs`: pure address model; all figure values derive from its result.
- `src/architecture.mjs`: scheduling, divergent paths and shared-memory bank models.
- `src/ai-models.mjs`: reductions, tiled matmul, numeric conversion, attention and inference budgets.
- `content/lessons.mjs`: lesson prose and a shared static page renderer used during the build.
- `content/remaining-lessons.mjs`, `src/ai-lesson.mjs`: remaining lesson content and computed views.
- `src/lesson.mjs`, `src/theme.mjs`: shared experiment controls and theme persistence.
- `index.html`: course introduction and roadmap.
- `content/memory.html`, `src/app.mjs`, `src/style.css`: Lab 01 and its interactive views.
- `tests/`: model invariants, boundary cases, browser interactions and responsive layout.
- `examples/`: optional runnable CUDA exercises.
- `docs/`: curriculum, model scope, sources and development rules.

Inspired by the model-driven learning approach in [Digital Design](https://github.com/snowch/digital-design)
and [Assembly Lab](https://github.com/snowch/assembly-lab). This small standalone prototype does
not yet integrate `snowch/learning-platform`; migration is a separate curriculum/platform decision.
