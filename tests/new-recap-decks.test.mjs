// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {recapData,helloFigure,memoryFigure,investigationFigure} from '../scripts/recap-review-decks.mjs';

test('new recaps preserve the input/launch distinction and withhold new-case answers',()=>{
 const hello=recapData.hello;
 assert.deepEqual(hello.five.output,hello.five.input.map(x=>x*2));
 assert.deepEqual(hello.nine.threads.filter(t=>t.skipped).map(t=>t.i),[9,10,11]);
 assert.doesNotMatch(helloFigure('question'),/3 blocks|Valid indices/);
 assert.match(helloFigure('answer'),/3 blocks × 4 threads/);
 const host=recapData['launch-from-input'];
 assert.equal(host.nine.count*4,36);
 assert.doesNotMatch(memoryFigure('question'),/36 bytes|3 blocks/);
 assert.match(memoryFigure('answer'),/36 bytes/);
});

test('investigation recap compares complete identical outputs and separates load counts from capacity',()=>{
 const {variants,challenge}=recapData['putting-it-together'];
 assert.deepEqual(variants.map(r=>r.inputLoads),[128,64,32]);
 assert.deepEqual(variants.map(r=>r.residentBlocks),[8,4,1]);
 for(const r of variants)assert.deepEqual(r.output,variants[0].output);
 assert.equal(challenge.inputLoads,512);assert.equal(challenge.output.length**2,64);
 assert.doesNotMatch(investigationFigure('question'),/>512<|>64</);
 assert.match(investigationFigure('answer'),/>512</);
});
