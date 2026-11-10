// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import {smFrame,smEvents} from './sm-hardware-model.mjs';
import {renderSmHardware,renderSmEvent} from './sm-hardware-view.mjs';
if(document.getElementById('sm-explorer')){
const walkthrough=document.getElementById('sm-walkthrough');
const openLinked=()=>{if(location.hash==='#sm-warps')walkthrough.open=true;};
openLinked();addEventListener('hashchange',openLinked);
document.getElementById('scheduling-sm-explore').addEventListener('click',()=>{walkthrough.open=true;});
let cursor=0;
const $=id=>document.getElementById(id);
function draw(){
  const frame=smFrame(cursor);
  $('sm-diagram').innerHTML=renderSmHardware(frame);
  $('sm-event').innerHTML=renderSmEvent(frame);
  $('sm-position').textContent=cursor===0?'Before the loads':`Event ${cursor} of ${smEvents.length-1}`;
  $('sm-previous').disabled=cursor===0;
  $('sm-next').disabled=cursor===smEvents.length-1;
  $('sm-reset').disabled=cursor===0;
}
$('sm-previous').addEventListener('click',()=>{cursor=Math.max(0,cursor-1);draw();});
$('sm-next').addEventListener('click',()=>{cursor=Math.min(smEvents.length-1,cursor+1);draw();});
$('sm-reset').addEventListener('click',()=>{cursor=0;draw();});
registerExperiment('sm-hardware',()=>({cursor}),saved=>{cursor=Number.isInteger(saved.cursor)&&saved.cursor>=0&&saved.cursor<smEvents.length?saved.cursor:0;draw();});
draw();

const controls=document.querySelector('.sm-explorer-controls');
new ResizeObserver(()=>controls.style.setProperty('--sm-top',document.querySelector('.topbar').getBoundingClientRect().height+'px')).observe(document.querySelector('.topbar'));

}
