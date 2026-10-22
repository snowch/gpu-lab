// Copyright © 2026 Christopher Snow.
// Editorial selection: only first-use terms essential to each lesson.
// Definitions are plain text; renderConcepts escapes them before rendering.
export const conceptsByLesson = {
  scheduling: [
    {term:'Streaming multiprocessor (SM)',definition:'A GPU unit that runs resident thread blocks and schedules their warps.'},
    {term:'Latency',definition:'The delay between starting an operation and having its result available.'},
    {term:'Latency hiding',definition:'Issuing ready work from another warp while one waits; this does not make its load faster.'},
  ],
  divergence: [
    {term:'Branch divergence',definition:'Threads in one warp take different control-flow paths.'},
    {term:'Active-lane mask',definition:'The set of lanes that participate in a particular instruction.'},
  ],
  'shared-memory': [
    {term:'Shared memory',definition:'Fast, programmer-managed memory accessible to threads of the same block.'},
    {term:'Bank',definition:'One independently serviced part of shared memory.'},
    {term:'Bank conflict',definition:'Different words requested from the same bank need separate service rounds in this model.'},
    {term:'Broadcast',definition:'Multiple lanes requesting the same shared-memory word can be served together on a read.'},
  ],
  reduction: [
    {term:'Reduction',definition:'Combining many inputs into one value, such as a sum or maximum.'},
    {term:'Data race',definition:'Conflicting accesses to the same memory without the required ordering, where at least one access writes.'},
  ],
  matmul: [
    {term:'Tile',definition:'A small rectangular part of a matrix that threads can work on together.'},
    {term:'Arithmetic intensity',definition:'Arithmetic operations per byte moved across a specified memory boundary.'},
  ],
  'tensor-cores': [
    {term:'Tensor core',definition:'Specialised GPU hardware for supported matrix multiply-accumulate operations.'},
    {term:'WMMA',definition:'A CUDA interface for warp-cooperative matrix multiply-accumulate operations.'},
    {term:'Fragment',definition:'A thread’s portion of a matrix tile used by that cooperative operation.'},
  ],
  attention: [
    {term:'Query (Q)',definition:'The vector asking what information is relevant.'},
    {term:'Key (K)',definition:'The vector compared with a query to produce a score.'},
    {term:'Value (V)',definition:'The information combined using the scores after normalisation.'},
    {term:'Softmax',definition:'A function turning scores into non-negative weights that sum to one.'},
  ],
  inference: [
    {term:'Prefill',definition:'Processing the input prompt tokens together before generation.'},
    {term:'Decode',definition:'Producing a new token for each active sequence in a batch.'},
    {term:'KV cache',definition:'Stored attention keys and values from earlier tokens, reused during decode.'},
    {term:'Roofline bound',definition:'An optimistic minimum-time estimate from counted memory traffic and arithmetic work.'},
  ],
};
