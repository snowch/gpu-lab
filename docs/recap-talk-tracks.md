# Approved chapter recap narration

Approved by the user on 13 November 2026 before narration generation.

These are the complete talk tracks for the three missing chapter recaps. Each numbered slide has two caption/speech cues. The question slides pause before the answer. Existing recaps keep their current narration.

## Chapter 1: Double five values

### s01: One input, one doubled result.

On screen: Five floating-point inputs stay in the same order.

**s01-c1:** Chapter One starts with five floating-point inputs: one, two, three, four and five. Doubling gives two, four, six, eight and ten.

**s01-c2:** PyTorch chooses the implementation for its tensor operation. Our manual CUDA example performs the same calculation, so we can trace how each result is produced.

### s02: A thread executes the GPU program.

On screen: Our mapping gives one input position to each thread.

**s02-c1:** A thread is one execution of a GPU program. In this example, each participating thread reads one input, doubles it and writes the matching output position.

**s02-c2:** Thread four reads input index four, whose value is five. It writes ten at output index four. An index chooses a position; it is not the stored value.

### s03: Blocks group the threads.

On screen: The global index combines block and local position.

**s03-c1:** With four threads per block, local positions start again at zero in each block. Block one, position zero therefore needs a global array index.

**s03-c2:** Multiply the block number by the block size, then add the local position. One times four plus zero gives index four, so this thread doubles the fifth input.

### s04: The CPU supplies the launch and count.

On screen: Launch coverage and valid array positions are different.

**s04-c1:** The CPU requests two blocks of four threads and passes an input count of five. The eight launched threads have indices zero through seven.

**s04-c2:** The count is an ordinary kernel argument supplied by the CPU program. Changing the number of blocks does not change that count or allocate longer arrays.

### s05: A bounds check protects the arrays.

On screen: Only indices smaller than the supplied count may access them.

**s05-c1:** The correct check permits only indices smaller than five: zero through four. Threads five, six and seven skip both the read and the write.

**s05-c2:** A check allowing index five would access positions that do not exist. The guard trusts the supplied count; the CPU must also provide enough input and output storage.

### s06: Pause: cover nine inputs.

On screen: Keep four threads per block. Choose the block count.

**s06-c1:** Now there are nine inputs, with indices zero through eight. Keep four threads per block. Would two blocks cover every input?

**s06-c2:** Predict the smallest block count that covers all nine values. Which launched indices must then skip the arrays? Pause before comparing.

### s07: Three blocks cover all nine inputs.

On screen: Twelve launched threads include three extra indices.

**s07-c1:** Two blocks create only eight threads, leaving input index eight without a thread. Three blocks create twelve threads, covering all nine inputs.

**s07-c2:** With the count set to nine, indices nine, ten and eleven skip the arrays. A bounds check can prevent an access, but it cannot create a missing thread.

### s08: Trace values, indices and coverage.

On screen: Return to the chapter and explain a different grouping.

**s08-c1:** Keep three questions separate: which input does this thread select, how many threads did the CPU launch, and which indices may safely access the arrays?

**s08-c2:** Return to Chapter One and compare four with eight threads per block. Explain why the grouping changes while each valid input still produces the same doubled result.

## Chapter 3: Manage CUDA memory

### s01: Start with the CPU input array.

On screen: The existing data supplies the element count.

**s01-c1:** Chapter Three follows the manual CUDA workflow for the same five inputs. The CPU program already has a vector containing those values.

**s01-c2:** It obtains the element count from the vector size and passes that count to the kernel. A GPU pointer carries an address, not an automatically discoverable array length.

### s02: Elements and bytes answer different questions.

On screen: Five FP32 values occupy twenty bytes.

**s02-c1:** The element count is five. Each FP32 value occupies four bytes, so each five-element array needs twenty bytes of value storage.

**s02-c2:** Allocation and copy calls take byte counts. The kernel bounds check takes an element count. For this one-input, one-output operation, both arrays have the same number of positions.

### s03: Allocate GPU storage, then copy inputs.

On screen: Input storage and output storage are separate allocations.

**s03-c1:** The CPU allocates twenty bytes for GPU inputs and twenty bytes for GPU outputs. Allocation reserves storage; it does not copy the CPU vector values.

**s03-c2:** A host-to-device copy then fills the GPU input allocation. The kernel will write the separate output allocation. The original CPU input remains available.

### s04: Derive a launch that covers the data.

On screen: Two blocks of four cover five input positions.

**s04-c1:** Choose four threads per block for tracing. Round the input count up to whole blocks: five inputs need two blocks, creating eight threads.

**s04-c2:** The CPU passes the GPU pointers and element count as ordinary arguments. The bounds check permits indices zero through four and excludes the three extra threads.

### s05: Copy results back, then release GPU storage.

On screen: The CPU result remains after the GPU allocations are freed.

**s05-c1:** After the kernel, a device-to-host copy places five results in a CPU output vector. This blocking copy in the default stream completes the preceding calculation before the CPU uses those results.

**s05-c2:** The program checks the result and frees both GPU allocations. Freeing GPU storage does not erase the CPU result or the original CPU input.

### s06: Pause: change the input array to nine values.

On screen: Keep FP32 values and four threads per block.

**s06-c1:** Suppose the CPU input vector now contains nine values. Predict the element count, bytes per array and minimum number of four-thread blocks.

**s06-c2:** Would changing only the block count provide larger GPU allocations or update the kernel argument? Pause and connect each setting to the data that supplies it.

### s07: Derive all three sizes from the input.

On screen: Nine elements need thirty-six bytes and three blocks.

**s07-c1:** The vector supplies a count of nine. Nine times four gives thirty-six bytes for each array. Three blocks of four create twelve threads, with indices nine through eleven excluded.

**s07-c2:** The program must provide the larger allocations, byte-counted copies and count argument too. Launch dimensions alone cannot update these separate responsibilities.

### s08: Follow the complete ownership chain.

On screen: Input size → storage and copies → launch → result → cleanup.

**s08-c1:** The input array supplies the count. The operation determines the output shape. From those choices, the CPU program supplies storage, copies and launch arguments.

**s08-c2:** Return to Chapter Three and trace its complete program. For later reductions or matrix operations, derive the required output size from that operation instead of assuming it always equals the input length.

## Chapter 14: Investigate matrix multiplication

### s01: Hold the matrix operation fixed.

On screen: Compare algorithms for the same four-by-four FP32 inputs.

**s01-c1:** Chapter Fourteen investigates one matrix multiplication. Keep the inputs, dimensions, number format and final output fixed while changing how input values are reused.

**s01-c2:** The baseline computes sixteen outputs separately. Its teaching algorithm explicitly loads one hundred and twenty-eight input values and stores sixteen results.

### s02: Share input tiles without changing the result.

On screen: Tile widths two and four reduce explicit input loads.

**s02-c1:** A tile width of two shares loaded inputs across several outputs and reduces the count to sixty-four input loads. A width of four reduces it to thirty-two.

**s02-c2:** Every choice produces the same complete output matrix in this model. These are explicit algorithm loads with cache reuse excluded; they are not measured physical memory traffic.

### s03: Larger tiles also consume block resources.

On screen: Fewer loads do not establish the fastest implementation.

**s03-c1:** With the chapter’s synthetic resource budgets, tile width two uses thirty-two shared-memory bytes and two hundred and fifty-six registers per block. Four blocks fit those budgets.

**s03-c2:** Tile width four uses one hundred and twenty-eight shared-memory bytes and one thousand and twenty-four registers per block. Only one block fits. This capacity bound is not a schedule or a timing measurement.

### s04: Write a hypothesis and its uncertainty.

On screen: Choose what to investigate, then name the missing evidence.

**s04-c1:** A useful recommendation states both the benefit and the cost. A larger tile reduces explicit input loads while using more registers and shared memory per block.

**s04-c2:** Either tile can be a hypothesis worth investigating. Neither a lower load count nor a higher block capacity proves which implementation is faster on a physical GPU.

### s05: Pause: double the matrix dimension.

On screen: Use eight-by-eight inputs and tile width two.

**s05-c1:** Now use eight-by-eight inputs with tile width two and the same resource budgets. Predict input loads, output stores and resident-block capacity.

**s05-c2:** Does doubling the matrix dimension double every count? Separate complete-operation counts from resources needed by one block before comparing the answer.

### s06: Different counts grow at different rates.

On screen: The per-block resource requirement stays the same.

**s06-c1:** This eight-by-eight case loads five hundred and twelve input values and stores sixty-four outputs. Four blocks still fit the stated teaching budgets.

**s06-c2:** At fixed tile width, input loads grow with the cube of the matrix dimension, while output stores grow with its square. The resources used by one block do not change here.

### s07: Measure equivalent implementations fairly.

On screen: Check results, define the timed interval, then repeat.

**s07-c1:** To compare real implementations, first check both outputs against a suitable reference. Keep inputs and number format comparable, and change one proposed optimisation at a time.

**s07-c2:** Define whether timing includes allocation and transfers. Warm up, wait for the GPU work in the chosen interval, repeat measurements, and inspect actual operations with a profiler.

### s08: Turn the model into a testable recommendation.

On screen: Record evidence, assumptions and the next experiment.

**s08-c1:** The browser supports a reuse argument and a resource trade-off. It does not identify the fastest kernel or measure physical GPU performance.

**s08-c2:** Return to Chapter Fourteen and write your recommendation: which tile would you test first, what evidence supports it, what uncertainty remains, and what measurement would resolve it?
