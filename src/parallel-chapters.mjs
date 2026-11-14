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
  {slug:'scan',number:16,title:'How can threads compute running totals?',summary:'Follow staged prefix sums, then turn inclusive totals into exclusive output offsets.',source:`import torch

x = torch.tensor(
    [0, 1, 0, 2, 1, 0, 3, 0],
    dtype=torch.int64, device="cuda",
)
flags = (x == 0).to(torch.int64)
totals = torch.cumsum(flags, dim=0)
print(totals.cpu())`,expected:{totals:[1,1,2,2,2,3,3,4]}},
  {slug:'compaction',number:17,title:'Where should each surviving token go?',summary:'Turn selection flags into unique output positions, then preserve token order while packing the survivors.',source:`import torch

categories = torch.tensor(
    [0, 1, 0, 2, 1, 0, 3, 0],
    dtype=torch.int64, device="cuda",
)
token_ids = torch.arange(8, device="cuda")
keep = categories == 0
out = token_ids[keep]
print(out.cpu())`,expected:{out:[0,2,5,7]}},
  {slug:'progress',number:18,title:'Why can a parallel program stop making progress?',summary:'Break a dining-philosopher wait cycle, diagnose barrier participation and separate resource ordering from scheduling progress.',source:`import torch

x = torch.tensor(
    [1.0, 2.0, 3.0, 4.0],
    dtype=torch.float32, device="cuda",
)
y = x * 2.0
z = y * 3.0
print(z.cpu())`,expected:{z:[6,12,18,24]}},
  {slug:'pipelines',number:19,title:'How can copying overlap computation?',summary:'Trace copy/compute dependencies, protect two reusable slots and compare explicitly synthetic schedules.',source:`import torch

target = torch.device("cuda")
host = torch.arange(1, 9, dtype=torch.float32)
if target.type == "cuda":
    host = host.pin_memory()
    streams = [torch.cuda.Stream(), torch.cuda.Stream()]
    results = []
    for chunk, stream in zip(host.chunk(2), streams):
        with torch.cuda.stream(stream):
            copied = chunk.to(target, non_blocking=True)
            results.append(copied * 2.0)
    for stream in streams:
        stream.synchronize()
    out = torch.cat([result.cpu() for result in results])
else:
    out = host * 2.0
print(out)`,expected:{out:[2,4,6,8,10,12,14,16]}},
];
