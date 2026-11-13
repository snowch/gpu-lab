import {sectionHeading} from './section-cues.mjs';
import {roundedTensorValue as tensorValue} from './value-format.mjs';
// Copyright © 2026 Christopher Snow.
import {recordingLink} from './recording-view.mjs';
import {tiledMatmul, precisionMatmul} from './ai-models.mjs';
import {escape, fmt, metrics, table} from './continuation-ui.mjs';

const matmulDefaults = {n:8, tile:2, sharedBudget:512, registers:16};
const precisionDefaults = {format:'fp16', pattern:'cancellation'};
export const matrixCode = ({n=8}={}) => `import torch

n = ${n}
a = torch.tensor(
    [[(r + k) % 5 - 2 for k in range(n)]
     for r in range(n)],
    dtype=torch.float32, device="cuda",
)
b = torch.tensor(
    [[(k + c) % 3 - 1 for c in range(n)]
     for k in range(n)],
    dtype=torch.float32, device="cuda",
)
c = a @ b
print(c.cpu())`;

const patternCode = {
  cancellation:'[1.0003 if k < 8 else -1.0 for k in range(16)]',
  small:'[1e-8 for k in range(16)]',
  exact:'[1.0 if k % 2 == 0 else -0.5 for k in range(16)]',
};
const dtype = {fp32:'torch.float32', fp16:'torch.float16', bf16:'torch.bfloat16'};
const precisionCode = ({format='fp16', pattern='cancellation'}={}) => `import torch

row = torch.tensor(
    ${patternCode[pattern]},
    dtype=torch.float32, device="cuda",
)
a = row.repeat(16, 1).to(${dtype[format]})
b = torch.ones((16, 16), dtype=${dtype[format]}, device="cuda")
c = a @ b
print(c[0, 0].float().item())`;

// CPU PyTorch makes this a runnable arithmetic explanation without selecting a GPU kernel.
const accumulationCode = ({format='fp16', pattern='cancellation'}={}) => `import torch

row = torch.tensor(
    ${patternCode[pattern]},
    dtype=torch.float32,
)
converted = row.to(${dtype[format]}).float()
total = torch.zeros((), dtype=torch.float32)
reference = torch.zeros((), dtype=torch.float32)
for k in range(16):
    total = total + converted[k] * 1.0
    reference = reference + row[k] * 1.0
print("Converted-input sum:", total.item())
print("Original-input sum:", reference.item())`;

const formatControl = {key:'format',label:'Input number format',options:[['fp16','FP16'],['bf16','BF16'],['fp32','FP32 (keep original inputs)']]};
const patternControl = {key:'pattern',label:'Input row',options:[['cancellation','Eight near-one values, then eight −1.0 values'],['small','Sixteen small positive values'],['exact','Alternating 1.0 and −0.5']]};
const basicMatmul = tiledMatmul(matmulDefaults);
const dotExample = tiledMatmul({...matmulDefaults,n:4,tile:1});
const basicPrecision = precisionMatmul(precisionDefaults);
const list = values => values.map(tensorValue).join(', ');

export const chapters = [
  {
    slug:'matmul',number:10,title:'How can matrix multiplication reuse its inputs?',
    lead:'Multiply matching entries of a row and a column, add their products, then reuse input values across several outputs.',
    source:matrixCode(matmulDefaults),
    openingHTML:`<p>In a neural-network layer, matrix multiplication combines many inputs with learned weights. Here <code>@</code> multiplies two ${basicMatmul.n} × ${basicMatmul.n} matrices. It produces a new ${basicMatmul.output.length} × ${basicMatmul.output[0].length} matrix, C.</p><p>A’s first row is [${escape(list(basicMatmul.a[0]))}]; B’s first column is [${escape(list(basicMatmul.b.map(row=>row[0])))}]. You choose the matrices and operation. PyTorch selects the implementation, allocates the result and launches the GPU work; this code leaves the grouping of GPU work to that implementation.</p>`,
    sections:[
      {
        id:'matrix-dot',title:'Build one output from a row and a column',
        terms:[['K index','The position shared by a row of A and a column of B; it identifies which pair to multiply.']],
        body:`<p>For output <code>C[r,c]</code>, take row r of A and column c of B. Multiply <code>A[r,k] × B[k,c]</code> for every k, then add the products. Both inputs here are 4 × 4, a smaller instance of the opening example.</p><p>For these initial inputs, A’s first row is [${escape(list(dotExample.a[0]))}] and B’s first column is [${escape(list(dotExample.b.map(row=>row[0])))}]. Use these values to predict C[0,0] before running.</p><p>The trace begins at C[0,0]. In this first algorithm each thread computes one output; each step adds one product. After all four K positions, that output is complete. This trace stays with C[0,0]. After Run, open “Inspect the complete inputs and final C” to see the whole matrix. “Next step” is an inspection order, not GPU scheduling.</p><p class="muted">Model assumptions: these small whole-valued FP32 inputs produce exact products and sums. Each output separately loads its inputs; caches, concurrent execution and timings are absent.</p>`,
        task:'Predict C[0,0] by multiplying row 0 of A by column 0 of B. Run, then step through the first four products. Change matrix dimension to 8 and explain why each output now needs more products.',
        experiment:{model:'matmul',defaults:{...matmulDefaults,n:4,tile:1},focus:'dot',traceCount:result=>result.n,controls:[{key:'n',label:'Matrix dimension',options:[[4,'4 × 4'],[8,'8 × 8']]}],code:matrixCode},
        after:'<p>Other outputs use different row–column pairs, but many pairs contain the same A or B value. The next experiment keeps these inputs and results while changing how often inputs are loaded.</p>',
      },
      {
        id:'matrix-reuse',title:'Load a tile, use it for several outputs',
        terms:[['Tile','A small rectangular part of a matrix, computed or loaded as a group.'],['K phase','One group of K positions whose products are added to the current output tile.']],
        body:`<p>Let N be the number of rows and columns in each square matrix. Choose a square output tile of width T. Our teaching algorithm assigns one block of T × T threads to each output tile, with one output per thread. In one K phase, load a T × T tile of A and a T × T tile of B. For T greater than 1, the block keeps these in shared memory. T = 1 loads directly for its single output without a shared tile. Each loaded A value contributes to T output columns; each loaded B value contributes to T output rows.</p><p>The trace follows the first output tile. Each thread starts its partial sum at zero and adds products from successive K phases. After Run, open “Compare the complete final C” to see the whole matrix. Input tiles can be replaced only after their users finish; a real shared-memory implementation must establish that ordering between threads. Here T = 1 is the separate-output algorithm from the first experiment.</p><p class="muted">Model assumptions: each input tile is loaded once per output tile and K phase. The count covers explicit input loads, excludes caches, and is not a count of physical memory transactions or elapsed time. The displayed PyTorch code changes with matrix dimension; tile selection changes only the browser algorithm because ordinary <code>@</code> leaves implementation selection to PyTorch.</p>`,
        task:'For the fixed 4 × 4 inputs, predict whether tile width 2 changes C or the input-load count. Run and follow the first two K phases. Change only tile width to 1, then 4. Compare final C and explain which outputs share each loaded input.',
        experiment:{model:'matmul',defaults:{...matmulDefaults,n:4},focus:'reuse',traceCount:result=>result.n/result.tile,controls:[{key:'tile',label:'Tile width in the browser algorithm',options:[[1,'1 · separate outputs'],[2,'2 · share across two outputs'],[4,'4 · share across four outputs']]}],code:matrixCode},
        after:'<p>For each output tile, a phase loads 2T² inputs. There are (N/T)² output tiles and N/T phases, giving 2N³/T input loads. The multiplication still computes the same N² dot products. This is a reuse argument; it does not establish how much faster a real kernel will run.</p>',
      },
    ],
    transfer:{prompt:'For the same 8 × 8 inputs, compare tile widths 1 and 4. Predict how many input values each algorithm explicitly loads and whether C changes. Explain the sharing before revealing the comparison.',answer:(()=>{const one=tiledMatmul({...matmulDefaults,tile:1}),four=tiledMatmul({...matmulDefaults,tile:4});return `Tile width 1 loads ${one.inputLoads} input values; tile width 4 loads ${four.inputLoads}. Each loaded input can contribute to ${four.tile} outputs in a phase. Both produce the same C, including C[0,0] = ${tensorValue(four.output[0][0])}. This comparison assumes no cache reuse and predicts no elapsed time.`;})()},
    optionalHTML:'<details><summary>Optional: why not make every tile larger?</summary><p>Shared-memory tiles and per-thread registers consume finite storage. A register is storage private to a thread. A larger tile can reuse more inputs while consuming more storage per block, leaving room for fewer resident blocks (blocks whose resources are currently allocated on an SM). In a CUDA implementation, the programmer declares the shared workspace; register use is determined when the kernel is compiled. Actual choices also depend on hardware, layouts and the implementation. The focused experiments above count reuse; they do not predict a resource optimum or a speedup.</p></details>',
    closingHTML:`<section class="book-section chapter-resource" data-section-kind="recap" id="matmul-recording-link">${sectionHeading('recap','Watch input tiles feed several outputs')}<p>Optional recap: <a id="matmul-watch" data-reading-link href="matmul-video.html?from=matmul">watch how matrix tiles reuse inputs</a>. Follow one input into several outputs, retain the partial sums across K phases, then explain the input-load counts. The recording illustrates this teaching algorithm; it does not show the implementation PyTorch selected or measure GPU speed.</p></section>`,
  },
  {
    closingHTML:recordingLink('tensor-cores','follow input rounding into FP32 sums','Compare conversion, cancellation and small-value range before applying an exact-input case. The recording uses sequential arithmetic to explain accuracy; it does not identify tensor-core instructions or GPU timings.'),
    slug:'tensor-cores',number:11,title:'What changes when matrix inputs use fewer bits?',
    lead:'Convert FP32 inputs to FP16 or BF16, compare the resulting sums, then connect matrix operations to tensor cores.',
    source:precisionCode(precisionDefaults),
    openingHTML:`<p>A matrix multiplication in a neural network can store inputs in a smaller number format. <code>torch.float16</code> stores each input in two bytes instead of FP32’s four. The conversion with <code>.to(...)</code> may round a value before <code>@</code> uses it. Converting the result to FP32 for printing cannot restore discarded input information.</p><p>All rows of A are identical and all entries of B are one. Every output is therefore the same row–column dot product. The row starts with eight values written as 1.0003 and ends with eight −1.0 values. They first enter FP32 storage, then convert to FP16. You choose the inputs and format; PyTorch chooses the matrix implementation. The browser uses a declared arithmetic order to isolate conversion and accumulation.</p>`,
    sections:[
      {
        id:'precision-conversion',title:'Compare values before and after conversion',

        body:`<p>Both FP16 and BF16 use two bytes per input. FP16 distinguishes finer differences between nearby values; BF16 preserves a wider range of magnitudes, similar to FP32. Keep the near-one inputs fixed and compare the converted values.</p><p>Positions 0–7 contain the near-one input and 8–15 contain −1.0. Stepping selects an input position. B’s corresponding input is exactly one in every supported format.</p><p class="muted">Model assumptions: inputs round to the nearest representable value. The CPU trace isolates arithmetic and does not execute tensor cores. Detailed rounding rules are available after the experiments.</p>`,
        task:'Predict which of the 16 row values change in FP16. Run and compare original and converted values. Change only the input format to BF16, then FP32; explain why −1.0 behaves differently from the near-one value.',
        experiment:{model:'tensor-cores',defaults:{...precisionDefaults},focus:'conversion',controls:[formatControl],code:precisionCode},
        after:'<p>The input conversion happens before accumulation. Once a converted input has become exactly 1.0, no later addition can recover its original small excess.</p>',
      },
      {
        id:'precision-accumulation',title:'Add products into an FP32 running sum',
        initialPrompt:'Run to compare the converted-input and original-input sums.',
        terms:[['FP32 accumulator','A running sum stored and rounded in FP32 after each addition in this model.']],
        body:`<p>Each product here is the converted A input times one. Compare two FP32 running sums: one receives converted inputs; the reference receives original FP32 inputs. In the near-one pattern, eight negative ones cancel most of the positive sum. A small discarded input difference can then dominate the final answer.</p><p>Next try the small positive inputs to test range. Finally use alternating 1.0 and −0.5 to test values represented exactly in all three formats. The “Inspect the PyTorch example for these settings” disclosure contains an explicit CPU loop matching the model’s chosen order; it is an arithmetic explanation, not a GPU matrix implementation.</p><p class="muted">Model assumptions: each addition rounds to FP32 and K advances from 0 to 15. All A rows are identical and all B entries are one, so this one trace explains every C entry. Actual matrix kernels may use a different accumulation order or numeric rules.</p>`,
        task:'Run the near-one pattern and inspect K = 7 and K = 15 to compare sums before and after cancellation. Then choose the small positive inputs and open “Inspect the PyTorch example for these settings” to find their magnitude. Predict whether FP16 and BF16 keep them non-zero, then run and compare. Finally, compare the alternating 1.0 and −0.5 inputs across all three formats.',
        experiment:{model:'tensor-cores',defaults:{...precisionDefaults},focus:'accumulation',controls:[formatControl,patternControl],code:accumulationCode},
        after:'<p>Agreement on the exact pattern does not establish accuracy for every input. A useful accuracy check needs the values and formats that the real workload uses, as well as an appropriate reference.</p>',
      },
      {
        id:'precision-cooperation',title:'Connect the arithmetic to tensor cores',
        terms:[['Tensor core','Specialised GPU hardware for supported matrix multiply-and-accumulate operations.'],['Multiply–accumulate','Multiply inputs and add their products to an existing output sum.']],
        body:`<p>The previous chapter grouped outputs into tiles to reuse inputs. Tensor-core implementations also work on matrix groups: threads cooperate to supply input tiles and retain or store the output tile. On NVIDIA GPUs, the warp introduced earlier is one such cooperation group. A lane does not independently perform an entire matrix multiplication.</p><p>A ${basicPrecision.output.length} × ${basicPrecision.output[0].length} output tile with ${basicPrecision.row.length} K positions expresses ${basicPrecision.scalarFmas.toLocaleString('en-GB')} scalar multiply–accumulates. That describes arithmetic work, not hardware instructions, cycles or speed. Supported shapes, formats and cooperation rules depend on the GPU and programming interface.</p><p>The browser’s sequential additions do not execute or simulate tensor cores. For <code>a @ b</code>, PyTorch and its selected library implementation decide whether and how to use specialised hardware. A smaller dtype alone does not establish the implementation or its speed. The numeric exercise gives you an accuracy question to ask alongside a separate hardware measurement.</p>`,
        task:'Explain two independent choices to a colleague: how the inputs are represented, and how products are accumulated. Then explain why the sequential browser trace cannot reveal which tensor-core instructions PyTorch selected.',
      },
    ],
    optionalHTML:'<details><summary>Optional: inspect the arithmetic rules</summary><p>Input conversion rounds to the nearest representable value, with ties to an even last bit, including tiny values near zero. The model then advances K from 0 to 15 and rounds each addition to FP32. Actual matrix kernels may use another order or numeric rules; the trace does not identify tensor-core instructions.</p></details>',
    transfer:{prompt:'A new row alternates 1.0 and −0.5, and B remains all ones. Predict whether converting the inputs to FP16 changes the result of this model. Does that result prove that near-one inputs or very small inputs are safe too?',answer:(()=>{const r=precisionMatmul({format:'fp16',pattern:'exact'});return `Both 1.0 and −0.5 are exactly representable in FP16. ${r.changed} row inputs change and both sequential sums are ${tensorValue(r.result)}. This tests those inputs only; cancellation and small magnitudes can expose different conversion errors. It supplies no tensor-core execution or timing evidence.`;})()},
  },
];

function matrix(values, label, rowOrigin=0, columnOrigin=0) {
  return table(['Row / column',...values[0].map((_,i)=>columnOrigin+i)],values.map((row,r)=>[rowOrigin+r,...row.map(tensorValue)]),label);
}
function phaseMatrices(r, event) {
  const a = Array.from({length:r.tile},(_,i)=>Array.from({length:r.tile},(_,j)=>r.a[event.row+i][event.k0+j]));
  const b = Array.from({length:r.tile},(_,i)=>Array.from({length:r.tile},(_,j)=>r.b[event.k0+i][event.col+j]));
  const c = Array.from({length:r.tile},()=>Array(r.tile).fill(0));
  event.cCells.forEach(([row,col,value])=>{c[row-event.row][col-event.col]=value;});
  return `<div class="continuation-cards"><div class="continuation-card">${matrix(a,`A tile: rows ${event.row}–${event.row+r.tile-1}, K ${event.k0}–${event.k0+r.tile-1}`,event.row,event.k0)}</div><div class="continuation-card">${matrix(b,`B tile: K ${event.k0}–${event.k0+r.tile-1}, columns ${event.col}–${event.col+r.tile-1}`,event.k0,event.col)}</div><div class="continuation-card selected">${matrix(c,`Partial C tile: rows ${event.row}–${event.row+r.tile-1}, columns ${event.col}–${event.col+r.tile-1}`,event.row,event.col)}</div></div>`;
}

export function renderResult(model, result, cursor=0, focus='') {
  if(model!=='matmul'&&model!=='tensor-cores') return null;
  const step = result.trace[Math.max(0,Math.min(result.trace.length-1,cursor))];
  if(model==='matmul') {
    const r=result;
    if(focus==='dot') {
      const {row,col,k0}=step;
      return `<div class="continuation-visual"><p><strong>Inspecting C[${row},${col}]</strong>: K = ${k0}. Select the next step to add the next pair to this output.</p>${table(['K','A row value','B column value','Product'],r.a[row].map((a,k)=>[k,tensorValue(a),tensorValue(r.b[k][col]),tensorValue(a*r.b[k][col])]),`Row ${row} of A meets column ${col} of B`)}${metrics([['Selected A input',tensorValue(r.a[row][k0])],['Selected B input',tensorValue(r.b[k0][col])],['Selected product',tensorValue(r.a[row][k0]*r.b[k0][col])],['Partial C after this step',tensorValue(step.cCells[0][2])],['Final C for this pair',tensorValue(r.output[row][col])]])}<details><summary>Inspect the complete inputs and final C</summary>${matrix(r.a,'A')}${matrix(r.b,'B')}${matrix(r.output,'Final C')}</details></div>`;
    }
    return `<div class="continuation-visual"><p><strong>${escape(step.label)}</strong>. These input tiles contribute to the selected partial output tile.</p>${phaseMatrices(r,step)}${metrics([['Inputs loaded in this phase',step.aCells.length+step.bCells.length],['Outputs sharing each loaded input',r.tile],['Input loads for complete C',r.inputLoads],['Separate-output input loads',r.naiveLoads]])}<p>The complete algorithm computes the same ${r.output.length} × ${r.output[0].length} C while changing explicit input reuse. Shared input storage for one block is ${r.sharedBytes} bytes in this model. The partial tile above includes all K phases up to this step.</p><details><summary>Compare the complete final C</summary>${matrix(r.output,'Final C (all K phases complete)')}</details></div>`;
  }
  const r=result;
  if(focus==='conversion') {
    return `<div class="continuation-visual"><p><strong>Input position K = ${step.k}</strong>: original FP32 → ${escape(r.format.toUpperCase())} conversion. Highlighting selects one position; conversion is not a hardware execution timeline.</p><div class="continuation-cards">${r.row.map((value,k)=>`<div class="continuation-card${k===step.k?' selected':''}"><strong>K = ${k}</strong><p>${escape(tensorValue(value))} → ${escape(tensorValue(r.converted[k]))}</p><span>${value===r.converted[k]?'Unchanged':'Rounded to a different value'}</span></div>`).join('')}</div>${metrics([['Selected original FP32 input',tensorValue(step.input)],['Selected converted input',tensorValue(step.converted)],['Changed inputs in this row',r.changed]])}</div>`;
  }
  const previous=step.k===0?0:r.trace[step.k-1].partial;
  const referencePrevious=step.k===0?0:r.trace[step.k-1].reference;
  return `<div class="continuation-visual"><p><strong>K = ${step.k}</strong>: multiply the converted input by B’s value of one, then add into the FP32 accumulator.</p>${table(['Path','Previous sum','Input × B','FP32 sum after addition'],[['Converted inputs',tensorValue(previous),`${tensorValue(step.converted)} × 1.0`,tensorValue(step.partial)],['Original FP32 inputs',tensorValue(referencePrevious),`${tensorValue(step.input)} × 1.0`,tensorValue(step.reference)]],'Two sums at the same K position')}${metrics([['Final converted-input sum',tensorValue(r.result)],['Final original-input reference',tensorValue(r.reference)],['Final absolute difference',r.error],['Changed inputs in this row',r.changed]])}<p>All ${r.output.length*r.output[0].length} output entries equal ${escape(tensorValue(r.result))} for these identical A rows and all-one B columns. Final values include all ${r.trace.length} additions, even while you inspect an earlier step. This declared sequential order is not a tensor-core trace.</p></div>`;
}
