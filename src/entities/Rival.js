import {clamp} from '../engine/physics.js';

// Rival dogs surrender after losing their hearts; neutral cats stay outside combat.
export class Rival {
 constructor(breed,x,speed=20){
  Object.assign(this,{breed,x,y:199,w:28,h:23,origin:x,range:55,speed,vx:speed,face:1,state:'patrol',calm:0,maxHp:breed==='pinscher'?2:3,inv:0,timer:0,defeated:false});this.hp=this.maxHp;
 }
 reset(){Object.assign(this,new Rival(this.breed,this.origin,this.speed))}
 soothe(seconds){if(this.defeated)return;this.calm=seconds;this.state='return';this.timer=0}
 hit(damage,face){
  if(this.defeated||this.inv>0)return false;
  this.hp=Math.max(0,this.hp-damage);this.inv=.4;this.calm=0;this.defeated=this.hp===0;
  this.state=this.defeated?'defeated':'stunned';this.timer=.45;
  this.x=clamp(this.x+face*12,this.origin-this.range,this.origin+this.range);return true;
 }
 update(dt,player){
  this.inv=Math.max(0,this.inv-dt);if(this.defeated)return;
  this.calm=Math.max(0,this.calm-dt);this.timer=Math.max(0,this.timer-dt);
  if(this.calm>0)this.state='return';
  if(this.state==='stunned'){if(this.timer<=0){this.state='recover';this.timer=.6}return}
  if(this.state==='windup'){if(this.timer<=0){this.state='charge';this.timer=.38}return}
  if(this.state==='charge'){
   this.x=clamp(this.x+this.face*85*dt,this.origin-this.range,this.origin+this.range);
   if(this.timer<=0){this.state='recover';this.timer=.8}return;
  }
  if(this.state==='recover'&&this.timer>0)return;
  const distance=Math.abs(player.x-this.x),near=Math.abs(player.y-this.y)<40;
  if(this.calm<=0&&near&&distance<95){this.state='windup';this.face=player.x<this.x?-1:1;this.timer=.55;return}
  this.state=this.calm>0?'return':near&&distance<135?'alert':'patrol';
  if(this.state==='patrol'||this.state==='return'){
   this.x=clamp(this.x+this.vx*dt,this.origin-this.range,this.origin+this.range);
   if(this.x<=this.origin-this.range||this.x>=this.origin+this.range)this.vx*=-1;
   this.face=this.vx<0?-1:1;
  }
 }
}
