// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import { STARTER, CASE_LENGTHS, inputFor, simulateKernel, snapshot, kernelBody, wgslSource, validateProgram } from './kernel-model.mjs';
import { runWebGPU } from './kernel-webgpu.mjs';
const byId = id => document.getElementById(id);
const storageKey = 'gpu-lab-kernel-prototype-v1';
let program = { ...STARTER }, models = [], gpuResults = null, selected = 0, position = 0, busy = false, restored = false;
try { const stored = localStorage.getItem(storageKey); if (stored) { program = { ...validateProgram(JSON.parse(stored)) }; restored = true; } } catch { /* Storage is optional. */ }
const inputs = CASE_LENGTHS.map(inputFor);
function format(value) { return value === null || value === undefined || Number.isNaN(value) ? '—' : String(value); }
function setStatus(message, state = '') { byId('kernel-status').textContent = message; byId('kernel-status').dataset.state = state; }
function applyControls() {
  byId('kernel-index').value = program.index;
  byId('kernel-guard').value = program.guard ? 'yes' : 'no';
  byId('kernel-operation').value = program.operation;
  byId('kernel-source').textContent = kernelBody(program);
  byId('shader-source').textContent = wgslSource(program);
}
function invalidate() {
  models = []; gpuResults = null;
  byId('kernel-results').hidden = true; byId('kernel-inspector').hidden = true; byId('gpu-adapter').hidden = true;
  setStatus('Kernel changed. Run the checks again.');
}
function setBusy(value) {
  busy = value;
  byId('kernel-editor').disabled = value;
  for (const id of ['run-model', 'reset-kernel', 'download-shader']) byId(id).disabled = value;
  byId('run-gpu').disabled = value || !navigator.gpu;
}
function verdict(result) {
  if (!result) return 'Not run';
  if (result.blocked) return 'Stopped';
  return result.passed ? 'Pass' : 'Fail';
}
function explanation(result) {
  if (!result) return '';
  if (result.blocked) return result.message;
  if (result.hazards?.length) return result.hazards[0];
  const failure = result.failures?.[0];
  return failure ? `y[${failure.index}]: expected ${failure.expected}, got ${format(failure.actual)}${failure.actual == null || Number.isNaN(failure.actual) ? ' (unwritten)' : ''}` : 'Every output matches.';
}
function showCases() {
  const tbody = byId('kernel-cases'); tbody.replaceChildren();
  models.forEach((model, index) => {
    const row = document.createElement('tr');
    const length = document.createElement('th'); length.scope = 'row'; length.textContent = String(CASE_LENGTHS[index]); row.append(length);
    for (const result of [model, gpuResults?.[index]]) {
      const cell = document.createElement('td'); cell.textContent = verdict(result);
      if (result) { const detail = document.createElement('small'); detail.textContent = explanation(result); cell.append(detail); }
      row.append(cell);
    }
    const cell = document.createElement('td'), button = document.createElement('button');
    button.type = 'button'; button.textContent = `Inspect ${CASE_LENGTHS[index]}`; button.setAttribute('aria-pressed', String(index === selected));
    button.addEventListener('click', () => { selected = index; position = 0; showCases(); renderTrace(); byId('kernel-inspector').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    cell.append(button); row.append(cell); tbody.append(row);
  });
  byId('kernel-results').hidden = false;
}
function memory(id, values, active = -1) {
  const grid = byId(id); grid.replaceChildren();
  values.forEach((value, index) => {
    const cell = document.createElement('div'); cell.className = `kernel-cell${index === active ? ' active' : ''}`;
    const label = document.createElement('small'); label.textContent = `[${index}]`;
    const content = document.createElement('strong'); content.textContent = format(value);
    cell.append(label, content); cell.setAttribute('aria-label', `Element ${index}, ${format(value)}`); grid.append(cell);
  });
}
function renderTrace() {
  const result = models[selected]; if (!result) return;
  position = Math.max(0, Math.min(position, result.trace.length - 1));
  const event = result.trace[position];
  byId('kernel-inspector').hidden = false;
  byId('inspection-case').textContent = `Length ${CASE_LENGTHS[selected]} · ${result.groups} workgroup(s) of 32 · ${result.invocations} invocations launched.`;
  byId('kernel-step').max = String(result.trace.length - 1); byId('kernel-step').value = String(position);
  byId('trace-position').textContent = `Source operation ${position + 1} of ${result.trace.length}`;
  const descriptions = {
    index: `Compute i = ${event.i} from ${program.index === 'local' ? 'the local ID' : program.index === 'next' ? 'the global ID plus one' : 'the global ID'}.`,
    guard: `Check ${event.i} < ${result.input.length}: ${event.allowed ? 'true; continue to memory access.' : 'false; this invocation skips the arrays.'}`,
    load: `Read x[${event.i}] = ${event.value} at byte offset ${event.byteOffset}.`,
    arithmetic: `${event.loaded} ${program.operation === 'multiply' ? '×' : '+'} 2 = ${event.value} in FP32.`,
    store: `Write y[${event.i}] = ${event.value} at byte offset ${event.byteOffset}.`,
    fault: event.message,
  };
  byId('kernel-event').textContent = descriptions[event.op];
  byId('kernel-state').innerHTML = [['Workgroup', event.group], ['Local ID', event.local], ['Global ID', event.global], ['Index i', event.i]].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  memory('kernel-input', result.input, event.op === 'load' ? event.i : -1);
  memory('kernel-output', snapshot(result, position), event.op === 'store' ? event.i : -1);
  const actual = gpuResults?.[selected];
  byId('gpu-output-panel').hidden = !actual?.output;
  if (actual?.output) memory('kernel-gpu-output', actual.output);
  byId('trace-back').disabled = position === 0; byId('trace-next').disabled = position === result.trace.length - 1;
}
function runModel() {
  models = inputs.map(input => simulateKernel(program, input)); selected = 0; position = 0;
  showCases(); renderTrace();
  const passed = models.filter(result => result.passed).length;
  setStatus(`Browser model: ${passed} of ${models.length} checks pass. ${passed === models.length ? 'Now compare with WebGPU or investigate another expression.' : 'Inspect a failing length, repair the kernel, and run again.'}`, passed === models.length ? 'pass' : 'fail');
}
for (const id of ['kernel-index', 'kernel-guard', 'kernel-operation']) byId(id).addEventListener('change', () => {
  program = { index: byId('kernel-index').value, guard: byId('kernel-guard').value === 'yes', operation: byId('kernel-operation').value };
  applyControls(); invalidate();
  try { localStorage.setItem(storageKey, JSON.stringify(program)); } catch { /* Storage is optional. */ }
});
byId('run-model').addEventListener('click', runModel);
byId('run-gpu').addEventListener('click', async () => {
  if (busy) return;
  runModel(); setBusy(true); byId('gpu-adapter').hidden = true; setStatus('Compiling and running the WGSL shader with WebGPU…');
  try {
    const result = await runWebGPU({ ...program }, inputs);
    gpuResults = result.results; showCases(); renderTrace();
    const passed = gpuResults.filter(result => result.passed).length;
    setStatus(`WebGPU: ${passed} of ${gpuResults.length} checks pass. ${passed === gpuResults.length ? 'All read-back values match the reference.' : 'Inspect the failed or stopped cases below.'}`, passed === gpuResults.length ? 'pass' : 'fail');
    byId('gpu-adapter').hidden = false;
    byId('gpu-adapter').textContent = `Executed through WebGPU on ${result.adapterDescription}. ${result.software === true ? 'The browser reports a software/fallback adapter.' : result.software === false ? 'The browser reports a non-fallback adapter.' : 'The browser does not identify whether this adapter uses software.'} No timing comparison is made.`;
  } catch (error) { gpuResults = null; showCases(); renderTrace(); setStatus(error.message, 'unavailable'); }
  finally { setBusy(false); }
});
byId('reset-kernel').addEventListener('click', () => {
  program = { ...STARTER }; applyControls(); invalidate();
  try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
});
byId('kernel-step').addEventListener('input', event => { position = Number(event.target.value); renderTrace(); });
for (const [id, action] of [['trace-back', () => position - 1], ['trace-next', () => position + 1], ['trace-start', () => 0], ['trace-end', () => models[selected].trace.length - 1]]) byId(id).addEventListener('click', () => { position = action(); renderTrace(); });
byId('download-shader').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([wgslSource(program)], { type: 'text/plain' })), link = document.createElement('a');
  link.href = url; link.download = 'scale.wgsl'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
applyControls(); setBusy(false);
if (restored) setStatus('Restored your saved kernel. Run the checks again.');
if (!navigator.gpu) byId('gpu-support').textContent = 'WebGPU is unavailable in this browser. All browser-model tasks still work, including offline.';
