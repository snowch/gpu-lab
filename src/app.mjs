// Copyright © 2026 Christopher Snow.
import { simulateLoad, kernelSource } from './model.mjs';
const $ = id => document.getElementById(id);
let selectedLane = 0;
let revealed = false;
let result;
const config = () => ({ stride: Number($('stride').value), offset: Number($('offset').value), activeLanes: Number($('active').value) });
const setText = (id, text) => { $(id).textContent = text; };

function renderSelection() {
  const lane = result.lanes[selectedLane];
  for (const button of $('lanes').children) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.lane) === selectedLane));
  }
  setText('lane-detail', lane.active
    ? `Lane ${lane.id} → element ${lane.element} → byte address ${lane.address}${revealed ? ` → sector ${lane.sector}` : ''}.`
    : `Lane ${lane.id} is inactive. It issues no memory access.`);
  if (!revealed) return;
  for (const cell of $('sectors').querySelectorAll('.word')) {
    cell.classList.toggle('selected', lane.active && Number(cell.dataset.address) === lane.address);
  }
}

function render() {
  const settings = config();
  result = simulateLoad(settings);
  $('results').hidden = !revealed;
  setText('kernel', kernelSource(settings));
  $('lanes').replaceChildren(...result.lanes.map(lane => {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.lane = lane.id;
    button.textContent = lane.id;
    button.className = lane.active ? 'lane' : 'lane inactive';
    button.setAttribute('aria-label', `Lane ${lane.id}${lane.active ? '' : ', inactive'}`);
    button.addEventListener('click', () => { selectedLane = lane.id; renderSelection(); });
    return button;
  }));
  if (revealed) {
    setText('sector-count', result.sectors.length);
    setText('useful-bytes', result.usefulBytes);
    setText('covered-bytes', result.coveredBytes);
    setText('utilisation', `${Math.round(result.utilisation * 100)}%`);
    $('sectors').replaceChildren(...result.sectors.map(sector => {
      const row = document.createElement('div'); row.className = 'sector';
      const label = document.createElement('div'); label.className = 'sector-label';
      label.textContent = `Sector ${sector.id}`;
      const address = document.createElement('span'); address.textContent = `bytes ${sector.startAddress}–${sector.startAddress + 31}`;
      label.append(address); row.append(label);
      const words = document.createElement('div'); words.className = 'words';
      for (const word of sector.words) {
        const cell = document.createElement('span');
        cell.className = `word${word.laneIds.length ? ' used' : ''}`;
        cell.dataset.address = word.address;
        cell.textContent = word.laneIds.length ? `L${word.laneIds[0]}` : '·';
        cell.title = `Byte ${word.address}: ${word.laneIds.length ? 'lane ' + word.laneIds[0] : 'not requested'}`;
        words.append(cell);
      }
      row.append(words); return row;
    }));
    setText('explanation', `${settings.activeLanes} active lanes request ${result.usefulBytes} bytes in ${result.sectors.length} sectors, covering ${result.coveredBytes} bytes. ${result.sectors.length === result.minimumSectors ? 'This reaches the minimum sector count for this many distinct FP32 values.' : `These values could fit in ${result.minimumSectors} sectors if packed consecutively from an aligned base.`} Sector utilisation measures requested bytes divided by bytes in touched sectors; it is not GPU utilisation.`);
  }
  renderSelection();
}
function resetExperiment() {
  revealed = false; $('guess').value = '';
  setText('feedback', 'Pattern changed. Make a new prediction, then inspect the addresses.');
  setText('copy-status', 'The browser models addresses; it does not compile CUDA.');
  render();
}
for (const id of ['stride', 'offset', 'active']) $(id).addEventListener('change', resetExperiment);
for (const button of document.querySelectorAll('[data-preset]')) {
  button.addEventListener('click', () => {
    $('stride').value = button.dataset.preset === 'column' ? '8' : '1';
    $('offset').value = button.dataset.preset === 'misaligned' ? '1' : '0';
    $('active').value = '32'; resetExperiment();
  });
}
$('prediction').addEventListener('submit', event => {
  event.preventDefault();
  if (!$('prediction').reportValidity()) return;
  const guess = Number($('guess').value);
  revealed = true; render();
  setText('feedback', guess === result.sectors.length
    ? `Your prediction matches: ${result.sectors.length} sectors. Follow a lane below to explain why.`
    : `You predicted ${guess}; the model touches ${result.sectors.length} sectors. Inspect the grouped addresses below and compare them with your reasoning.`);
});
$('inspect').addEventListener('click', () => { revealed = true; render(); setText('feedback', 'Addresses grouped. Select a lane to follow its value into memory.'); });
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('kernel').textContent); setText('copy-status', 'Kernel copied.'); }
  catch { setText('copy-status', 'Clipboard unavailable. Select the code to copy it.'); }
});
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  setText('theme', theme === 'dark' ? 'Light theme' : 'Dark theme');
}
let savedTheme;
try { savedTheme = localStorage.getItem('gpu-lab-theme'); } catch { /* Storage is optional. */ }
applyTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('theme').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme); try { localStorage.setItem('gpu-lab-theme', theme); } catch { /* Storage is optional. */ }
});
render();
