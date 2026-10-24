// Copyright © 2026 Christopher Snow.
import {steps,analyse,shaderSource} from './hello-model.mjs';
export async function execute(stepIndex,body) {
  const model=analyse(stepIndex,body);
  const adapter=await globalThis.navigator?.gpu?.requestAdapter();
  if(!adapter) return {...model,backend:'Browser model — WebGPU is unavailable here; these values were calculated on the CPU.'};
  const device=await adapter.requestDevice(), buffers=[];
  try {
    device.pushErrorScope('validation');
    const module=device.createShaderModule({code:shaderSource(stepIndex,body)});
    const messages=await module.getCompilationInfo();
    const errors=messages.messages.filter(m=>m.type==='error');
    if(errors.length) throw new Error(errors.map(m=>m.message).join('\n'));
    const pipeline=await device.createComputePipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[device.createBindGroupLayout({entries:[
      {binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:'storage'}},
      ...(stepIndex>=2?[{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:'read-only-storage'}}]:[])
    ]})]}),compute:{module,entryPoint:'main'}});
    const create=(size,usage)=>{const b=device.createBuffer({size,usage});buffers.push(b);return b;};
    const bytes=model.output.length*4;
    const output=create(bytes,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST);
    device.queue.writeBuffer(output,0,new Float32Array(model.output.length).fill(NaN));
    const entries=[{binding:0,resource:{buffer:output}}];
    if(stepIndex>=2) {
      const input=create(bytes,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
      device.queue.writeBuffer(input,0,new Float32Array(model.input));
      entries.push({binding:1,resource:{buffer:input}});
    }
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries});
    const readback=create(bytes,GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ);
    const encoder=device.createCommandEncoder(), pass=encoder.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,bind);
    pass.dispatchWorkgroups(Math.ceil(steps[stepIndex].length/steps[stepIndex].size));pass.end();
    encoder.copyBufferToBuffer(output,0,readback,0,bytes);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const values=Array.from(new Float32Array(readback.getMappedRange()),v=>Number.isNaN(v)?null:v);
    readback.unmap();
    const error=await device.popErrorScope();if(error) throw new Error(error.message);
    const fallback=adapter.info?.isFallbackAdapter??adapter.isFallbackAdapter;
    return {...model,output:values,backend:fallback===true?'WebGPU — compiled shader, executed on a software/fallback adapter.':'WebGPU — compiled shader; output read back from the browser-selected adapter.'};
  } finally {buffers.forEach(b=>b.destroy());device.destroy();}
}
