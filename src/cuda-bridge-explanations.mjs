// Copyright © 2026 Christopher Snow.
// Curated additions to the shared code walkthrough; no source rewriting.
export function courseCudaExplanations(source){
 const items=[];
 const add=(fragment,meaning)=>{if(source.includes(fragment))items.push([fragment,meaning]);};
 if(source.includes('void doubleRow(')||source.includes('void doubleColumn(')){
  add('const float input[5][5]','Receives the GPU address of the read-only 5 × 5 input. The CPU must provide all 25 FP32 values.');
  if(source.includes('void doubleRow(')){
   add('int row','Receives the row number chosen by the CPU, from 0 to 4. It is the same for every thread in this launch.');
   add('int column = blockIdx.x * blockDim.x + threadIdx.x;','Gives each thread its own column number by the global-index rule from Chapter 1.');
   add('if (column < 5)','Permits only columns 0–4; the extra launched threads skip the arrays.');
   add('output[column] = input[row][column] * 2.0f;','Keeps the chosen row fixed, reads this thread’s column and writes its doubled value to the matching output position.');
  }else{
   add('int column','Receives the column number chosen by the CPU, from 0 to 4.');
   add('int row = blockIdx.x * blockDim.x + threadIdx.x;','Gives each thread its own row number; the chosen column stays fixed.');
   add('if (row < 5)','Permits only rows 0–4.');
   add('output[row] = input[row][column] * 2.0f;','Reads one value down the chosen column and writes its doubled result into a five-value output.');
  }
 }
 if(source.includes('void packValues(')||source.includes('void doubleStrided(')){
  add('int n','Receives the selected element count, which also sizes the output. It is not the extent of the original strided input array.');
  add('int stride, int offset','Receive the element step and starting element position chosen by the CPU. They count elements, rather than bytes.');
  add('if (i < n)','Checks output coverage. The CPU must separately ensure every offset + i * stride is inside the input allocation.');
  add('packed[i] = input[offset + i * stride];','Reads a strided input and writes the same value to neighbouring packed output position i.');
  add('float value = input[offset + i * stride];','Reads one selected input into this thread’s private FP32 value. The input address is the one studied by the sector model.');
 }
 if(source.includes('scale<<<')){
  add('scale<<<blocks, threadsPerBlock>>>(\n    d_input, d_intermediate, n);','Launches the first doubling calculation. Its result goes to the separately allocated intermediate GPU array.');
  add('scale<<<blocks, threadsPerBlock>>>(\n    d_intermediate, d_output, n);','Launches the second doubling using the first result. Both calls use the same ordered default CUDA queue.');
  add('CUDA_CHECK(cudaGetLastError());','Checks for a launch error using the helper from Chapter 3. It does not wait for the kernel to finish.');
 }
 if(source.includes('void chooseCalculation(')){
  add('float value = input[i];','Reads this thread’s input after the array-bounds check.');
  add('if (value > 0.0f)','Chooses the doubling expression only for a positive input.');
  add('output[i] = -value;','Negates this thread’s input. This fixed reference uses the one-operation negative path.');
 }
 if(source.includes('void sumEight(')){
  add('__shared__ float partial[8];','Declares eight shared FP32 positions for this block, separate from the GPU input and output arrays.');
  add('int t = threadIdx.x;','Uses a position from 0 to 7 inside the single eight-thread block.');
  add('partial[t] = input[t];','Gives each thread one initial write into the shared workspace.');
  add('__syncthreads();','Makes every block thread wait and orders preceding shared-memory writes before later reads. The call appears after the initial writes and after each addition stage.');
  add('for (int stride = 8 / 2; stride > 0; stride /= 2)','Combines partial sums over partner distances 4, 2 and 1, with a block barrier after each stage.');
  add('if (t < stride)','Only the lower-index threads add at this stage; every thread still reaches the following barrier outside this condition.');
  add('partial[t] += partial[t + stride];','Combines the partner’s partial sum with this thread’s value in the shared workspace.');
  add('if (t == 0) output[0] = partial[0];','Lets only thread 0 write the one final output after all stages.');
 }
 if(source.includes('void separateProducts(')){
  add('int row = blockIdx.y * blockDim.y + threadIdx.y;','Combines the block and thread y coordinates into the output row.');
  add('int col = blockIdx.x * blockDim.x + threadIdx.x;','Combines the x coordinates into the output column.');
  add('if (row < 4 && col < 4)','Keeps threads whose row or column lies outside the fixed 4 × 4 output from accessing the arrays.');
  add('float sum = 0.0f;','Initialises this thread’s private FP32 dot-product sum to zero.');
  add('for (int k = 0; k < 4; ++k)','Visits K positions 0–3 to complete this thread’s output dot product.');
  add('sum += a[row * 4 + k] * b[k * 4 + col];','Adds the product of A’s row entry and B’s column entry. Each row contains four elements in this flat row-major representation.');
  add('c[row * 4 + col] = sum;','Stores the completed dot product in this thread’s output position.');
 }
 if(source.includes('void sharedProducts(')){
  add('__shared__ float aTile[2][2], bTile[2][2];','Declares two 2 × 2 shared input tiles for this block.');
  add('int y = threadIdx.y, x = threadIdx.x;','Names each thread’s local row y and column x, each 0 or 1.');
  add('int row = blockIdx.y * 2 + y;','Chooses this thread’s global output row from its tile’s row and local position.');
  add('int col = blockIdx.x * 2 + x;','Chooses the corresponding output column.');
  add('float sum = 0.0f;','Starts one private output sum per thread, retained across both K phases.');
  add('for (int k0 = 0; k0 < 4; k0 += 2)','Visits phase starts 0 and 2. Each phase covers two K positions.');
  add('aTile[y][x] = a[row * 4 + k0 + x];','Makes each thread load one A value into a shared position.');
  add('bTile[y][x] = b[(k0 + y) * 4 + col];','Makes each thread load one B value for the same K phase.');
  add('__syncthreads();','The first barrier makes tile loads ready for the block. The second keeps those tiles unchanged until every thread finishes using them.');
  add('sum += aTile[y][k] * bTile[k][x];','Reuses a shared A row and B column to add a product into this thread’s retained sum.');
  add('c[row * 4 + col] = sum;','Writes the output after both K phases are complete.');
 }
 if(source.includes('void roundInputs(')){
  add('__half stored = __float2half_rn(input[i]);','Converts to the nearest FP16 value; an exact tie chooses an even last bit. __half is CUDA’s FP16 type.');
  add('converted[i] = __half2float(stored);','Converts the rounded value back to FP32 for inspection. It cannot recover the discarded input precision.');
 }
 if(source.includes('float newMax = fmaxf(')){
  add('int n','Receives the query-row and key-row count. Every row here has four FP32 components; input and output capacities must account for that width.');
  add('float maxScore = -INFINITY;','Starts below every finite score so the first key establishes the maximum.');
  add('float normalizer = 0.0f;','Starts the sum of unnormalised weights at zero.');
  add('float weighted[4] = {0.0f, 0.0f, 0.0f, 0.0f};','Starts four private weighted-value totals, one per output component, at zero.');
  add('score *= 0.5f;','Scales the four-component dot product by 1 / sqrt(4), matching the attention example.');
  add('float newMax = fmaxf(maxScore, score);','Finds the largest score seen so far, including this key.');
  add('float oldScale = expf(maxScore - newMax);','Computes the factor that expresses the previous totals relative to the new maximum.');
  add('float weight = expf(score - newMax);','Computes this key’s unnormalised weight at the same scale.');
  add('normalizer = normalizer * oldScale + weight;','Rescales the previous weight sum and adds the new key’s contribution.');
  add('weighted[c] = weighted[c] * oldScale\n        + weight * values[key * 4 + c];','Rescales one weighted-value total and adds this key’s matching value component. All four components use the same scale and weight.');
  add('maxScore = newMax;','Retains the new maximum for the next key.');
  add('output[query * 4 + c] = weighted[c] / normalizer;','Divides each final weighted total by the final weight sum after visiting every key.');
 }
 if(source.includes('void appendCache(')){
  add('int cachedTokens, int width','Receive the existing token count and components per token. The CPU must reserve capacity for one additional row before launch.');
  add('int c = blockIdx.x * blockDim.x + threadIdx.x;','Assigns one component of the new key and value to this thread.');
  add('if (c < width)','Excludes extra threads beyond the row width; it does not check or grow the cache allocation.');
  add('int position = cachedTokens * width + c;','Locates component c of the new row immediately after the existing rows.');
  add('keys[position] = newKey[c];','Writes the new key component without copying the earlier cache rows.');
  add('values[position] = newValue[c];','Writes the corresponding new value component into the separate value cache.');
 }
 if(source.includes('cudaEvent_t start, stop;')){
  add('cudaEvent_t start, stop;','Declares two CUDA event handles in the CPU program.');
  add('cudaEventCreate(&start)','Creates the start event; the following call creates the stop event. These events have timing enabled by default.');
  add('cudaEventRecord(start)','Queues the start marker before the kernel in the same default stream.');
  add('cudaEventRecord(stop)','Queues the stop marker after the kernel.');
  add('cudaEventSynchronize(stop)','Waits until the stop event has completed before the CPU reads the interval.');
  add('cudaEventElapsedTime(\n    &milliseconds, start, stop)','Writes the elapsed GPU interval between the event markers into milliseconds.');
  add('cudaEventDestroy(start)','Releases the start event; the next call releases the stop event.');
 }
 if(source.includes('wmma::fragment')){
  add('wmma::fragment<wmma::matrix_a, 16, 16, 16,\n        half, wmma::row_major> aTile;','Declares an FP16 A fragment for a 16 × 16 × 16 operation using row-major input. Its elements are distributed across the warp. The following declaration supplies the matching B fragment.');
  add('wmma::fragment<wmma::accumulator, 16, 16, 16,\n        float> result;','Declares the warp’s FP32 accumulator fragment for the output tile.');
  add('wmma::fill_fragment(result, 0.0f);','Initialises every accumulator entry to zero.');
  add('wmma::load_matrix_sync(aTile, a, 16);','Cooperatively loads the A tile with a row pitch of 16 elements. The next call loads B.');
  add('wmma::mma_sync(result, aTile, bTile, result);','Cooperatively calculates A × B plus the existing accumulator. All warp threads must participate.');
  add('wmma::store_matrix_sync(\n        c, result, 16, wmma::mem_row_major);','Cooperatively writes the FP32 result with a row pitch of 16 elements.');
 }
 return items;
}
