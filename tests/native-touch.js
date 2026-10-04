import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${base}?qa=1`);await page.getByRole('button',{name:'Доставить пиццу'}).tap();
const cdp=await context.newCDPSession(page);
const snapshot=()=>page.evaluate(()=>window.__PANDA_QA__.snapshot());
async function swipe(dx,dy){
  const box=await page.locator('#canvas').boundingBox();const x=box.x+box.width*.5,y=box.y+box.height*.64;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
await swipe(70,0);assert.equal((await snapshot()).lane,2);
await swipe(-70,0);assert.equal((await snapshot()).lane,1);
await swipe(0,-70);assert.equal((await snapshot()).action,'jump');
await page.waitForTimeout(1050);await swipe(0,70);assert.equal((await snapshot()).action,'slide');
// AudioContext must start from a user gesture and stop while paused.
await page.getByRole('button',{name:'Включить звук'}).tap();
await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__PANDA_QA__.audio.context.state),'running');
await page.getByRole('button',{name:'Пауза',exact:true}).tap();await page.waitForTimeout(100);
assert.equal(await page.evaluate(()=>window.__PANDA_QA__.audio.context.state),'suspended');
await page.getByRole('button',{name:'Продолжить'}).tap();await page.waitForTimeout(100);
assert.equal(await page.evaluate(()=>window.__PANDA_QA__.audio.context.state),'running');
const perf=await page.evaluate(async()=>{
  const durations=[];let previous=performance.now();
  await new Promise(resolve=>{function tick(now){durations.push(now-previous);previous=now;if(durations.length<180)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
  const sorted=durations.slice(5).sort((a,b)=>a-b);
  const qa=window.__PANDA_QA__,measure=[];
  for(let i=0;i<120;i++){const start=performance.now();qa.renderer.draw(qa.game,0);measure.push(performance.now()-start);}
  return {medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],meanDrawMs:measure.reduce((a,b)=>a+b,0)/measure.length,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height]};
});
assert.ok(perf.meanDrawMs<16.7,`Rendering took ${perf.meanDrawMs}ms`);assert.deepEqual(errors,[]);
await page.screenshot({path:'artifacts/native-touch-playing.png'});
console.log(JSON.stringify({base,status:'passed',nativeTouch:'4 directions',audio:'start / suspend / resume',perf,errors},null,2));
await writeFile('artifacts/native-touch-results.json',JSON.stringify({base,perf,errors},null,2));
await browser.close();
