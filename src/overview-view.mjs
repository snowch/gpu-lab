// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import { overviewExample, renderWorkMap } from './overview-visuals.mjs';
const view = document.getElementById('work-map');
if (view) {
  const example = overviewExample();
  const blockControl = document.getElementById('map-block');
  const warpControl = document.getElementById('map-warp');
  document.getElementById('work-map-controls').hidden = false;
  function update() {
    view.innerHTML = renderWorkMap(example, blockControl.value, Number(warpControl.value));
    const block = example.blocks.find(block => block.name === blockControl.value);
    document.getElementById('work-map-selection').textContent = `Following block ${block.name} on SM ${block.sm}, warp ${warpControl.value}.`;
  }
  blockControl.addEventListener('change', update);
  warpControl.addEventListener('change', update);
  registerExperiment('overview',()=>({}),update);
}
