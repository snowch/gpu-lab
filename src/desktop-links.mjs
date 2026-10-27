// Copyright © 2026 Christopher Snow.
const pythonPages=['hello','devices','reading','layout','requests','scheduling','divergence','reduction','matmul','tensor-cores','attention','inference','memory'];
export function desktopLinks(slug){
  return `<section class="book-section desktop-links"><h2>Run the example on your desktop</h2><p>${pythonPages.includes(slug)?`<a href="../examples/desktop/${slug}.py" download>Download this chapter’s opening PyTorch example</a>. `:''}<a href="desktop.html#examples">See the complete example index and setup appendix</a> for CPU PyTorch, the supported GPGPU-Sim programs and optional NVIDIA GPU execution.</p><p>The browser still requires no installation. Downloads are generated from the displayed source; CPU checks and simulator checks do not establish GPU performance.</p></section>`;
}
