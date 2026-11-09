// Copyright © 2026 Christopher Snow.
// Explanations are curated for the book's examples, not guesses about arbitrary code.
export function codeExplanations(source) {
  const entries=[];
  const add=(fragment,meaning)=>{
    const at=source.indexOf(fragment);
    if(at<0)return;
    const start=source.slice(0,at).split('\n').length-1;
    const end=start+fragment.split('\n').length-1;
    entries.push({fragment,meaning,lines:Array.from({length:end-start+1},(_,i)=>start+i)});
  };
  const match=(pattern,meaning)=>{const m=source.match(pattern);if(m)add(m[0].trim(),typeof meaning==='function'?meaning(m):meaning);};
  const python=/^import torch\b/.test(source.trimStart());
  if(source.includes('prof.export_chrome_trace("trace.json")')) {
    add('from torch.profiler import ProfilerActivity, profile, record_function', 'Imports the CPU/CUDA activity selectors, the profile recording context and record_function for naming the captured operation.');
    add('print("PyTorch:", torch.__version__)', 'Records the installed PyTorch version. The following prints record its CUDA build and the actual GPU model.');
    add('x = torch.arange(\n    1, 4097, dtype=torch.float32, device="cuda",\n)', 'Creates 4,096 FP32 inputs, from 1.0 to 4096.0, on the NVIDIA GPU. The endpoint 4097 is excluded.');
    add('for _ in range(5):', 'Runs five warm-up multiplications before capture. The underscore is a loop variable whose value is unused.');
    add('torch.cuda.synchronize()', 'Waits for earlier CUDA work to finish. The later synchronisation inside capture also waits for the recorded multiplication.');
    add('activities = [ProfilerActivity.CPU, ProfilerActivity.CUDA]', 'Requests CPU events and supported CUDA activity from the profiler.');
    add('with profile(activities=activities) as prof:', 'Records events within this context; exiting ends capture.');
    add('with record_function("gpu_lab_multiply"):', 'Names the enclosed CPU range so it can be found on the timeline. Its y = x * 2 is the multiplication being inspected.');
    add('prof.export_chrome_trace("trace.json")', 'Writes the captured events to a Chrome JSON trace for a timeline viewer or the supplied reader.');
    add('torch.testing.assert_close(y, x + x)', 'Checks the captured multiplication against addition of the same inputs, outside the recorded interval.');
  } else if(python){
    if(source.includes('x_cpu =')) {
      add('x_cpu = torch.tensor(', 'Creates the input tensor in CPU memory.');
      add('dtype=torch.float32', 'Stores each number as FP32, a 32-bit floating-point value taking four bytes.');
      add('x_gpu = x_cpu.to("cuda")', 'Copies the CPU tensor to NVIDIA GPU memory. x_cpu still refers to the original CPU tensor.');
      match(/y_gpu = x_gpu \* [^\n]+/, 'Multiplies each GPU input by this amount. The new result tensor y_gpu stays in GPU memory.');
      add('y_cpu = y_gpu.cpu()', 'Requests a CPU copy of the result, waiting for the work needed to produce it. The GPU result remains available too.');
    } else if(source.includes('scaled_dot_product_attention')) {
      add('k_cache = torch.arange(', 'Creates three cached key rows with four components each. v_cache supplies the corresponding value rows.');
      add('q_new = torch.tensor(', 'Supplies the new query. k_new and v_new supply its key and value; each row has four components.');
      add('k_cache = torch.cat((k_cache, k_new), dim=-2)', 'Appends the new key along the token-row dimension. The matching v_cache call appends its value; torch.cat makes new tensors and copies the entries.');
      add('out = F.scaled_dot_product_attention(', 'Combines the cached values according to their keys’ matches with q_new. PyTorch selects the attention implementation.');
      add('dropout_p=0.0, is_causal=False', 'Disables dropout and an additional causal mask. This single query may attend to every supplied cache row, including its new row.');
    } else if(source.includes('weights = torch.softmax')) {
      const scale=source.match(/\) \* (1000|1)\n/);
      add('q = torch.tensor(', `Creates deterministic query inputs. k and v supply matching key and value rows${scale?`, then multiplication by ${scale[1]} scales all query components`:''}.`);
      if(scale)entries.at(-1).lines.push(source.slice(0,source.indexOf(scale[0])).split('\n').length-1);
      add('scores = q @ k.T / d**0.5', 'Transposes the keys with .T, multiplies queries by keys with @, then divides by the square root of their width. Each score compares one query with one key.');
      add('weights = torch.softmax(scores, dim=-1)', 'Turns each score row into non-negative weights summing to one. dim=-1 selects the last dimension: the keys within that row.');
      add('out = weights @ v', 'Forms a weighted sum of the value rows for each query.');
      add('print(out[0])', 'Prints the four-component result for query row 0.');
    } else if(source.includes('row = torch.tensor(')) {
      add('dtype=torch.float32', 'Initially stores the row in FP32, before any conversion to a smaller input format.');
      match(/a = row\.repeat\(16, 1\)\.to\(torch\.\w+\)/, 'Repeats the row sixteen times to form matrix a, then converts its inputs to the selected number format. Conversion can round or discard small values.');
      add('b = torch.ones(', 'Creates a matrix filled with ones, so each output dot product adds the entries of one input row.');
      add('c = a @ b', 'Multiplies the matrices. PyTorch selects the matrix implementation and its accumulation rules.');
      add('print(c[0, 0].float().item())', 'Selects one output, converts it to FP32 and reads its scalar value for printing. This cannot recover information lost during input conversion.');
      match(/converted = row\.to\(torch\.\w+\)\.float\(\)/, 'Converts inputs to the selected format, then back to FP32 for the explicit accumulation loop. Any information lost in the first conversion stays lost.');
      add('total = torch.zeros((), dtype=torch.float32)', 'Creates an FP32 scalar running sum, initially zero. The empty shape () means a single scalar.');
      add('reference = torch.zeros((), dtype=torch.float32)', 'Creates a separate FP32 sum for comparison using the original inputs.');
      add('for k in range(16):', 'Fixes the accumulation order, unlike a matrix library’s implementation-dependent order.');
      add('total = total + converted[k] * 1.0', 'Accumulates products from the converted inputs. This explicit example runs on the CPU.');
      add('reference = reference + row[k] * 1.0', 'Accumulates the original FP32 inputs in the same order, isolating the effect of input conversion.');
    } else if(source.includes('c = a @ b')) {
      match(/n = \d+/, 'Sets the number of rows and columns in each square matrix.');
      add('a = torch.tensor(', 'Creates the FP32 input matrix a. Its repeating values make the products easy to check.');
      add('b = torch.tensor(', 'Creates input matrix b using the other repeating pattern.');
      add('dtype=torch.float32, device="cuda"', 'Stores the matrices as FP32 tensors on an NVIDIA GPU.');
      add('c = a @ b', 'Multiplies the matrices: each output combines one row of a with one column of b. PyTorch chooses the kernel and launch settings.');
      add('print(c.cpu())', 'Copies the result to CPU memory for printing.');
    } else if(source.includes('torch.where')) {
      match(/values = [^\n]+/, 'Sets the input sign pattern for the lane comparison.');
      add('device="cuda"', 'Places the input tensor in NVIDIA GPU memory.');
      match(/y = torch\.where\([^\n]+/, 'Selects the positive expression where x > 0 and the other expression elsewhere. Python evaluates both supplied expressions; this does not establish that a GPU branch is used.');
      add('print(y.cpu())', 'Copies the selected results to CPU memory and prints them.');
    } else if(source.includes('total = x.sum()')) {
      match(/torch\.arange\(1, \d+/, 'Creates consecutive input values starting at 1.0. The second argument is an excluded endpoint.');
      add('dtype=torch.float32', 'Uses four-byte FP32 inputs.');
      add('device="cuda"', 'Places the input tensor on an NVIDIA GPU.');
      add('total = x.sum()', 'Combines all input values into one scalar tensor on the GPU. PyTorch chooses the algorithm for the sum and handles its launches.');
      add('print(total.cpu())', 'Copies the scalar result to CPU memory so Python can print it.');
    } else if(source.includes('torch.arange')) {
      match(/torch\.arange\(\s*(1,\s*26|32 \* 8)/, m=>m[1].startsWith('1,')?'Creates the FP32 values 1.0 through 25.0. The endpoint 26 is excluded.':'Creates 256 consecutive FP32 values, starting at 0.0.');
      add('dtype=torch.float32', 'Stores each value in four-byte FP32 format.');
      add('device="cuda"', 'Places the tensor in NVIDIA GPU memory.');
      match(/\.reshape\((?:5, 5|32, 8)\)/, 'Interprets the same values as the requested rows and columns. In this setup the reshape shares the original storage.');
      add('x[0, :]', 'Selects every column of row 0. The selected values stay in x’s existing storage.');
      add('x[:, 0]', 'Selects row 0 through the last row in column 0. These selected values are separated in the original storage.');
      add('column.contiguous()', 'Makes a packed copy when the column is strided, so successive selected values become neighbours in the new storage.');
      add('packed_column.stride()', 'Reports element steps in the packed copy. A step of one means neighbouring values.');
      add('x.shape, x.stride()', 'Reports the grid’s dimensions and the element steps used to move along each dimension. Strides count elements, not bytes.');
      add('row.stride()', 'Reports the element steps for the row view.');
      add('column.stride()', 'Reports the element steps for the column view.');
      match(/y = (?:x\[0, :\]|values) \* [^\n]+/, 'Multiplies each selected value, producing a new result tensor without changing the input values.');
    } else if(source.includes('torch.tensor(')) {
      add('x = torch.tensor(', 'Creates a tensor containing the input values in the list.');
      add('device="cuda"', 'Asks PyTorch to store that tensor on an NVIDIA GPU.');
      match(/y = x \* [^\n]+/, 'Multiplies every value in x by this amount and stores the results in a new tensor, y. The values in x stay the same.');
      match(/z = y \* [^\n]+/, 'Applies a second multiplication to y, producing a new GPU tensor z.');
      add('print(z.cpu())', 'Waits for the needed GPU work, copies z to CPU memory and prints it.');
    }
  } else if(source.includes('__global__')||source.includes('<<<')) {
    add('__global__ void', 'Declares a GPU kernel. Each launched thread executes this function. void means the function returns no value; this example writes results into output arrays.');
    if(!source.includes('tile[32][33]')) {
      add('const float*', 'Passes the location of an array of FP32 values. const prevents this function from changing values through that input pointer.');
      match(/int i = [^\n;]+;/, m=>[
        'Declares an integer i and calculates this thread’s array index.',
        ...[['blockIdx.x','the block number'],['blockDim.x','the number of threads per block'],['threadIdx.x','the thread’s position within its block']]
          .filter(([term])=>m[0].includes(term)).map(([term,meaning])=>`${term} is ${meaning}.`),
      ].join(' '));
      add('if (i < n)', 'Runs the enclosed array accesses only when i is smaller than the input count n. Otherwise this thread skips them.');
      match(/(?:output|y)\[i\] = [^;]+;/, m=>source.includes('void gather(')
        ? 'Reads the selected input element and copies it to y[i]. Brackets select array elements. The semicolon ends the statement.'
        : 'Reads the indexed input value or values, performs the shown arithmetic, then writes the indexed result. '+(/\b(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?f\b/i.test(m[0])?'A trailing f marks an FP32 literal. ':'')+'The semicolon ends the statement.');
      match(/x\[\d+ \+ i \* \d+\]/, 'Selects an input element using the starting offset plus index times stride. These are element positions, not byte offsets.');
    }
    if(source.includes('tile[32][33]')) {
      add('__shared__ float tile[32][33]', 'Allocates a block’s shared-memory workspace: 32 useful columns with one extra padding word in each row.');
      add('int lane = threadIdx.x;', 'Uses the thread’s position as its column number. This example launches one block with 32 threads.');
      add('for (int row = 0; row < 32; ++row)', 'Visits all 32 rows. Each thread fills its own column from the corresponding input values.');
      add('tile[row][lane] = input[row * 32 + lane];', 'Copies one value from the flat row-major input into the shared tile. The input has 32 columns per row.');
      add('__syncthreads();', 'Makes all threads in the block wait until the shared tile has been filled, before any starts the column read.');
      add('output[lane] = tile[lane][0];', 'Reads row lane of shared column 0 and writes that value to the output. Thread 0 filled this column before the barrier.');
    }
    match(/int threadsPerBlock = \d+;/, 'Sets the number of threads in each block. threadsPerBlock is a variable name we chose.');
    match(/int blocks = \d+;/, 'Sets the number of blocks. blocks is a variable name we chose.');
    match(/\w+<<<[\s\S]*?;/, 'Launches the kernel from the CPU. Between <<< and >>> are the block count and threads per block; arguments in parentheses are passed to the kernel. Device arrays must already be allocated.');
  } else if(/^(?:values = |column = |packed = |transposed = )/.test(source)) {
    match(/x\[\d+, :\]/, 'Selects all columns of the chosen row. The row number starts at zero; the result shares x’s storage.');
    match(/x\[:, \d+\]/, 'Selects the chosen column across all rows. Its values remain separated in x’s original storage.');
    add('column.contiguous()', 'Packs the strided column into a new contiguous tensor, without changing x.');
    add('transposed = x.T', 'Swaps the row and column interpretation. This transpose is a view: its values stay in the same storage.');
    add('transposed[0, :]', 'Reads the first row of the transposed view: the original tensor’s first column.');
    match(/y = (?:values|packed|transposed\[0, :\]) \* [^\n]+/, 'Multiplies each selected value by the shown amount to create the result tensor y.');
  }
  return entries.sort((a,b)=>source.indexOf(a.fragment)-source.indexOf(b.fragment));
}
