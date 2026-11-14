import {parallelChapters} from './parallel-chapters.mjs';
import {sectionHeading} from './section-cues.mjs';
// Copyright © 2026 Christopher Snow.
const pythonPages=[...parallelChapters.map(c=>c.slug),'putting-it-together','hello','devices','reading','layout','requests','scheduling','divergence','reduction','matmul','tensor-cores','attention','inference','memory'];
export function desktopLinks(slug,{after=''}={}){
  const download=pythonPages.includes(slug)?`<a href="../examples/desktop/${slug}.py" download>Download this chapter’s PyTorch example</a>${slug==='hello'?', or use the <a href="../examples/book-opening.py" download>companion script</a> to check examples across the opening chapters':''}. `:'Use the CUDA download beside the example. ';
  return `<details class="book-section desktop-links chapter-resource${slug==='hello'?' hello-local':''}" data-section-kind="desktop" id="${slug}-local"><summary>${sectionHeading('desktop','Run on your computer')}</summary><div class="resource-body"><p>${download}The <a href="desktop.html#${pythonPages.includes(slug)?'pytorch':'first-cuda'}">setup appendix</a> explains ${pythonPages.includes(slug)?'CPU-only PyTorch checks, NVIDIA GPU execution and the separate CUDA programs supported by GPGPU-Sim':'GPGPU-Sim and NVIDIA GPU execution'}. <a href="desktop.html#examples">Browse the complete example index</a>.</p><p>${slug==='hello'?'The companion’s NVIDIA GPU path remains unvalidated. ':''}CPU and simulator checks do not establish GPU performance.</p>${after}</div></details>`;
}
