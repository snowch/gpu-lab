# Run a downloaded CUDA program

The browser exercises need no installation. These optional paths run the complete
CUDA C++ program downloaded from chapter 1. Its multiplier is the value selected
when you download it.

## On an NVIDIA GPU

Use a compatible NVIDIA GPU, driver, CUDA Toolkit and host C++ compiler.
On Linux or Windows with WSL2 and NVIDIA CUDA support, open a terminal in the
folder containing `hello.cu`:

```sh
nvcc -std=c++17 hello.cu -o hello
./hello
```

With the default multiplier of two, expect `Output: [2, 4, 6, 8, 10]`.
To check the output automatically from a GPU Lab checkout (also requires Python 3):

```sh
bash scripts/run-cuda.sh native /path/to/hello.cu '[2,4,6,8,10]'
```

## Without an NVIDIA GPU: GPGPU-Sim

Use Docker Engine on Linux, or Docker Desktop with Linux containers (Windows users
can use a WSL2 terminal). The tested container targets Linux x86-64. ARM desktops
may require `--platform linux/amd64` emulation, which is slower and unvalidated.
The first build downloads a CUDA toolchain and compiles the simulator; allow
several GB of disk space and several minutes. Later runs reuse the image.

```sh
git clone https://github.com/snowch/gpu-lab.git
cd gpu-lab
docker build -f docker/cuda-sim.Dockerfile -t gpu-lab-cuda-sim .
```

Then, in the folder containing your downloaded `hello.cu`:

```sh
docker run --rm --network none \
  --mount "type=bind,src=$PWD,dst=/input,readonly" \
  gpu-lab-cuda-sim /input/hello.cu '[2,4,6,8,10]'
```

The container compiles the file with `nvcc`, runs it in functional simulation and
checks the printed values against the supplied JSON array. It exits unsuccessfully
on compilation errors, runtime failures or incorrect values. Change the expected
array if you changed the multiplier. Omit the array to inspect outputs without
checking them. Generated binaries and simulator files are temporary; your source
folder is mounted read-only. No GPU, NVIDIA driver or host CUDA installation is
needed for this path. Run only CUDA programs you trust.

## What CI checks

The CUDA workflow uses this same Dockerfile and runner. It generates chapter 1
programs with multipliers 2, −0.5, 0 and 3.25 using the browser's download generator,
then compares all five results with independent CPU references. Each program
launches eight threads across two blocks, including the guarded partial tail.
The existing gather, matrix multiplication and reduction checks run as well.
Compiler information, the simulator revision and execution logs are retained as CI
artifacts. These checks establish compilation and simulated output correctness;
physical NVIDIA GPU compatibility and performance have not been validated here.
