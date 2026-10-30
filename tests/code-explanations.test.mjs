// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {testedPythonExamples} from '../src/desktop-catalog.mjs';
import {kernelSource} from '../src/hello-model.mjs';
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
});
test('repair explanations follow the actual guard and arithmetic instead of asserting a correct kernel',()=>{
 for(const guard of [true,false])for(const operation of ['multiply','add','vector-add']){
  const source=kernelBody({index:'next',guard,operation});
  const entries=codeExplanations(source);
  assert.equal(entries.some(e=>e.fragment==='if (i < n)'),guard);
  assert.ok(entries.some(e=>e.fragment.includes('+ 1;')));
  assert.doesNotMatch(entries.map(e=>e.meaning).join(' '),/correct index|unique index/);
 }
});
