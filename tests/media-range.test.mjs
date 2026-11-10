// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaRangeResponse} from '../src/media-range.mjs';
const body=()=>new Response('0123456789',{headers:{'Content-Type':'video/mp4','Content-Length':'10'}});
test('cached media ranges support bounded, open-ended and suffix seeking',async()=>{
 for(const [range,text,contentRange] of [['bytes=2-5','2345','bytes 2-5/10'],['bytes=7-','789','bytes 7-9/10'],['bytes=-3','789','bytes 7-9/10'],['bytes=8-99','89','bytes 8-9/10'],['bytes=-99','0123456789','bytes 0-9/10']]){
  const r=await mediaRangeResponse(range,body());
  assert.equal(r.status,206);assert.equal(r.headers.get('Content-Type'),'video/mp4');
  assert.equal(r.headers.get('Content-Range'),contentRange);assert.equal(Number(r.headers.get('Content-Length')),text.length);
  assert.equal(await r.text(),text);
 }
});
test('unavailable media ranges return 416 while unsupported range formats retain the full response',async()=>{
 for(const range of ['bytes=10-','bytes=9-1','bytes=-0','bytes=999999999999999999999-']){
  const r=await mediaRangeResponse(range,body());assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */10');assert.equal(await r.text(),'');
 }
 for(const range of [null,'','items=1-2','bytes=0-1,4-5','bytes=-']){
  const r=await mediaRangeResponse(range,body());assert.equal(r.status,200);assert.equal(await r.text(),'0123456789');
 }
 const missing=new Response('missing',{status:404});assert.equal(await mediaRangeResponse('bytes=0-1',missing),missing);
});
