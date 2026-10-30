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
  if(python){
    if(source.includes('x_cpu =')) {
      add('x_cpu = torch.tensor(', 'Creates the input tensor in CPU memory. The list supplies its values; x_cpu is the name we use to refer to it.');
      add('dtype=torch.float32', 'Stores each number as FP32, a 32-bit floating-point value taking four bytes.');
      add('x_gpu = x_cpu.to("cuda")', 'Copies the CPU tensor to NVIDIA GPU memory. x_cpu still refers to the original CPU tensor.');
      match(/y_gpu = x_gpu \* [^\n]+/, 'Multiplies each GPU input by this amount. The new result tensor y_gpu stays in GPU memory.');
      add('y_cpu = y_gpu.cpu()', 'Requests a CPU copy of the result, waiting for the work needed to produce it. The GPU result remains available too.');
    } else if(source.includes('scaled_dot_product_attention')) {
      add('import torch.nn.functional as F', 'Makes PyTorch’s functional operations available under the shorter name F.');
      add('k_cache = torch.arange(', 'Creates the cached key values. reshape(3, 4) arranges them as three token rows with four components each; division by 10 scales the keys.');
      add('v_cache = torch.arange(', 'Creates the cached values for the same three tokens, also with four components per row.');
      add('q_new = torch.tensor(', 'Supplies the new token’s query: four components used to compare it with the cached keys.');
      add('k_new = torch.tensor(', 'Supplies the new token’s key, to be added to the key cache.');
      add('v_new = torch.tensor(', 'Supplies the new token’s value, to be added to the value cache.');
      add('k_cache = torch.cat((k_cache, k_new), dim=-2)', 'Appends the new key as another token row. dim=-2 selects the row dimension in this two-dimensional example.');
      add('v_cache = torch.cat((v_cache, v_new), dim=-2)', 'Appends the corresponding value row, keeping the key and value caches aligned.');
      add('out = F.scaled_dot_product_attention(', 'Combines the cached values according to their keys’ matches with q_new. PyTorch selects the attention implementation.');
      add('dropout_p=0.0, is_causal=False', 'Disables dropout and an additional causal mask. This single query may attend to every supplied cache row, including its new row.');
    } else if(source.includes('weights = torch.softmax')) {
      match(/n, d = [^\n]+/, 'Sets the number of token rows n and the number of components d in each row.');
      const scale=source.match(/\) \* (1000|1)\n/);
      add('q = torch.tensor(', `Creates the query rows: what each token looks for. The nested lists build one row at a time${scale?`, then multiplication by ${scale[1]} scales all query components`:''}.`);
      if(scale)entries.at(-1).lines.push(source.slice(0,source.indexOf(scale[0])).split('\n').length-1);
      add('k = torch.tensor(', 'Creates the key rows used for comparison with each query.');
      add('v = torch.tensor(', 'Creates the value rows that attention will combine.');
      add('scores = q @ k.T / d**0.5', 'Transposes the keys with .T, multiplies queries by keys with @, then divides by the square root of their width. Each score compares one query with one key.');
      add('weights = torch.softmax(scores, dim=-1)', 'Turns each score row into non-negative weights summing to one. dim=-1 selects the last dimension: the keys within that row.');
      add('out = weights @ v', 'Forms a weighted sum of the value rows for each query.');
      add('print(out[0])', 'Prints the four-component result for query row 0.');
    } else if(source.includes('row = torch.tensor(')) {
      match(/\[[^\n]*for k in range\(16\)\]/, m=>m[0].includes(' if ')?'Builds sixteen input values in one row. The condition chooses a value for each position k.':'Repeats this value sixteen times to build the input row.');
      add('dtype=torch.float32', 'Initially stores the row in FP32, before any conversion to a smaller input format.');
      match(/a = row\.repeat\(16, 1\)\.to\(torch\.\w+\)/, 'Repeats the row sixteen times to form matrix a, then converts its inputs to the selected number format. Conversion can round or discard small values.');
      add('b = torch.ones(', 'Creates a matrix filled with ones, so each output dot product adds the entries of one input row.');
      add('c = a @ b', 'Multiplies the matrices. PyTorch selects the matrix implementation and its accumulation rules.');
      add('print(c[0, 0].float().item())', 'Selects one output, converts it to FP32 and reads its scalar value for printing. This cannot recover information lost during input conversion.');
      match(/converted = row\.to\(torch\.\w+\)\.float\(\)/, 'Converts inputs to the selected format, then back to FP32 for the explicit arithmetic below. Any information lost in the first conversion stays lost.');
      add('total = torch.zeros((), dtype=torch.float32)', 'Creates an FP32 scalar running sum, initially zero. The empty shape () means a single scalar.');
      add('reference = torch.zeros((), dtype=torch.float32)', 'Creates a separate FP32 sum for comparison using the original inputs.');
      add('for k in range(16):', 'Visits positions 0 through 15 in a declared order, unlike a matrix library’s implementation-dependent addition order.');
      add('total = total + converted[k] * 1.0', 'Accumulates products from the converted inputs. This explicit example runs on the CPU.');
      add('reference = reference + row[k] * 1.0', 'Accumulates the original FP32 inputs in the same order, isolating the effect of input conversion.');
    } else if(source.includes('c = a @ b')) {
      match(/n = \d+/, 'Sets the number of rows and columns in each square matrix.');
      add('a = torch.tensor(', 'Creates matrix a from the following nested Python lists: one inner list for each row.');
      add('(r + k) % 5 - 2', 'Generates a small integer value for row r, column k. % is the remainder after division, giving a repeating pattern.');
      add('b = torch.tensor(', 'Creates matrix b. Here k selects its row and c its column.');
      add('(k + c) % 3 - 1', 'Generates b’s repeating input pattern using remainder modulo 3.');
      add('dtype=torch.float32, device="cuda"', 'Stores the matrices as FP32 tensors on an NVIDIA GPU.');
      add('c = a @ b', 'Multiplies the matrices: each output combines one row of a with one column of b. PyTorch chooses the kernel and launch settings.');
      add('print(c.cpu())', 'Copies the result to CPU memory and prints it. Lowercase c here names the result tensor; the c inside the list above was a column index.');
    } else if(source.includes('torch.where')) {
      match(/values = [^\n]+/, 'Builds the chosen sign pattern. Multiplying a Python list repeats it; adding lists joins them.');
      match(/values\[:\d+\]/, 'Keeps the first chosen number of inputs. The slice endpoint is excluded.');
      add('device="cuda"', 'Places the input tensor in NVIDIA GPU memory.');
      match(/y = torch\.where\([^\n]+/, 'Selects the positive expression where x > 0 and the other expression elsewhere. Python evaluates both supplied expressions; this does not establish that a GPU branch is used.');
      add('print(y.cpu())', 'Copies the selected results to CPU memory and prints them.');
    } else if(source.includes('total = x.sum()')) {
      match(/torch\.arange\(1, \d+/, 'Creates consecutive input values starting at 1. The second argument is an excluded endpoint.');
      add('dtype=torch.float32', 'Uses four-byte FP32 inputs.');
      add('device="cuda"', 'Places the input tensor on an NVIDIA GPU.');
      add('total = x.sum()', 'Combines all input values into one scalar tensor on the GPU. PyTorch chooses the reduction algorithm and launches.');
      add('print(total.cpu())', 'Copies the scalar result to CPU memory so Python can print it.');
    } else if(source.includes('torch.arange')) {
      match(/torch\.arange\((?:1, 26|32 \* 8)/, m=>m[0].includes('1, 26')?'Creates values 1 through 25. The endpoint 26 is excluded.':'Creates 256 consecutive values, starting at zero.');
      add('dtype=torch.float32', 'Stores each value in four-byte FP32 format.');
      add('device="cuda"', 'Places the tensor in NVIDIA GPU memory.');
      match(/\.reshape\((?:5, 5|32, 8)\)/, 'Interprets the same values as the requested rows and columns. In this setup the reshape shares the original storage.');
      add('x[0, :]', 'Selects every column of row 0. The result is a view sharing x’s storage.');
      add('x[:, 0]', 'Selects row 0 through the last row in column 0. These selected values are separated in the original storage.');
      add('column.contiguous()', 'Makes a packed copy when the column is strided, so successive selected values become neighbours in the new storage.');
      add('packed_column.stride()', 'Reports element steps in the packed copy. A step of one means neighbouring values.');
      add('x.shape, x.stride()', 'Reports the grid’s dimensions and the element steps used to move along each dimension. Strides count elements, not bytes.');
      add('row.stride()', 'Reports the element steps for the row view.');
      add('column.stride()', 'Reports the element steps for the column view.');
      match(/y = (?:x\[0, :\]|values) \* [^\n]+/, 'Multiplies each selected value, producing a new result tensor without changing the input values.');
    } else if(source.includes('torch.tensor(')) {
      add('import torch', 'Makes PyTorch available to this program under the name torch.');
      add('x = torch.tensor(', 'Creates a tensor containing the numbers in the list. x is the name we use to refer to it.');
      add('device="cuda"', 'Asks PyTorch to store that tensor on an NVIDIA GPU.');
      match(/y = x \* [^\n]+/, 'Multiplies every number in x by this amount and stores the results in a new tensor, y. The numbers in x stay the same.');
      match(/z = y \* [^\n]+/, 'Applies a second multiplication to y, producing a new GPU tensor z.');
      add('print(z.cpu())', 'Waits for the needed GPU work, copies z to CPU memory and prints it.');
    }
  } else if(source.includes('__global__')||source.includes('<<<')) {
    add('__global__ void', 'Declares a GPU kernel. Each launched thread executes this function. void means the function writes results through its output array instead of returning a value.');
    if(!source.includes('tile[32][33]')) {
      add('const float*', 'Passes the location of an array of FP32 values. const prevents this function from changing values through that input pointer.');
      match(/int i = [^\n;]+;/, 'Declares an integer i and calculates the array index used below. blockIdx.x is the block number, blockDim.x its size, and threadIdx.x the position in the block. Check which terms this example uses.');
      add('if (i < n)', 'Allows array work only when i is smaller than the input count n. Extra threads skip that work.');
      match(/(?:output|y)\[i\] = [^;]+;/, source.includes('void gather(')?'Reads the selected input element and copies it to y[i]. Brackets select array elements; ; ends the statement.':'Reads the indexed input value or values, performs the shown arithmetic, then writes the indexed result. A trailing f marks an FP32 literal; ; ends the statement.');
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
    match(/\w+<<<[^\n]+;/, 'Launches the kernel from the CPU. Between <<< and >>> are the block count and threads per block; arguments in parentheses are passed to the kernel. Device arrays must already be allocated.');
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
