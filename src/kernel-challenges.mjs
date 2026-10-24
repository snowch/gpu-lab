// Copyright © 2026 Christopher Snow.
import { simulateKernel, inputFor } from './kernel-model.mjs';
export const challenges = [
  { title: '1. Repair the missing output', task: 'scale', program: {index:'next', guard:true, operation:'multiply', blockSize:32},
    prompt: 'Before running the starter: how many outputs remain unwritten for length 8?',
    question: 'Why was the first output missing?', answers: ['The index starts at one, so nobody writes element zero.', 'The input is too short for the GPU.', 'Every block needs exactly 32 elements.'], correct:0,
    metric: r => r.output.filter(v => v === null).length, explanation: 'Follow global ID zero through the index expression.' },
  { title: '2. Diagnose the second block', task:'scale', program:{index:'local',guard:true,operation:'multiply',blockSize:32},
    prompt:'Before running the starter: how many outputs remain unwritten for length 35?',
    question:'Why can length 32 pass while length 35 fails?', answers:['The GPU cannot process 35 values.', 'Local IDs restart, so the second block targets the same outputs.', 'FP32 cannot represent the last input.'], correct:1,
    metric:r=>r.output.filter(v=>v===null).length, explanation:'Compare local and global IDs in block one.' },
  { title:'3. Protect the partial block',task:'scale',program:{index:'global',guard:false,operation:'multiply',blockSize:16},
    prompt:'Before running the starter: how many threads access outside length 35?',
    question:'What should the extra threads do?', answers:['Write the final element again.', 'Read zero from any invalid index.', 'Skip array access when their index reaches the vector length.'],correct:2,
    metric:r=>r.trace.filter(e=>e.op==='fault').length, explanation:'Three groups of 16 launch 48 threads; only 35 elements exist.' },
  { title:'4. Transfer: add two vectors',task:'vector-add',program:{index:'local',guard:false,operation:'add',blockSize:8},
    prompt:'Before running the starter: how many threads launch for length 35?',
    question:'Which rule makes this solution work across block sizes?', answers:['Use a unique global index, guard it, and add both input elements.', 'Use the local ID and add the scalar factor.', 'Choose a block as large as the vector.'],correct:0,
    metric:r=>r.threads, explanation:'Each valid global index must read x[i] and b[i] and write y[i] once.' },
];
export function predictionAnswer(challenge) {
  return challenge.metric(simulateKernel({...challenge.program,task:challenge.task},inputFor(challenge === challenges[0] ? 8 : 35)));
}
export function assessSolution(program, challenge, answer) {
  const lengths = challenge.task === 'vector-add' ? [1,7,17,35,65] : [8,32,35];
  const sizes = challenge.task === 'vector-add' ? [8,16,32,64] : [program.blockSize ?? 32];
  return { code: sizes.every(blockSize => lengths.every(n => simulateKernel({...program,task:challenge.task,blockSize},inputFor(n)).passed)), explanation: Number(answer) === challenge.correct && answer !== '' };
}
