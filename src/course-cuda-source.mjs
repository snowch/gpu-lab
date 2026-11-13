// Copyright © 2026 Christopher Snow.
// These exact sources supply both the lesson excerpts and runnable downloads.
export const courseKernels = {
row:`__global__ void doubleRow(
    const float input[5][5], float* output, int row) {
    int column = blockIdx.x * blockDim.x + threadIdx.x;
    if (column < 5) {
        output[column] = input[row][column] * 2.0f;
    }
}`,
column:`__global__ void doubleColumn(
    const float input[5][5], float* output, int column) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;
    if (row < 5) {
        output[row] = input[row][column] * 2.0f;
    }
}`,
pack:`__global__ void packValues(
    const float* input, float* packed,
    int n, int stride, int offset) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        packed[i] = input[offset + i * stride];
    }
}`,
requests:`__global__ void doubleStrided(
    const float* input, float* output,
    int n, int stride, int offset) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        float value = input[offset + i * stride];
        output[i] = value * 2.0f;
    }
}`,
scale:`__global__ void scale(
    const float* input, float* output, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) output[i] = input[i] * 2.0f;
}`,
branch:`__global__ void chooseCalculation(
    const float* input, float* output, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        float value = input[i];
        if (value > 0.0f) {
            output[i] = value * 2.0f;
        } else {
            output[i] = -value;
        }
    }
}`,
reduction:`__global__ void sumEight(
    const float* input, float* output) {
    __shared__ float partial[8];
    int t = threadIdx.x;
    partial[t] = input[t];
    __syncthreads();
    for (int stride = 8 / 2; stride > 0; stride /= 2) {
        if (t < stride) {
            partial[t] += partial[t + stride];
        }
        __syncthreads();
    }
    if (t == 0) output[0] = partial[0];
}`,
dot:`__global__ void separateProducts(
    const float* a, const float* b, float* c) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row < 4 && col < 4) {
        float sum = 0.0f;
        for (int k = 0; k < 4; ++k) {
            sum += a[row * 4 + k] * b[k * 4 + col];
        }
        c[row * 4 + col] = sum;
    }
}`,
tiled:`__global__ void sharedProducts(
    const float* a, const float* b, float* c) {
    __shared__ float aTile[2][2], bTile[2][2];
    int y = threadIdx.y, x = threadIdx.x;
    int row = blockIdx.y * 2 + y;
    int col = blockIdx.x * 2 + x;
    float sum = 0.0f;
    for (int k0 = 0; k0 < 4; k0 += 2) {
        aTile[y][x] = a[row * 4 + k0 + x];
        bTile[y][x] = b[(k0 + y) * 4 + col];
        __syncthreads();
        for (int k = 0; k < 2; ++k) {
            sum += aTile[y][k] * bTile[k][x];
        }
        __syncthreads();
    }
    c[row * 4 + col] = sum;
}`,
precision:`__global__ void roundInputs(
    const float* input, float* converted, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        __half stored = __float2half_rn(input[i]);
        converted[i] = __half2float(stored);
    }
}`,
attention:`__global__ void onlineAttention(
    const float* queries, const float* keys,
    const float* values, float* output, int n) {
    int query = blockIdx.x * blockDim.x + threadIdx.x;
    if (query >= n) return;
    float maxScore = -INFINITY;
    float normalizer = 0.0f;
    float weighted[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    for (int key = 0; key < n; ++key) {
        float score = 0.0f;
        for (int c = 0; c < 4; ++c) {
            score += queries[query * 4 + c]
                * keys[key * 4 + c];
        }
        score *= 0.5f;
        // BEGIN ONLINE_UPDATE
        float newMax = fmaxf(maxScore, score);
        float oldScale = expf(maxScore - newMax);
        float weight = expf(score - newMax);
        normalizer = normalizer * oldScale + weight;
        for (int c = 0; c < 4; ++c) {
            weighted[c] = weighted[c] * oldScale
                + weight * values[key * 4 + c];
        }
        maxScore = newMax;
        // END ONLINE_UPDATE
    }
    for (int c = 0; c < 4; ++c) {
        output[query * 4 + c] = weighted[c] / normalizer;
    }
}`,
cache:`__global__ void appendCache(
    float* keys, float* values,
    const float* newKey, const float* newValue,
    int cachedTokens, int width) {
    int c = blockIdx.x * blockDim.x + threadIdx.x;
    if (c < width) {
        int position = cachedTokens * width + c;
        keys[position] = newKey[c];
        values[position] = newValue[c];
    }
}`,
};
export const scaleLaunch=`scale<<<blocks, threadsPerBlock>>>(
    d_input, d_intermediate, n);
CUDA_CHECK(cudaGetLastError());
scale<<<blocks, threadsPerBlock>>>(
    d_intermediate, d_output, n);
CUDA_CHECK(cudaGetLastError());`;

export const timingSource=`cudaEvent_t start, stop;
CUDA_CHECK(cudaEventCreate(&start));
CUDA_CHECK(cudaEventCreate(&stop));
CUDA_CHECK(cudaEventRecord(start));
sharedProducts<<<blocks, threads>>>(d_a, d_b, d_c);
CUDA_CHECK(cudaGetLastError());
CUDA_CHECK(cudaEventRecord(stop));
CUDA_CHECK(cudaEventSynchronize(stop));
float milliseconds = 0.0f;
CUDA_CHECK(cudaEventElapsedTime(
    &milliseconds, start, stop));
CUDA_CHECK(cudaEventDestroy(start));
CUDA_CHECK(cudaEventDestroy(stop));`;

export const wmmaKernel=`using namespace nvcuda;
__global__ void matrixTile(
    const half* a, const half* b, float* c) {
    wmma::fragment<wmma::matrix_a, 16, 16, 16,
        half, wmma::row_major> aTile;
    wmma::fragment<wmma::matrix_b, 16, 16, 16,
        half, wmma::row_major> bTile;
    wmma::fragment<wmma::accumulator, 16, 16, 16,
        float> result;
    wmma::fill_fragment(result, 0.0f);
    wmma::load_matrix_sync(aTile, a, 16);
    wmma::load_matrix_sync(bTile, b, 16);
    wmma::mma_sync(result, aTile, bTile, result);
    wmma::store_matrix_sync(
        c, result, 16, wmma::mem_row_major);
}`;

const preamble=`// Copyright © 2026 Christopher Snow.
// nvcc -std=c++17 -arch=sm_70 course-bridges.cu -o bridges
// Run ./bridges for correctness. Only physical GPU timing is meaningful.
#include <cuda_runtime.h>
#include <cuda_fp16.h>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <algorithm>
#include <vector>
#define CUDA_CHECK(call) do { cudaError_t e=(call); if(e!=cudaSuccess) { \\
  std::fprintf(stderr,"%s: %s\\n",#call,cudaGetErrorString(e));std::exit(1); } } while(0)
`;

export function courseCudaProgram(){return preamble+Object.values(courseKernels).join('\n\n')+`
std::vector<float*> allocations;
float* reserve(int count) {
    float* address;
    CUDA_CHECK(cudaMalloc(&address, count * sizeof(float)));
    allocations.push_back(address);
    return address;
}
float* upload(const std::vector<float>& values) {
    float* address = reserve(values.size());
    CUDA_CHECK(cudaMemcpy(address, values.data(),
        values.size() * sizeof(float), cudaMemcpyHostToDevice));
    return address;
}
std::vector<float> results;
void collect(float* address, int count) {
    CUDA_CHECK(cudaGetLastError());
    std::vector<float> values(count);
    CUDA_CHECK(cudaMemcpy(values.data(), address,
        count * sizeof(float), cudaMemcpyDeviceToHost));
    results.insert(results.end(), values.begin(), values.end());
}
void measure(float* d_a, float* d_b, float* d_c) {
    dim3 blocks(2, 2), threads(2, 2);
    // Warm-up and result checks belong outside a timed interval.
    for (int repeat = 0; repeat < 5; ++repeat) {
        sharedProducts<<<blocks, threads>>>(d_a, d_b, d_c);
    }
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());
    for (int repeat = 0; repeat < 10; ++repeat) {
        ${timingSource.replaceAll('\n','\n        ')}
        std::printf("GPU interval: %g ms\\n", milliseconds);
    }
}
int main(int argc, char** argv) {
    std::vector<float> matrix(25);
    for(int i=0;i<25;++i) matrix[i]=i+1.0f;
    float* d_matrix=upload(matrix);
    float* selected=reserve(5);
    auto matrixRows=reinterpret_cast<const float(*)[5]>(d_matrix);
    for(int row=0;row<5;++row) {
        doubleRow<<<1,8>>>(matrixRows,selected,row); collect(selected,5);
    }
    for(int column=0;column<5;++column) {
        doubleColumn<<<1,8>>>(matrixRows,selected,column); collect(selected,5);
    }
    packValues<<<1,8>>>(d_matrix,selected,5,5,0); collect(selected,5);
    doubleStrided<<<1,32>>>(d_matrix,selected,5,1,0); collect(selected,5);
    doubleStrided<<<1,32>>>(d_matrix,selected,5,5,0); collect(selected,5);
    float* d_input=upload({1.0f,2.0f,3.0f,4.0f,5.0f});
    float* d_intermediate=reserve(5);
    float* d_output=reserve(5);
    int n=5, blocks=2, threadsPerBlock=4;
    ${scaleLaunch.replaceAll('\n','\n    ')}
    collect(d_output,5);
    std::vector<float> signs(32);
    for(int i=0;i<32;++i) signs[i]=i%2 ? -2.0f : 2.0f;
    float* d_signs=upload(signs); float* d_branches=reserve(32);
    chooseCalculation<<<1,32>>>(d_signs,d_branches,32); collect(d_branches,32);
    float* d_eight=upload({1,2,3,4,5,6,7,8});float* d_sum=reserve(1);
    sumEight<<<1,8>>>(d_eight,d_sum);collect(d_sum,1);
    std::vector<float> a(16),b(16);
    for(int r=0;r<4;++r)for(int c=0;c<4;++c) {
        a[r*4+c]=(r+c)%5-2.0f;b[r*4+c]=(r+c)%3-1.0f;
    }
    float* d_a=upload(a);float* d_b=upload(b);float* d_c=reserve(16);
    dim3 threads(2,2), grid(2,2);
    separateProducts<<<grid,threads>>>(d_a,d_b,d_c);collect(d_c,16);
    sharedProducts<<<grid,threads>>>(d_a,d_b,d_c);collect(d_c,16);
    std::vector<float> row(16,-1.0f);
    for(int i=0;i<8;++i)row[i]=1.0003f;
    float* d_row=upload(row);float* d_converted=reserve(16);
    roundInputs<<<1,32>>>(d_row,d_converted,16);collect(d_converted,16);
    std::vector<float> q(32),k(32),v(32);
    for(int i=0;i<8;++i)for(int c=0;c<4;++c) {
        q[i*4+c]=(i+c)%5-2.0f;
        k[i*4+c]=((2*i+c+4)%7-3)/2.0f;
        v[i*4+c]=(i+c)%9-4.0f;
    }
    float* dq=upload(q);float* dk=upload(k);float* dv=upload(v);
    float* dout=reserve(32);
    onlineAttention<<<1,8>>>(dq,dk,dv,dout,8);collect(dout,32);
    std::vector<float> oldK(16,0.0f),oldV(16,0.0f);
    for(int i=0;i<12;++i){oldK[i]=i/10.0f;oldV[i]=i;}
    float* cacheK=upload(oldK);float* cacheV=upload(oldV);
    float* newK=upload({0.2f,0.3f,0.4f,0.5f});
    float* newV=upload({12.0f,13.0f,14.0f,15.0f});
    appendCache<<<1,8>>>(cacheK,cacheV,newK,newV,3,4);
    collect(cacheK,16);collect(cacheV,16);
    // Independent CPU references: ordinary selections, scalar matrix products,
    // materialised softmax (rather than the GPU's online recurrence), and append.
    std::vector<double> expected;
    for(int r=0;r<5;++r)for(int c=0;c<5;++c)expected.push_back(matrix[r*5+c]*2);
    for(int c=0;c<5;++c)for(int r=0;r<5;++r)expected.push_back(matrix[r*5+c]*2);
    for(int r=0;r<5;++r)expected.push_back(matrix[r*5]);
    for(int c=0;c<5;++c)expected.push_back(matrix[c]*2);
    for(int r=0;r<5;++r)expected.push_back(matrix[r*5]*2);
    for(int i=1;i<=5;++i)expected.push_back(i*4);
    for(float value:signs)expected.push_back(value>0 ? value*2 : -value);
    expected.push_back(36);
    for(int variant=0;variant<2;++variant)for(int r=0;r<4;++r)for(int c=0;c<4;++c){
        double sum=0;for(int j=0;j<4;++j)sum+=a[r*4+j]*b[j*4+c];
        expected.push_back(sum);
    }
    for(int i=0;i<16;++i)expected.push_back(i<8 ? 1.0 : -1.0);
    for(int query=0;query<8;++query){
        double scores[8],weights[8],maximum=-INFINITY,total=0;
        for(int key=0;key<8;++key){
            scores[key]=0;
            for(int c=0;c<4;++c)scores[key]+=q[query*4+c]*k[key*4+c]/2.0;
            maximum=std::max(maximum,scores[key]);
        }
        for(int key=0;key<8;++key){weights[key]=std::exp(scores[key]-maximum);total+=weights[key];}
        for(int c=0;c<4;++c){
            double sum=0;for(int key=0;key<8;++key)sum+=weights[key]*v[key*4+c];
            expected.push_back(sum/total);
        }
    }
    for(int i=0;i<12;++i)expected.push_back(i/10.0);
    for(double value:{0.2,0.3,0.4,0.5})expected.push_back(value);
    for(int i=0;i<16;++i)expected.push_back(i);
    if(expected.size()!=results.size())return 1;
    for(std::size_t i=0;i<results.size();++i){
        if(!std::isfinite(results[i]) || std::fabs(results[i]-expected[i])>1e-6*(1+std::fabs(expected[i]))){
            std::fprintf(stderr,"CPU reference mismatch at %zu\\n",i);return 1;
        }
    }
    std::printf("Output: [");
    for(std::size_t i=0;i<results.size();++i) {
        if(i)std::printf(", ");std::printf("%.9g",results[i]);
    }
    std::printf("]\\n");
    std::puts("Verified CUDA course bridge outputs against independent CPU references.");
    if(argc>1 && std::strcmp(argv[1],"--timing")==0) measure(d_a,d_b,d_c);
    for(float* address:allocations)CUDA_CHECK(cudaFree(address));
    return 0;
}
`;}

export function nativeWmmaProgram(){return preamble.replace('course-bridges.cu -o bridges','wmma.cu -o wmma').replace('Run ./bridges','Run ./wmma')+'#include <mma.h>\n'+wmmaKernel+`
// Native hardware example. Compiled, but not functionally simulated in CI.
int main() {
    std::vector<half> input(256,__float2half(1.0f));
    std::vector<float> output(256);
    half *a,*b;float* c;
    CUDA_CHECK(cudaMalloc(&a,512));CUDA_CHECK(cudaMalloc(&b,512));
    CUDA_CHECK(cudaMalloc(&c,1024));
    CUDA_CHECK(cudaMemcpy(a,input.data(),512,cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(b,input.data(),512,cudaMemcpyHostToDevice));
    matrixTile<<<1,32>>>(a,b,c);CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaMemcpy(output.data(),c,1024,cudaMemcpyDeviceToHost));
    for(float value:output)if(value!=16.0f)return 1;
    CUDA_CHECK(cudaFree(a));CUDA_CHECK(cudaFree(b));CUDA_CHECK(cudaFree(c));
    std::puts("Verified 256 WMMA outputs on the selected device.");
    return 0;
}
`;}
