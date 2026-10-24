// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

test('background cache pruning finishes before an update can create its staging cache',async()=>{
  const base='https://example.test/gpu-lab/',prefix=`gpu-lab:${base}:`,stores=new Map(),handlers=new Map();
  const file=body=>({path:'index.html',bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')});
  const old={schema:1,id:'1'.repeat(64),commit:null,date:null,files:[file('old page')],bytes:8};
  const next={schema:1,id:'2'.repeat(64),commit:null,date:null,files:[file('new page')],bytes:8};
  const paused=deferred(),resume=deferred(),fetched=deferred();
  let keysCalls=0,prunePaused=false,overlap=false;
  const caches={
    async open(name){
      if(!stores.has(name)) stores.set(name,new Map());
      const entries=stores.get(name);
      return {async match(url){return entries.get(String(url))?.clone();},async put(url,response){entries.set(String(url),response.clone());}};
    },
    async keys(){
      if(++keysCalls===2){prunePaused=true;paused.resolve();await resume.promise;prunePaused=false;}
      return [...stores.keys()];
    },
    async delete(name){return stores.delete(name);},
  };
  const meta=await caches.open(prefix+'status-v1');
  await meta.put(base+'__app_status_state__',new Response(JSON.stringify({active:old.id,saved:true})));
  const saved=await caches.open(prefix+'release-'+old.id);
  await saved.put(base+'__release_manifest__',new Response(JSON.stringify(old)));
  await saved.put(base+'index.html',new Response('old page'));
  const client={id:'learner',url:base+'index.html',postMessage(){}};
  const context=vm.createContext({URL,Request,Response,AbortController,AbortSignal,crypto:webcrypto,console,setTimeout,clearTimeout,caches,
    self:{registration:{scope:base},clients:{async matchAll(){return [client];}},addEventListener(type,fn){handlers.set(type,fn);}},
    async fetch(){overlap ||= prunePaused;await fetched.promise;return new Response('new page');},
  });
  const contract=(await readFile(new URL('../src/release-contract.mjs',import.meta.url),'utf8')).replaceAll('export ','');
  vm.runInContext(contract+'\n'+await readFile(new URL('../scripts/service-worker.js',import.meta.url),'utf8'),context);
  function rpc(type,data={}) {
    let work;const messages=[];
    handlers.get('message')({source:client,ports:[{postMessage(message){messages.push(message);}}],data:{type,running:old.id,...data},waitUntil(promise){work=promise;}});
    return {messages,get work(){return work;}};
  }
  const status=rpc('STATUS');await paused.promise;
  const update=rpc('PREPARE',{release:next,save:false});
  // Let both handlers advance while cleanup is deliberately paused in CacheStorage.
  for(let i=0;i<10;i++) await new Promise(setImmediate);
  resume.resolve();await status.work;fetched.resolve();await update.work;
  assert.equal(overlap,false,'Update fetched assets while cleanup could still delete its cache');
  assert.ok(!update.messages.some(m=>m.error),JSON.stringify(update.messages));
  assert.equal(update.messages.at(-1).result.pendingReady,true);
  assert.ok(stores.has(prefix+'release-'+next.id));
});
