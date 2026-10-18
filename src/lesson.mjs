// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import { scheduleWarps, branchWarp, sharedBanks } from './architecture.mjs';
import { mechanismVisual } from './mechanism-visuals.mjs';
const $ = id => document.getElementById(id);
const kind = document.body.dataset.lesson;
const num = id => Number($(id).value);
let result, cursor = 0, revealed = false;
const percent = value => `${Math.round(value * 100)}%`;
function element(tag, text, className = '') {
  const el = document.createElement(tag); el.textContent = text; el.className = className; return el;
}
function configuration() {
  if (kind === 'scheduling') return { warps: num('warps'), latency: num('latency') };
  if (kind === 'divergence') return { pattern: $('pattern').value, activeLanes: num('activeLanes'), negativeOps: num('negativeOps') };
  const choice = $('bankPattern').value;
  return { stride: { row: 1, column: 32, padded: 33, stride2: 2, broadcast: 1 }[choice], broadcast: choice === 'broadcast', activeLanes: num('activeLanes') };
}
function compute() {
  const model = { scheduling: scheduleWarps, divergence: branchWarp, 'shared-memory': sharedBanks }[kind];
  result = model(configuration());
}
const answer = () => kind === 'scheduling' ? result.idle : kind === 'divergence' ? result.instructions : result.rounds;
function inspectLane() {
  const lane = result.lanes[Number($('lane').value)];
  if (!lane) return;
  $('lane-detail').textContent = kind === 'divergence'
    ? `Lane ${lane.id}: input ${lane.input}; ${lane.active ? `${lane.path} path; final output ${lane.output}.` : 'inactive; no output write.'}`
    : `Lane ${lane.id}: word ${lane.word}, byte address ${lane.address}, bank ${lane.bank}.`;
}
function render() {
  $('results').hidden = !revealed;
  if (!revealed) return;
  const metrics = kind === 'scheduling'
    ? [['Model cycles', result.cycles], ['Instructions issued', result.issued], ['Idle cycles', result.idle], ['Issue-slot use', percent(result.issueUtilisation)]]
    : kind === 'divergence'
    ? [['Paths taken', result.paths], ['Path operations', result.instructions], ['Useful lane slots', result.usefulSlots], ['Lane-slot use', percent(result.utilisation)]]
    : [['Service rounds', result.rounds], ['Banks used', result.banksUsed], ['Distinct words', result.distinctWords], ['Reading lanes', result.lanes.length]];
  $('metrics').replaceChildren(...metrics.map(([label, value]) => {
    const card = document.createElement('div'); card.append(element('span', label), element('strong', value)); return card;
  }));
  $('step').max = result.trace.length - 1; $('step').value = cursor;
  $('position').textContent = `${cursor + 1} / ${result.trace.length}`;
  $('back').disabled = cursor === 0; $('next').disabled = cursor === result.trace.length - 1;
  const current = result.trace[cursor];
  const figure = $('figure'); figure.replaceChildren();
  figure.className = `architecture-figure ${kind}`;
  figure.insertAdjacentHTML('beforeend',mechanismVisual(kind,result,current));
  if (kind === 'scheduling') {
    $('step-detail').textContent = `Cycle ${current.cycle}: ${current.selected === null ? 'idle; no unfinished warp is ready.' : `warp ${current.selected} issues ${current.instruction}.`}`;
    for (let id = 0; id < current.before.length; id++) {
      const warp = current.before[id];
      const card = element('div', '', `warp-card${current.selected === id ? ' selected' : ''}`);
      card.append(element('strong', `Warp ${id}`), element('span', current.selected === id ? 'ISSUING' : warp.status.toUpperCase()));
      card.append(element('p', warp.status === 'done' ? 'Program complete' : `Next: ${result.program[warp.pc]}${warp.status === 'waiting' ? ` · ready at cycle ${warp.readyAt}` : ''}`));
      figure.append(card);
    }
    $('explanation').textContent = `${result.issued} instructions issued across ${result.cycles} model cycles; ${result.idle} slots were idle. Increasing warps increases the work as well as the opportunities to hide latency. Issue-slot use is not occupancy or a hardware speedup.`;
  } else if (kind === 'divergence') {
    $('step-detail').textContent = `${current.label}: ${current.mask.length} participating lanes out of 32.`;
    for (const lane of result.lanes) {
      const card = element('div', `L${lane.id} ${lane.input < 0 ? '−' : '+'}`, `mask-lane${current.mask.includes(lane.id) ? ' selected' : ''}${!lane.active ? ' inactive' : ''}`);
      card.setAttribute('aria-label', `Lane ${lane.id}, ${!lane.active ? 'inactive' : current.mask.includes(lane.id) ? 'participating' : 'masked off'}`);
      figure.append(card);
    }
    $('explanation').textContent = `${result.instructions} path operations use ${result.usefulSlots} of ${result.instructions * 32} possible lane slots. Empty paths are skipped. Masked-off lanes do no work for this operation; they may participate in another path.`;
  } else {
    $('step-detail').textContent = `Round ${cursor + 1}: ${current.served.length} banks serve ${current.served.reduce((n,s)=>n+s.laneIds.length,0)} lanes.`;
    for (const bank of result.banks) {
      const serving = current.served.find(s => s.bank === bank.id);
      const card = element('div', '', `bank-card${serving ? ' selected' : ''}`);
      card.append(element('strong', `Bank ${bank.id}`));
      card.append(element('span', `${bank.words.length} distinct ${bank.words.length === 1 ? 'word' : 'words'}`));
      card.append(element('p', serving ? `Word ${serving.word} → ${serving.laneIds.length} ${serving.laneIds.length === 1 ? 'lane' : 'lanes'}` : 'No word served'));
      figure.append(card);
    }
    $('explanation').textContent = `${result.distinctWords} distinct words map to ${result.banksUsed} banks. The busiest bank needs ${result.rounds} service ${result.rounds === 1 ? 'round' : 'rounds'}. Readers of the same word share its service. These rounds count conflicts, not measured latency.`;
  }
  $('lane-inspector').hidden = kind === 'scheduling';
  if (kind !== 'scheduling') {
    const previous = Number($('lane').value) || 0;
    $('lane').replaceChildren(...result.lanes.map(l => {
      const option = element('option', `Lane ${l.id}`); option.value = l.id; return option;
    }));
    $('lane').value = String(Math.min(previous, result.lanes.length - 1)); inspectLane();
  }
  $('trace').replaceChildren(...result.trace.map((tick, i) => {
    const title = kind === 'scheduling' ? `${tick.cycle}: ${tick.selected === null ? 'idle' : `W${tick.selected} ${tick.instruction}`}` : kind === 'divergence' ? tick.label : `Round ${i + 1}`;
    const button = element('button', title, i === cursor ? 'selected' : '');
    button.type = 'button'; button.setAttribute('aria-pressed', String(i === cursor));
    button.addEventListener('click', () => { cursor = i; render(); $('trace').children[i].focus({ preventScroll: true }); });
    return button;
  }));
}
for (const select of $('controls').querySelectorAll('select')) {
  select.addEventListener('change', () => {
    revealed = false; cursor = 0; $('guess').value = ''; compute(); render();
    $('feedback').textContent = 'Configuration changed. Make a new prediction, then inspect.';
  });
}
$('prediction').addEventListener('submit', event => {
  event.preventDefault(); if (!$('prediction').reportValidity()) return;
  revealed = true; cursor = 0; render();
  $('feedback').textContent = num('guess') === answer() ? `Your prediction matches: ${answer()}. Step through the trace to explain why.` : `You predicted ${num('guess')}; the model gives ${answer()}. Follow the trace and compare with your reasoning.`;
});
$('inspect').addEventListener('click', () => { revealed = true; cursor = 0; render(); $('feedback').textContent = 'Computed trace ready. Use Next step to follow the model.'; });
$('back').addEventListener('click', () => { cursor = Math.max(0, cursor - 1); render(); });
$('next').addEventListener('click', () => { cursor = Math.min(result.trace.length - 1, cursor + 1); render(); });
$('restart').addEventListener('click', () => { cursor = 0; render(); });
$('step').addEventListener('input', () => { cursor = num('step'); render(); });
$('lane').addEventListener('change', inspectLane);
compute(); render();
