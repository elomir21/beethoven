import {test} from 'node:test';import assert from 'node:assert/strict';import {game as g,input,save,tick,draw} from './harness.mjs';
test('intro, pausa, dano, checkpoint, latido, save e reinício',()=>{g.menu();assert.equal(g.mode,'menu');g.story('intro');draw();tick([],['Escape']);assert.equal(g.mode,'play');for(let i=0;i<20;i++)tick();tick([],['Escape']);assert.equal(g.mode,'pause');const x=g.player.x;for(let i=0;i<50;i++)tick(['KeyD']);assert.equal(g.player.x,x);tick([],['Escape']);assert.equal(g.mode,'play');g.hurt();assert.equal(g.player.hp,2);g.player.inv=0;g.hurt();g.player.inv=0;g.hurt();assert.equal(g.mode,'over');g.retry();assert.equal(g.player.hp,3);const d=g.level.dogs[0];g.player.x=d.x-50;tick([],['KeyE']);assert(d.calm>0);const cp=g.level.checkpoints[0];g.player.x=cp.x;g.player.y=199;g.player.grounded=true;tick();assert.equal(g.checkpoint,cp.x);assert.equal(save.data.checkpoint,cp.x);g.retry();assert.equal(g.player.x,cp.x);save.reset();assert.equal(save.data.started,false);});
test('travessia das cinco fases por física e inputs, sem teleporte',()=>{save.reset();g.collected.clear();g.start(0);let totalFrames=0,retries=0;const results=[];
 for(let index=0;index<5;index++){
  if(index>0){assert.equal(g.mode,'transition');tick([],['Enter'])}let frames=0,jumpHold=0,lastJump=-1000,stalls=0,lastX=0;
  while(g.mode==='play'&&frames<60000){const p=g.player,l=g.level;
   const danger=[...l.dogs.filter(d=>d.calm<=0),...l.hazards].some(d=>d.x>p.x-20&&d.x<p.x+85&&Math.abs(d.y-p.y)<65);
   const gap=l.ground.some((s,n)=>n<l.ground.length-1&&s.x+s.w>p.x&&s.x+s.w<p.x+68);
   // O bot late antes de cães, segura o salto e usa as mesmas teclas do jogador.
   let pressed=[];if(p.grounded&&(danger||gap)&&frames-lastJump>45){pressed.push('Space');jumpHold=55;lastJump=frames}
   if(frames%110===0)pressed.push('KeyE');
   const held=['KeyD','ShiftLeft'];if(jumpHold-->0)held.push('Space');tick(held,pressed);frames++;
   if(g.mode==='over'){retries++;assert(retries<25,'excesso de recuperações');g.retry()}
   if(Math.abs(p.x-lastX)<.01)stalls++;else stalls=0;lastX=p.x;if(stalls>200)throw Error('personagem preso');
   if(index===4&&p.x>l.end-40){tick([],['KeyE']);break}
  }
  assert(frames<60000,`fase ${index+1} não concluída`);assert.equal(g.mode,index===4?'ending':'transition');results.push({level:index+1,seconds:Math.round(frames/120),checkpoint:g.checkpoint});totalFrames+=frames;
 }
 assert.equal(g.mode,'ending');for(let i=0;i<4;i++)tick([],['Enter']);assert.equal(g.mode,'finish');assert.equal(save.data.completed,true);assert(g.collected.size>0);draw();console.log(JSON.stringify({simulation:results,bones:g.collected.size,retries,seconds:Math.round(totalFrames/120)}));
});
