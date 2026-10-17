// Copyright © 2026 Christopher Snow.
function integer(name, value, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
  }
}

/** A single-issue, round-robin teaching scheduler. All warps are resident at t=0.
 * Each warp runs two LD,MUL,ST sequences. A load at t becomes usable at t+latency.
 * MUL/ST each take one issue slot, without further waits. No cache/bandwidth model.
 */
export function scheduleWarps({ warps = 1, latency = 6 } = {}) {
  integer('warps', warps, 1, 8); integer('latency', latency, 1, 16);
  const program = ['LD', 'MUL', 'ST', 'LD', 'MUL', 'ST'];
  const state = Array.from({ length: warps }, () => ({ pc: 0, readyAt: 0 }));
  const trace = [];
  let next = 0;
  while (state.some(w => w.pc < program.length)) {
    const cycle = trace.length;
    const before = state.map(w => ({ ...w, status: w.pc === program.length ? 'done' : w.readyAt > cycle ? 'waiting' : 'ready' }));
    let selected = null;
    for (let delta = 0; delta < warps; delta++) {
      const id = (next + delta) % warps;
      if (before[id].status === 'ready') { selected = id; break; }
    }
    let instruction = 'idle';
    if (selected !== null) {
      const warp = state[selected];
      instruction = program[warp.pc++];
      warp.readyAt = cycle + (instruction === 'LD' ? latency : 1);
      next = (selected + 1) % warps;
    }
    trace.push({ cycle, selected, instruction, before });
  }
  const issued = trace.filter(t => t.selected !== null).length;
  return { trace, cycles: trace.length, issued, idle: trace.length - issued,
    issueUtilisation: issued / trace.length, program };
}

/** Explicit two-path instruction model, not a claim about compiler lowering. */
export function branchWarp({ pattern = 'alternating', activeLanes = 32, negativeOps = 3 } = {}) {
  if (!['positive', 'negative', 'halves', 'alternating', 'one-negative'].includes(pattern)) throw new RangeError('Unknown lane pattern.');
  integer('activeLanes', activeLanes, 1, 32);
  if (![1, 3].includes(negativeOps)) throw new RangeError('Choose one or three negative-path operations.');
  const lanes = Array.from({ length: 32 }, (_, id) => {
    const negative = pattern === 'negative' || pattern === 'halves' && id >= 16 || pattern === 'alternating' && id % 2 === 1 || pattern === 'one-negative' && id === 0;
    const input = negative ? -2 : 2;
    return { id, active: id < activeLanes, path: negative ? 'negative' : 'positive', input,
      output: id >= activeLanes ? null : negative ? negativeOps === 1 ? -input : -input * 2 + 1 : input * 2 };
  });
  const positive = lanes.filter(l => l.active && l.path === 'positive').map(l => l.id);
  const negative = lanes.filter(l => l.active && l.path === 'negative').map(l => l.id);
  const trace = [];
  if (positive.length) trace.push({ label: 'Positive: multiply by 2', mask: positive, path: 'positive' });
  if (negative.length) {
    for (const label of ['Negative: negate', 'Negative: multiply by 2', 'Negative: add 1'].slice(0, negativeOps)) {
      trace.push({ label, mask: negative, path: 'negative' });
    }
  }
  const usefulSlots = trace.reduce((total, t) => total + t.mask.length, 0);
  return { lanes, trace, instructions: trace.length, usefulSlots,
    utilisation: usefulSlots / (32 * trace.length), paths: Number(positive.length > 0) + Number(negative.length > 0) };
}

/** One shared-memory FP32 read per active lane, 32 banks, 4-byte bank width.
 * Multiple readers of the same word broadcast. Distinct words in a bank serialize.
 */
export function sharedBanks({ stride = 32, activeLanes = 32, broadcast = false } = {}) {
  integer('stride', stride, 1, 33); integer('activeLanes', activeLanes, 1, 32);
  if (typeof broadcast !== 'boolean') throw new TypeError('broadcast must be a boolean.');
  const lanes = Array.from({ length: activeLanes }, (_, id) => {
    const word = broadcast ? 0 : id * stride;
    return { id, word, address: word * 4, bank: word % 32 };
  });
  const banks = Array.from({ length: 32 }, (_, id) => {
    const requests = lanes.filter(l => l.bank === id);
    const words = [...new Set(requests.map(l => l.word))];
    return { id, words, requests };
  });
  const rounds = Math.max(...banks.map(b => b.words.length));
  const trace = Array.from({ length: rounds }, (_, round) => ({
    round, served: banks.flatMap(bank => {
      const word = bank.words[round];
      return word === undefined ? [] : [{ bank: bank.id, word,
        laneIds: bank.requests.filter(l => l.word === word).map(l => l.id) }];
    }),
  }));
  return { lanes, banks, trace, rounds, banksUsed: banks.filter(b => b.words.length).length,
    distinctWords: new Set(lanes.map(l => l.word)).size };
}
