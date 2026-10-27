// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mapConcepts,mapEdges,mapViews,conceptById,connections,initialMap} from '../src/gpu-map-data.mjs';
import {renderMap,renderWarp,renderThread} from '../src/gpu-map-view.mjs';
import {chapters} from '../src/book-chapters.mjs';
test('map has unique concepts, valid directed edges and coverage for every chapter',()=>{
 assert.equal(new Set(mapConcepts.map(c=>c.id)).size,mapConcepts.length);
 const pages=new Set([...chapters.map(c=>c.slug),'memory','kernel','shared-memory']);
 for(const c of mapConcepts){assert.ok(c.meaning&&c.example);assert.ok(connections(c.id).length);for(const page of c.chapters)assert.ok(pages.has(page));for(const view of c.views)assert.ok(mapViews.some(v=>v.id===view));}
 for(const e of mapEdges){assert.ok(conceptById(e.from)&&conceptById(e.to)&&e.label);assert.notEqual(e.from,e.to);}
 for(const c of chapters){const state=initialMap(c.slug);assert.equal(state.chapter,c.slug);assert.ok(conceptById(state.concept).chapters.includes(c.slug));assert.ok(conceptById(state.concept).views.includes(state.view));}
 assert.deepEqual(initialMap('invalid'),initialMap());
});
test('map distinguishes ownership, grouping and scheduling without false containment',()=>{
 assert.ok(mapEdges.some(e=>e.from==='sm'&&e.to==='block'&&e.label==='hosts resident'));
 assert.ok(mapEdges.some(e=>e.from==='block'&&e.to==='shared'));
 assert.ok(mapEdges.some(e=>e.from==='scheduler'&&e.to==='warp'));
 assert.match(conceptById('warp').example,/two warps/);
 assert.match(conceptById('block').example,/Several blocks/);
 assert.match(conceptById('sectors').example,/not a count of physical DRAM/);
});
test('both diagrams and every concept are built into the HTML',()=>{
 const html=renderMap();
 for(const c of mapConcepts){
  assert.ok(html.includes(`id="concept-${c.id}"`),c.id);
  assert.ok(html.includes(`data-map-concept="${c.id}"`),c.id);
 }
 assert.ok(html.indexOf('id="memory-cache"')<html.indexOf('id="vram"'),'Caches are on the data path, not nested inside VRAM');
 assert.match(html,/id="sm-0"/);assert.match(html,/id="sm-1"/);
 for(const block of ['a','b','c'])for(const warp of [0,1])assert.ok(html.includes(`id="${block}-warp-${warp}"`));
 assert.equal((html.match(/class="map-node map-lane"/g)||[]).length,192);
 assert.doesNotMatch(html,/id="(?:gpu-map|hardware-panel|operation-panel)"[^>]*hidden/);
 const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'Every disclosure has a unique stable ID');
});
test('warp lanes and launch traces derive indices from block membership',()=>{
 assert.match(renderWarp('c',1),/Lane 7 → thread 39 within block C/);
 assert.match(renderWarp('a',0),/Lane 31 → thread 31 within block A/);
 assert.match(renderThread(4),/Block 1 × 4 threads per block \+ position 0 = index 4/);
 assert.match(renderThread(4),/write output\[4\] = 10/);
 assert.match(renderThread(7),/bounds check skips the read and write/);
 assert.doesNotMatch(renderThread(7),/write output/);
});
