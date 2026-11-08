import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Beethoven} from '../src/entities/Beethoven.js';
import {Rival} from '../src/entities/Rival.js';
import {game as g,save,tick,draw} from './harness.mjs';

const advance=seconds=>{for(let i=0;i<Math.ceil(seconds*120);i++)tick()};
function start(index=0){save.reset();g.collected.clear();g.start(index);g.player.grounded=true}
function faceTarget(target,gap=8,face=1){g.player.x=face>0?target.x-g.player.w-gap:target.x+target.w+gap;g.player.y=199;g.player.vx=0;g.player.vy=0;g.player.face=face;g.player.grounded=true}

test('patada e mordida têm preparação, alcance frontal e recarga compartilhada',()=>{
 const p=new Beethoven(100);assert(p.strike('paw'));assert.equal(p.attackBox(),null);assert(!p.strike('bite'));
 p.attack.elapsed=.1;assert(p.attackBox().x>p.x);assert.equal(p.attackBox().w,37);
 p.attack.face=-1;assert.equal(p.attackBox().x,66);p.attack.elapsed=.25;assert.equal(p.attackBox(),null);
 assert(!p.strike('unknown'));
});

test('patada acerta uma vez por golpe mesmo sem invulnerabilidade do rival; segurar não repete',()=>{
 start();const d=g.level.dogs[0];faceTarget(d);tick([],['KeyJ']);assert.equal(d.hp,d.maxHp);
 for(let i=0;i<45;i++){d.inv=0;tick(['KeyJ'])}
 assert.equal(d.hp,d.maxHp-1);assert.equal(g.player.attack,null);draw();
});

test('mordida causa dois danos; vitória acalma definitivamente e não volta ao latir ou ao superpum',()=>{
 start();const d=g.level.dogs[0];faceTarget(d);tick([],['KeyK']);advance(.32);assert.equal(d.hp,d.maxHp-2);
 advance(.45);faceTarget(d);tick([],['KeyJ']);advance(.12);assert(d.defeated);assert.equal(d.state,'defeated');
 g.player.x=d.x;g.player.inv=0;g.player.vy=0;g.player.y=199;tick([],['KeyE']);g.superGas();advance(1);
 assert.equal(g.player.hp,3);assert.equal(d.hp,0);assert.equal(d.state,'defeated');draw();
});

test('golpes respeitam direção, distância, altura e as duas orientações',()=>{
 for(const scenario of ['back','far','high','left']){
  start();const d=g.level.dogs[0];faceTarget(d,scenario==='far'?65:8,scenario==='left'?-1:1);
  if(scenario==='back')g.player.face=-1;if(scenario==='high')g.player.y=90;
  tick([],['KeyJ']);advance(.14);assert.equal(d.hp,d.maxHp-(scenario==='left'?1:0),scenario);
 }
});

test('rivais avisam antes de avançar, podem ser interrompidos e respeitam seus limites',()=>{
 const d=new Rival('pitbull',200),p=new Beethoven(170);d.update(.01,p);assert.equal(d.state,'windup');
 d.update(.56,p);assert.equal(d.state,'charge');assert(d.hit(1,1));assert.equal(d.state,'stunned');assert(!d.hit(1,1));
 d.update(.5,p);assert.equal(d.state,'recover');d.soothe(3.5);d.update(.01,p);assert.equal(d.state,'return');
 for(let i=0;i<600;i++)d.update(1/120,p);assert(d.x>=d.origin-d.range&&d.x<=d.origin+d.range);
 start();const enemy=g.level.dogs[0];faceTarget(enemy,-5);enemy.state='windup';enemy.timer=.1;tick([],[],.05);assert.equal(g.player.hp,3);
 tick([],[],.06);assert.equal(enemy.state,'charge');assert.equal(g.player.hp,2);tick();assert.equal(g.player.hp,2);
});

test('patadas e mordidas ferem todos os chefes; investida e cooldown bloqueiam dano',()=>{
 for(let index=0;index<5;index++)for(const [key,damage]of [['KeyJ',1],['KeyK',2]]){
  start(index);const b=g.level.boss;b.active=true;b.state='recover';b.timer=5;faceTarget(b);
  tick([], [key]);advance(.32);assert.equal(b.hp,b.maxHp-damage,`${index} ${key}`);
 }
 start();const b=g.level.boss;b.active=true;b.state='charge';b.timer=5;b.speed=0;faceTarget(b);
 tick([],['KeyK']);advance(.32);assert.equal(b.hp,b.maxHp);
 b.state='recover';b.inv=0;tick([],['KeyJ']);assert.equal(g.player.attack?.kind,'bite');assert.equal(b.hp,b.maxHp);
});

test('pausa congela golpe e recarga; retry restaura rivais, novo jogador e vitórias de chefe persistem',()=>{
 start();const d=g.level.dogs[0];faceTarget(d);tick([],['KeyJ']);advance(.08);
 const elapsed=g.player.attack.elapsed,cooldown=g.player.attackCooldown,hp=d.hp;g.pause();tick([],['KeyK'],1);
 assert.equal(g.player.attack.elapsed,elapsed);assert.equal(g.player.attackCooldown,cooldown);assert.equal(d.hp,hp);
 g.resume();g.retry();assert.equal(d.hp,d.maxHp);assert.equal(d.state,'patrol');assert.equal(g.player.attack,null);assert.equal(g.player.attackCooldown,0);
 const b=g.level.boss;b.active=true;b.hp=2;b.state='recover';b.timer=5;faceTarget(b);tick([],['KeyK']);advance(.18);
 assert(b.defeated);assert(save.data.bosses.includes(0));g.start(0,true);assert(g.level.boss.defeated);
 assert(g.level.dogs.every(d=>d.hp===d.maxHp&&!d.defeated));
});

test('camisa reforça golpes e gatos de cenário permanecem neutros',()=>{
 start();const d=g.level.dogs[0];faceTarget(d);g.player.power=2;g.player.launch=0;tick([],['KeyK']);advance(.2);assert(d.defeated);
 start();const cat=g.level.cats[0];g.player.x=cat.x-30;g.player.face=1;tick([],['KeyJ']);advance(.5);tick([],['KeyK']);advance(.5);
 assert.equal(g.player.hp,3);assert.equal(cat.hp,undefined);assert(!cat.defeated);
});
