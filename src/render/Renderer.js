import {levels} from '../data/levels.js';
import {characterFiles,animalSprites,humanSprites} from '../data/assets.js';
import {introFamily,walkFrame} from '../data/familyScene.js';
import {spriteFrames} from '../data/spriteFrames.js';
import {createParallaxStrip,parallaxPhase} from './parallax.js';
const files=levels.map(l=>l.bg);
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.images={};this.strips={};this.t=0;this.resize();if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas)}window.addEventListener('resize',()=>this.resize())}
 resize(){const bounds=this.canvas.getBoundingClientRect?.();const units=Math.max(30,Math.min(240,Math.ceil((bounds?.width||480)*(window.devicePixelRatio||1)/16)));const width=units*16,height=units*9;if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height}this.c.setTransform(width/480,0,0,height/270,0,0);this.c.imageSmoothingEnabled=true;this.c.imageSmoothingQuality='high'}
 async load(){this.errors=[];await Promise.all([...files,...characterFiles].map(async f=>{const im=new Image();im.src=window.BEETHOVEN_ASSETS?.[f]||'/assets/'+f;try{await im.decode();this.images[f]=im}catch{this.errors.push(f)}}))}
 text(s,x,y,color='#fff4d6',size=8,align='left'){const c=this.c;c.font=`${size}px monospace`;c.textAlign=align;c.fillStyle='#112d36';c.fillText(s,x+1,y+1);c.fillStyle=color;c.fillText(s,x,y)}
 rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(Math.round(x),Math.round(y),w,h)}
 background(index,cam=0,t=0){const c=this.c,l=levels[index],im=this.images[l.bg];this.rect(0,0,480,270,index===2?'#829fa7':'#8bc8df');if(im){const strip=this.strips[l.bg]??=createParallaxStrip(im),scale=272/strip.height,phase=parallaxPhase(cam*.24,strip.width*scale),pattern=c.createPattern(strip,'repeat-x');c.save();c.translate(-phase,254-272);c.scale(scale,scale);c.fillStyle=pattern;c.fillRect(0,0,(480+phase)/scale,strip.height);c.restore()}for(let i=0;i<4;i++){const x=((i*177-cam*.08+t*1.4)%700+700)%700-100;this.rect(x,22+i%2*15,38,5,'#ffffff55');this.rect(x+8,17+i%2*15,22,7,'#ffffff55')}if(index===2)this.rect(0,0,480,222,'#27374a48');if(index===4)this.rect(0,0,480,222,'#ffbe6030');}
 sprite(kind,x,y,frame=0,face=1){const spec=animalSprites[kind]||humanSprites[kind],c=this.c,im=this.images[spec.file];if(!im)return;const frames=spriteFrames[spec.file].frames,index=spec.row===undefined?frame:spec.row*spec.columns+frame;const box=frames[index],sequence=spec.row===undefined?frames:frames.slice(spec.row*spec.columns,(spec.row+1)*spec.columns);const scale=Math.min(spec.width/Math.max(...sequence.map(f=>f.w)),spec.height/Math.max(...sequence.map(f=>f.h)));const w=box.w*scale,h=box.h*scale;c.save();c.translate(x,y);c.scale(face,1);c.drawImage(im,box.x,box.y,box.w,box.h,-w/2,-h,w,h);c.restore()}
 animal(kind,x,y,frame=0,face=1){this.sprite(kind,x,y,frame,face)}
 dog(x,y,frame=0,face=1){this.sprite('beethoven',x,y,frame,face)}
 human(x,y,variant=0,walk=0,face=1){this.sprite(variant?'julia':'elomir',x,y,walk?walkFrame(walk,1):0,face)}
 bone(x,y,t){const c=this.c;c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*3+x)*2));this.rect(-5,-1,10,3,'#fff1bc');for(const [a,b]of[[-6,-3],[-6,1],[4,-3],[4,1]])this.rect(a,b,3,3,'#fff1bc');c.restore()}
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
 for(const h of l.hazards){if(h.type==='bike'){this.rect(h.x,h.y+5,28,9,'#375b64');this.rect(h.x+4,h.y,2,8,'#e6ba66');this.rect(h.x+21,h.y,2,8,'#e6ba66');this.rect(h.x+8,h.y+2,13,3,'#b87652')}else if(h.type==='swing'){this.rect(h.x+8,155,1,48,'#5c7873');this.rect(h.x-1,h.y,30,5,'#d99764')}else{this.rect(h.x,h.y+9,h.w,5,'#5797a9');this.rect(h.x+6,h.y+10,h.w-12,1,'#b6d8da')}}
 for(const cat of l.cats){if(cat.x<cam-60||cat.x>cam+540)continue;this.animal(cat.coat,cat.x,cat.y,cat.state==='watch'?3:1+Math.floor(t*(cat.flee>0?12:5))%2,cat.vx<0?-1:1);if(cat.flee>0)this.text('!',cat.x,cat.y-29,'#f1d4a0',8,'center')}
 for(const d of l.dogs){if(d.x<cam-70||d.x>cam+550)continue;this.animal(d.breed,d.x+14,d.y+23,d.state==='bark'?3:d.state==='patrol'||d.state==='return'?1+Math.floor(t*7)%2:0,d.vx<0?-1:1);if(d.state==='bark')this.text('Au!',d.x+10,d.y-8,'#ffe4a4',8);if(d.calm>0)this.text('♪',d.x+10,d.y-8,'#b8f2c7',9)}
 if(l.index===4)this.gate(l.end+38);else{this.rect(l.end+18,182,3,40,'#345d55');this.rect(l.end+4,181,60,13,'#ead2a0');this.text('CAMINHO →',l.end+34,190,'#355651',7,'center')}
 if(!(p.inv>0&&Math.floor(t*14)%2))this.dog(p.x+p.w/2,p.y+p.h,p.frame(t),p.face);
 if(p.bark>0){c.strokeStyle='#fff1b9';c.beginPath();c.arc(p.x+13+p.face*23,p.y+8,10+(1-p.bark/.4)*13,-1,1);c.stroke()}
 for(const f of g.particles){this.rect(f.x,f.y,2,2,f.color)}
 if(g.debug){c.strokeStyle='red';for(const s of [...l.ground,...l.platforms,p])c.strokeRect(s.x,s.y,s.w,s.h)}c.restore();
 this.weather(l.weather,t,l.index===1?p.x/l.width:1);this.hud(g);
 }
 weather(type,t,progress=1){if(type==='rain'||type==='drizzle'||type==='cloud'&&progress>.6){const c=this.c;c.strokeStyle=type==='rain'?'#d0e4ed77':'#d0e4ed44';c.beginPath();for(let i=0;i<(type==='rain'?65:25);i++){const x=(i*73+t*95)%500,y=(i*41+t*260)%280;c.moveTo(x,y);c.lineTo(x-3,y+9)}c.stroke();}}
 hud(g){this.rect(8,8,110,22,'#12333deb');for(let i=0;i<3;i++){const color=i<g.player.hp?'#f3ad8e':'#42616a',x=15+i*14;this.rect(x,14,4,4,color);this.rect(x+6,14,4,4,color);this.rect(x,17,10,4,color);this.rect(x+2,21,6,2,color);this.rect(x+4,23,2,2,color)}this.bone(76,20,0);this.text(String(g.collected.size).padStart(3,'0'),88,23,'#ffe9ac',9);this.rect(345,8,127,22,'#12333deb');this.text(`${g.level.index+1}/5 · ${g.level.name.length>20?g.level.subtitle:g.level.name}`,409,22,'#e6edd7',6,'center');this.rect(8,35,110,2,'#204448');this.rect(8,35,110*g.player.x/g.level.width,2,'#e4c889');if(g.messageTime>0){this.rect(35,242,410,20,'#12333ded');this.text(g.message,240,255,'#fff2ca',8,'center')}
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
