import {clamp,move} from '../engine/physics.js';
export class Beethoven {
 constructor(x,y=222){this.x=x;this.y=y-23;this.w=27;this.h=23;this.vx=0;this.vy=0;this.face=1;this.grounded=false;this.coyote=0;this.buffer=0;this.hp=3;this.inv=0;this.bark=0;this.land=0;this.state='idle';this.time=0;this.step=0;this.power=0;this.launch=0;this.flying=false;this.burst=false;this.boostCooldown=0;}
 eatChicken(){this.power=20;this.launch=.9;this.vy=-220;this.grounded=false;this.burst=true;this.boostCooldown=.45}
 update(dt,input,solids,audio,slippery){
  this.time+=dt;this.inv=Math.max(0,this.inv-dt);this.bark=Math.max(0,this.bark-dt);this.land=Math.max(0,this.land-dt);
  this.power=Math.max(0,this.power-dt);this.launch=Math.max(0,this.launch-dt);this.boostCooldown-=dt;this.burst=false;
  const jumpHeld=input.has('Space','KeyW','ArrowUp');
  this.flying=this.power>0&&(this.launch>0||jumpHeld);
  this.coyote=this.grounded?.1:this.coyote-dt;this.buffer=input.hit('Space','KeyW','ArrowUp')?.1:this.buffer-dt;
  const autoRun=input.has('Run'),direction=Number(input.has('KeyD','ArrowRight'))-Number(input.has('KeyA','ArrowLeft'));
  const axis=direction||(autoRun?this.face:0),running=autoRun||input.has('ShiftLeft','ShiftRight');
  const speed=this.power>0&&running?180:running?145:95,accel=this.grounded?(slippery?270:820):this.flying?650:450;
  if(axis){this.face=axis;this.vx+=axis*accel*dt}else this.vx*=Math.pow(slippery?.25:.00002,dt);
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
  this.state=this.inv>1?'hurt':this.bark>0?'bark':this.flying?'fly':!this.grounded?(this.vy<0?'jump':'fall'):this.land>0?'land':Math.abs(this.vx)>105?'run':Math.abs(this.vx)>9?'walk':this.time>10&&Math.abs(this.vx)<1?'sleep':'idle';
  if(axis)this.time%=8;
  if(this.grounded&&Math.abs(this.vx)>15){this.step+=dt;if(this.step>.19){audio.sfx('step');this.step=0}}
 }
 frame(t){const frames={idle:[0,0,1,0],walk:[1,2,3,4,3,2],run:[5,6,7,8,7,6],jump:[9,10,6],fly:[6,9,6,10],fall:[10,11],land:[11,1],bark:[0,9,0,10],hurt:[9,11],happy:[0,9,10,0],sleep:[11,9]};const a=frames[this.state]||frames.idle;return a[Math.floor(t*(this.state==='run'?12:7))%a.length]}
}
