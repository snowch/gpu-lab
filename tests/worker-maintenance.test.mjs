// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

test('eviction during a shared readiness scan is detected before reporting a complete release',async()=>{
  const base='https://example.test/gpu-lab/';
  const bodies=new Map([['examples/gather.cu','kernel source'],['video.mp4','recording bytes']]);
  const release={id:'3'.repeat(64),files:[...bodies].map(([path,body])=>({path,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}))};
  const started=deferred(),resume=deferred();
  const present=new Set(bodies.keys());
  let pause=true;
  const cache={
    async match(url){
      const path=String(url).slice(base.length);
      if(path==='video.mp4'&&pause){pause=false;started.resolve();await resume.promise;}
      return present.has(path)?new Response(bodies.get(path)):undefined;
    },
    async keys(){return [...present].map(path=>new Request(new URL(path,base)));},
  };
  const context=vm.createContext({release,URL,Request,Response,AbortController,AbortSignal,crypto:webcrypto,console,setTimeout,clearTimeout,
    caches:{async open(){return cache;}},self:{registration:{scope:base},addEventListener(){}}});
  const contract=(await readFile(new URL('../src/release-contract.mjs',import.meta.url),'utf8')).replaceAll('export ','');
  vm.runInContext(contract+'\n'+await readFile(new URL('../scripts/service-worker.js',import.meta.url),'utf8'),context);
  const check=()=>vm.runInContext('complete(release)',context);
  const first=check();await started.promise;
  // This file already passed its byte/hash check. Evict it while the large
  // recording is still being read, then let another tab join the same scan.
  present.delete('examples/gather.cu');const joined=check();resume.resolve();
  assert.deepEqual(await Promise.all([first,joined]),[false,false]);
  present.add('examples/gather.cu');assert.equal(await check(),true);
});

test('concurrent readiness checks share byte verification but later checks detect eviction and recover from errors',async()=>{
  const base='https://example.test/gpu-lab/',body='recording bytes';
  const release={id:'1'.repeat(64),files:[{path:'video.mp4',bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}]};
  const started=deferred(),resume=deferred();
  let reads=0,present=true,denied=false;
  const cache={async keys(){return present?[new Request(new URL('video.mp4',base))]:[];},async match(){
    reads++;
    if(reads===1){started.resolve();await resume.promise;}
    if(denied){denied=false;throw new Error('Storage temporarily unavailable');}
    return present?new Response(body):undefined;
  }};
  const context=vm.createContext({release,URL,Request,Response,AbortController,AbortSignal,crypto:webcrypto,console,setTimeout,clearTimeout,
    caches:{async open(){return cache;}},self:{registration:{scope:base},addEventListener(){}}});
  const contract=(await readFile(new URL('../src/release-contract.mjs',import.meta.url),'utf8')).replaceAll('export ','');
  vm.runInContext(contract+'\n'+await readFile(new URL('../scripts/service-worker.js',import.meta.url),'utf8'),context);
  const check=()=>vm.runInContext('complete(release)',context);
  const first=check();await started.promise;
  const others=Array.from({length:15},check);
  resume.resolve();assert.ok((await Promise.all([first,...others])).every(Boolean));
  assert.equal(reads,1,'Sixteen tabs should not reread the same recording sixteen times');
  present=false;assert.equal(await check(),false,'A completed check cannot conceal later eviction');
  present=true;denied=true;await assert.rejects(check(),/Storage temporarily unavailable/);
  assert.equal(await check(),true,'A rejected scan must not poison the next retry');
});

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
      return {async keys(){return [...entries.keys()].map(url=>new Request(url));},async match(url){return entries.get(String(url))?.clone();},async put(url,response){entries.set(String(url),response.clone());}};
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

test('readiness verification bounds parallel I/O and still rejects missing bytes and same-size corruption',async()=>{
  const base='https://example.test/gpu-lab/';
  const bodies=new Map(Array.from({length:9},(_,i)=>[`file-${i}.bin`,`payload-${i}`]));
  const release={id:'4'.repeat(64),files:[...bodies].map(([path,body])=>({path,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}))};
  let active=0,peak=0,tampered=null,missing=null,denied=null;
  const cache={
    async match(url){
      const path=String(url).slice(base.length);active++;peak=Math.max(peak,active);
      try{
        await new Promise(setImmediate);
        if(path===denied)throw new Error('Temporary read failure');
        return path===missing?undefined:new Response(path===tampered?'tamperd-'+path.match(/\d/)[0]:bodies.get(path));
      }finally{active--;}
    },
    async keys(){return [...bodies.keys()].filter(path=>path!==missing).map(path=>new Request(new URL(path,base)));},
  };
  const context=vm.createContext({release,URL,Request,Response,AbortController,AbortSignal,crypto:webcrypto,console,setTimeout,clearTimeout,
    caches:{async open(){return cache;}},self:{registration:{scope:base},addEventListener(){}}});
  const contract=(await readFile(new URL('../src/release-contract.mjs',import.meta.url),'utf8')).replaceAll('export ','');
  vm.runInContext(contract+'\n'+await readFile(new URL('../scripts/service-worker.js',import.meta.url),'utf8'),context);
  const check=()=>vm.runInContext('complete(release)',context);
  assert.equal(await check(),true);assert.ok(peak>1&&peak<=4,'Overlap I/O without reading the whole book into memory');assert.equal(active,0);
  tampered='file-1.bin';assert.equal(await check(),false,'Equal byte length must not bypass the content hash');assert.equal(active,0);
  tampered=null;missing='file-6.bin';assert.equal(await check(),false);assert.equal(active,0);
  missing=null;denied='file-1.bin';await assert.rejects(check(),/Temporary read failure/);assert.equal(active,0,'Failed batches must settle before the next scan');
  denied=null;assert.equal(await check(),true,'Repair/retry must perform a new complete scan');
});
