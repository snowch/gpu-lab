# Concrete language review

Copyright © 2026 Christopher Snow.

Reviewed the overview, thirteen published chapters, code explanations, documentation
questions, GPU map, extra practice and desktop appendix. The aim is to name the
calculation, data, destination or comparison before relying on general phrases.
“Values” describes tensor data; “tensor” describes the container. Counts and
established terms such as number format, stride, warp and accumulation retain their
technical meanings. This is an author review, not independent learner testing.

| Chapter | Review outcome |
| --- | --- |
| 1 | Title and introduction name doubling five input values. Match the first exercise and distinguish extra threads from missing input values. |
| 2 | Name storage in the title, GPU memory in the multiplication heading, and CPU memory in the return-copy heading. |
| 3 | Keep the explicit row/column title; connect the five input values to the larger tensor and name FP32. |
| 4 | Name locating selected values in memory and ask whether packing changes those values. Retain view, stride and offset definitions. |
| 5 | Name tensor values in the title and row/column memory sectors in the summary. Replace “lives” with “is stored”. |
| 6 | Name the waiting warp and input value. Describe the second warp’s ready instruction and compare instruction counts. |
| 7 | Keep the concrete different-calculations title; name doubling positive inputs and negating negative inputs in the lead. |
| 8 | Name adding input values in the title and four/eight inputs in section headings. Name the read-before-write diagnostic. |
| 9 | Keep matrix multiplication and reuse in the title; replace “a row meets a column” with multiplying matching entries and adding products. |
| 10 | Keep the fewer-bits question; name FP32/FP16/BF16 conversion and compare values before and after conversion. |
| 11 | Name memory in the title and score/weight matrices in the storage-count section. |
| 12 | Keep the inference-step question; name cached keys/values, data transfers, arithmetic, prefill and decode in the lead and headings. |
| 13 | Replace the generic closing title with investigating matrix multiplication. Name tile widths, input loads, per-block storage and the GPU measurement question. |

Chapter names are updated in contents, navigation, page titles, previous/next links,
map chapter links, the desktop example index and the curriculum plan. Slugs and
control IDs stay stable. Reference questions name storage; the map names warp
scheduling. Setup commands in the desktop appendix already name their actions and
remain intact. Extra-practice memory headings now refer to tensor values.

The pass changes prose and labels. Programs, model assumptions, numerical results,
experimental configurations and prediction/reveal behaviour are unchanged. Existing
checks cover the chapter sequence and interactive flows; a separate rendered-page
review checks title consistency, wrapping and overflow across phone, tablet and
desktop sizes in both themes. The authoring checklist records the wording principle.
