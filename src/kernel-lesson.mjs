// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import { STARTER, CASE_LENGTHS, inputFor, simulateKernel, snapshot, kernelBody, wgslSource, validateProgram } from './kernel-model.mjs';
import { runWebGPU } from './kernel-webgpu.mjs';
import { challenges, predictionAnswer, assessSolution } from './kernel-challenges.mjs';
const byId = id => document.getElementById(id);
const storageKey = 'gpu-lab-kernel-prototype-v1';
let activeChallenge = null, predicted = false;
let program = { ...STARTER }, models = [], gpuResults = null, selected = 0, position = 0, busy = false, restored = false;
try { const stored = localStorage.getItem(storageKey); if (stored) { program = { ...validateProgram(JSON.parse(stored)) }; restored = true; } } catch { /* Storage is optional. */ }
const inputs = CASE_LENGTHS.map(inputFor);
function format(value) { return value === null || value === undefined || Number.isNaN(value) ? '—' : String(value); }
function setStatus(message, state = '') { byId('kernel-status').textContent = message; byId('kernel-status').dataset.state = state; }
function applyControls() {
  try { localStorage.setItem(storageKey, JSON.stringify(program)); } catch { /* Storage is optional. */ }
  byId('kernel-size').value = program.workgroupSize ?? 32;
  byId('kernel-task').value = program.task ?? 'scale';
  byId('kernel-index').value = program.index;
  byId('kernel-guard').value = program.guard ? 'yes' : 'no';
  byId('kernel-operation').value = program.operation;
  byId('task-description').textContent = program.task === 'vector-add' ? 'Write y[i] = x[i] + b[i]. The second input repeats −2.25, −1.25, −0.25, 0.75, 1.75. Check lengths 8, 32 and 35; the transfer assessment also checks other lengths and workgroup sizes.' : 'For x = [0.5, −1, 1.5, −2, …], output must start [1, −2, 3, −4, …]. Check lengths 8, 32 and 35, including the final element.';
  byId('kernel-source').textContent = kernelBody(program);
  byId('shader-source').textContent = wgslSource(program);
}
function invalidate() {
  models = []; gpuResults = null;
  byId('challenge-feedback').textContent = '';
  byId('kernel-results').hidden = true; byId('kernel-inspector').hidden = true; byId('gpu-adapter').hidden = true;
  setStatus('Kernel changed. Run the checks again.');
}
function setBusy(value) {
  busy = value;
  const awaitingPrediction = activeChallenge && !predicted;
  byId('kernel-editor').disabled = value || awaitingPrediction;
  byId('start-challenge').disabled = value;
  byId('check-prediction').disabled = value || predicted;
  byId('check-challenge').disabled = value;
  for (const id of ['run-model', 'reset-kernel', 'download-shader']) byId(id).disabled = value;
  byId('run-model').disabled = value || awaitingPrediction;
  byId('run-gpu').disabled = value || awaitingPrediction || !navigator.gpu;
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
  byId('inspection-case').textContent = `Length ${CASE_LENGTHS[selected]} · ${result.groups} workgroup(s) of ${result.workgroupSize} · ${result.invocations} invocations launched.`;
  byId('kernel-step').max = String(result.trace.length - 1); byId('kernel-step').value = String(position);
  byId('trace-position').textContent = `Source operation ${position + 1} of ${result.trace.length}`;
  const descriptions = {
    index: `Compute i = ${event.i} from ${program.index === 'local' ? 'the local ID' : program.index === 'next' ? 'the global ID plus one' : 'the global ID'}.`,
    guard: `Check ${event.i} < ${result.input.length}: ${event.allowed ? 'true; continue to memory access.' : 'false; this invocation skips the arrays.'}`,
    'load-b': `Read b[${event.i}] = ${event.value} at byte offset ${event.byteOffset}.`,
    load: `Read x[${event.i}] = ${event.value} at byte offset ${event.byteOffset}.`,
    arithmetic: `${event.loaded} ${program.operation === 'multiply' ? '×' : '+'} ${event.operand} = ${event.value} in FP32.`,
    store: `Write y[${event.i}] = ${event.value} at byte offset ${event.byteOffset}.`,
    fault: event.message,
  };
  byId('kernel-event').textContent = descriptions[event.op];
  byId('kernel-state').innerHTML = [['Workgroup', event.group], ['Local ID', event.local], ['Global ID', event.global], ['Index i', event.i]].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  renderMap(result, event);
  byId('second-input-panel').hidden = program.operation !== 'vector-add';
  if (program.operation === 'vector-add') memory('kernel-second-input', result.secondInput, event.op === 'load-b' ? event.i : -1);
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
for (const id of ['kernel-index', 'kernel-guard', 'kernel-operation', 'kernel-size', 'kernel-task']) byId(id).addEventListener('change', () => {
  program = { index: byId('kernel-index').value, guard: byId('kernel-guard').value === 'yes', operation: byId('kernel-operation').value, workgroupSize: Number(byId('kernel-size').value), task: byId('kernel-task').value };
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
  activeChallenge = null; predicted = false; byId('challenge-active').hidden = true;
  program = { ...STARTER }; applyControls(); invalidate(); setBusy(false);
  try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
});
byId('kernel-step').addEventListener('input', event => { position = Number(event.target.value); renderTrace(); });
for (const [id, action] of [['trace-back', () => position - 1], ['trace-next', () => position + 1], ['trace-start', () => 0], ['trace-end', () => models[selected].trace.length - 1]]) byId(id).addEventListener('click', () => { position = action(); renderTrace(); });
byId('download-shader').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([wgslSource(program)], { type: 'text/plain' })), link = document.createElement('a');
  link.href = url; link.download = program.task === 'vector-add' ? 'vector-add.wgsl' : 'scale.wgsl'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
applyControls(); setBusy(false);
if (restored) setStatus('Restored your saved kernel. Run the checks again.');
if (!navigator.gpu) byId('gpu-support').textContent = 'WebGPU is unavailable in this browser. All browser-model tasks still work, including offline.';

function renderMap(result, event) {
  const container = byId('invocation-map'); container.replaceChildren();
  const indices = result.trace.filter(e => e.op === 'index');
  const targets = new Map();
  for (const e of indices) if (e.i < result.input.length) targets.set(e.i, (targets.get(e.i) ?? 0) + 1);
  for (let group = 0; group < result.groups; group++) {
    const box = document.createElement('fieldset'), legend = document.createElement('legend');
    legend.textContent = 'Workgroup ' + group; box.append(legend);
    for (const e of indices.filter(e => e.group === group)) {
      const button = document.createElement('button'); button.type = 'button';
      const state = e.i >= result.input.length ? program.guard ? 'skip' : 'invalid' : targets.get(e.i) > 1 ? 'duplicate' : 'write';
      button.textContent = 'ID ' + e.global + ' → ' + (state === 'skip' ? 'skip' : 'y[' + e.i + ']') + (['duplicate','invalid'].includes(state) ? ' · ' + state : '');
      button.dataset.mapping = state;
      button.setAttribute('aria-pressed', String(e.global === event.global));
      button.setAttribute('aria-label', 'Workgroup ' + group + ', local ID ' + e.local + ', global ID ' + e.global + ', ' + state + (state === 'skip' ? '' : ', output ' + e.i));
      button.addEventListener('click', () => { position = result.trace.indexOf(e); renderTrace(); const replacement = byId('invocation-map').querySelector('[aria-pressed="true"]'); replacement?.focus(); });
      box.append(button);
    }
    container.append(box);
  }
  const missing = Array.from({length:result.input.length},(_,i)=>i).filter(i=>!targets.has(i));
  byId('mapping-summary').textContent = missing.length ? 'Outputs with no invocation: ' + missing.join(', ') + '.' : 'Every output has an invocation targeting it. Checks also verify values and unique writes.';
}
challenges.forEach((challenge, index) => {
  const option = document.createElement('option'); option.value = index; option.textContent = challenge.title; byId('challenge-choice').append(option);
});
byId('start-challenge').addEventListener('click', () => {
  activeChallenge = challenges[Number(byId('challenge-choice').value)]; predicted = false;
  program = {...activeChallenge.program, task:activeChallenge.task}; applyControls(); invalidate();
  byId('challenge-active').hidden = false;
  byId('challenge-goal').textContent = activeChallenge.task === 'vector-add' ? 'Construct y[i] = x[i] + b[i]. All three statements may need changing. Assessment uses lengths 1, 7, 17, 35 and 65 at every supported workgroup size.' : 'Repair y = 2 * x, then explain why the starter failed.';
  byId('prediction-label').textContent = activeChallenge.prompt;
  byId('challenge-prediction').value = ''; byId('prediction-feedback').textContent = '';
  byId('answer-label').textContent = activeChallenge.question;
  byId('challenge-answer').replaceChildren();
  const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Choose your explanation'; byId('challenge-answer').append(empty);
  activeChallenge.answers.forEach((answer, index) => { const option = document.createElement('option'); option.value = index; option.textContent = answer; byId('challenge-answer').append(option); });
  setStatus('Record your prediction before repairing this starter.');
  setBusy(false); byId('challenge-prediction').focus();
});
byId('check-prediction').addEventListener('click', () => {
  const value = byId('challenge-prediction').value;
  if (!activeChallenge || value === '' || !Number.isInteger(Number(value)) || Number(value) < 0) { byId('prediction-feedback').textContent = 'Enter a non-negative whole number first.'; return; }
  const expected = predictionAnswer(activeChallenge);
  predicted = true; setBusy(false);
  byId('prediction-feedback').textContent = (Number(value) === expected ? 'Prediction matches. ' : 'Prediction recorded: ' + value + '; the model gives ' + expected + '. ') + activeChallenge.explanation;
  program = {...activeChallenge.program, task:activeChallenge.task}; applyControls(); invalidate(); runModel();
});
byId('check-challenge').addEventListener('click', () => {
  if (!activeChallenge || !predicted) { byId('challenge-feedback').textContent = 'Record your starter prediction first. A revised understanding is welcome.'; return; }
  if ((program.task ?? 'scale') !== activeChallenge.task) { byId('challenge-feedback').textContent = 'Restore the challenge output goal before checking.'; return; }
  const result = assessSolution(program, activeChallenge, byId('challenge-answer').value);
  byId('challenge-feedback').textContent = result.code && result.explanation ? 'Challenge complete: all output and safety checks pass, and your explanation matches.' : !result.code ? 'Not complete: repair the kernel so every assessment case is safe and correct. Inspect a failing case below.' : 'The kernel passes. Revisit your explanation: ' + activeChallenge.explanation;
  runModel();
});
byId('challenge-answer').addEventListener('change', () => { byId('challenge-feedback').textContent = ''; });
