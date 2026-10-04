import { FINISH_DISTANCE, VIEW_DISTANCE } from './level.js';
const W = 450, H = 800;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.time = 0; this.effects = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize = () => {
      const density = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * density); canvas.height = Math.round(H * density);
      this.density = density;
    };
    this.resize(); window.addEventListener('resize', this.resize);
    this.sprites = new Map();
    for (const type of ['pizza', 'professor', 'desk', 'assignments', 'low', 'coffee', 'tree', 'planter', 'door']) {
      const image = document.createElement('canvas'); image.width = 280; image.height = 300;
      const previous = this.ctx; this.ctx = image.getContext('2d'); this.ctx.translate(140, 270);
      this.drawObject(type); this.ctx = previous; this.sprites.set(type, image);
    }
  }
  poly(points, color, stroke = null, width = 2) {
    const c = this.ctx; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  round(x, y, w, h, r, color, stroke) {
    const c = this.ctx; c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = color; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 3; c.stroke(); }
  }
  ellipse(x, y, rx, ry, color) { const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  text(text, x, y, size, color, align = 'center') { const c = this.ctx; c.fillStyle = color; c.font = `900 ${size}px system-ui`; c.textAlign = align; c.fillText(text, x, y); }
  line(points, color, width = 2) {
    const c = this.ctx; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.stroke();
  }
  pizza(x = 0, y = -30, scale = 1) {
    const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale);
    this.poly([[-28,-38],[30,-38],[0,30]], '#ffcf51', '#c87828', 3);
    this.line([[-29,-39],[-12,-44],[12,-44],[31,-39]], '#e99b42', 12);
    this.line([[-27,-40],[-10,-44],[12,-44],[29,-40]], '#ffe099', 4);
    this.ellipse(-10,-22,6,6,'#e9593e'); this.ellipse(12,-18,7,7,'#e9593e'); this.ellipse(0,1,6,6,'#e9593e');
    this.line([[-12,-7],[-8,-4]], '#539559', 3); this.line([[7,-31],[11,-33]], '#539559', 3); c.restore();
  }
  shadow(x,y,rx,ry,alpha=.2) { this.ellipse(x,y,rx,ry,`rgba(25,71,66,${alpha})`); }
  drawObject(type) {
    const c = this.ctx;
    if (type === 'pizza') {
      this.ellipse(0,-59,48,48,'#ffd85624'); this.pizza(0,-60,1.12); return;
    }
    this.shadow(0,-2, type==='low'?76:49,12);
    if (type === 'assignments') {
      for (let i=0;i<4;i++) {
        const x = i%2 ? -48 : -42, y = -25-i*16;
        this.poly([[x,y],[x+83,y],[x+96,y-8],[x+12,y-8]],'#fff3cf','#d79653');
        this.round(x,y,83,13,2,i%2?'#ffdb80':'#fff8dd','#d79653');
        this.line([[x+9,y+5],[x+53,y+5]],'#dcba84');
      }
      this.round(-37,-88,81,23,5,'#f47a48'); this.text('ДЕДЛАЙН',3,-72,10,'#fff8e6');
      this.poly([[20,-91],[12,-112],[37,-112]],'#fbd261');
    } else if (type === 'low') {
      this.round(-76,-145,13,143,5,'#2e8c99'); this.round(63,-145,13,143,5,'#2e8c99');
      this.round(-80,-149,160,58,8,'#b5426a','#87324f');
      this.line([[-69,-136],[-50,-105],[-28,-136],[-7,-105],[14,-136],[35,-105],[56,-136]],'#e8788c',5);
      this.round(-40,-133,80,29,5,'#fff1d1'); this.text('↓ ПОДКАТ',0,-114,12,'#a73e60');
      this.round(-82,-8,26,12,4,'#256d78'); this.round(56,-8,26,12,4,'#256d78');
    } else if (type === 'coffee') {
      this.round(-42,-136,84,134,10,'#286b78','#174b59');
      this.round(-37,-129,73,33,6,'#f0ac63'); this.text('КОФЕ',0,-107,17,'#fff8e6');
      this.round(-25,-85,50,58,5,'#153e4b'); this.round(-15,-46,30,21,3,'#fff3d9');
      this.ellipse(0,-47,15,4,'#ddae72'); this.line([[0,-75],[0,-57]],'#e9c28b',3);
      this.round(30,-88,5,5,2,'#80d2bd'); this.round(-34,-13,68,7,2,'#174550');
      this.round(-27,-153,55,18,5,'#fbdb73'); this.text('☕',0,-139,15,'#654630');
    } else if (type === 'desk') {
      this.round(-26,-67,51,50,10,'#31647b'); this.round(-22,-18,13,22,4,'#234852'); this.round(10,-18,13,22,4,'#234852');
      this.round(-29,-118,57,57,17,'#596bc4'); this.ellipse(0,-129,21,24,'#f5bf96');
      this.round(-22,-151,44,19,9,'#493d54'); this.line([[-27,-98],[-45,-75]],'#f2bd96',13); this.line([[27,-98],[46,-75]],'#f2bd96',13);
      this.round(-61,-72,123,15,5,'#e6a364','#98634e'); this.round(-54,-57,9,56,3,'#935e4c'); this.round(44,-57,9,56,3,'#935e4c');
      this.round(-30,-113,63,43,5,'#294f65','#a3dbda'); this.round(-23,-107,49,31,2,'#83d3d5');
      this.text('</>',1,-88,17,'#2d7c8b'); this.round(-10,-73,24,4,1,'#375c69'); this.round(-46,-84,10,12,2,'#f7edd7');
    } else if (type === 'professor') {
      this.round(-25,-60,19,57,6,'#46536a'); this.round(7,-60,19,57,6,'#46536a');
      this.round(-31,-10,29,13,5,'#334358'); this.round(4,-10,29,13,5,'#334358');
      this.round(-37,-132,74,82,18,'#79578e','#544469'); this.poly([[-12,-128],[0,-108],[12,-128]],'#fff0d1');
      this.poly([[0,-110],[-5,-97],[0,-71],[6,-97]],'#efb558');
      this.line([[-32,-112],[-46,-69]],'#79578e',18); this.line([[32,-111],[48,-67]],'#79578e',18);
      this.ellipse(0,-151,27,30,'#f4c098'); this.ellipse(0,-174,26,12,'#d2e0d3');
      this.round(-27,-164,13,19,5,'#d2e0d3'); this.round(14,-164,13,19,5,'#d2e0d3');
      this.round(-21,-155,18,12,4,'#fff1d2','#49616c'); this.round(3,-155,18,12,4,'#fff1d2','#49616c'); this.line([[-2,-151],[3,-151]],'#49616c',3);
      this.ellipse(-12,-150,2,2,'#334954'); this.ellipse(11,-150,2,2,'#334954'); this.line([[-7,-134],[7,-134]],'#ad7361',2);
      this.round(-57,-85,30,40,3,'#58a493','#306d71'); this.text('5?',-42,-61,17,'#fff3d4');
    } else if (type === 'tree') {
      this.round(-7,-108,15,111,4,'#9b7350'); this.line([[0,-61],[29,-86]],'#9b7350',7);
      this.ellipse(0,-124,48,55,'#47986c'); this.ellipse(-29,-111,30,34,'#5dae72'); this.ellipse(25,-132,32,41,'#74bc75'); this.ellipse(-12,-151,28,25,'#8cc879');
    } else if (type === 'planter') {
      this.poly([[-32,-37],[34,-37],[25,0],[-24,0]],'#e89464','#c67952'); this.round(-37,-43,77,13,4,'#fabb7e');
      for (let i=0;i<5;i++) { this.line([[i*13-26,-41],[i*13-26,-61-i%2*13]],'#549c64',4); this.ellipse(i*13-26,-67-i%2*13,9,9,i%2?'#fbd277':'#f27b77'); }
    } else if (type === 'door') {
      this.round(-115,-206,230,207,16,'#f8cc7d','#d3985a');
      this.round(-94,-169,188,170,10,'#e38f59'); this.round(-78,-155,156,155,10,'#2f7c83','#235c68');
      this.round(-68,-140,63,115,4,'#78c6c4'); this.round(5,-140,63,115,4,'#6abcbf');
      this.line([[0,-145],[0,0]],'#205567',7); this.round(-15,-61,5,23,2,'#ffdf8b'); this.round(10,-61,5,23,2,'#ffdf8b');
      this.round(-103,-215,206,43,10,'#f2b751','#bd8145'); this.text('СТУДИК',0,-187,25,'#31686e');
      this.pizza(0,-242,.45); this.round(-108,-4,216,14,4,'#f9dea4');
    }
  }
  project(lane, z) {
    const s = 1 / (1 + Math.max(-2,z) / 17);
    return { x: 225 + (lane-1)*130*s, y: 206+456*s, s };
  }
  sprite(type, x,y,s,rotation=0) {
    const c = this.ctx; c.save(); c.translate(x,y); c.scale(s,s); c.rotate(rotation);
    c.drawImage(this.sprites.get(type),-140,-270); c.restore();
  }
  campus(distance) {
    const c = this.ctx;
    const sky = c.createLinearGradient(0,0,0,340); sky.addColorStop(0,'#67cdd7'); sky.addColorStop(1,'#d5efdf'); c.fillStyle=sky; c.fillRect(0,0,W,H);
    this.ellipse(358,119,39,39,'#fff0b1'); this.ellipse(350,115,51,51,'#fff2be35');
    for (const [x,y] of [[75,114],[270,61],[411,196]]) { this.ellipse(x,y,34,10,'#f0f9e8'); this.ellipse(x-10,y-6,19,14,'#f0f9e8'); }
    this.poly([[0,190],[58,178],[130,205],[168,220],[267,210],[325,184],[390,167],[450,186],[450,360],[0,360]],'#80c5ac');
    // University wings frame the route, with warm façades and teal windows.
    this.poly([[0,143],[112,196],[112,382],[0,505]],'#e8a773');
    this.poly([[0,126],[114,189],[114,212],[0,156]],'#e8825b');
    this.poly([[450,142],[338,197],[338,383],[450,505]],'#f9d191');
    this.poly([[450,124],[337,188],[337,212],[450,155]],'#f4aa6e');
    for (let floor=0;floor<3;floor++) for (let j=0;j<3;j++) {
      const x=10+j*35, y=188+floor*73+j*13, h=41-j*5;
      this.poly([[x,y],[x+23,y+11],[x+23,y+h+11],[x,y+h]],'#397d8a','#ffdc9e',3);
      this.line([[x+4,y+5],[x+4,y+h-3]],'#82bcc1',3);
      const xr=450-x; this.poly([[xr,y],[xr-23,y+11],[xr-23,y+h+11],[xr,y+h]],'#40868e','#fff0bd',3);
      this.line([[xr-4,y+5],[xr-4,y+h-3]],'#a1d3c6',3);
    }
    this.poly([[0,387],[103,316],[112,330],[0,420]],'#338a8c'); this.poly([[450,387],[347,316],[338,330],[450,420]],'#ed785c');
    this.round(158,156,134,80,4,'#ffd38a'); this.round(148,153,154,15,4,'#f29963');
    this.round(204,136,42,22,8,'#3b888a'); this.text('УНИВЕР',225,152,9,'#fff1cb');
    for(let i=0;i<5;i++) this.round(166+i*24,180,16,24,2,'#4c98a0');
    this.sprite('door',225,251,.28);
    this.poly([[0,407],[160,222],[291,222],[450,407],[450,800],[0,800]],'#a5ce80');
    this.poly([[185,220],[265,220],[530,800],[-80,800]],'#efc889');
    this.poly([[185,220],[-80,800],[-110,800],[177,220]],'#fbe3ab');
    this.poly([[265,220],[530,800],[565,800],[273,220]],'#fbe3ab');
    // Pavers and lane markers move in perspective with the actual run.
    for (let z = 3-(distance%7);z<100;z+=7) {
      if(z<0) continue;
      const p=this.project(1,z); const half=202*p.s;
      this.line([[225-half,p.y],[225+half,p.y]],'#d7b68088',Math.max(.5,1.6*p.s));
    }
    for(let z=3-(distance%9);z<80;z+=9) {
      if(z<0) continue;
      for(const lane of [.5,1.5]) { const a=this.project(lane,z),b=this.project(lane,z+3);
        this.line([[a.x,a.y],[b.x,b.y]],'#fff1c9',Math.max(1,5*a.s)); }
    }
    for(let z=10-(distance%23);z<100;z+=23) {
      if(z<0) continue;
      const p=this.project(1,z);
      this.sprite('tree',225-273*p.s,p.y,p.s*.95);
      this.sprite('planter',225+254*p.s,p.y,p.s*.8);
    }
    // Warm light across the foreground without reducing silhouette contrast.
    const light=c.createLinearGradient(0,200,450,800); light.addColorStop(0,'#fff0c000');light.addColorStop(1,'#ffecb31a');c.fillStyle=light;c.fillRect(0,200,W,600);
  }
  panda(x,y,action,phase,jumpHeight,hit=false,finish=false) {
    const c=this.ctx, run=this.reducedMotion?0:Math.sin(phase*14), stride=action==='slide'?0:run;
    this.shadow(x,y+3,39,10,jumpHeight>.1?.12:.23);
    c.save();c.translate(x,y-jumpHeight*94);if(hit)c.rotate(-.18);
    if(action==='slide') { c.translate(0,12); c.scale(1.16,.57); }
    const bounce=action==='jump'?0:Math.abs(run)*3;
    c.translate(0,-bounce);
    this.line([[-18,-33],[-22-stride*5,-4-stride*8]],'#253b41',18);
    this.line([[18,-33],[22+stride*5,-4+stride*8]],'#253b41',18);
    this.ellipse(-23-stride*5,-5-stride*8,15,8,'#22343e');this.ellipse(23+stride*5,-5+stride*8,15,8,'#22343e');
    this.line([[-31,-91],[-46,-55+stride*10]],'#cb413b',19);this.ellipse(-46,-54+stride*10,11,13,'#283b40');
    this.line([[31,-91],[46,-55-stride*10]],'#f7634b',19);this.ellipse(46,-54-stride*10,11,13,'#283b40');
    this.round(-38,-103,76,76,26,'#ec4f40','#b53c37');
    this.round(-33,-100,63,20,10,'#fa7355');this.round(-30,-35,60,10,4,'#b73836');
    this.line([[-22,-92],[-24,-48]],'#763a35',5);this.line([[22,-92],[24,-48]],'#763a35',5);
    // Insulated pizza delivery backpack seen from behind.
    this.round(-27,-90,54,47,10,'#f4b651','#b47336'); this.round(-25,-88,50,9,4,'#ffd978');this.pizza(0,-65,.35);
    this.ellipse(-24,-135,17,18,'#263b40');this.ellipse(24,-135,17,18,'#263b40');
    this.ellipse(-24,-137,8,8,'#415052');this.ellipse(24,-137,8,8,'#415052');
    this.ellipse(0,-119,40,35,'#fbf3df');this.ellipse(9,-118,30,30,'#fff9e9');
    this.ellipse(-29,-111,10,19,'#293e40');this.ellipse(29,-111,10,19,'#293e40');
    this.ellipse(-7,-137,12,6,'#fffdf1'); this.round(-26,-93,52,11,5,'#c44239');
    if(finish){this.ellipse(-42,-59,7,7,'#ffe289');this.ellipse(43,-58,7,7,'#ffe289');}
    c.restore();
  }
  event(event,game) {
    if(event.type==='collect') { const p=this.project(event.entity.lane,0);for(let i=0;i<9;i++)this.effects.push({x:p.x,y:p.y-60,vx:(i-4)*29,vy:-110-Math.random()*70,life:.6,color:i%2?'#ffdf68':'#ff884f'}); }
    if(event.type==='finish')for(let i=0;i<80;i++)this.effects.push({x:Math.random()*450,y:Math.random()*-500,vx:(Math.random()-.5)*60,vy:90+Math.random()*80,life:5,color:['#ffd462','#f27164','#71bcb6','#fff7d1'][i%4]});
    if(event.type==='hit')this.hitTime=.34;
  }
  draw(game,dt) {
    this.time+=dt;const c=this.ctx;c.setTransform(this.density,0,0,this.density,0,0);
    const active=game.state==='playing';const distance=game.state==='menu'?24:game.distance;
    c.save();if(this.hitTime>0&&!this.reducedMotion){c.translate(Math.sin(this.time*75)*this.hitTime*13,0);this.hitTime-=dt;}
    this.campus(distance);
    const visible=game.entities.filter(e=>!e.resolved&&e.z-distance< VIEW_DISTANCE&&e.z-distance> -3).sort((a,b)=>b.z-a.z);
    if(game.state==='menu') {
      this.sprite('pizza',169,469,.63,-.22);this.sprite('pizza',293,408,.48,.18);
      this.sprite('assignments',330,553,.52);this.sprite('professor',118,451,.38);
    }else{
      for(const e of visible) {
        const p=this.project(e.lane,e.z-distance);
        this.sprite(e.type,p.x,p.y,p.s,e.type==='pizza'&& !this.reducedMotion?Math.sin(this.time*2+e.z)*.14:0);
      }
    }
    if(distance>FINISH_DISTANCE-95){const z=FINISH_DISTANCE-distance;const p=this.project(1,z);this.sprite('door',p.x,p.y,p.s*.92);}
    const player=this.project(game.state==='menu'?1:game.x,0);
    this.panda(player.x,player.y,game.action,active?game.elapsed:this.time*.45,game.jumpHeight,game.state==='gameover',game.state==='finish');
    if(game.state==='gameover'&&game.hit){const p=this.project(game.hit.lane,0);c.globalAlpha=.8;this.sprite(game.hit.type,p.x,p.y,1);c.globalAlpha=1;}
    if(game.state!=='paused') {
      for(const effect of this.effects){effect.x+=effect.vx*dt;effect.y+=effect.vy*dt;effect.vy+=160*dt;effect.life-=dt;c.globalAlpha=Math.min(1,effect.life*3);this.round(effect.x,effect.y,5,8,2,effect.color);}
      this.effects=this.effects.filter(p=>p.life>0);c.globalAlpha=1;
    }
    c.restore();
    if(this.hitTime>0){c.fillStyle=`rgba(238,83,64,${this.hitTime*.7})`;c.fillRect(0,0,W,H);}
  }
}
