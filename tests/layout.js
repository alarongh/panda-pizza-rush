import { chromium,firefox,webkit } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
for(const [name,engine]of Object.entries({chromium,firefox,webkit})){
  const browser=await engine.launch();const page=await browser.newPage();
  for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
    await page.setViewportSize(size);await page.goto(base);
    for(const safe of [0,24]){
      await page.evaluate(value=>{for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty(`--safe-${side}`,`${value}px`);},safe);
      const box=await page.locator('#game').boundingBox(),canvas=await page.locator('#canvas').boundingBox();
      assert.ok(Math.abs(box.width/box.height-9/16)<.002,`${name}: game aspect changed`);
      assert.ok(Math.abs(canvas.width/canvas.height-9/16)<.002,`${name}: canvas stretched`);
      assert.ok(box.x>=safe-1&&box.y>=safe-1&&box.x+box.width<=size.width-safe+1&&box.y+box.height<=size.height-safe+1);
      const primary=await page.locator('#primary').boundingBox();assert.ok(primary.y+primary.height<box.y+box.height);
    }
  }
  await page.screenshot({path:`artifacts/${name}-layout.png`});await browser.close();console.log(`${name}: portrait/landscape and simulated 24px safe areas passed`);
}
