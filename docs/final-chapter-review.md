# Final chapter: author review and verification

Copyright © 2026 Christopher Snow.

The final question is whether the reader can defend a change to one workload
without treating a reduced counter as proof of a faster GPU kernel. Chapter 13
uses the existing matrix engine and Python source template, with no new numerical
execution rules. The fixed FP32 workload and independent baseline make the tile
comparison inspectable. The new-case question changes N while holding tile width
and per-SM budgets fixed. The model contract records all counts and limits.

The first browser review identified missing first-use definitions and a matrix
header too wide on phones. Add baseline/capacity definitions and use numeric column
indices. Inspection also made the hardware-comparison boundary explicit: the
PyTorch download does not select our teaching tile widths. Distinct CUDA/Triton
implementations would be required for that comparison on hardware.

The chapter reuses the common controls, prediction gating, independent state,
references and accessible styling. Navigation, the desktop index/downloads,
map chapter references and global chapter counts include chapter 13. The offline
suite checks a completed choice and unanswered baseline across an actual update.
The dedicated numerical contract pins the default and transfer-case trade-offs;
CPU PyTorch CI checks the new opening's output against the engine.

NVIDIA kernel-programming and Triton tutorial pages returned HTTP 200 during link
review. The official PyTorch documentation host returned HTTP 403 from this
execution environment, so its profiler recipe could not be fetched here; the
link is an official tutorial URL. The existing timing and layout references supply
the applied documentation questions. External sources are optional online reading.

Actual phone/tablet/desktop and both-theme interactions were exercised. This is an
author review plus automated checks, not independent learner testing. Final command
results and CI evidence are recorded in the pull request.
