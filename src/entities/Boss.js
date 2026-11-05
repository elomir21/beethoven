import {clamp} from '../engine/physics.js';

const profiles=[
 {name:'Mingau, dono da orla',kind:'tabby',hp:5,speed:125,windup:.95,leap:150},
 {name:'Brutus do parque',kind:'pitbull',hp:6,speed:145,windup:.9,leap:0},
 {name:'Ratão das galerias',kind:'rat',hp:7,speed:135,windup:1,leap:80},
 {name:'Sombra do caminho',kind:'tuxedo',hp:7,speed:155,windup:.9,leap:130},
 {name:'Titã do portão',kind:'rottweiler',hp:9,speed:170,windup:.8,leap:0},
];

export class Boss {
 constructor(index,end){
  const profile=profiles[index];Object.assign(this,profile);
  this.index=index;this.end=end;this.maxHp=profile.hp;
  this.w=this.kind==='rat'?64:52;this.h=this.kind==='rat'?43:42;
  this.left=end-510;this.right=end-45;this.trigger=end-490;
  this.x=end-180;this.y=222-this.h;this.vy=0;this.face=-1;
  this.active=false;this.defeated=false;this.state='idle';this.timer=0;this.inv=0;
 }
 reset(){Object.assign(this,new Boss(this.index,this.end))}
 update(dt,player){
  if(!this.active||this.defeated)return;
  this.inv=Math.max(0,this.inv-dt);this.timer-=dt;
  if(this.state==='idle'){this.state='prowl';this.timer=.8}
  if(this.state==='prowl'){
   this.face=player.x+player.w/2<this.x+this.w/2?-1:1;
   this.x+=this.face*24*dt;
   if(this.timer<=0){this.state='windup';this.timer=this.windup}
  }else if(this.state==='windup'&&this.timer<=0){
   this.state='charge';this.timer=.72;this.vy=-this.leap;
  }else if(this.state==='charge'){
   this.x+=this.face*this.speed*dt;
   if(this.timer<=0||this.x<=this.left+8||this.x+this.w>=this.right){this.state='recover';this.timer=1.5}
  }else if(this.state==='recover'&&this.timer<=0){this.state='prowl';this.timer=.65}
  this.x=clamp(this.x,this.left+8,this.right-this.w);
  this.vy+=850*dt;this.y=Math.min(222-this.h,this.y+this.vy*dt);
  if(this.y>=222-this.h)this.vy=0;
 }
 hit(damage=1){
  if(!this.active||this.defeated||this.inv>0)return false;
  this.hp=Math.max(0,this.hp-damage);this.inv=.85;
  this.defeated=this.hp===0;
  if(this.defeated)this.state='defeated';
  else if(this.state==='charge'){this.state='recover';this.timer=.75;this.vy=0}
  return true;
 }
}
