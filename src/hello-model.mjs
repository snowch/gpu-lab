// Copyright © 2026 Christopher Snow.
export const steps = [
  {title:'Hello, GPU', description:'Write one number, then read it back.', instruction:'Run this program. Then change 42.0 to another number and run it again.',
    before:'@compute @workgroup_size(1)\nfn main() {', body:'output[0] = 42.0;', after:'}', size:1, length:1,
    explain:'This small GPU function is a kernel. It writes a number into output[0], the first element of a buffer. A buffer is an array of values. The browser reads that value back and displays it below; the shader does not print to a terminal.'},
  {title:'Give each invocation an ID', description:'Run the same function four times.', instruction:'Run the program. Each invocation writes its own ID into its own output element.',
    before:'@compute @workgroup_size(4)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {', body:'output[id.x] = f32(id.x);', after:'}', size:4,length:4,
    explain:'An invocation is one execution of the function. Here four invocations form one workgroup. Their IDs are 0, 1, 2 and 3. id.x is the ID along the first dimension; f32 converts it to a floating-point number. Workgroup size is a software choice, not a hardware warp size.'},
  {title:'Double an input', description:'Read one input value and write one result.', instruction:'Input is [1, 2, 3, 4]. Run to double every value. Then change 2.0 to 3.0 and run again.',
    before:'@compute @workgroup_size(4)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {',body:'output[id.x] = input[id.x] * 2.0;',after:'}',size:4,length:4,
    explain:'Each invocation reads input[id.x] and writes output[id.x]. Together they perform elementwise scaling, the same kind of operation you can express on a tensor.'},
  {title:'Handle a partial workgroup',description:'Five inputs need two workgroups of four.',instruction:'Input is [1, 2, 3, 4, 5]. Run the guarded program. Then change 5u to 4u and see which output is missed. Restore 5u afterwards.',
    before:'@compute @workgroup_size(4)\nfn main(@builtin(global_invocation_id) id: vec3<u32>) {',body:'if (id.x < 5u) {\n  output[id.x] = input[id.x] * 2.0;\n}',after:'}',size:4,length:5,
    explain:'We launch eight invocations for five elements. IDs 5, 6 and 7 must skip the arrays. The condition keeps each access inside the buffer. The u in 5u means an unsigned integer.'},
];
const number = '(-?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
export function analyse(stepIndex, body) {
  const step=steps[stepIndex]; if (!step) throw new Error('Unknown lesson.');
  const compact=body.replace(/\s+/g,'');
  const patterns=[
    new RegExp('^output\\[0\\]='+number+';$'),
    /^output\[id\.x\]=f32\(id\.x\);$/,
    new RegExp('^output\\[id\\.x\\]=input\\[id\\.x\\]\\*'+number+';$'),
    /^if\(id\.x<(\d+)u\)\{output\[id\.x\]=input\[id\.x\]\*2\.0;\}$/,
  ];
  const match=compact.match(patterns[stepIndex]);
  if (!match) throw new Error(stepIndex===1 ? 'Keep the ID-writing statement for this step. Restore the example to continue.' : stepIndex===3 ? 'For this step, change only the whole number before u in the bounds check.' : 'For this step, change only the number in the highlighted line.');
  const value=Number(match[1]??0);
  if (!Number.isFinite(Math.fround(value))) throw new Error('Use a finite FP32 number.');
  if(stepIndex===3 && value>step.length) throw new Error('That guard allows an access past the five-element buffer. Use 5u or less.');
  const input=Array.from({length:step.length},(_,i)=>i+1);
  const launched=Math.ceil(step.length/step.size)*step.size;
  const output=Array(step.length).fill(null);
  for(let id=0;id<launched;id++){
    if(stepIndex===3 && id>=value) continue;
    output[id]=stepIndex===0?Math.fround(value):stepIndex===1?id:Math.fround(input[id]*(stepIndex===3?2:value));
  }
  return {input,output,launched,skipped:stepIndex===3?launched-value:0};
}
export function shaderSource(stepIndex, body) {
  const step=steps[stepIndex];
  return '@group(0) @binding(0) var<storage, read_write> output: array<f32>;\n'+
    (stepIndex>=2?'@group(0) @binding(1) var<storage, read> input: array<f32>;\n':'')+
    '\n'+step.before+'\n'+body+'\n'+step.after;
}
