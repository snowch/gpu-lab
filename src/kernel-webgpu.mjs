// Copyright © 2026 Christopher Snow.
import { simulateKernel, wgslSource, checkOutput, WORKGROUP_SIZE } from './kernel-model.mjs';

// No fallback computes WebGPU output on the CPU. Unsupported adapters are reported.
export async function runWebGPU(program, inputs) {
  if (!globalThis.navigator?.gpu) throw new Error('WebGPU is unavailable in this browser. The browser model still works.');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('No WebGPU adapter is available. The browser model still works.');
  const device = await adapter.requestDevice();
  const info = adapter.info;
  const adapterDescription = info?.description || info?.device || 'browser-selected adapter';
  const software = info?.isFallbackAdapter ?? adapter.isFallbackAdapter ?? null;
  const results = [];
  device.pushErrorScope('validation');
  try {
    const source = wgslSource(program);
    const module = device.createShaderModule({ code: source });
    const compilation = await module.getCompilationInfo();
    const errors = compilation.messages.filter(message => message.type === 'error');
    if (errors.length) throw new Error(errors.map(message => message.message).join('\n'));
    const pipeline = await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'scale' } });
    for (const input of inputs) {
      const model = simulateKernel(program, input);
      if (!model.safe) {
        results.push({ blocked: true, passed: false, message: `Not dispatched: ${model.hazards[0]}` });
        continue;
      }
      if (!input.length) { results.push({ output: [], ...checkOutput(input, []) }); continue; }
      const size = input.length * 4;
      const buffers = [];
      const create = (length, usage) => { const buffer = device.createBuffer({ size: length, usage }); buffers.push(buffer); return buffer; };
      try {
        const x = create(size, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
        const y = create(size, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
        const params = create(16, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
        const readback = create(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
        device.queue.writeBuffer(x, 0, input);
        // NaN marks an output the kernel never wrote; valid test outputs are finite.
        device.queue.writeBuffer(y, 0, new Float32Array(input.length).fill(NaN));
        const parameters = new ArrayBuffer(16), view = new DataView(parameters);
        view.setUint32(0, input.length, true); view.setFloat32(4, 2, true);
        device.queue.writeBuffer(params, 0, parameters);
        const bind = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [x, y, params].map((buffer, binding) => ({ binding, resource: { buffer } })) });
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline); pass.setBindGroup(0, bind);
        pass.dispatchWorkgroups(Math.ceil(input.length / WORKGROUP_SIZE)); pass.end();
        encoder.copyBufferToBuffer(y, 0, readback, 0, size);
        device.queue.submit([encoder.finish()]);
        await readback.mapAsync(GPUMapMode.READ);
        const output = Array.from(new Float32Array(readback.getMappedRange()));
        readback.unmap();
        results.push({ output, ...checkOutput(input, output) });
      } finally { buffers.forEach(buffer => buffer.destroy()); }
    }
    const validation = await device.popErrorScope();
    if (validation) throw new Error(validation.message);
    return { results, source, adapterDescription, software };
  } finally { device.destroy(); }
}
