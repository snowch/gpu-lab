// Copyright © 2026 Christopher Snow.
export const chapters=[
  {title:'One operation, many numbers',slug:'hello',summary:'Follow five values from PyTorch to threads, indices and a small CUDA kernel.',opening:true},
  {title:'Where do the numbers live?',slug:'devices',summary:'Copy inputs to the GPU, calculate there, and bring back a result.',opening:true},
  {title:'How do we select values from a tensor?',slug:'reading',summary:'Select rows and columns, then multiply the chosen values.',opening:true},
  {title:'How are tensor values arranged in memory?',slug:'layout',summary:'Follow values into storage, compare strides, then make a packed copy.',opening:true},
  {title:'How do threads read those values?',slug:'requests',summary:'Follow five reads from one warp and compare the sectors they touch.',opening:true},
  {title:'How can work continue during a wait?',slug:'scheduling',summary:'Follow a waiting warp, then see how another warp can make progress.',opening:true},
  {title:'What if lanes need different calculations?',slug:'divergence',summary:'Follow active lanes through different calculations.',opening:true},
  {title:'How do threads combine their results?',slug:'reduction',summary:'Build a sum using shared values and block barriers.',opening:true},
  {title:'How can matrix multiplication reuse its inputs?',slug:'matmul',summary:'Compare repeated loads with shared tiles in matrix multiplication.',opening:true},
  {title:'What changes when matrix inputs use fewer bits?',slug:'tensor-cores',summary:'Trace input rounding and accumulation, then connect them to matrix hardware.',opening:true},
  {title:'How can attention store less?',slug:'attention',summary:'Build a weighted result, then compare full intermediates with tiles.',opening:true},
  {title:'What limits an inference step?',slug:'inference',summary:'Follow the KV cache, then compare memory and compute bounds.',opening:true},
];
