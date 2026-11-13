// Copyright © 2026 Christopher Snow.
export const chapters=[
  {title:'How does a GPU double five values?',slug:'hello',summary:'Double five input values, then trace each result through threads, indices and a CUDA kernel.',opening:true},
  {title:'Where are tensor values stored?',slug:'devices',summary:'Copy five inputs from CPU to GPU memory, multiply them, then copy the results back.',opening:true},
  {title:'How does a CUDA program manage GPU memory?',slug:'launch-from-input',summary:'Derive counts from an input array, allocate GPU storage, copy values, launch a kernel and read back the results.',opening:true},
  {title:'How do we select values from a tensor?',slug:'reading',summary:'Select rows and columns, then multiply the chosen values.',opening:true},
  {title:'How are tensor values arranged in memory?',slug:'layout',summary:'Locate row and column values in memory, compare strides, then make a packed copy.',opening:true},
  {title:'How do threads read tensor values?',slug:'requests',summary:'Compare the memory sectors read by five threads for a row, a column and a packed copy.',opening:true},
  {title:'What runs while a warp waits for data?',slug:'scheduling',summary:'Follow a warp waiting for an input value, then let another ready warp run.',opening:true},
  {title:'What if lanes need different calculations?',slug:'divergence',summary:'Compare lanes that double positive inputs with lanes that negate negative inputs.',opening:true},
  {title:'How do threads add values together?',slug:'reduction',summary:'Add four or eight input values using shared memory and block barriers.',opening:true},
  {title:'How can matrix multiplication reuse its inputs?',slug:'matmul',summary:'Compare repeated loads with shared tiles in matrix multiplication.',opening:true},
  {title:'What changes when matrix inputs use fewer bits?',slug:'tensor-cores',summary:'Compare FP32, FP16 and BF16 inputs, then inspect how rounding affects the sum.',opening:true},
  {title:'How can attention use less memory?',slug:'attention',summary:'Combine value rows using attention weights, then compare full score matrices with tiles.',opening:true},
  {title:'What limits an inference step?',slug:'inference',summary:'Count cached keys and values, then estimate limits from data transfers and arithmetic.',opening:true},
  {title:'Investigate a matrix multiplication',slug:'putting-it-together',summary:'Compare matrix tile widths, count input loads and resource use, then choose what to measure on a GPU.',opening:true},
];
