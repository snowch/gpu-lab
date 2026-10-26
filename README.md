# GPU Lab

Copyright © 2026 Christopher Snow.

An interactive book and set of labs for AI practitioners who want to understand how GPUs execute tensor
operations. Familiarity with Python, arrays and basic tensor shapes is enough to start.
CUDA arrives through small programs tied to the hardware model.

Course URL: <https://snowch.github.io/gpu-lab/>

## Current scope

[Repair a kernel](https://snowch.github.io/gpu-lab/lessons/kernel.html) is a hands-on
workshop for understanding and debugging CUDA kernels. Repair the kernel,
check lengths 8/32/35, replay reads and writes in the browser model, and compile and run
the corresponding CUDA C++ program on an NVIDIA GPU after downloading it. The browser
simulates supported CUDA expressions on the CPU; it neither compiles CUDA nor executes
GPU code. Generated CUDA programs include their host setup but have not yet been
compiled or validated on an NVIDIA GPU.


Start with the new book opening:

1. [One operation, many numbers](https://snowch.github.io/gpu-lab/lessons/hello.html): five values, threads, indices, blocks and bounds checks.
2. [Where do the numbers live?](https://snowch.github.io/gpu-lab/lessons/devices.html): copy to the GPU, calculate there, and copy a result back.
3. [How do we select values from a tensor?](https://snowch.github.io/gpu-lab/lessons/reading.html): shape, row and column selection.
4. [How are tensor values arranged in memory?](https://snowch.github.io/gpu-lab/lessons/layout.html): views, strides and packed copies.
5. [How do threads read those values?](https://snowch.github.io/gpu-lab/lessons/requests.html): warps and equal-work sector comparisons.

Each example retains its own controls, diagram and results. The
[PyTorch companion](examples/book-opening.py) checks these operations using real
PyTorch: `python examples/book-opening.py --device cpu` or `--device cuda`.
CPU mode checks values/layouts without GPU transfers; CUDA mode needs an NVIDIA
GPU and has not yet been validated on hardware. Neither mode is a benchmark.
The remaining book chapters are planned adaptations of the existing labs, not
completed rewrites. [Meet the GPU](https://snowch.github.io/gpu-lab/lessons/meet-gpu.html)
remains an optional visual reference available offline and without JavaScript.

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

## Use offline

Choose **Install** in the course header to add GPU Lab to your apps with its own GPU-chip
icon and standalone window. Chrome and Edge offer a native install prompt when available;
the dialog also explains Safari’s Add to Dock / Add to Home Screen options. Installed apps
use the same offline course. Installation and shortcut placement are controlled by your browser.

Open **App status → Offline access** and choose **Download for offline use**.
The panel shows the exact file bytes before saving every lesson, simulator, diagram
and CUDA/PyTorch example, including lessons you have not visited. Wait for
**Available offline** before disconnecting. External links need internet access;
running downloaded examples requires their usual local tools. Installing the app
and checking for updates do not automatically download the offline course.

App status compares the running build with the deployed release. Choose **Update**
to prepare it, then **Restart to update** when ready. All open GPU Lab windows save
their experiment state before restarting together; a busy or non-responsive window
blocks the restart. **Later** keeps the pending badge visible. Closing all windows
or refreshing does not apply a prepared update automatically.

Cancelled downloads can resume from verified files. Failed replacements leave the
previous complete copy usable. App status detects missing/evicted files and offers
repair. **Remove offline copy** asks for confirmation and preserves learner work,
preferences and other apps. HTTPS (or localhost) and browser storage are required.
See [the release contract, migration notes and validation](docs/app-status.md).

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
python tests/offline.py
```

CI runs the model/build and both browser suites before deploying `dist/` from `main` through GitHub Pages Actions.
Pull requests run checks without deployment. All application assets use relative paths.

The build emits `release.json`, immutable `releases/<build-id>/` assets and a stable
`sw.js` lifecycle engine. Clean Git builds retain their source commit/date in the
footer; archives and dirty development builds identify themselves without a fake
revision. App status uses network-only deployed metadata, never GitHub `main`.
The worker prepares files only on request and verifies size and SHA-256 before
selection. During development, use App status to update, or unregister the worker
in browser developer tools while iterating. The browser suites exercise both root
and `/gpu-lab/` hosting, complete offline access and multiple real built releases.

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


Start with **Hello, GPU** (`lessons/hello.html`): change a multiplier and see how
each thread connects an input to an output. Five sections flow down one page, each with its own visual and independent controls.
They introduce indices, blocks and
bounds checks before revealing a complete CUDA kernel. The browser simulation makes
no GPU execution claim. **Repair a kernel** follows; the eight architecture labs
remain available independently.

Download chapter 1’s CUDA program and [run it on an NVIDIA GPU or locally through GPGPU-Sim](docs/run-cuda.md). The desktop container is also used by CI.
