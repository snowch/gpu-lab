// Copyright © 2026 Christopher Snow.
const pythonPages=['putting-it-together','hello','devices','reading','layout','requests','scheduling','divergence','reduction','matmul','tensor-cores','attention','inference','memory'];
export function desktopLinks(slug){
  // The final chapter includes its download within Where next.
  if(slug==='putting-it-together')return '';
  const download=pythonPages.includes(slug)?`<a href="../examples/desktop/${slug}.py" download>Download this chapter’s PyTorch example</a>${slug==='hello'?', or use the <a href="../examples/book-opening.py" download>companion script</a> to check examples across the opening chapters':''}. `:'Use the CUDA download beside the example. ';
  return `<section class="book-section desktop-links"><h2>Run this example on your computer</h2><p>${download}The <a href="desktop.html#${pythonPages.includes(slug)?'pytorch':'first-cuda'}">setup appendix</a> explains ${pythonPages.includes(slug)?'CPU-only PyTorch checks, NVIDIA GPU execution and the separate CUDA programs supported by GPGPU-Sim':'GPGPU-Sim and NVIDIA GPU execution'}. <a href="desktop.html#examples">Browse the complete example index</a>.</p><p>${slug==='hello'?'The companion’s NVIDIA GPU path remains unvalidated. ':''}CPU and simulator checks do not establish GPU performance.</p></section>`;
}
