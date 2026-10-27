# Run the examples on your desktop

Copyright © 2026 Christopher Snow.

No installation or GPU is required for the browser exercises. The optional
[desktop appendix](https://snowch.github.io/gpu-lab/lessons/desktop.html) collects runnable downloads. Choose
one of three paths: compile CUDA C++ in a CPU-hosted simulator, run PyTorch in a
Python environment, or execute CUDA C++ on an NVIDIA GPU. GPGPU-Sim runs the
supported CUDA programs; it does not run the course's PyTorch examples.

## First CUDA run without an NVIDIA GPU

Use a Linux x86-64 computer with Git and a running Docker Engine, or Windows with
WSL2 and Docker Desktop configured for Linux containers and WSL integration. Run
the commands below in a Linux or WSL2 terminal. This path needs no NVIDIA GPU,
NVIDIA driver or host CUDA installation: the image supplies the compiler and
simulator. ARM hosts, including Apple Silicon, are unvalidated; forcing
`--platform linux/amd64` emulation is not an established supported path.

Plan for **20 GB or more of free space, with substantial extra headroom**, in the
storage Docker actually uses. This is not a promise that 20 GB is enough: a
32 GB environment with about 24 GB free ran out of space while unpacking the
base image. Compressed downloads, unpacked layers, build cache and temporary
files can coexist. Check Docker Desktop's disk allocation as well as host free
space. The first build downloads a large toolchain image and builds the
simulator; its duration depends on the machine and network. Later runs reuse
the image.

From a terminal, clone the repository and build the image:

```sh
git clone https://github.com/snowch/gpu-lab.git
cd gpu-lab
docker build -f docker/cuda-sim.Dockerfile -t gpu-lab-cuda-sim .
```

Download the default `hello.cu` from the desktop appendix, or use chapter 1’s
download to choose a multiplier. The chapter download contains the multiplier
selected when you saved it. Open a terminal in the folder containing that file, then run:

```sh
docker run --rm --network none \
  --mount "type=bind,src=$PWD,dst=/input,readonly" \
  gpu-lab-cuda-sim /input/hello.cu
```

The container compiles the file with `nvcc` and executes its CUDA kernel in
functional simulation. With multiplier two, the program prints
`Output: [2, 4, 6, 8, 10]` amongst the simulator messages. Its binaries and working
files are temporary; the downloaded source folder is mounted read-only. The
runtime command needs no network access after the image has been built.

To check the values automatically, supply the expected output as a JSON array:

```sh
docker run --rm --network none \
  --mount "type=bind,src=$PWD,dst=/input,readonly" \
  gpu-lab-cuda-sim /input/hello.cu '[2,4,6,8,10]'
```

A successful comparison ends with
`PASS: verified 5 output values against the CPU reference`. Change the expected
array if you selected a different multiplier. This optional checker requires one
printed `Output: [...]` line; it rejects missing, extra, nonfinite or mismatched
values. Without the array, the runner checks compilation and simulated execution
but does not independently compare the printed values. The repository's gather,
matmul/reduction and shared-memory examples instead contain their own reference
checks and success messages.

## What the simulator configuration means

The Dockerfile pins the CUDA 12.8 Ubuntu 24.04 base image by digest and GPGPU-Sim
to revision `c3eeb6d19016960ab66789efdd8a3200cc30222a`. The runner compiles
embedded PTX for `compute_70`, links the shared CUDA runtime supplied by
GPGPU-Sim, and loads its `SM7_QV100` configuration. It sets
`PTX_SIM_MODE_FUNC=1` for functional execution.

This checks whether a supported compiled program computes the expected values.
It does not measure an NVIDIA GPU, validate the browser's teaching-machine cycle
counts, or establish bank-conflict timing, memory-transaction counts or speedups.
The configuration name is not a claim of measured V100 performance. Arbitrary
modern CUDA libraries or kernels may need features outside this simulator path.

## Run the repository's CUDA check suite

The complete suite also needs **Node.js 22 or newer on the host** to generate
programs from the same source generators used for browser downloads. From the
repository root, after building the image:

```sh
node scripts/generate-cuda-cases.mjs
docker run --rm --network none --entrypoint bash \
  --mount "type=bind,src=$PWD,dst=/course" \
  gpu-lab-cuda-sim /course/scripts/cuda-sim.sh
```

This mount is writable because the suite saves logs and configuration beneath
`test-results/cuda-sim/`. Generated CUDA sources and their JSON references are
in `test-results/generated-cuda/`. Files written by the container may belong to
root on a Linux host.

The suite is configured to check:

- Four chapter 1 downloads: multipliers 2, −0.5, 0 and 3.25, each with five inputs
  and a guarded eight-thread launch.
- Twelve safe repair-workshop downloads: multiplication, addition and vector
  addition, each with block sizes 8, 16, 32 and 64, for 35 inputs. All use guarded
  global indexing. Addition is checked against its own arithmetic, even though
  it is not a correct solution to the workshop's multiplication goal.
- Five gather cases: contiguous, strided, misaligned, partial-warp and
  multiple-block inputs.
- The self-checking naive matmul, tiled matmul and block reduction in
  `examples/ai-kernels.cu`.
- The 32-value padded shared-memory column read in
  `examples/shared-memory.cu`.

Unsafe workshop configurations are excluded. This suite does not compile or
validate tensor-core or attention CUDA kernels. The CUDA CI workflow uses the
same Dockerfile and scripts and preserves compiler, simulator and run logs.
The configured checks are not themselves evidence that a particular revision
passed; inspect that revision's CI result and artifacts. See
[validation boundaries](validation.md).

## Run the PyTorch downloads separately

Use a Python environment with PyTorch installed. Choose an installation for your
platform from [PyTorch's installation guide](https://pytorch.org/get-started/locally/).
The desktop appendix provides generated `.py` downloads based on the chapter
source. Each runnable download defaults to `--device cpu` and also accepts `--device cuda`;
use `--help` to inspect its options. For the appendix’s `hello.py` download:

```sh
python hello.py --device cpu
python hello.py --device cuda
```

Use the corresponding filename for another chapter or experiment. CPU mode can
check values, shapes and layouts without a GPU. It cannot demonstrate CPU–GPU transfers
or validate a CUDA backend. CUDA mode needs a compatible NVIDIA GPU, driver and
CUDA-enabled PyTorch installation. Where an example deliberately explains an
arithmetic order with a CPU loop, its description distinguishes that calculation
from a GPU matrix implementation.

To regenerate the downloads in a checkout, use Node.js 22 or newer:

```sh
node scripts/export-desktop.mjs
python test-results/desktop-examples/hello.py --device cpu
```

The generator writes to `test-results/desktop-examples/`; the site build places
the same runnable sources under `examples/desktop/` in the built site. They
include chapters 1–12, the memory lab and named experiment downloads such as
`precision-accumulation.py`. Use the appendix links to choose a program.

The repository also includes the opening companion:

```sh
python examples/book-opening.py --device cpu
```

CPU checks do not establish which GPU implementation PyTorch selects or how
fast it runs. Physical GPU execution of the new downloads remains unvalidated.
Do not pass Python files to the GPGPU-Sim container.

## Run CUDA C++ on an NVIDIA GPU

Use a compatible NVIDIA GPU, driver, CUDA Toolkit and supported host C++ compiler.
On Linux, or Windows through WSL2 configured for NVIDIA CUDA, open a terminal in
the folder containing the downloaded `hello.cu`:

```sh
nvcc -std=c++17 hello.cu -o hello
./hello
```

With multiplier two, expect `Output: [2, 4, 6, 8, 10]`. For an independent output
comparison from a repository checkout, also install Python 3 and run:

```sh
bash scripts/run-cuda.sh native /path/to/hello.cu '[2,4,6,8,10]'
```

This uses your installed compiler and physical GPU. Record their versions and
GPU model when reporting a result; this project has not yet validated this native
path on physical NVIDIA hardware. Neither printing the right values nor running
the functional simulator constitutes a performance measurement.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Docker cannot connect to its daemon | Start Docker; on Windows, enable Linux containers and WSL integration, then use the WSL terminal. Check `docker info`. |
| Build or extraction reports no space left | Check Docker's storage allocation, `docker system df`, and host free space. Increase capacity or remove only images/cache you no longer need. Allow room for temporary unpacked layers; free space exceeding 20 GB can still be insufficient. |
| `/input/hello.cu` is missing | Run from the folder that actually contains `hello.cu`. Keep the quoted mount argument, and use `/input/hello.cu` inside the container. Check Docker Desktop's file-sharing access if necessary. |
| `nvcc` reports a compiler or source error | Use the first compiler diagnostic. Confirm the downloaded filename and that it contains a complete program. The container supplies CUDA 12.8; for native execution, check `nvcc --version` and your host compiler's CUDA compatibility. |
| CUDA driver/runtime error in the simulator path | Use the supplied image entrypoint, or the documented suite command. The runner sources simulator setup and checks that `libcudart` resolves to GPGPU-Sim. Running an executable with the ordinary CUDA runtime on a CPU-only host is a different path. |
| Timeout or unsupported simulator operation | Read the complete simulator log. The wrapper gives each program 180 seconds. Confirm that you are running a covered course example; a timeout is a failed check, not a pass. |
| Wrong output or missing `PASS` | With the optional JSON checker, use expected values for the selected multiplier or workshop operation. Read the reported failing index. The checker requires exactly one `Output` array; self-checking standalone examples use their own success markers instead. Omitting JSON does not run that comparison. |
| Suite cannot write logs, or generated sources are missing | Run the generator from the repository root before the suite, and use its writable `/course` mount. Check ownership of `test-results/` if an earlier container run created root-owned files. |

For a reproducible report, include the command, source file, expected values,
compiler version, simulator revision and full failure log. Keep correctness,
simulated behaviour and physical GPU performance as separate claims.
