import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const engines=process.env.TEST_ENGINES?.split(',')||['chromium','firefox','webkit'];
const results=[];
await mkdir('artifacts',{recursive:true});
for(const name of engines){
  const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();const errors=[];const responses=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)responses.push(`${response.status()} ${response.url()}`);});
  await page.clock.install();
  await page.goto(`${base}?qa=1`);await page.waitForFunction(()=>!!window.__PANDA_QA__);
  await page.screenshot({path:`artifacts/${name}-menu.png`});
  const box=await page.locator('#game').boundingBox();assert.ok(Math.abs(box.width/box.height-9/16)<.005);
  await page.getByRole('button',{name:'Доставить пиццу'}).click({force:name === 'webkit'});
  const state=()=>page.evaluate(()=>window.__PANDA_QA__.snapshot());
  assert.equal((await state()).state,'playing');
  // Real browser key events, including WASD and action exclusivity.
  await page.keyboard.press('ArrowLeft');await page.clock.runFor(250);assert.equal((await state()).lane,0);
  await page.keyboard.press('ArrowRight');await page.clock.runFor(250);assert.equal((await state()).x,1);
  await page.keyboard.press('w');assert.equal((await state()).action,'jump');await page.keyboard.press('s');assert.equal((await state()).action,'jump');
  await page.clock.runFor(1100);await page.keyboard.press('s');assert.equal((await state()).action,'slide');
  await page.clock.runFor(1100);assert.equal((await state()).action,null);
  // Pointer events use exactly the same path as physical phone swipes.
  async function swipe(dx,dy){
    await page.locator('#canvas').dispatchEvent('pointerdown',{pointerId:9,pointerType:'touch',isPrimary:true,clientX:190,clientY:650});
    await page.locator('#canvas').dispatchEvent('pointermove',{pointerId:9,pointerType:'touch',isPrimary:true,clientX:190+dx,clientY:650+dy});
    await page.locator('#canvas').dispatchEvent('pointerup',{pointerId:9,pointerType:'touch',isPrimary:true,clientX:190+dx,clientY:650+dy});
  }
  // dispatchEvent does not establish native pointer capture; the gesture should
  // still work if browsers reject capture for synthetic events.
  await swipe(80,0);assert.equal((await state()).lane,2);await swipe(-80,0);assert.equal((await state()).lane,1);
  await swipe(0,-80);assert.equal((await state()).action,'jump');await page.clock.runFor(1050);await swipe(0,80);assert.equal((await state()).action,'slide');
  await page.keyboard.press('p');const paused=await state();await page.clock.runFor(4000);assert.deepEqual(await state(),paused);
  await page.getByRole('button',{name:'Продолжить'}).click({force:name === 'webkit'});assert.equal((await state()).state,'playing');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).state,'paused');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal((await state()).state,'paused');
  await page.getByRole('button',{name:'Продолжить'}).click({force:name === 'webkit'});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal((await state()).state,'paused');await page.evaluate(()=>{delete document.hidden;});
  // Collision integration and UI transitions on real frames.
  await page.getByRole('button',{name:'В меню',exact:true}).click({force:name === 'webkit'});await page.getByRole('button',{name:'Доставить пиццу'}).click({force:name === 'webkit'});
  await page.clock.runFor(1000);
  await page.evaluate(()=>{const g=window.__PANDA_QA__.game;g.entities=[{id:1,type:'assignments',lane:1,z:g.distance+3,resolved:false}];});
  await page.keyboard.press('ArrowUp');await page.clock.runFor(500);assert.equal((await state()).state,'playing');
  await page.clock.runFor(600);
  await page.evaluate(()=>{const g=window.__PANDA_QA__.game;g.entities=[{id:2,type:'low',lane:1,z:g.distance+3,resolved:false}];});
  await page.keyboard.press('ArrowDown');await page.clock.runFor(500);assert.equal((await state()).state,'playing');
  await page.clock.runFor(700);
  await page.evaluate(()=>{const g=window.__PANDA_QA__.game;g.entities=[{id:3,type:'professor',lane:1,z:g.distance+3,resolved:false}];});
  await page.clock.runFor(700);assert.equal((await state()).state,'gameover');assert.ok(await page.getByRole('heading',{name:'Упс, препятствие!'}).isVisible());
  await page.screenshot({path:`artifacts/${name}-gameover.png`});
  await page.getByRole('button',{name:'Ещё забег'}).click({force:name === 'webkit'});assert.ok((await state()).distance<2);assert.equal((await state()).pizzas,0);
  // Full authored run, no entity deletion or immunity. Automated player chooses
  // clear lanes via ordinary keyboard events with a 1.1 second lookahead.
  let iterations=0;
  while((await state()).state==='playing'&&iterations++<650){
    const steering=await page.evaluate(()=>{
      const g=window.__PANDA_QA__.game;
      const next=g.entities.find(e=>!e.resolved&&e.type!=='pizza'&&e.z-g.distance<g.speed*1.1);
      if(!next)return null;
      const row=g.entities.filter(e=>!e.resolved&&e.type!=='pizza'&&e.z===next.z);
      const safe=[0,1,2].find(l=>!row.some(e=>e.lane===l));return g.lane<safe?'ArrowRight':g.lane>safe?'ArrowLeft':null;
    });
    if(steering)await page.keyboard.press(steering);
    await page.clock.runFor(160);
    const shot=await state();if(shot.distance>400&&shot.distance<404)await page.screenshot({path:`artifacts/${name}-playing.png`});
  }
  const finish=await state();assert.equal(finish.state,'finish');assert.equal(finish.distance,900);assert.ok(finish.pizzas>0);assert.equal(finish.score,900+finish.pizzas*10);
  await page.screenshot({path:`artifacts/${name}-finish.png`});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('panda-pizza-rush:v1')));assert.equal(stored.best,finish.score);assert.equal(stored.last.delivered,true);
  await page.reload();await page.waitForFunction(()=>!!window.__PANDA_QA__);assert.ok((await page.locator('#best').innerText()).includes(String(finish.score).slice(-3)));
  // Screen controls, mute preference and restart from the menu.
  await page.getByRole('button',{name:'Доставить пиццу'}).click({force:name === 'webkit'});await page.getByRole('button',{name:'Влево',exact:true}).tap({force:name === 'webkit'});assert.equal((await state()).lane,0);
  if(await page.locator('#sound').isVisible()){
    await page.getByRole('button',{name:'Включить звук'}).tap({force:name === 'webkit'});assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
  }
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'В меню',exact:true}).click({force:name === 'webkit'});
  for(const viewport of [{width:360,height:640},{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
    await page.setViewportSize(viewport);const gameBox=await page.locator('#game').boundingBox();
    assert.ok(gameBox.x>=-1&&gameBox.y>=-1&&gameBox.x+gameBox.width<=viewport.width+1&&gameBox.y+gameBox.height<=viewport.height+1);
    assert.ok(await page.getByRole('button',{name:'Доставить пиццу'}).isVisible());
    const primaryBox=await page.locator('#primary').boundingBox();assert.ok(primaryBox.y+primaryBox.height<=gameBox.y+gameBox.height);
    if(viewport.width===1440)await page.screenshot({path:`artifacts/${name}-desktop.png`});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(responses,[]);
  results.push({engine:name,status:'passed',finish,errors,failedRequests:responses});console.log(`${name}: all browser scenarios passed; ${finish.pizzas} pizzas, ${finish.score} score, ${finish.elapsed.toFixed(1)} s`);
  await context.close();await browser.close();
}
await writeFile('artifacts/browser-results.json',JSON.stringify({base,results},null,2));

