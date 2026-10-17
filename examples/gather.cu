// Copyright © 2026 Christopher Snow.
// Build: nvcc -O2 gather.cu -o gather
// Run:   ./gather [stride=1] [offset=0] [n=32]
// Requires the CUDA toolkit and a compatible NVIDIA GPU.
// This is a correctness example, not a performance benchmark.
#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>
#include <cerrno>
#include <vector>

#define CUDA_CHECK(call) do { \
    cudaError_t error = (call); \
    if (error != cudaSuccess) { \
        std::fprintf(stderr, "%s: %s\n", #call, cudaGetErrorString(error)); \
        std::exit(1); \
    } \
} while (0)

__global__ void gather(const float* x, float* y, int n, int stride, int offset) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = x[offset + i * stride];
}

int argument(const char* text, int low, int high) {
    errno = 0;
    char* end = nullptr;
    long value = std::strtol(text, &end, 10);
    if (errno || end == text || *end || value < low || value > high) {
        std::fprintf(stderr, "Expected an integer from %d to %d; got %s\n", low, high, text);
        std::exit(1);
    }
    return static_cast<int>(value);
}

int main(int argc, char** argv) {
    if (argc > 4) {
        std::fprintf(stderr, "Usage: %s [stride 1..32] [offset 0..31] [n 1..1048576]\n", argv[0]);
        return 1;
    }
    const int stride = argc > 1 ? argument(argv[1], 1, 32) : 1;
    const int offset = argc > 2 ? argument(argv[2], 0, 31) : 0;
    const int n = argc > 3 ? argument(argv[3], 1, 1048576) : 32;
    const size_t inputCount = static_cast<size_t>(offset) + static_cast<size_t>(n - 1) * stride + 1;
    std::vector<float> input(inputCount), output(n);
    for (size_t i = 0; i < inputCount; ++i) input[i] = static_cast<float>(i % 4096);
    float *deviceInput = nullptr, *deviceOutput = nullptr;
    CUDA_CHECK(cudaMalloc(&deviceInput, input.size() * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&deviceOutput, output.size() * sizeof(float)));
    CUDA_CHECK(cudaMemcpy(deviceInput, input.data(), input.size() * sizeof(float), cudaMemcpyHostToDevice));
    constexpr int threads = 128;
    gather<<<(n + threads - 1) / threads, threads>>>(deviceInput, deviceOutput, n, stride, offset);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());
    CUDA_CHECK(cudaMemcpy(output.data(), deviceOutput, output.size() * sizeof(float), cudaMemcpyDeviceToHost));
    CUDA_CHECK(cudaFree(deviceInput));
    CUDA_CHECK(cudaFree(deviceOutput));
    for (int i = 0; i < n; ++i) {
        const float expected = input[offset + static_cast<size_t>(i) * stride];
        if (output[i] != expected) {
            std::fprintf(stderr, "Mismatch at %d: expected %g, got %g\n", i, expected, output[i]);
            return 1;
        }
    }
    std::printf("Verified %d output values (stride %d, offset %d).\n", n, stride, offset);
    return 0;
}
