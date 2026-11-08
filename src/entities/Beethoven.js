import {clamp,move} from '../engine/physics.js';
export const attacks={
 paw:{duration:.3,cooldown:.42,from:.05,to:.2,reach:34,damage:1},
 bite:{duration:.42,cooldown:.7,from:.12,to:.3,reach:24,damage:2},
};
export class Beethoven {
 constructor(x,y=222){this.x=x;this.y=y-23;this.w=27;this.h=23;this.vx=0;this.vy=0;this.face=1;this.grounded=false;this.coyote=0;this.buffer=0;this.hp=3;this.inv=0;this.bark=0;this.land=0;this.state='idle';this.time=0;this.step=0;this.power=0;this.launch=0;this.flying=false;this.burst=false;this.boostCooldown=0;}
 attack=null;attackCooldown=0;
 strike(kind){const move=attacks[kind];if(!move||this.attack||this.attackCooldown>0)return false;this.attack={kind,elapsed:0,face:this.face,hits:new Set()};this.attackCooldown=move.cooldown;this.state=kind;return true}
 attackBox(){const a=this.attack;if(!a)return null;const move=attacks[a.kind];if(a.elapsed<move.from||a.elapsed>move.to)return null;return {x:a.face>0?this.x+this.w-3:this.x-move.reach,y:this.y-5,w:move.reach+3,h:this.h+10}}
 eatChicken(){this.power=20;this.launch=.9;this.vy=-220;this.grounded=false;this.burst=true;this.boostCooldown=.45}
 update(dt,input,solids,audio,slippery){
  this.time+=dt;this.inv=Math.max(0,this.inv-dt);this.bark=Math.max(0,this.bark-dt);this.land=Math.max(0,this.land-dt);
  this.attackCooldown=Math.max(0,this.attackCooldown-dt);if(this.attack){this.attack.elapsed+=dt;if(this.attack.elapsed>=attacks[this.attack.kind].duration)this.attack=null}
  this.power=Math.max(0,this.power-dt);this.launch=Math.max(0,this.launch-dt);this.boostCooldown-=dt;this.burst=false;
  const jumpHeld=input.has('Space','KeyW','ArrowUp');
  this.flying=this.power>0&&(this.launch>0||jumpHeld);
  this.coyote=this.grounded?.1:this.coyote-dt;this.buffer=input.hit('Space','KeyW','ArrowUp')?.1:this.buffer-dt;
  const autoRun=input.has('Run'),direction=Number(input.has('KeyD','ArrowRight'))-Number(input.has('KeyA','ArrowLeft'));
  const axis=direction||(autoRun?this.face:0),running=autoRun||input.has('ShiftLeft','ShiftRight');
  const speed=this.power>0&&running?180:running?145:95,accel=this.grounded?(slippery?270:820):this.flying?650:450;
  if(axis){if(!this.attack)this.face=axis;this.vx+=axis*accel*dt}else this.vx*=Math.pow(slippery?.25:.00002,dt);
  this.vx=clamp(this.vx,-speed,speed);
  if(this.flying){
   this.buffer=0;this.coyote=0;this.vy=clamp(this.vy-1000*dt,-130,180);
   if(this.boostCooldown<=0){this.burst=true;this.boostCooldown=.45;audio.sfx('fart')}
  }else{
   if(this.buffer>0&&this.coyote>0){this.vy=-335;this.buffer=0;this.coyote=0;this.grounded=false;audio.sfx('jump')}
   if(!jumpHeld&&this.vy< -110)this.vy+=900*dt;
  }
  this.vy=Math.min(480,this.vy+(this.flying?220:850)*dt);
  const was=this.grounded;move(this,dt,solids);
  if(this.power>0&&this.y<35){this.y=35;this.vy=Math.max(0,this.vy)}
  if(!was&&this.grounded){this.land=.1;audio.sfx('land')}
  this.state=this.attack?this.attack.kind:this.inv>1?'hurt':this.bark>0?'bark':this.flying?'fly':!this.grounded?(this.vy<0?'jump':'fall'):this.land>0?'land':Math.abs(this.vx)>105?'run':Math.abs(this.vx)>9?'walk':this.time>10&&Math.abs(this.vx)<1?'sleep':'idle';
  if(axis)this.time%=8;
  if(this.grounded&&Math.abs(this.vx)>15){this.step+=dt;if(this.step>.19){audio.sfx('step');this.step=0}}
 }
 frame(t){if(this.attack){const a=this.attack,frames=a.kind==='paw'?[0,9,6,0]:[0,5,10,0];return frames[Math.min(3,Math.floor(a.elapsed/attacks[a.kind].duration*4))]}const frames={idle:[0,0,1,0],walk:[1,2,3,4,3,2],run:[5,6,7,8,7,6],jump:[9,10,6],fly:[6,9,6,10],fall:[10,11],land:[11,1],bark:[0,9,0,10],hurt:[9,11],happy:[0,9,10,0],sleep:[11,9]};const a=frames[this.state]||frames.idle;return a[Math.floor(t*(this.state==='run'?12:7))%a.length]}
}
