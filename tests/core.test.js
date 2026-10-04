import test from 'node:test';
import assert from 'node:assert/strict';
import { RunnerGame } from '../src/core.js';
import { createLevel, FINISH_DISTANCE, OBSTACLES } from '../src/level.js';
import { LocalStorageAdapter } from '../src/adapters.js';
const advance=(game,seconds)=>{for(let t=0;t<seconds;t+=1/120)game.update(1/120);};
function encounter(type,action){
  const events=[];const g=new RunnerGame({onEvent:e=>events.push(e.type)});g.reset();
  g.entities=[{type,lane:1,z:3,resolved:false}];if(action)g.input(action);advance(g,.5);return {g,events};
}
test('every authored obstacle row has a clear lane; all types appear',()=>{
  const rows=new Map();const types=new Set();
  for(const e of createLevel())if(e.type!=='pizza'){types.add(e.type);rows.set(e.z,[...(rows.get(e.z)||[]),e.lane]);}
  for(const [z,lanes]of rows){assert.ok(new Set(lanes).size<3,`No clear lane at ${z}`);assert.equal(lanes.length,new Set(lanes).size);}
  assert.deepEqual([...types].sort(),Object.keys(OBSTACLES).sort());
});
test('pizza is resolved once and contributes exactly ten points',()=>{
  const {g,events}=encounter('pizza');assert.equal(g.pizzas,1);assert.equal(g.score,Math.floor(g.distance)+10);
  advance(g,2);assert.equal(g.pizzas,1);assert.equal(events.filter(e=>e==='collect').length,1);
});
test('all five obstacles cause gameover on impact',()=>{
  for(const type of Object.keys(OBSTACLES)){const {g,events}=encounter(type);assert.equal(g.state,'gameover',type);assert.ok(events.includes('hit'));}
});
test('jump clears assignments; slide clears low banner; wrong actions fail',()=>{
  assert.equal(encounter('assignments','jump').g.state,'playing');
  assert.equal(encounter('low','slide').g.state,'playing');
  assert.equal(encounter('assignments','slide').g.state,'gameover');
  assert.equal(encounter('low','jump').g.state,'gameover');
  assert.equal(encounter('professor','jump').g.state,'gameover');
});
test('lane transitions, edge clamping and dodging are consistent',()=>{
  const {g}=encounter('professor','left');assert.equal(g.state,'playing');assert.equal(g.x,0);
  assert.equal(g.input('left'),false);g.input('right');g.input('right');g.input('right');advance(g,.3);assert.equal(g.x,2);
});
test('pause freezes simulation and action timers; resume and restart work',()=>{
  const g=new RunnerGame();g.reset();g.input('jump');advance(g,.15);g.pause();
  const before=JSON.stringify(g.result()),actionTime=g.actionTime;advance(g,5);
  assert.equal(JSON.stringify(g.result()),before);assert.equal(g.actionTime,actionTime);assert.equal(g.input('left'),false);
  g.resume();advance(g,.5);assert.ok(g.distance>2);g.reset();assert.equal(g.pizzas,0);assert.equal(g.distance,0);assert.equal(g.x,1);assert.equal(g.action,null);
});
test('authored route can be finished by ordinary controls within 60–120 seconds',()=>{
  const g=new RunnerGame();g.reset();
  for(let t=0;t<120*120&&g.state==='playing';t++){
    const next=g.entities.find(e=>!e.resolved&&e.type!=='pizza'&&e.z-g.distance<g.speed*1.1);
    if(next){const row=g.entities.filter(e=>!e.resolved&&e.type!=='pizza'&&e.z===next.z);const safe=[0,1,2].find(l=>!row.some(e=>e.lane===l));if(g.lane<safe)g.input('right');else if(g.lane>safe)g.input('left');}
    g.update(1/120);
  }
  assert.equal(g.state,'finish');assert.equal(g.distance,FINISH_DISTANCE);assert.ok(g.elapsed>=60&&g.elapsed<=120);assert.ok(g.pizzas>0);assert.equal(g.result().delivered,true);
});
test('score and collisions agree at 15, 30, 60 and 120 fps',()=>{
  const results=[];
  for(const fps of [15,30,60,120]){
    const g=new RunnerGame();g.reset();g.entities=[{type:'pizza',lane:1,z:1},{type:'professor',lane:1,z:12}];
    for(let i=0;i<fps*4;i++)g.update(1/fps);results.push(g.result());
  }
  assert.ok(results.every(r=>r.score===results[0].score&&r.pizzas===1));
});
test('long stalls cannot skip collisions or advance entire hidden minutes',()=>{
  const g=new RunnerGame();g.reset();g.entities=[];g.update(60);assert.ok(g.distance<1);g.update(NaN);assert.ok(Number.isFinite(g.distance));
});
test('storage tolerates unavailable, corrupted and denied localStorage',()=>{
  const memory=new Map();const store=new LocalStorageAdapter({getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)});
  assert.equal(store.load().best,0);store.save({best:123,last:{score:123},sound:true});assert.equal(store.load().best,123);assert.equal(store.load().sound,true);
  memory.set(store.key,'null');assert.equal(store.load().best,0);memory.set(store.key,'{bad');assert.equal(store.load().best,0);
  const denied=new LocalStorageAdapter({getItem(){throw Error();},setItem(){throw Error();}});assert.equal(denied.load().best,0);assert.equal(denied.save({best:3}),false);
});
