import './style.css';
import { RunnerGame } from './core.js';
import { Renderer } from './renderer.js';
import { InputController } from './input.js';
import { WebPlatformAdapter, LocalStorageAdapter } from './adapters.js';
import { GameAudio } from './audio.js';
import { FINISH_DISTANCE, hintAt, OBSTACLES } from './level.js';
const byId=id=>document.getElementById(id);
const ui=Object.fromEntries(['game','hud','pizza','score','sound','pause','distance','progress','overlay','panel','eyebrow','title','description','stats','instructions','primary','secondary','best','hint','feedback','controls'].map(id=>[id,byId(id)]));
let local;try{local=window.localStorage;}catch{local=null;}
const storage=new LocalStorageAdapter(local),saved=storage.load(),platform=new WebPlatformAdapter(),audio=new GameAudio(saved.sound);
const renderer=new Renderer(byId('canvas'));
let previous=performance.now(),feedbackTime=0;
const game=new RunnerGame({onEvent(event){
  renderer.event(event,game);audio.play(event.type);platform.feedback(event.type);
  if(event.type==='collect'){ui.feedback.textContent='+10 🍕';feedbackTime=.48;}
  if(event.type==='avoid'){ui.feedback.textContent=event.entity.type==='low'?'Чистый подкат!':'Красивый прыжок!';feedbackTime=.7;}
  if(event.type==='hit'||event.type==='finish'){
    saved.last=game.result();saved.best=Math.max(saved.best,saved.last.score);storage.save(saved);showScreen();
  }
  if(event.type==='pause'||event.type==='resume')showScreen();
}});
function soundLabel(){ui.sound.hidden=!audio.supported;ui.sound.setAttribute('aria-pressed',String(audio.enabled));ui.sound.setAttribute('aria-label',audio.enabled?'Выключить звук':'Включить звук');ui.sound.textContent=audio.enabled?'♫':'♪';}
soundLabel();
function showScreen(){
  const state=game.state,playing=state==='playing',paused=state==='paused',result=state==='finish'||state==='gameover';
  ui.game.classList.toggle('result',result);ui.game.classList.toggle('paused',paused);ui.game.dataset.state=state;
  ui.overlay.hidden=playing;ui.hud.hidden=state==='menu';ui.controls.hidden=!playing;ui.hint.hidden=!playing;
  ui.instructions.hidden=state!=='menu';ui.stats.hidden=!result;ui.secondary.hidden=state==='menu';ui.best.textContent=`Рекорд: ${saved.best.toLocaleString('ru-RU')}`;
  ui.panel.setAttribute('aria-label',paused?'Пауза':result?'Результат забега':'Меню игры');
  if(state==='menu'){
    ui.eyebrow.textContent='ДОСТАВКА В СТУДИК';ui.title.innerHTML='<span>PANDA</span><span>PIZZA RUSH</span>';
    ui.description.innerHTML='Пары закончились.<br>Приключение только начинается!';ui.primary.innerHTML='Доставить пиццу <span>→</span>';
  }else if(paused){
    ui.eyebrow.textContent='ПИЦЦА ПОДОЖДЁТ';ui.title.textContent='Небольшой перерыв';
    ui.description.textContent='Продолжи, когда будешь готов. Твой забег сохранён на паузе.';ui.primary.textContent='Продолжить →';
  }else if(result){
    const won=state==='finish';ui.eyebrow.textContent=won?'МИССИЯ ВЫПОЛНЕНА':'ЕЩЁ ОДНА ПОПЫТКА?';
    ui.title.textContent=won?'Пицца доставлена!':'Упс, препятствие!';
    ui.description.textContent=won?'Студик сыт. Панда — герой. А ты? Попробуй собрать ещё больше пиццы!':`${OBSTACLES[game.hit.type].label}. ${game.hit.type==='assignments'?'Прыгай чуть раньше, чтобы оказаться над стопкой.':game.hit.type==='low'?'Скользи под баннером или меняй полосу.':'Обойди его по соседней полосе.'}`;
    ui.stats.innerHTML=`<div><b>${game.score}</b>ОЧКИ</div><div><b>🍕 ${game.pizzas}</b>КУСОЧКИ</div><div><b>${Math.floor(game.distance)} м</b>ДИСТАНЦИЯ</div><div><b>${Math.round(game.elapsed)} с</b>ВРЕМЯ</div>`;
    ui.primary.textContent='Ещё забег →';
  }
  if(!playing) {ui.feedback.textContent='';feedbackTime=0;newInput.cancel();}
}
function start(){game.reset();renderer.effects=[];renderer.hitTime=0;previous=performance.now();audio.unlock();showScreen();ui.primary.blur();}
function pause(){if(game.state==='playing'){game.pause();audio.suspend();}}
function resume(){previous=performance.now();audio.unlock();game.resume();ui.primary.blur();}
function togglePause(){if(game.state==='playing')pause();else if(game.state==='paused')resume();}
const newInput=new InputController(ui.game,action=>{audio.unlock();game.input(action);},togglePause);
ui.primary.addEventListener('click',()=>game.state==='paused'?resume():start());
ui.secondary.addEventListener('click',()=>{game.state='menu';game.action=null;renderer.effects=[];showScreen();});
ui.pause.addEventListener('click',pause);
ui.sound.addEventListener('click',()=>{audio.enabled=!audio.enabled;saved.sound=audio.enabled;storage.save(saved);soundLabel();if(audio.enabled)audio.unlock();else audio.suspend();});
document.querySelectorAll('[data-action]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();audio.unlock();game.input(button.dataset.action);});
  button.addEventListener('click',event=>{if(event.detail===0){audio.unlock();game.input(button.dataset.action);}});
});
platform.onSuspend(()=>{pause();audio.suspend();});
platform.onFocus(()=>{previous=performance.now();});
// Resume is deliberate: returning to a tab never restarts a dangerous run.
let lastHud='';
function frame(now){
  const dt=Math.max(0,Math.min(.1,(now-previous)/1000));previous=now;game.update(dt);renderer.draw(game,dt);
  const hudKey=`${game.score}:${Math.floor(game.distance)}:${game.pizzas}`;
  if(hudKey!==lastHud){ui.pizza.textContent=game.pizzas;ui.score.textContent=game.score;ui.distance.textContent=`${Math.floor(game.distance)} / ${FINISH_DISTANCE} м`;ui.progress.style.width=`${game.distance/FINISH_DISTANCE*100}%`;lastHud=hudKey;}
  if(game.state==='playing'){
    const hint=hintAt(game.distance);ui.hint.hidden=!hint;if(ui.hint.textContent!==hint)ui.hint.textContent=hint;
    if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0)ui.feedback.textContent='';}
  }
  requestAnimationFrame(frame);
}
showScreen();byId('loader').hidden=true;requestAnimationFrame(frame);
// Opt-in QA instrumentation is absent during ordinary play. No shortcuts or
// cheat controls are exposed in the customer interface.
if(new URLSearchParams(location.search).has('qa')){
  window.__PANDA_QA__={game,audio,storage,renderer,start,pause,resume,snapshot:()=>({state:game.state,distance:game.distance,score:game.score,pizzas:game.pizzas,x:game.x,lane:game.lane,action:game.action,speed:game.speed,elapsed:game.elapsed})};
}
