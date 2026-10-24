// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readReleaseMetadata} from '../src/release-metadata.mjs';
const release={schema:1,id:'0'.repeat(64),commit:null,date:null,bytes:0,files:[{path:'index.html',bytes:0,sha256:'1'.repeat(64)}]};
const response=(headers={},data=release,status=200)=>new Response(JSON.stringify(data),{status,headers});
test('release checks accept fresh bounded GitHub Pages cache responses and disclose the lifetime',async()=>{
  assert.deepEqual(await readReleaseMetadata(response()),{release,cacheLifetime:0});
  assert.deepEqual(await readReleaseMetadata(response({'Age':'0'})),{release,cacheLifetime:0});
  assert.deepEqual(await readReleaseMetadata(response({'Age':'17','Cache-Control':'public, max-age=600'})),{release,cacheLifetime:600});
  assert.equal((await readReleaseMetadata(response({'Age':'59','Cache-Control':'max-age=60'}))).cacheLifetime,60);
});
test('expired, unbounded, malformed or invalid release metadata is still rejected',async()=>{
  for(const headers of [
    {'Age':'600','Cache-Control':'max-age=600'}, {'Age':'601','Cache-Control':'max-age=600'},
    {'Age':'17'}, {'Age':'17','Cache-Control':'max-age=3600'},
    {'Age':'17','Cache-Control':'no-store'}, {'Age':'-1'}, {'Age':'oops'}, {'Age':'1.5'},
  ]) await assert.rejects(()=>readReleaseMetadata(response(headers)),JSON.stringify(headers));
  await assert.rejects(()=>readReleaseMetadata(response({}, {},503)));
  await assert.rejects(()=>readReleaseMetadata(response({}, {})));
});
test('a validated immutable running manifest does not require a fresh CDN response',async()=>{
  const result=await readReleaseMetadata(response({'Age':'9000','Cache-Control':'max-age=600'}),{immutable:true});
  assert.deepEqual(result,{release,cacheLifetime:0});
  await assert.rejects(()=>readReleaseMetadata(response({},{}),{immutable:true}));
});
