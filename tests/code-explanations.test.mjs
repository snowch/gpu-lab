// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {testedPythonExamples} from '../src/desktop-catalog.mjs';
import {kernelSource} from '../src/hello-model.mjs';
import {readingOpening} from '../src/book-code.mjs';
import {kernelBody} from '../src/kernel-model.mjs';
import {codeExplanations} from '../src/code-explanation-data.mjs';
import {annotatedSource,explainHTML} from '../src/code-explanations-view.mjs';
const decode=text=>text.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&amp;','&');
test('all displayed Python variants have ordered explanations tied to existing source lines',()=>{
 for(const {source,slug,id} of testedPythonExamples()){
  const entries=codeExplanations(source);
  assert.ok(entries.length>=2,`${slug}/${id}`);
  let previous=-1;
  for(const e of entries){
   assert.ok(source.includes(e.fragment),e.fragment);
   const at=source.indexOf(e.fragment);assert.ok(at>=previous);previous=at;
   assert.ok(e.lines.every(i=>i>=0&&i<source.split('\n').length));
   assert.ok(e.lines.some(i=>source.split('\n')[i].includes(e.fragment.split('\n')[0])));
  }
  assert.equal(decode(annotatedSource(source).replace(/<[^>]+>/g,'')),source);
 }
});
test('walkthroughs preserve code attributes, source and static explanations without answering reference questions',()=>{
 const source=kernelSource(2),html=explainHTML(`<pre id="source"><code id="kernel">${source.replaceAll('<','&lt;').replaceAll('>','&gt;')}</code></pre>`);
 assert.match(html,/<pre id="source" data-explained-code>/);
 assert.match(html,/<code id="kernel">/);
 assert.match(html,/What each part does/);
 assert.match(html,/data-code-explanation[^>]+disabled/);
 assert.equal(explainHTML('<pre class="reference-code"><code>import torch\nx = torch.tensor([1.], device="cuda")</code></pre>'),'<pre class="reference-code"><code>import torch\nx = torch.tensor([1.], device="cuda")</code></pre>');
 assert.equal(explainHTML('<pre>y = x * 2</pre>'),'<pre>y = x * 2</pre>');
 const question='<pre data-code-question><code>transposed = x.T\ny = transposed[0, :] * 2</code></pre>';
 assert.equal(explainHTML(question),question);
 const local='<pre data-code-explained-locally><code>if (i &lt; n) { output[i] = input[i] * 2.0f; }</code></pre>';
 assert.equal(explainHTML(local),local);
});
test('repair explanations follow the actual guard and arithmetic instead of asserting a correct kernel',()=>{
 for(const index of ['global','local','next'])for(const guard of [true,false])for(const operation of ['multiply','add','vector-add']){
  const source=kernelBody({index,guard,operation});
  const entries=codeExplanations(source);
  assert.equal(entries.some(e=>e.fragment==='if (i < n)'),guard);
  const indexEntry=entries.find(e=>e.fragment.startsWith('int i ='));
  assert.ok(indexEntry);
  for(const term of ['blockIdx.x','blockDim.x','threadIdx.x']){
   assert.equal(indexEntry.meaning.includes(term),indexEntry.fragment.includes(term),`${index}: ${term}`);
  }
  assert.equal(indexEntry.fragment.includes('+ 1;'),index==='next');
  assert.doesNotMatch(entries.map(e=>e.meaning).join(' '),/correct index|unique index/);
 }
});

test('CUDA arithmetic explanations identify the per-thread FP32 data flow',()=>{
 const literal=codeExplanations(kernelSource(2)).find(e=>e.fragment.startsWith('output[i] ='));
 assert.match(literal.fragment,/2\.0f/);
 assert.match(literal.meaning,/FP32/);
 assert.match(literal.meaning,/thread/);
 for(const operation of ['multiply','add','vector-add']){
  const expression=codeExplanations(kernelBody({index:'global',guard:true,operation})).find(e=>e.fragment.startsWith('y[i] ='));
  assert.ok(expression);
  assert.match(expression.meaning,/FP32/);
  assert.match(expression.meaning,/thread/);
 }
});
test('formatted tensor openings explain the arange input range without changing copyable source',()=>{
 for(const mode of ['selection','layout','requests']){
  const source=readingOpening(mode);
  const range=codeExplanations(source).find(e=>e.fragment.startsWith('torch.arange('));
  assert.ok(range,mode);
  assert.ok(source.includes(range.fragment));
  assert.match(range.meaning,/1\.0 through 25\.0/);
  assert.match(range.meaning,/endpoint 26 is excluded/);
  assert.equal(decode(annotatedSource(source).replace(/<[^>]+>/g,'')),source);
 }
});
