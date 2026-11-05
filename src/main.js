import {Input} from './systems/Input.js';
import {Display} from './systems/Display.js';
import {Save} from './systems/Save.js';
import {AudioSystem} from './systems/Audio.js';
import {Beethoven} from './entities/Beethoven.js';
import {Renderer} from './render/Renderer.js';
import {makeLevel} from './data/levels.js';
import {intro,ending} from './data/story.js';
import {clamp,overlap} from './engine/physics.js';
const canvas=document.querySelector('#game'),overlay=document.querySelector('#overlay');
const input=new Input(canvas),save=new Save(),audio=new AudioSystem(save.data.muted),render=new Renderer(canvas);
class Game {
 constructor(){this.mode='loading';this.time=0;this.cam=0;this.particles=[];this.debug=false;this.messageTime=0;this.collected=new Set(save.data.bones)}
 panel(title,text,actions,hero=false){overlay.innerHTML=`<section class="panel ${hero?'hero':''}"><p class="eyebrow">${hero?'UMA AVENTURA EM SANTA CATARINA':'BEETHOVEN · O CAMINHO DE CASA'}</p><h1>${title}</h1>${text}<div class="actions"></div></section>`;const row=overlay.querySelector('.actions');for(const [label,fn]of actions){const b=document.createElement('button');b.textContent=label;if(!row.children.length)b.className='primary';b.onclick=()=>{audio.unlock();input.clear();fn()};row.append(b)}}
 menu(){this.mode='menu';this.panel('BEETHOVEN','<div class="subtitle">O CAMINHO DE CASA</div><p>Um cachorro curioso. Cinco lugares para descobrir.<br>Ajude Beethoven a reencontrar sua família.</p>',[['Jogar',()=>{save.reset();this.collected.clear();this.story('intro')}],...(save.data.started&&!save.data.completed?[['Continuar',()=>this.start(save.data.level,true)]]:[]),['Controles',()=>this.controls()]],true)}
 controls(){this.mode='controls';this.panel('Como jogar','<p>A / D ou ← / →: andar · Shift: correr<br>No celular, segure Correr para avançar sozinho.<br>Espaço / W / ↑: pular · E: latir / atacar<br>Encontre as coxas de frango escondidas nas plantas!<br>Camisa do Vasco por 20 s: segure Pular para voar com superpum.<br>Solte Pular para descer. O poder não protege de ferimentos.<br>Evite vidro, espinhos e pontas. Há duas bandeiras por fase.<br>Chefes: desvie da investida, lata na recuperação ou salte sobre eles.<br>M: som · Esc: pausa · R pausado: checkpoint</p>',[['Voltar',()=>this.menu()]])}
 story(mode){overlay.innerHTML='';this.mode=mode;this.parts=mode==='intro'?intro:ending;this.part=0;this.partTime=0;audio.mode=mode==='intro'?0:4;canvas.focus()}
 nextPart(){this.partTime=0;this.part++;if(this.part>=this.parts.length){if(this.mode==='intro')this.start(0);else this.finish()}}
 start(index,resume=false){overlay.innerHTML='';this.level=makeLevel(index);this.checkpoint=resume?(this.level.checkpoints.filter(cp=>cp.x<=save.data.checkpoint).at(-1)?.x||0):0;if(save.data.bosses.includes(index)){this.level.boss.defeated=true;this.level.boss.hp=0;this.level.boss.state='defeated'}this.player=new Beethoven(this.checkpoint||50);this.cam=clamp(this.player.x-140,0,this.level.width-480);this.mode='play';this.particles=[];this.hint(index===0?(input.touch?'Correr avança · Pular · Latir. Procure frango nas plantas!':'A/D mover · Espaço pular/voar · E atacar. Procure frango!'):index===2?'Cuidado com o vidro e o piso molhado. Um chefe espera no final!':'Duas bandeiras, frango escondido e um chefe no fim do caminho.',9);audio.mode=index;save.data.level=index;save.data.started=true;save.data.checkpoint=this.checkpoint;save.data.unlocked=[...new Set([...save.data.unlocked,index])];save.write();canvas.focus();input.clear()}
 hint(text,time=4){this.message=text;this.messageTime=time}
 pause(){if(this.mode!=='play')return;this.mode='pause';this.panel('Pausado','<p>Um descanso antes de seguir para casa.</p>',[['Continuar',()=>this.resume()],['Voltar ao checkpoint',()=>this.retry()],['Menu',()=>this.menu()]])}
 resume(){this.mode='play';overlay.innerHTML='';input.clear();canvas.focus()}
 retry(){this.player=new Beethoven(this.checkpoint||50);this.cam=clamp(this.player.x-140,0,this.level.width-480);if(!this.level.boss.defeated)this.level.boss.reset();for(const chicken of this.level.chickens){chicken.eaten=false;chicken.revealed=false}this.particles=[];this.resume()}
 hurt(fall=false){if(this.mode!=='play')return;const p=this.player;if(p.inv>0&&!fall)return;p.hp--;p.inv=1.8;audio.sfx('hurt');if(p.hp<=0){this.mode='over';this.panel('Vamos tentar de novo?','<p>Não desista, Beethoven! Sua família está esperando.</p>',[['Tentar do checkpoint',()=>this.retry()],['Menu',()=>this.menu()]]);return}p.vy=-150;p.vx=-p.face*85;if(fall){p.x=this.checkpoint||50;p.y=199;p.vx=0;p.vy=0;if(this.level.boss.active&&!this.level.boss.defeated)this.level.boss.reset();this.cam=clamp(p.x-140,0,this.level.width-480)}}
 hitBoss(damage=1){const b=this.level.boss;if(!b.hit(damage))return false;audio.sfx(b.defeated?'victory':'bossHit');if(b.defeated){b.active=false;save.data.bosses=[...new Set([...save.data.bosses,this.level.index])];save.write();this.hint('Chefe vencido! O caminho está livre. Vamos para casa!',5)}return true}
 superGas(){const p=this.player,b=this.level.boss;for(let i=0;i<9;i++)this.particles.push({x:p.x+p.w/2-p.face*16,y:p.y+15,vx:-p.face*(25+i*5),vy:12+(i%3-1)*18,life:.55+i*.025,color:i%2?'#b7d764aa':'#e2eaa477',gas:true,size:4+i%4});for(const d of this.level.dogs)if(Math.abs(d.x-p.x)<100&&Math.abs(d.y-p.y)<60){d.calm=3.5;d.state='return'}if(Math.abs(b.x+b.w/2-p.x-p.w/2)<110&&Math.abs(b.y+b.h/2-p.y-p.h/2)<65)this.hitBoss(2)}
 transition(){save.data.bones=[...this.collected];save.data.level=this.level.index+1;save.data.checkpoint=0;save.data.unlocked=[...new Set([...save.data.unlocked,save.data.level])];save.write();this.mode='transition';this.panel('Mais perto de casa',`<p>${this.level.story}</p><p class="small">${this.level.index+1} de 5 etapas concluídas · ${this.collected.size} ossinhos encontrados</p>`,[['Seguir viagem',()=>this.start(save.data.level)]])}
 finish(){save.data.completed=true;save.data.bones=[...this.collected];save.write();this.mode='finish';this.panel('FIM','<div class="subtitle">BEETHOVEN: O CAMINHO DE CASA</div><p>Depois de uma longa aventura, Beethoven finalmente encontrou o caminho de casa.</p><p>Porque nenhuma distância é grande demais quando o destino é o amor de quem nos espera.</p><p class="small">'+this.collected.size+' ossinhos · Uma família reunida ♥<br>Arte de referência fornecida pelo usuário · Música original sintetizada</p>',[['Jogar novamente',()=>{save.reset();this.collected.clear();this.story('intro')}],['Voltar ao menu',()=>this.menu()]])}
 update(dt){if(!['pause','over','transition'].includes(this.mode))this.time+=dt;if(input.hit('KeyM'))toggleMute();if(input.hit('F2'))this.debug=!this.debug;
 if(this.mode==='menu'&&input.hit('Enter')){audio.unlock();save.reset();this.collected.clear();this.story('intro')}
 if(['intro','ending'].includes(this.mode)){audio.update(dt);this.partTime+=dt;if(this.mode==='intro'&&this.part===1&&this.partTime<dt*2)audio.sfx('bark');if(input.hit('Escape')){if(this.mode==='intro')this.start(0);else this.finish()}else if(input.hit('Enter')||this.partTime>=this.parts[this.part].duration)this.nextPart();return}
 if(this.mode==='transition'&&input.hit('Enter'))this.start(save.data.level);
 if(this.mode==='pause'){if(input.hit('Escape'))this.resume();if(input.hit('KeyR'))this.retry();return}if(this.mode!=='play')return;if(input.hit('Escape')){this.pause();return}
 const l=this.level,p=this.player;audio.update(dt,l.weather==='rain');this.messageTime-=dt;
 for(const s of l.platforms){const last=s.x;if(s.moving)s.x=s.origin+Math.sin(this.time*.9+s.phase)*28;s.dx=s.x-last}
 const previousFeet=p.y+p.h;
 p.update(dt,input,[...l.ground,...l.platforms],audio,l.slippery.some(s=>p.x>s.x&&p.x<s.x+s.w));p.x=clamp(p.x,0,l.width-p.w);
 const boss=l.boss;
 if(!boss.active&&!boss.defeated&&p.x>=boss.trigger){boss.active=true;this.hint(`CHEFE: ${boss.name}. Desvie, lata ou pule sobre ele!`,6)}
 boss.update(dt,p);
 if(boss.active&&!boss.defeated)p.x=clamp(p.x,boss.left,boss.right-p.w);
 for(const chicken of l.chickens){if(chicken.eaten)continue;if(!chicken.revealed&&Math.abs(p.x-chicken.x)<90&&Math.abs(p.y-chicken.y)<80){chicken.revealed=true;this.hint('Cheiro de frango! Procure entre as folhas da plataforma.')}if(overlap(p,{x:chicken.x-5,y:chicken.y-5,w:26,h:26})){chicken.eaten=true;p.eatChicken();audio.sfx('chicken');audio.sfx('fart');this.hint('VASCO! Superpum por 20s. Segure Pular/Espaço para voar!',6)}}
 if(p.burst)this.superGas();
 if(input.hit('KeyE')&&p.bark<=0){p.bark=.4;audio.sfx('bark');for(const d of l.dogs)if(Math.abs(d.x-p.x)<120){d.calm=3.5;d.state='return'}if(boss.state!=='charge'&&Math.abs(boss.x+boss.w/2-p.x-p.w/2)<110&&Math.abs(boss.y+boss.h/2-p.y-p.h/2)<60&&Math.sign(boss.x+boss.w/2-p.x-p.w/2)===p.face)this.hitBoss(p.power>0?2:1);if(l.index===4&&boss.defeated&&p.x>l.end-55){audio.sfx('interact');this.story('ending');return}}
 for(const d of l.dogs){d.calm=Math.max(0,d.calm-dt);const distance=Math.abs(d.x-p.x);d.state=d.calm>0?'return':distance<75?'bark':distance<135?'alert':'patrol';if(d.state==='patrol'||d.state==='return'){d.x+=d.vx*dt;if(d.x<d.origin-d.range||d.x>d.origin+d.range)d.vx*=-1}if(d.calm<=0&&overlap(p,d))this.hurt()}
 for(const cat of l.cats){
  const distance=Math.abs(cat.x-p.x);
  if(p.bark>0&&distance<100&&cat.flee<=0){cat.flee=1;cat.vx=cat.x<p.x?-12:12}
  cat.flee=Math.max(0,cat.flee-dt);cat.state=cat.flee>0?'startled':distance<65?'watch':'stroll';
  if(cat.state!=='watch'){cat.x+=cat.vx*dt*(cat.flee>0?2.5:1);if(cat.x<cat.origin-cat.range){cat.x=cat.origin-cat.range;cat.vx=Math.abs(cat.vx)}if(cat.x>cat.origin+cat.range){cat.x=cat.origin+cat.range;cat.vx=-Math.abs(cat.vx)}}
 }
 for(const h of l.hazards)if(overlap(p,h))this.hurt();
 if(boss.active&&!boss.defeated&&overlap(p,boss)){if(p.vy>0&&previousFeet<=boss.y+12){this.hitBoss(p.power>0?2:1);p.vy=-265;p.inv=Math.max(p.inv,.25)}else if(boss.inv<=0)this.hurt()}
 for(const b of l.bones)if(!this.collected.has(b.id)&&Math.abs(p.x+13-b.x)<23&&Math.abs(p.y+10-b.y)<24){this.collected.add(b.id);save.data.bones=[...this.collected];save.write();audio.sfx('bone');for(let i=0;i<6;i++)this.particles.push({x:b.x,y:b.y,vx:(i-3)*12,vy:-40-i*5,life:.6,color:'#fff2b3'})}
 for(const cp of l.checkpoints)if(Math.abs(p.x-cp.x)<27&&p.grounded&&cp.x>this.checkpoint){this.checkpoint=cp.x;p.hp=3;save.data.checkpoint=cp.x;save.write();audio.sfx('checkpoint');this.hint('Caminho marcado! Checkpoint salvo ♥')}
 if(p.y>290)this.hurt(true);if(this.mode!=='play')return;
 this.particles=this.particles.filter(f=>{f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=100*dt;return f.life>0}).slice(-60);
 const goal=clamp(p.x-205+p.face*28,0,l.width-480);this.cam+=(goal-this.cam)*Math.min(1,dt*5);
 if(p.x>l.end-40&&boss.defeated){if(l.index<4)this.transition();else this.hint(input.touch?'Você chegou! Toque em Latir no portão.':'Você chegou! Pressione E para latir no portão.',2)}
 }
 syncUI(){const powered=['play','pause'].includes(this.mode)&&this.player?.power>0,jump=document.querySelector('[data-key="Space"]');if(jump&&this.uiPower!==powered){jump.textContent=powered?'Voar':'Pular';jump.setAttribute('aria-label',powered?'Voar com superpum':'Pular');this.uiPower=powered}if(this.uiMode===this.mode)return;this.uiMode=this.mode;document.querySelector('main')?.setAttribute('data-mode',this.mode);const scene=document.querySelector('#scene-controls'),pause=document.querySelector('#pause');if(scene)scene.hidden=!['intro','ending'].includes(this.mode);if(pause){pause.disabled=!['play','pause'].includes(this.mode);pause.textContent=this.mode==='pause'?'Retomar':'Pausar'}}
 draw(){this.syncUI();if(['play','pause','over','transition'].includes(this.mode))render.level(this);else if(['intro','ending'].includes(this.mode))render.cutscene(this);else{render.background(this.mode==='finish'?4:0,this.time*7,this.time);render.rect(0,222,480,48,'#64765b');render.dog(365,222,[0,1,0,9][Math.floor(this.time*2)%4],-1);if(this.mode==='finish'){render.human(310,222);render.human(400,222,1)}}}
}
const game=new Game();function toggleMute(){audio.unlock();audio.muted=!audio.muted;save.data.muted=audio.muted;save.write();document.querySelector('#mute').textContent=audio.muted?'♪ Som desligado':'♪ Som ligado'}document.querySelector('#mute').onclick=toggleMute;document.querySelector('#mute').textContent=audio.muted?'♪ Som desligado':'♪ Som ligado';window.addEventListener('blur',()=>game.pause());document.addEventListener('visibilitychange',()=>{if(document.hidden)game.pause()});
document.querySelector('#pause')?.addEventListener('click',()=>{input.clear();if(game.mode==='play')game.pause();else if(game.mode==='pause')game.resume()});
document.querySelector('#story-next')?.addEventListener('click',()=>{audio.unlock();input.clear();if(['intro','ending'].includes(game.mode))game.nextPart()});
document.querySelector('#story-skip')?.addEventListener('click',()=>{audio.unlock();input.clear();if(game.mode==='intro')game.start(0);else if(game.mode==='ending')game.finish()});
const shell=document.querySelector('#game-shell');if(shell)new Display(shell,render,input);
await render.load();document.querySelector('#loading').remove();game.menu();if(render.errors.length){const warning=document.createElement('p');warning.textContent='Algumas imagens não carregaram. Recarregue para restaurar a arte.';document.querySelector('footer').append(warning)}
let last=performance.now(),acc=0;function frame(now){acc+=Math.min((now-last)/1000,.05);last=now;let steps=0;while(acc>=1/120&&steps++<6){game.update(1/120);input.end();acc-=1/120}game.draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// Read-only diagnostics for QA; no gameplay bypasses.
window.beethoven={snapshot:()=>({mode:game.mode,level:game.level?.index,x:game.player?.x,y:game.player?.y,vx:game.player?.vx,vy:game.player?.vy,face:game.player?.face,hp:game.player?.hp,grounded:game.player?.grounded,state:game.player?.state,bark:game.player?.bark,power:game.player?.power,flying:game.player?.flying,bones:game.collected.size,checkpoint:game.checkpoint,errors:render.errors,resolution:{width:canvas.width,height:canvas.height},boss:game.level?{name:game.level.boss.name,kind:game.level.boss.kind,x:game.level.boss.x,y:game.level.boss.y,w:game.level.boss.w,h:game.level.boss.h,hp:game.level.boss.hp,maxHp:game.level.boss.maxHp,timer:game.level.boss.timer,face:game.level.boss.face,state:game.level.boss.state,active:game.level.boss.active,defeated:game.level.boss.defeated}:null,chickens:game.level?.chickens.map(c=>({x:c.x,y:c.y,eaten:c.eaten,revealed:c.revealed})),npcs:game.level?.dogs.slice(0,3).map(d=>({x:d.x,state:d.state,calm:d.calm,breed:d.breed})),cats:game.level?.cats.map(c=>({x:c.x,coat:c.coat,state:c.state}))})};

export {game, input, save, audio};
export {render};
