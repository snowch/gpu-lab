// Copyright © 2026 Christopher Snow.
import { compareColumnPlans } from './packing-plan.mjs';

const $ = id => document.getElementById(id);
const form = $('packing-prediction');
const completed = new Set();
let predictedCorrect = false;
let comparison = null;
const planLabel = plan => plan === 'direct' ? 'A (read the strided view)' : 'B (pack once)';
const explanationFor = result => result.best === 'direct' ? 'overhead' : 'reuse';

function reset() {
  predictedCorrect = false;
  comparison = null;
  form.querySelectorAll('input[name="packing-plan"]').forEach(radio => { radio.checked = false; });
  $('packing-results').hidden = true;
  $('packing-explanation').value = '';
  $('packing-explanation-feedback').textContent = '';
  $('packing-feedback').textContent = 'Predict first. The two plans must produce exactly the same column values.';
}

function show(result) {
  comparison = result;
  $('packing-results').hidden = false;
  $('packing-counts').textContent =
    `A: ${result.reads} × ${result.directPerRead} = ${result.directTotal} sector touches. ` +
    `B: ${result.packRead} to read the column + ${result.packWrite} to write its packed copy + ` +
    `${result.reads} × ${result.packedPerRead} to read the copy = ${result.packedTotal}.`;
  $('packing-direct-total').textContent = String(result.directTotal);
  $('packing-packed-total').textContent = String(result.packedTotal);
  const maximum = Math.max(result.directTotal, result.packedTotal);
  $('packing-direct-bar').style.width = `${100 * result.directTotal / maximum}%`;
  $('packing-packed-bar').style.width = `${100 * result.packedTotal / maximum}%`;
  $('packing-winner').textContent = result.best === 'tie'
    ? 'Both plans touch the same number of model sectors.'
    : `${planLabel(result.best)} touches fewer model sectors for ${result.reads} ${result.reads === 1 ? 'read' : 'reads'}.`;
  $('packing-explanation').value = '';
  $('packing-explanation-feedback').textContent = '';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const choice = form.querySelector('input[name="packing-plan"]:checked').value;
  const result = compareColumnPlans(Number($('packing-reads').value));
  predictedCorrect = choice === result.best;
  show(result);
  $('packing-feedback').textContent = predictedCorrect
    ? `Correct: ${planLabel(choice)}. Explain why it wins below.`
    : `You chose ${planLabel(choice)}; ${planLabel(result.best)} touches fewer sectors in this model. Compare the work counted for each plan, then try again.`;
});

$('packing-reads').addEventListener('change', reset);
$('packing-show').addEventListener('click', () => {
  predictedCorrect = false;
  show(compareColumnPlans(Number($('packing-reads').value)));
  $('packing-feedback').textContent = 'Model counts shown without a prediction. Inspect the copy cost and each later read.';
});
$('packing-check-explanation').addEventListener('click', () => {
  if (!comparison) return;
  const answer = $('packing-explanation').value;
  if (!answer) {
    $('packing-explanation-feedback').textContent = 'Choose an explanation first.';
    return;
  }
  if (answer !== explanationFor(comparison)) {
    $('packing-explanation-feedback').textContent = 'Not quite. Consider whether an initial copy or repeated packed reads dominate.';
    return;
  }
  if (!predictedCorrect) {
    $('packing-explanation-feedback').textContent =
      'That explanation fits. To complete the challenge, select the plan before inspecting the counts and check it.';
    return;
  }
  completed.add(comparison.reads);
  const mastered = completed.has(1) && completed.has(4);
  $('packing-explanation-feedback').textContent = mastered
    ? 'Both transfer cases passed: you chose and explained the right plan for one read and four reads. The values were unchanged.'
    : `Correct explanation for ${comparison.reads} ${comparison.reads === 1 ? 'read' : 'reads'}. ` +
      'Now test the other case: one read versus four reads. Which changes your decision?';
});
reset();
