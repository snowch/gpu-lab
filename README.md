# GPU Lab

Copyright © 2026 Christopher Snow.

An interactive course for AI practitioners who want to understand how GPUs execute tensor
operations. Familiarity with Python, arrays and basic tensor shapes is enough to start.
CUDA arrives through small programs tied to the hardware model.

Course URL: <https://snowch.github.io/gpu-lab/>

## Current scope

Four working drafts connect AI operations to small, inspectable models:

1. [Reading a tensor](https://snowch.github.io/gpu-lab/#lab): addresses, stride, alignment and coalescing.
2. [Keeping the GPU busy](https://snowch.github.io/gpu-lab/lessons/scheduling.html): ready/waiting warps and latency hiding.
3. [Taking different paths](https://snowch.github.io/gpu-lab/lessons/divergence.html): branch masks and useful lane slots.
4. [Sharing work within a block](https://snowch.github.io/gpu-lab/lessons/shared-memory.html): shared-memory banks, broadcasts and padding.

Each has predictions, a computed view, CUDA connections and exercises. Labs 02–04 have
step/replay controls. The roadmap's remaining four modules are planned. Module 04's reduction
and race-detection experiments are also still planned; its current interactive model covers reads.

The teaching models do not interpret CUDA. Their counts and toy scheduling cycles do not
predict physical DRAM traffic, measured elapsed time, or speedups on a particular GPU.
See [the model contract](docs/model.md) and [course plan](docs/plan.md).

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

## Repository layout

- `src/model.mjs`: pure address model; all figure values derive from its result.
- `src/architecture.mjs`: scheduling, divergent paths and shared-memory bank models.
- `content/lessons.mjs`: lesson prose and a shared static page renderer used during the build.
- `src/lesson.mjs`, `src/theme.mjs`: shared experiment controls and theme persistence.
- `src/app.mjs`, `src/style.css`, `index.html`: accessible static lesson and views.
- `tests/`: model invariants, boundary cases, browser interactions and responsive layout.
- `examples/`: optional runnable CUDA exercises.
- `docs/`: curriculum, model scope, sources and development rules.

Inspired by the model-driven learning approach in [Digital Design](https://github.com/snowch/digital-design)
and [Assembly Lab](https://github.com/snowch/assembly-lab). This small standalone prototype does
not yet integrate `snowch/learning-platform`; migration is a separate curriculum/platform decision.
