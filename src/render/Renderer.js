import {levels} from '../data/levels.js';
import {characterFiles,animalSprites,humanSprites} from '../data/assets.js';
import {introFamily,walkFrame} from '../data/familyScene.js';
import {spriteFrames} from '../data/spriteFrames.js';
import {createParallaxStrip,parallaxPhase} from './parallax.js';
import {attacks} from '../entities/Beethoven.js';
const files=levels.map(l=>l.bg);
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.images={};this.strips={};this.t=0;this.resize();if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas)}window.addEventListener('resize',()=>this.resize())}
 resize(){const bounds=this.canvas.getBoundingClientRect?.();const units=Math.max(30,Math.min(240,Math.ceil((bounds?.width||480)*(window.devicePixelRatio||1)/16)));const width=units*16,height=units*9;if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height}this.c.setTransform(width/480,0,0,height/270,0,0);this.c.imageSmoothingEnabled=true;this.c.imageSmoothingQuality='high'}
 async load(){this.errors=[];await Promise.all([...files,...characterFiles].map(async f=>{const im=new Image();im.src=window.BEETHOVEN_ASSETS?.[f]||'./assets/'+f;try{await im.decode();this.images[f]=im}catch{this.errors.push(f)}}))}
 text(s,x,y,color='#fff4d6',size=8,align='left'){const c=this.c;c.font=`${size}px monospace`;c.textAlign=align;c.fillStyle='#112d36';c.fillText(s,x+1,y+1);c.fillStyle=color;c.fillText(s,x,y)}
 rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(Math.round(x),Math.round(y),w,h)}
 background(index,cam=0,t=0){const c=this.c,l=levels[index],im=this.images[l.bg];this.rect(0,0,480,270,index===2?'#829fa7':'#8bc8df');if(im){const strip=this.strips[l.bg]??=createParallaxStrip(im),scale=272/strip.height,phase=parallaxPhase(cam*.24,strip.width*scale),pattern=c.createPattern(strip,'repeat-x');c.save();c.translate(-phase,254-272);c.scale(scale,scale);c.fillStyle=pattern;c.fillRect(0,0,(480+phase)/scale,strip.height);c.restore()}for(let i=0;i<4;i++){const x=((i*177-cam*.08+t*1.4)%700+700)%700-100;this.rect(x,22+i%2*15,38,5,'#ffffff55');this.rect(x+8,17+i%2*15,22,7,'#ffffff55')}if(index===2)this.rect(0,0,480,222,'#27374a48');if(index===4)this.rect(0,0,480,222,'#ffbe6030');}
 sprite(kind,x,y,frame=0,face=1){const spec=animalSprites[kind]||humanSprites[kind],c=this.c,im=this.images[spec.file];if(!im)return;const frames=spriteFrames[spec.file].frames,index=spec.row===undefined?frame:spec.row*spec.columns+frame;const box=frames[index],sequence=spec.row===undefined?frames:frames.slice(spec.row*spec.columns,(spec.row+1)*spec.columns);const scale=Math.min(spec.width/Math.max(...sequence.map(f=>f.w)),spec.height/Math.max(...sequence.map(f=>f.h)));const w=box.w*scale,h=box.h*scale;c.save();c.translate(x,y);c.scale(face,1);c.drawImage(im,box.x,box.y,box.w,box.h,-w/2,-h,w,h);c.restore()}
 animal(kind,x,y,frame=0,face=1){this.sprite(kind,x,y,frame,face)}
 dog(x,y,frame=0,face=1){this.sprite('beethoven',x,y,frame,face)}
 player(p,t){
  const c=this.c,a=p.attack,progress=a?a.elapsed/attacks[a.kind].duration:0,swing=Math.sin(progress*Math.PI),face=a?.face||p.face;
  c.save();c.translate(p.x+p.w/2,p.y+p.h);if(a)c.rotate(face*swing*(a.kind==='paw'?-.12:.12));
  this.sprite(p.power>0?'beethovenVasco':'beethoven',0,0,p.frame(t),face);c.restore();
  if(!a)return;
  c.save();c.translate(p.x+p.w/2,p.y+8);c.scale(face,1);c.lineCap='round';
  if(a.kind==='paw'){
   const x=18+swing*22,y=7-swing*7;
   c.strokeStyle='#855330';c.lineWidth=7;c.beginPath();c.moveTo(9,9);c.lineTo(x,y);c.stroke();
   c.strokeStyle='#fff2ce';c.lineWidth=5;c.stroke();c.fillStyle='#fff2ce';c.beginPath();c.ellipse(x+2,y,7,5,-.2,0,Math.PI*2);c.fill();
   for(let i=0;i<3;i++){c.fillStyle='#b58456';c.beginPath();c.arc(x+3+i*2,y-3+i*2,1.3,0,Math.PI*2);c.fill()}
   c.strokeStyle='#ffe7a4';c.lineWidth=1.5;c.beginPath();c.arc(20,1,10+swing*15,-.9,.6);c.stroke();
  }else{
   const x=22+swing*10,opening=3+(1-swing)*7;
   c.strokeStyle='#ffe3b1';c.lineWidth=4;c.beginPath();c.moveTo(15,-5);c.lineTo(x,-opening);c.lineTo(x+7,-opening+2);c.moveTo(15,4);c.lineTo(x,opening);c.lineTo(x+7,opening-2);c.stroke();
   c.strokeStyle='#fff';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+i*3,-opening+2);c.lineTo(x+i*3,-opening+5);c.moveTo(x+i*3,opening-2);c.lineTo(x+i*3,opening-5);c.stroke()}
  }
  c.restore();
 }
 rival(d,t){
  const c=this.c,center=d.x+d.w/2;
  c.save();if(d.defeated)c.globalAlpha=.6;else if(d.inv>0&&Math.floor(t*18)%2)c.globalAlpha=.45;
  const frame=d.defeated?0:d.state==='windup'||d.state==='charge'?3:d.state==='stunned'?0:d.state==='patrol'||d.state==='return'?1+Math.floor(t*7)%2:0;
  this.animal(d.breed,center,d.y+d.h,frame,d.face);c.restore();
  if(d.defeated){this.text('✓',center,d.y-7,'#cce49a',10,'center');return}
  if(d.state==='windup'){this.text('!',center,d.y-12,'#ffe29a',11,'center');this.rect(d.face>0?center:center-40,220,40,2,'#e79b5a99')}
  if(d.state==='stunned')this.text('✦',center,d.y-10,'#ffe7a4',10,'center');
  if(d.calm>0)this.text('♪',center,d.y-10,'#b8f2c7',9,'center');
  if(d.hp<d.maxHp||['windup','charge','recover'].includes(d.state)){this.rect(center-15,d.y-5,30,3,'#563e43');this.rect(center-15,d.y-5,30*d.hp/d.maxHp,3,'#edba7f')}
 }
 human(x,y,variant=0,walk=0,face=1){this.sprite(variant?'julia':'elomir',x,y,walk?walkFrame(walk,1):0,face)}
 bone(x,y,t){const c=this.c;c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*3+x)*2));this.rect(-5,-1,10,3,'#fff1bc');for(const [a,b]of[[-6,-3],[-6,1],[4,-3],[4,1]])this.rect(a,b,3,3,'#fff1bc');c.restore()}
 hazard(h){
  const c=this.c;c.save();c.translate(h.x,h.y);
  this.rect(-2,h.h-2,h.w+4,3,'#9b504c');
  if(h.type==='thorns'){
   c.strokeStyle='#455a32';c.lineWidth=3;c.beginPath();c.moveTo(0,12);c.quadraticCurveTo(h.w/2,4,h.w,12);c.stroke();
  }
  for(let i=0;i<4;i++){
   const x=i*h.w/4,tip=i%2?0:4;
   c.beginPath();c.moveTo(x,14);c.lineTo(x+3,tip);c.lineTo(x+9,14);c.closePath();
   c.fillStyle=h.type==='glass'?(i%2?'#90d7d4':'#d7f1e9'):h.type==='thorns'?'#688341':'#9ea7b1';c.fill();
   c.strokeStyle=h.type==='glass'?'#e9ffff':h.type==='thorns'?'#a4af68':'#dde0d9';c.lineWidth=.7;c.stroke();
   if(h.type==='glass'){c.beginPath();c.moveTo(x+3,4);c.lineTo(x+4,11);c.stroke()}
  }
  c.restore();
 }
 chicken(item,t){
  if(item.eaten)return;const c=this.c,x=item.x+8,y=item.y+14;
  c.save();c.translate(x,y);
  // A subtle golden glint invites exploration; approaching reveals the food.
  c.fillStyle='#375b36';c.beginPath();c.ellipse(0,0,18,6,0,0,Math.PI*2);c.fill();
  if(item.revealed){
   c.translate(0,-8+Math.sin(t*4)*2);c.fillStyle='#ffce6844';c.beginPath();c.arc(0,-3,15,0,Math.PI*2);c.fill();
   c.save();c.rotate(-.6);c.fillStyle='#fff0cb';c.fillRect(1,-1,12,4);
   for(const y of [-1,3]){c.beginPath();c.arc(13,y,3,0,Math.PI*2);c.fill()}
   c.fillStyle='#8b401e';c.beginPath();c.ellipse(-3,0,9,6,0,0,Math.PI*2);c.fill();
   c.fillStyle='#d98837';c.beginPath();c.ellipse(-4,-1,7,4.5,0,0,Math.PI*2);c.fill();
   c.fillStyle='#f1b65b';c.beginPath();c.ellipse(-6,-2,3,1.7,-.3,0,Math.PI*2);c.fill();c.restore();
   c.translate(0,8-Math.sin(t*4)*2);
  }
  for(let i=0;i<5;i++){
   c.fillStyle=i%2?'#6b8d45':'#4d753e';c.beginPath();c.ellipse((i-2)*6,-2,4,7,(i-2)*.4,0,Math.PI*2);c.fill();
  }
  this.text('✦',15,-12,Math.sin(t*3)>0?'#ffdd87':'#c19c64',8,'center');c.restore();
 }
 boss(b,t){
  const c=this.c,center=b.x+b.w/2;
  c.save();c.fillStyle='#152a3344';c.beginPath();c.ellipse(center,223,b.w*.6,4,0,0,Math.PI*2);c.fill();
  if(b.active&&b.state==='windup'){
   this.rect(b.face<0?center-140:center,218,140,4,'#e27c5b88');
   this.text('VAI INVESTIR!',center,b.y-20,'#ffe29a',7,'center');
  }
  if(b.active&&b.state==='recover')this.text('AGORA!',center,b.y-20,'#cdf0a0',7,'center');
  if(b.inv>0&&Math.floor(t*18)%2)c.globalAlpha=.45;
  const cat=b.kind==='tabby'||b.kind==='tuxedo';
  const frame=b.defeated?3:b.kind==='rat'?(b.state==='charge'?2:b.state==='recover'?3:b.state==='prowl'?1:0):b.state==='charge'?(cat?2:3):b.state==='windup'?(cat?0:3):b.state==='prowl'?1+Math.floor(t*7)%2:0;
  c.translate(center,b.y+b.h);const scale=b.kind==='rat'?1.12:1.7;c.scale(scale,scale);this.sprite(b.kind,0,0,frame,b.face);c.restore();
  if(b.defeated)this.text('✓',center,b.y-12,'#cce49a',12,'center');
 }
 gate(x,open=false){this.rect(x-18,147,8,75,'#f0d3a1');this.rect(x+55,147,8,75,'#f0d3a1');this.rect(x-20,143,12,5,'#ba7447');this.rect(x+53,143,12,5,'#ba7447');if(!open){for(let i=0;i<8;i++)this.rect(x-7+i*8,165,3,57,'#465e61');this.rect(x-7,173,62,3,'#465e61');this.rect(x-7,207,62,3,'#465e61')}this.text('LAR',x+21,155,'#fff3bd',7,'center')}
 level(g){const {level:l,player:p}=g,cam=g.cam,c=this.c,t=g.time;this.background(l.index,cam,t);c.save();c.translate(-cam,0);
 // Silhuetas próximas e mobiliário repetido com velocidades distintas.
 for(let x=Math.floor(cam/280)*280;x<cam+650;x+=280){this.rect(x,188,2,34,'#3c6862');this.rect(x-6,182,14,7,'#f4d896');this.rect(x+65,214,20,8,'#446d55');this.rect(x+69,209,13,7,'#61894d')}
 for(const gap of l.gaps){this.rect(gap.x,222,gap.w,48,'#263e4b');this.rect(gap.x,251,gap.w,19,'#49727c');this.rect(gap.x+4,255,gap.w-8,2,'#81b8bb')}
 for(const s of l.ground){this.rect(s.x,s.y,s.w,48,'#745b48');this.rect(s.x,s.y,s.w,4,l.index===2?'#72918d':'#9cb76b');this.rect(s.x,s.y+4,s.w,4,'#d0b58a');for(let x=Math.floor(Math.max(s.x,cam)/24)*24;x<Math.min(s.x+s.w,cam+490);x+=24){this.rect(x+4,239,8,2,'#9e7c55');this.rect(x+14,255,7,2,'#4e4c44')}}
 for(const s of l.slippery){this.rect(s.x,220,s.w,2,'#9ee5ef');this.text('MOLHADO',s.x+3,216,'#b9edf5',6)}
 for(const s of l.platforms){if(s.x<cam-120||s.x>cam+500)continue;this.rect(s.x,s.y,s.w,s.h,'#8b634a');this.rect(s.x,s.y,s.w,3,s.moving?'#e9bc68':'#bcc687');this.rect(s.x+3,s.y+5,s.w-6,2,'#b68b5b');for(let px=6;px<s.w-6;px+=17)this.rect(s.x+px,s.y+7,5,1,'#6c513e');if(s.moving){this.rect(s.x+8,s.y+10,2,17,'#6c7371');this.rect(s.x+s.w-10,s.y+10,2,17,'#6c7371')}}
 for(const cp of l.checkpoints){this.rect(cp.x,185,3,37,'#e2d1a4');this.rect(cp.x+3,185,20,12,cp.x<=g.checkpoint?'#edd28a':'#6a9a92');this.text('♥',cp.x+7,194,'#fff4d6',8)}
 for(const b of l.bones)if(!g.collected.has(b.id)&&b.x>cam-10&&b.x<cam+490)this.bone(b.x,b.y,t);
 for(const chicken of l.chickens)if(chicken.x>cam-30&&chicken.x<cam+510)this.chicken(chicken,t);
 for(const h of l.hazards)this.hazard(h);
 for(const cat of l.cats){if(cat.x<cam-60||cat.x>cam+540)continue;this.animal(cat.coat,cat.x,cat.y,cat.state==='watch'?3:1+Math.floor(t*(cat.flee>0?12:5))%2,cat.vx<0?-1:1);if(cat.flee>0)this.text('!',cat.x,cat.y-29,'#f1d4a0',8,'center')}
 for(const d of l.dogs){if(d.x<cam-70||d.x>cam+550)continue;this.rival(d,t)}
 if(l.index===4)this.gate(l.end+38);else{this.rect(l.end+18,182,3,40,'#345d55');this.rect(l.end+4,181,60,13,'#ead2a0');this.text('CAMINHO →',l.end+34,190,'#355651',7,'center')}
 if(l.boss.x>cam-100&&l.boss.x<cam+580)this.boss(l.boss,t);
 if(l.boss.active&&!l.boss.defeated){for(const x of [l.boss.left,l.boss.right]){this.rect(x,148,2,74,'#d9a46188');this.text('⚑',x,145,'#f5c987',10,'center')}}
 if(!(p.inv>0&&Math.floor(t*14)%2))this.player(p,t);
 if(p.bark>0){c.strokeStyle='#fff1b9';c.beginPath();c.arc(p.x+13+p.face*23,p.y+8,10+(1-p.bark/.4)*13,-1,1);c.stroke()}
 for(const f of g.particles){if(f.gas){c.save();c.globalAlpha=Math.min(1,f.life*2);c.fillStyle=f.color;c.beginPath();c.ellipse(f.x,f.y,f.size+(1-f.life)*8,f.size+(1-f.life)*5,0,0,Math.PI*2);c.fill();c.restore()}else this.rect(f.x,f.y,2,2,f.color)}
 if(g.debug){c.strokeStyle='red';for(const s of [...l.ground,...l.platforms,p])c.strokeRect(s.x,s.y,s.w,s.h)}c.restore();
 this.weather(l.weather,t,l.index===1?p.x/l.width:1);this.hud(g);
 }
 weather(type,t,progress=1){if(type==='rain'||type==='drizzle'||type==='cloud'&&progress>.6){const c=this.c;c.strokeStyle=type==='rain'?'#d0e4ed77':'#d0e4ed44';c.beginPath();for(let i=0;i<(type==='rain'?65:25);i++){const x=(i*73+t*95)%500,y=(i*41+t*260)%280;c.moveTo(x,y);c.lineTo(x-3,y+9)}c.stroke();}}
 bossBar(b){
  const toolbar=document.querySelector('.footer-actions')?.getBoundingClientRect?.(),bounds=this.canvas.getBoundingClientRect?.();
  const overlaps=toolbar&&bounds?.height>0&&toolbar.bottom>bounds.top&&toolbar.top<bounds.bottom;
  const top=overlaps?Math.max(8,(toolbar.bottom-bounds.top)*270/bounds.height+5):8;
  this.rect(139,top,194,26,'#271d2aee');this.text(b.name,236,top+10,'#ffe2b0',7,'center');
  this.rect(147,top+16,178,4,'#69444a');this.rect(147,top+16,178*b.hp/b.maxHp,4,'#ebad72');
 }
 hud(g){this.rect(8,8,110,22,'#12333deb');for(let i=0;i<3;i++){const color=i<g.player.hp?'#f3ad8e':'#42616a',x=15+i*14;this.rect(x,14,4,4,color);this.rect(x+6,14,4,4,color);this.rect(x,17,10,4,color);this.rect(x+2,21,6,2,color);this.rect(x+4,23,2,2,color)}this.bone(76,20,0);this.text(String(g.collected.size).padStart(3,'0'),88,23,'#ffe9ac',9);this.rect(345,8,127,22,'#12333deb');this.text(`${g.level.index+1}/5 · ${g.level.name.length>20?g.level.subtitle:g.level.name}`,409,22,'#e6edd7',6,'center');this.rect(8,35,110,2,'#204448');this.rect(8,35,110*g.player.x/g.level.width,2,'#e4c889');const b=g.level.boss;if(b.active&&!b.defeated){this.bossBar(b)}if(g.player.power>0){this.rect(8,44,114,25,'#111c25ed');this.text(`VASCO · ${Math.ceil(g.player.power)}s`,65,54,'#fff5df',8,'center');this.rect(13,60,104,3,'#3d4148');this.rect(13,60,104*g.player.power/20,3,'#e6e8ce')}if(g.messageTime>0){this.rect(35,242,410,20,'#12333ded');this.text(g.message,240,255,'#fff2ca',8,'center')}
 }
 cutscene(g){
  const part=g.parts[g.part],t=g.partTime,c=this.c,scene=introFamily(g.part,t);
  this.background(part.place,g.mode==='intro'?scene.camera:g.time*8,g.time);this.rect(0,222,480,48,'#697667');
  if(part.place===4){
   this.rect(240,90,180,132,'#eac692');for(let row=0;row<7;row++)this.rect(225+row*10,95-row*4,210-row*20,4,row%2?'#b67c52':'#9b6047');
   this.rect(315,142,35,80,'#785b4d');this.rect(260,120,32,33,'#799da2');this.rect(274,120,3,33,'#e2cba1');this.rect(260,135,32,3,'#e2cba1');this.rect(262,122,10,3,'#c0d6cb');this.rect(318,147,3,65,'#98734e');this.rect(340,180,3,3,'#d9bd7e');for(let by=101;by<220;by+=12)this.rect(244,by,8,2,'#ddba85');
   this.human(g.mode==='ending'?(g.part>0?195:285-Math.min(t*13,90)):290,222,0,g.mode==='ending'&&g.part===0?t*5:0,-1);
   this.human(g.mode==='ending'?(g.part>0?238:340-Math.min(t*15,102)):345,222,1,g.mode==='ending'&&g.part===0?t*5:0,-1);
   this.gate(190,g.mode==='ending'&&g.part>0);if(g.mode==='ending')this.dog(g.part>1?175:110+Math.min(t*15,65),222,[0,9,10,0][Math.floor(t*8)%4],1);
  }else{
   if(scene.leash){
    const leash=scene.leash,fall=leash.fall||0,hand=[[11,-40],[10,-37],[4,-29],[12,-37],[4,-29],[16,-21]][scene.elomir.frame],handX=scene.elomir.x+hand[0],handY=scene.elomir.y+hand[1];
    c.save();c.strokeStyle='#e4b86c';c.lineWidth=1.2;c.lineCap='round';c.beginPath();
    if(leash.attached){c.moveTo(handX,handY);c.quadraticCurveTo((handX+scene.dog.x+9)/2,218,scene.dog.x+9,204)}
    else{c.moveTo(218,198+23*fall);c.quadraticCurveTo(236,214+7*fall,254,206+15*fall)}
    c.stroke();c.restore();
   }
   for(const [name,actor]of [['julia',scene.julia],['elomir',scene.elomir]])if(actor){this.sprite(name,actor.x,actor.y,actor.frame);if(g.part===0)this.text(name==='julia'?'Júlia':'Elomir',actor.x,147,'#fff2d1',7,'center')}
   this.dog(scene.dog.x,scene.dog.y,scene.dog.frame,1);
   if(scene.friend)this.animal('shepherd',scene.friend.x,scene.friend.y,1+Math.floor(t*7)%2,1);
   if(g.part===1&&t>.8)this.text('Au!',scene.dog.x+13,180,'#ffe4a4',9);
   if(g.part===5){this.rect(0,0,160,222,'#9bcbd233');this.text('?',264,177,'#fff4cc',14)}
  }
  this.rect(0,0,480,33,'#0d2933e8');this.text(g.mode==='intro'?'ANTES DA JORNADA':'O REENCONTRO',15,20,'#f2cf8b',9);this.text('ENTER avançar · ESC pular',465,20,'#c7d6ca',7,'right');
  this.rect(10,234,460,30,'#12313aee');part.text.split('\n').forEach((line,i)=>this.text(line,240,245+i*8,'#fff0d2',7,'center'));this.rect(10,230,460*(t/part.duration),2,'#e8c384');this.text(part.title,240,57,'#fff1c6',12,'center');
 }
}
