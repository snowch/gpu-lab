// Copyright © 2026 Christopher Snow.
import {tensorValue} from './value-format.mjs';
import {escape} from './continuation-ui.mjs';
const preview=values=>values?values.slice(0,2).map(tensorValue).join(', ')+' …':'?';
export function renderSmHardware(frame=null){
  const event=frame?.event,kind=event?.kind,warp=event?.warp===null?'':frame?.warps[event?.warp]?.name;
  const active=name=>name==='scheduler'?['request','multiply','store'].includes(kind):name==='arithmetic'?kind==='multiply':name==='registers'?['arrive','multiply','store'].includes(kind):['request','arrive','store'].includes(kind);
  const unit=(id,title,meaning,extra='')=>`<div class="sm-unit" data-sm-unit="${id}" data-active="${active(id)}"><h4>${title}</h4><p>${meaning}</p>${active(id)?`<p class="sm-active">${id==='scheduler'?`Selected ${kind==='request'?'load':kind} instruction`:id==='arithmetic'?'Multiply instruction':kind==='request'?'Requesting a load':kind==='arrive'?'Receiving values':kind==='store'?'Writing results':'Using registers'} · Warp ${warp}</p>`:''}${extra}</div>`;
  const edge=(id,on,label)=>`<div class="sm-connection" data-sm-edge="${id}" data-active="${on}"><span aria-hidden="true">↕</span><span>${label}</span></div>`;
  const registers=frame?`<dl class="sm-register-values">${frame.warps.map(w=>`<div><dt>Warp ${w.name} · separate values for each thread</dt><dd>Loaded: <strong>${preview(w.loaded)}</strong><br>Results: <strong>${preview(w.result)}</strong></dd></div>`).join('')}</dl>`:'';
  const arithmetic=frame?`<p class="sm-arithmetic-values">${frame.arithmetic?`Last multiply · Warp ${frame.arithmetic.warp}<br>${frame.arithmetic.input.slice(0,2).map((v,i)=>`${tensorValue(v)} × 2 → ${tensorValue(frame.arithmetic.result[i])}`).join('<br>')}`:'No multiply yet.'}</p>`:'';
  return `<figure class="sm-hardware${frame?'':' sm-hardware-overview'}" aria-label="Registers and execution hardware within one SM">
    <div class="sm-device-memory"><h4>GPU memory</h4><p>Input and output arrays</p>${frame?`<div class="sm-memory-values">${frame.warps.map(w=>`<p>Warp ${w.name} · inputs <strong>${preview(w.input)}</strong><br>Outputs <strong>${preview(w.output)}</strong></p>`).join('')}</div>`:''}</div>
    ${edge('memory',['request','arrive','store'].includes(kind),kind==='request'?'Read request':kind==='arrive'?'Loaded values':kind==='store'?'Output values':'Memory requests and values')}
    <div class="sm-chip"><h3>Inside one SM</h3>
      ${unit('load-store','Load/store units',frame?'Issue memory reads and writes, connecting GPU memory with the threads’ registers.':'Issue memory reads and writes.')}
      ${edge('load-registers',['arrive','store'].includes(kind),frame?'Values between load/store units and registers':'Load/store ↔ registers')}
      ${unit('registers','Registers',frame?'Hold working values separately for each thread.':'Per-thread working values.',registers)}
      ${edge('arithmetic',kind==='multiply',frame?'Register operands to arithmetic units; results back to registers':'Operands and results')}
      ${unit('arithmetic','Arithmetic units · FP32',frame?'Perform arithmetic using register values. Many threads share this hardware.':'Shared hardware using register operands.',arithmetic)}
      <aside class="sm-control-block" aria-label="Instruction selection">
    ${frame?`<div class="sm-warp-states">${frame.warps.map(w=>`<div class="sm-warp-state"><strong>Warp ${w.name} · 32 threads</strong><span>State after this event: ${w.status}</span></div>`).join('')}</div>`:''}
      ${unit('scheduler','Scheduler',frame?'Chooses an instruction from a ready warp. Different instructions use different execution units.':'Selects a ready warp instruction.')}
      ${frame?'<p class="sm-control-note">The scheduler starts instructions on the appropriate units. The solid arrows connect hardware carrying values; threads stay logical executions of the program.</p>':''}
      </aside>
    </div>
    <figcaption>${frame?'Values and readiness are shown after the named event. Lists show the first two of each warp’s 32 threads. ':''}Boxes show relationships, not a chip floor plan or unit counts. ${frame?'Arrow highlighting shows an instruction’s data path, not its duration.':'Arrows connect working values and execution units; instruction selection is separate.'}</figcaption>
  </figure>`;
}
export function renderSmEvent(frame){
  return `<h3>${escape(frame.event.title)}</h3><p>${escape(frame.event.text)}</p>`;
}
