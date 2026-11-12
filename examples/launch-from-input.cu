// Copyright © 2026 Christopher Snow.
// Compile: nvcc -std=c++17 launch-from-input.cu -o launch-from-input
// This example checks values; it does not measure GPU performance.
#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>
#include <limits>
#include <vector>

#define CUDA_CHECK(call) do { \
  cudaError_t error = (call); \
  if (error != cudaSuccess) { \
    std::fprintf(stderr, "%s: %s\n", #call, cudaGetErrorString(error)); \
    std::exit(1); \
  } \
} while (0)

// BEGIN KERNEL
__global__ void runKernel(
    const float* input, float* output, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        output[i] = input[i] * 2.0f;
    }
}
// END KERNEL

int main() {
    // BEGIN INPUT
    std::vector<float> input = {
        1.0f, 2.0f, 3.0f, 4.0f, 5.0f
    };
    // END INPUT
    // BEGIN BLOCK_SIZE
    int threadsPerBlock = 4;
    // END BLOCK_SIZE
    // No allocation or launch is needed for an empty input.
    if (input.empty()) {
        std::printf("Output: []\n");
        return 0;
    }
    // Keep the int conversion and rounded-up block expression in range.
    if (input.size() > static_cast<std::size_t>(
            std::numeric_limits<int>::max() - (threadsPerBlock - 1))) {
        std::fprintf(stderr, "Input is too large for this int-indexed example.\n");
        return 1;
    }
    // BEGIN SIZES
    int n = static_cast<int>(input.size());
    std::vector<float> output(input.size());
    std::size_t bytes = input.size() * sizeof(float);
    // END SIZES

    // BEGIN COPY_IN
    float *d_input, *d_output;
    CUDA_CHECK(cudaMalloc(&d_input, bytes));
    CUDA_CHECK(cudaMalloc(&d_output, bytes));
    CUDA_CHECK(cudaMemcpy(
        d_input, input.data(), bytes,
        cudaMemcpyHostToDevice));
    // END COPY_IN

    // BEGIN LAUNCH
    int blocks = (n + threadsPerBlock - 1)
        / threadsPerBlock;
    runKernel<<<blocks, threadsPerBlock>>>(
        d_input, d_output, n);
    // END LAUNCH
    CUDA_CHECK(cudaGetLastError());

    // BEGIN COPY_OUT
    CUDA_CHECK(cudaMemcpy(
        output.data(), d_output, bytes,
        cudaMemcpyDeviceToHost));
    // END COPY_OUT
    // The blocking device-to-host copy has made output available to the CPU.
    bool correct = true;
    std::printf("Output: [");
    for (int i = 0; i < n; ++i) {
        if (i) std::printf(", ");
        std::printf("%g", static_cast<double>(output[i]));
        if (output[i] != input[i] * 2.0f) correct = false;
    }
    std::printf("]\n");
    CUDA_CHECK(cudaFree(d_input));
    CUDA_CHECK(cudaFree(d_output));
    if (!correct) {
        std::fprintf(stderr, "Output differs from the CPU reference.\n");
        return 1;
    }
    return 0;
}
