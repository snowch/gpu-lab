#!/usr/bin/env bash
# Copyright © 2026 Christopher Snow.
# Compile a downloaded program; optional expected output is a JSON array.
set -eo pipefail
mode=${1:-}; source_file=${2:-}; expected=${3:-}
if [[ "$mode" != native && "$mode" != simulator ]] || [[ ! -f "$source_file" ]]; then
  echo 'Usage: run-cuda.sh native|simulator program.cu [expected-json-array]' >&2; exit 2
fi
source_file=$(realpath "$source_file")
runner_root=$(cd "$(dirname "$0")" && pwd)
run_dir=$(mktemp -d)
trap 'rm -rf "$run_dir"' EXIT
if [[ "$mode" == simulator ]]; then
  sim_root=${GPGPUSIM_ROOT:-/opt/gpgpu-sim}
  cd "$sim_root"
  source setup > "$run_dir/setup.log" 2>&1
  cp "$sim_root"/configs/tested-cfgs/SM7_QV100/* "$run_dir/"
fi
set -u
cd "$run_dir"
flags=(-std=c++17 -O2)
if [[ "$mode" == simulator ]]; then flags+=(--cudart shared -gencode arch=compute_70,code=compute_70); fi
nvcc "${flags[@]}" "$source_file" -o program
nvcc --version
if [[ "$mode" == simulator ]]; then
  git -C "$sim_root" rev-parse HEAD
  ldd ./program | grep 'libcudart.*gpgpu-sim'
  PTX_SIM_MODE_FUNC=1 timeout 180 ./program > run.log 2>&1 || { cat run.log; exit 1; }
  grep -q 'GPGPU-Sim' run.log
else
  ./program > run.log 2>&1 || { cat run.log; exit 1; }
fi
cat run.log
if [[ -n "$expected" ]]; then python3 "$runner_root/verify-cuda-output.py" run.log "$expected"; fi
