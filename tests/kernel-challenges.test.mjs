import test from 'node:test';
import assert from 'node:assert/strict';
import {challenges,predictionAnswer,assessSolution} from '../src/kernel-challenges.mjs';
test('predictions describe actual starter failures; completion needs code and explanation',()=>{
  assert.deepEqual(challenges.map(predictionAnswer),[1,3,13,40]);
  for (const challenge of challenges) {
    assert.equal(assessSolution(challenge.program,challenge,String(challenge.correct)).code,false);
    const repaired={...challenge.program,index:'global',guard:true,operation:challenge.task==='vector-add'?'vector-add':'multiply'};
    assert.deepEqual(assessSolution(repaired,challenge,String(challenge.correct)),{code:true,explanation:true});
    assert.equal(assessSolution(repaired,challenge,'').explanation,false);
    assert.equal(assessSolution(repaired,challenge,String((challenge.correct+1)%3)).explanation,false);
  }
});
