// Copyright © 2026 Christopher Snow.
// Only completed chapters are published here; future chapters have no dead links.
export const parallelChapters = [
  {slug:'histograms',number:15,title:'What if many threads update the same value?',summary:'Count token categories with atomics, then compare global counters with per-block partial counts.',source:`import torch

# Integer category IDs, such as token routing destinations.
x = torch.tensor(
    [0, 1, 0, 2, 1, 0, 3, 0],
    dtype=torch.int64, device="cuda",
)
counts = torch.bincount(x, minlength=4)
print(counts.cpu())`,expected:{counts:[4,2,1,1]}},
];
