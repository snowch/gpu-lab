// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mapConcepts,mapEdges,mapViews,conceptById,connections,initialMap} from '../src/gpu-map-data.mjs';
import {renderMap,renderMapDiagram} from '../src/gpu-map-view.mjs';
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
test('every concept has selectable graphical connections and a complete static reference',()=>{
 const html=renderMap();
 for(const c of mapConcepts){assert.ok(html.includes(`id="concept-${c.id}"`));const diagram=renderMapDiagram(c.id);assert.ok(diagram.includes('map-selected'));for(const edge of connections(c.id))assert.ok(diagram.includes(`data-concept="${edge.from===c.id?edge.to:edge.from}"`));}
});
