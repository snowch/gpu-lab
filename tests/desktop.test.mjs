// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {desktopExamples,testedPythonExamples} from '../src/desktop-catalog.mjs';
import {pythonProgram} from '../src/desktop-program.mjs';
import {exportDesktop} from '../scripts/export-desktop.mjs';
import {runnableSource} from '../src/hello-model.mjs';
import {renderBookNav,chapters} from '../content/book.mjs';
import {renderDesktop} from '../content/desktop.mjs';

test('every chapter has a complete source-generated Python download and setup link',()=>{
  const examples=desktopExamples();
  assert.equal(new Set(examples.map(e=>e.filename)).size,examples.length);
  for(const chapter of chapters)assert.ok(examples.some(e=>e.slug===chapter.slug&&e.id==='opening'),chapter.slug);
  for(const example of examples){
    assert.match(example.source,/^import torch/);
    assert.match(pythonProgram(example.source),/choices=\["cpu", "cuda"\], default="cpu"/);
  }
  assert.throws(()=>pythonProgram('y = x * 2'),/imports and setup/);
  const nav=renderBookNav('desktop');
  assert.equal([...nav.matchAll(/aria-current="page"/g)].length,1);
  assert.match(nav,/Run on your desktop/);
});

test('download wrapper selects CUDA requests without silently moving explicit CPU arithmetic',()=>{
  const program=pythonProgram('import torch\nx = torch.tensor([1.], device="cuda")\ny = x.to("cuda") * 2');
  assert.match(program,/device=_lab_device/);assert.match(program,/x.to\(_lab_device\)/);
  assert.match(program,/torch.cuda.is_available/);
  const cpu=pythonProgram('import torch\nx = torch.tensor([1.])\nprint(x)');
  assert.match(cpu,/x = torch.tensor\(\[1.\]\)/);
  assert.ok(testedPythonExamples().length>100);
});

test('exported files exactly match displayed-source wrappers and guarded CUDA generators',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'gpu-desktop-'));
  try{
    const examples=await exportDesktop(dir);
    for(const example of examples)assert.equal(await readFile(join(dir,example.filename),'utf8'),pythonProgram(example.source));
    assert.equal(await readFile(join(dir,'hello.cu'),'utf8'),runnableSource(2));
    const manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
    assert.equal(manifest.length,examples.length);
    for(const name of ['kernel-scale.cu','kernel-vector-add.cu'])assert.match(await readFile(join(dir,name),'utf8'),/if \(i < n\)/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('CUDA suite covers safe workshop templates and independent references',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'gpu-cuda-cases-'));
  try{
    execFileSync('node',['scripts/generate-cuda-cases.mjs',dir]);
    assert.equal((await readdir(dir)).filter(f=>f.endsWith('.cu')).length,16);
    for(const op of ['multiply','add','vector-add'])for(const size of [8,16,32,64]){
      const name=`workshop-${op}-${size}`;
      const expected=Array.from({length:35},(_,i)=>{const x=(i%2?-1:1)*(i+1)/2;return op==='multiply'?x*2:op==='add'?x+2:x+(i%5)-2.25;});
      assert.deepEqual(JSON.parse(await readFile(join(dir,name+'.json'),'utf8')),expected);
      const source=await readFile(join(dir,name+'.cu'),'utf8');
      assert.match(source,/blockIdx.x \* blockDim.x \+ threadIdx.x/);assert.match(source,/if \(i < n\)/);
    }
  }finally{await rm(dir,{recursive:true,force:true});}
  const bank=await readFile('examples/shared-memory.cu','utf8');
  assert.match(bank,/BEGIN BANK KERNEL[\s\S]*__syncthreads\(\)[\s\S]*END BANK KERNEL/);
  assert.match(bank,/readColumn<<<1, 32>>>/);assert.match(bank,/std::isfinite/);
});

test('appendix covers setup, expected output, provenance and explicit unsupported paths',()=>{
  const html=renderDesktop(desktopExamples(),{revision:'test-revision',image:'test-image'});
  for(const text of ['test-revision','test-image','PTX_SIM_MODE_FUNC=1','SM7_QV100','compute_70','PASS: verified 5','--network none','--device cpu','Tensor-core/WMMA','not a runnable language model'])assert.ok(html.includes(text),text);
  assert.equal([...html.matchAll(/<th scope="row">/g)].length,13);
});
