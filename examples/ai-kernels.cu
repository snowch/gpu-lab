// Copyright © 2026 Christopher Snow.
// nvcc -O2 ai-kernels.cu -o ai-kernels && ./ai-kernels
// Self-checking correctness exercises, not performance benchmarks.
#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>
#include <vector>
#define CUDA_CHECK(call) do { cudaError_t e=(call); if(e!=cudaSuccess) { \
  std::fprintf(stderr,"%s: %s\n",#call,cudaGetErrorString(e));std::exit(1); } } while(0)
constexpr int N=8,T=4;

__global__ void naive(const float* a,const float* b,float* c) {
  int row=blockIdx.y*blockDim.y+threadIdx.y,col=blockIdx.x*blockDim.x+threadIdx.x;
  if(row<N&&col<N){float sum=0;for(int k=0;k<N;k++)sum+=a[row*N+k]*b[k*N+col];c[row*N+col]=sum;}
}
__global__ void tiled(const float* a,const float* b,float* c) {
  __shared__ float as[T][T],bs[T][T];
  int y=threadIdx.y,x=threadIdx.x,row=blockIdx.y*T+y,col=blockIdx.x*T+x;
  float sum=0;
  for(int k0=0;k0<N;k0+=T){
    as[y][x]=a[row*N+k0+x];bs[y][x]=b[(k0+y)*N+col];
    __syncthreads();
    for(int k=0;k<T;k++)sum+=as[y][k]*bs[k][x];
    __syncthreads();
  }
  c[row*N+col]=sum;
}
__global__ void reduction(const float* input,float* output) {
  __shared__ float partial[N];
  int t=threadIdx.x;partial[t]=input[t];__syncthreads();
  for(int stride=N/2;stride>0;stride/=2){if(t<stride)partial[t]+=partial[t+stride];__syncthreads();}
  if(t==0)output[0]=partial[0];
}
int main(){
  std::vector<float>a(N*N),b(N*N),expected(N*N),out(N*N),input(N);
  for(int row=0;row<N;row++)for(int col=0;col<N;col++){
    a[row*N+col]=(row+col)%5-2;b[row*N+col]=(row+col)%3-1;
  }
  for(int row=0;row<N;row++)for(int col=0;col<N;col++)for(int k=0;k<N;k++)expected[row*N+col]+=a[row*N+k]*b[k*N+col];
  for(int i=0;i<N;i++)input[i]=i+1;
  float *da=nullptr,*db=nullptr,*dc=nullptr,*di=nullptr,*ds=nullptr;
  CUDA_CHECK(cudaMalloc(&da,a.size()*sizeof(float)));CUDA_CHECK(cudaMalloc(&db,b.size()*sizeof(float)));
  CUDA_CHECK(cudaMalloc(&dc,out.size()*sizeof(float)));CUDA_CHECK(cudaMalloc(&di,input.size()*sizeof(float)));
  CUDA_CHECK(cudaMalloc(&ds,sizeof(float)));
  CUDA_CHECK(cudaMemcpy(da,a.data(),a.size()*sizeof(float),cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemcpy(db,b.data(),b.size()*sizeof(float),cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemcpy(di,input.data(),input.size()*sizeof(float),cudaMemcpyHostToDevice));
  dim3 threads(T,T),blocks(N/T,N/T);
  for(int variant=0;variant<2;variant++){
    if(variant==0)naive<<<blocks,threads>>>(da,db,dc);else tiled<<<blocks,threads>>>(da,db,dc);
    CUDA_CHECK(cudaGetLastError());CUDA_CHECK(cudaDeviceSynchronize());
    CUDA_CHECK(cudaMemcpy(out.data(),dc,out.size()*sizeof(float),cudaMemcpyDeviceToHost));
    for(int i=0;i<N*N;i++)if(out[i]!=expected[i]){std::fprintf(stderr,"Matmul variant %d mismatch at %d\n",variant,i);return 1;}
  }
  reduction<<<1,N>>>(di,ds);CUDA_CHECK(cudaGetLastError());CUDA_CHECK(cudaDeviceSynchronize());
  float sum=0;CUDA_CHECK(cudaMemcpy(&sum,ds,sizeof(float),cudaMemcpyDeviceToHost));
  if(sum!=N*(N+1)/2){std::fprintf(stderr,"Reduction mismatch: %g\n",sum);return 1;}
  CUDA_CHECK(cudaFree(da));CUDA_CHECK(cudaFree(db));CUDA_CHECK(cudaFree(dc));CUDA_CHECK(cudaFree(di));CUDA_CHECK(cudaFree(ds));
  std::puts("Verified naive matmul, tiled matmul and block reduction.");return 0;
}
