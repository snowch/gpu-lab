# GPU Lab

Copyright © 2026 Christopher Snow.

An interactive course for AI practitioners who want to understand how GPUs execute tensor
operations. Familiarity with Python, arrays and basic tensor shapes is enough to start.
CUDA arrives through small programs tied to the hardware model.

Course URL: <https://snowch.github.io/gpu-lab/>

## Current scope

The first working draft explores one warp's global-memory load: change stride, alignment,
and active lanes; predict the sector count; inspect the computed addresses; connect them to
CUDA indexing. The page contains an eight-module roadmap. Only the first lab is implemented.

The simulator is an address-set model, not a CUDA interpreter or a timing simulator.
It counts aligned 32-byte sectors; it does not predict DRAM traffic, elapsed time, or speedups.
See [the model contract](docs/model.md) and [course plan](docs/plan.md).

## Develop

Node.js 22 or newer. The application and model tests have no package dependencies.

```sh
npm run dev      # http://localhost:5173/gpu-lab/
npm run check    # model tests and static build
```

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

## Repository layout

- `src/model.mjs`: pure address model; all figure values derive from its result.
- `src/app.mjs`, `src/style.css`, `index.html`: accessible static lesson and views.
- `tests/`: model invariants, boundary cases, browser interactions and responsive layout.
- `examples/`: optional runnable CUDA exercises.
- `docs/`: curriculum, model scope, sources and development rules.

Inspired by the model-driven learning approach in [Digital Design](https://github.com/snowch/digital-design)
and [Assembly Lab](https://github.com/snowch/assembly-lab). This small standalone prototype does
not yet integrate `snowch/learning-platform`; migration is a separate curriculum/platform decision.
