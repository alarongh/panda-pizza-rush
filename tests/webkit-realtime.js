import { webkit } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser=await webkit.launch();
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${process.env.TEST_URL||'http://127.0.0.1:4173/'}?qa=1`);
await page.getByRole('button',{name:'Доставить пиццу'}).tap();await page.waitForTimeout(500);
await page.getByRole('button',{name:'Пауза',exact:true}).tap();
const atPause=await page.evaluate(()=>window.__PANDA_QA__.snapshot());
await page.waitForTimeout(1200);assert.deepEqual(await page.evaluate(()=>window.__PANDA_QA__.snapshot()),atPause);
await page.screenshot({path:'artifacts/webkit-paused.png'});
await page.getByRole('button',{name:'Продолжить'}).tap();await page.waitForTimeout(500);
assert.equal(await page.evaluate(()=>window.__PANDA_QA__.game.state),'playing');
const audioAvailable=await page.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext));
if(audioAvailable){
  await page.getByRole('button',{name:'Включить звук'}).tap();await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.__PANDA_QA__.audio.context.state),'running');
  await page.getByRole('button',{name:'Пауза',exact:true}).tap();await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.__PANDA_QA__.audio.context.state),'suspended');
  await page.getByRole('button',{name:'Продолжить'}).tap();await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.__PANDA_QA__.audio.context.state),'running');
}else{assert.equal(await page.locator('#sound').isVisible(),false);}
assert.deepEqual(errors,[]);
console.log(`WebKit real time: normal tap and pause/resume passed (no forced actions / mocked clock). Web Audio available: ${audioAvailable}`);
await writeFile('artifacts/webkit-realtime-results.json',JSON.stringify({passed:true,audioAvailable,errors}));
await browser.close();
