// Copyright © 2026 Christopher Snow.
// Wrap the displayed kernel in a complete CUDA C++ program; no compilation in browser.
export function cudaProgram({kernel,input,second=[],size,args='d_x, d_y, d_b, n, 2.0f'}) {
  const literal=v=>Number.isInteger(v)?v+'.0f':String(v)+'f';
  return `// Generated GPU Lab example. Requires NVIDIA GPU, CUDA Toolkit and a C++ host compiler.
// Save as lab.cu, compile: nvcc -std=c++17 lab.cu -o lab
// Run: ./lab
// Not compiled or hardware-validated by the browser simulation.
#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <limits>
#define CUDA_CHECK(call) do { cudaError_t e = (call); if (e != cudaSuccess) { std::fprintf(stderr, "%s: %s\\n", #call, cudaGetErrorString(e)); std::exit(1); } } while (0)

${kernel}

int main() {
  const int n = ${input.length};
  const float x[n] = { ${input.map(literal).join(', ')} };
  const float b[n] = { ${(second.length?second:input.map(()=>0)).map(literal).join(', ')} };
  float y[n];
  for (int i = 0; i < n; ++i) y[i] = std::numeric_limits<float>::quiet_NaN();
  float *d_x, *d_y, *d_b;
  CUDA_CHECK(cudaMalloc(&d_x, sizeof(x)));
  CUDA_CHECK(cudaMalloc(&d_y, sizeof(y)));
  CUDA_CHECK(cudaMalloc(&d_b, sizeof(b)));
  CUDA_CHECK(cudaMemcpy(d_x, x, sizeof(x), cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemcpy(d_y, y, sizeof(y), cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemcpy(d_b, b, sizeof(b), cudaMemcpyHostToDevice));
  runKernel<<<(n + ${size} - 1) / ${size}, ${size}>>>(${args});
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaDeviceSynchronize());
  CUDA_CHECK(cudaMemcpy(y, d_y, sizeof(y), cudaMemcpyDeviceToHost));
  std::printf("Output: [");
  for (int i = 0; i < n; ++i) {
    if (i) std::printf(", ");
    if (std::isnan(y[i])) std::printf("unwritten");
    else std::printf("%g", static_cast<double>(y[i]));
  }
  std::printf("]\\n");
  CUDA_CHECK(cudaFree(d_x)); CUDA_CHECK(cudaFree(d_y)); CUDA_CHECK(cudaFree(d_b));
  return 0;
}
`;
}
export function downloadCuda(source,name='lab.cu') {
  const url=URL.createObjectURL(new Blob([source],{type:'text/plain'})),link=document.createElement('a');
  link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
