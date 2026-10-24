import {cudaProgram} from './cuda-program.mjs';
// Copyright © 2026 Christopher Snow.
export const STARTER = Object.freeze({ index: 'next', guard: true, operation: 'multiply' });
export const CASE_LENGTHS = [8, 32, 35];
export function blockSize(program) { return program.blockSize ?? 32; }
export function secondInput(length) { return Float32Array.from({ length }, (_, i) => (i % 5) - 2.25); }
export function validateProgram(program) {
  if (!program || !['global', 'next', 'local'].includes(program.index) || typeof program.guard !== 'boolean' || !['multiply', 'add', 'vector-add'].includes(program.operation)) throw new TypeError('Unsupported kernel expression');
  if (![8, 16, 32, 64].includes(blockSize(program)) || !['scale', 'vector-add'].includes(program.task ?? 'scale')) throw new TypeError('Unsupported launch or task');
  return program;
}
export function inputFor(length) {
  if (!Number.isInteger(length) || length < 0 || length > 256) throw new RangeError('Expected 0–256 elements');
  return Float32Array.from({ length }, (_, i) => (i % 2 ? -1 : 1) * (i + 1) / 2);
}
export function reference(input, program = {}) { const b = secondInput(input.length); return Array.from(input, (value, i) => Math.fround(program.task === 'vector-add' ? value + b[i] : value * 2)); }
export function checkOutput(input, output, program = {}) {
  const expected = reference(input, program);
  const failures = expected.flatMap((value, index) => output[index] === value ? [] : [{ index, expected: value, actual: output[index] ?? null }]);
  return { passed: output.length === expected.length && !failures.length, failures, expected };
}
export function indexExpression(program) { return ({ global: 'blockIdx.x * blockDim.x + threadIdx.x', next: 'blockIdx.x * blockDim.x + threadIdx.x + 1', local: 'threadIdx.x' })[validateProgram(program).index]; }
export function kernelBody(program) {
  validateProgram(program);
  const statement = program.operation === 'vector-add' ? 'y[i] = x[i] + b[i];' : `y[i] = x[i] ${program.operation === 'multiply' ? '*' : '+'} factor;`;
  return `__global__ void runKernel(const float* x, float* y, const float* b, int n, float factor) {\n  int i = ${indexExpression(program)};\n${program.guard ? `  if (i < n) {\n    ${statement}\n  }` : `  ${statement}`}\n}`;
}
export function cudaSource(program) {
  const input = inputFor(35), result = simulateKernel(program, input);
  if (!result.safe) throw new Error('Repair the invalid accesses or duplicate writes before downloading a CUDA program for 35 elements.');
  return cudaProgram({kernel:kernelBody(program), input:Array.from(input), second:Array.from(secondInput(input.length)), size:blockSize(program)});
}
export function simulateKernel(program, input) {
  validateProgram(program);
  if (input.length > 256 || Array.from(input).some(value => !Number.isFinite(value))) throw new RangeError('Expected at most 256 finite inputs');
  const values = Array.from(input, Math.fround), output = Array(values.length).fill(null), trace = [], hazards = [], written = new Set();
  const size = blockSize(program), b = Array.from(secondInput(values.length));
  const groups = Math.ceil(values.length / size);
  for (let global = 0; global < groups * size; global++) {
    const local = global % size, group = Math.floor(global / size);
    const i = program.index === 'global' ? global : program.index === 'next' ? global + 1 : local;
    const event = (op, extra = {}) => trace.push({ global, local, group, i, op, ...extra });
    event('index');
    if (program.guard) {
      event('guard', { allowed: i < values.length });
      if (i >= values.length) continue;
    }
    if (i >= values.length) {
      const message = `Thread ${global} would read x[${i}] outside ${values.length} elements.`;
      hazards.push(message); event('fault', { message }); continue;
    }
    const loaded = values[i];
    event('load', { value: loaded, byteOffset: i * 4 });
    if (program.operation === 'vector-add') event('load-b', { value: b[i], byteOffset: i * 4 });
    const value = Math.fround(program.operation === 'vector-add' ? loaded + b[i] : program.operation === 'multiply' ? loaded * 2 : loaded + 2);
    event('arithmetic', { loaded, operand: program.operation === 'vector-add' ? b[i] : 2, value });
    if (written.has(i)) {
      const message = `Threads from different blocks would write y[${i}].`;
      hazards.push(message); event('fault', { message }); continue;
    }
    written.add(i); output[i] = value;
    event('store', { value, byteOffset: i * 4 });
  }
  const checked = checkOutput(values, output, program);
  return { input: values, secondInput: b, blockSize: size, output, trace, hazards, safe: !hazards.length, groups, threads: groups * size, ...checked, passed: checked.passed && !hazards.length };
}
export function snapshot(result, position) {
  const output = Array(result.input.length).fill(null);
  for (const event of result.trace.slice(0, position + 1)) if (event.op === 'store') output[event.i] = event.value;
  return output;
}
