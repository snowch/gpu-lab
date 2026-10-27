// Copyright © 2026 Christopher Snow.
// Build: nvcc -std=c++17 -O2 shared-memory.cu -o shared-memory
// Run:   ./shared-memory
// Checks the padded-column example's values, not bank-conflict timing.
#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <limits>

#define CUDA_CHECK(call) do { \
    cudaError_t error = (call); \
    if (error != cudaSuccess) { \
        std::fprintf(stderr, "%s: %s\n", #call, cudaGetErrorString(error)); \
        std::exit(1); \
    } \
} while (0)

// BEGIN BANK KERNEL
__global__ void readColumn(const float* input, float* output) {
    // One block with 32 threads; a column read from a tile.
    __shared__ float tile[32][33]; // 32 useful columns + padding
    int lane = threadIdx.x;
    for (int row = 0; row < 32; ++row) {
        tile[row][lane] = input[row * 32 + lane];
    }
    __syncthreads();
    output[lane] = tile[lane][0];
}
// END BANK KERNEL

int main() {
    constexpr int rows = 32;
    constexpr int columns = 32;
    float input[rows * columns];
    float output[rows];
    for (int i = 0; i < rows * columns; ++i) input[i] = static_cast<float>(i);
    for (int row = 0; row < rows; ++row) output[row] = std::numeric_limits<float>::quiet_NaN();

    float *deviceInput = nullptr, *deviceOutput = nullptr;
    CUDA_CHECK(cudaMalloc(&deviceInput, sizeof(input)));
    CUDA_CHECK(cudaMalloc(&deviceOutput, sizeof(output)));
    CUDA_CHECK(cudaMemcpy(deviceInput, input, sizeof(input), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(deviceOutput, output, sizeof(output), cudaMemcpyHostToDevice));
    readColumn<<<1, 32>>>(deviceInput, deviceOutput);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());
    CUDA_CHECK(cudaMemcpy(output, deviceOutput, sizeof(output), cudaMemcpyDeviceToHost));
    CUDA_CHECK(cudaFree(deviceInput));
    CUDA_CHECK(cudaFree(deviceOutput));

    for (int row = 0; row < rows; ++row) {
        // Independent reference: the first column of a row-major 32-column array.
        const float expected = static_cast<float>(row * 32);
        if (!std::isfinite(output[row]) || output[row] != expected) {
            std::fprintf(stderr, "Mismatch at row %d: expected %g, got %g\n",
                         row, static_cast<double>(expected), static_cast<double>(output[row]));
            return 1;
        }
    }
    std::printf("Verified 32 padded shared-memory column values.\n");
    return 0;
}
