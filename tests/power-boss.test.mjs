import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeLevel} from '../src/data/levels.js';
import {Boss} from '../src/entities/Boss.js';
import {Beethoven} from '../src/entities/Beethoven.js';
import {fresh,validate,Save} from '../src/systems/Save.js';
import {game as g,save,tick,draw} from './harness.mjs';

const keys=held=>({has:(...ks)=>ks.some(k=>held.includes(k)),hit:()=>false}),silent={sfx(){}};
function start(index=0){save.reset();g.collected.clear();g.start(index)}

test('cinco arenas seguras, três perigos cortantes, duas coxas e só dois checkpoints por fase',()=>{
 for(let i=0;i<5;i++){
  const l=makeLevel(i);assert.equal(l.checkpoints.length,2);assert.equal(l.chickens.length,2);
  assert.deepEqual(new Set(l.hazards.map(h=>h.type)),new Set(['glass','thorns','spikes']));
  assert(l.ground.some(s=>s.x<=l.boss.left&&s.x+s.w>=l.end));
  assert(l.hazards.every(h=>h.x+h.w<l.boss.left));
  assert(l.checkpoints[1].x<l.boss.trigger&&l.checkpoints[1].x>l.chickens[1].x);
  assert(l.chickens.every(c=>l.platforms.some(s=>c.x>=s.x&&c.x+c.w<=s.x+s.w&&c.y+c.h<=s.y+1)));
 }
 assert.equal(makeLevel(2).boss.kind,'rat');
});

test('comer frango ativa a camisa, superpum e voo; pausa congela e retry repõe a coxa',()=>{
 start();const c=g.level.chickens[0];g.player.x=c.x;g.player.y=c.y-8;tick();
 assert(c.eaten&&c.revealed);assert.equal(g.player.power,20);assert(g.player.vy<0);assert(g.particles.some(p=>p.gas));draw();
 g.pause();tick(['Space'],[],1);assert.equal(g.player.power,20);g.resume();
 const x=g.player.x;for(let i=0;i<100;i++)tick(['Run','Space']);
 assert(g.player.flying);assert(g.player.y<100);assert(g.player.y>=35);assert(g.player.x>x+100);
 g.retry();assert.equal(g.player.power,0);assert(!c.eaten);assert(!c.revealed);
});

test('voo tem limite superior, desce ao soltar e expira sem mudar a física normal',()=>{
 const p=new Beethoven(50),floor=[{x:-10000,y:222,w:20000,h:100}];p.eatChicken();
 for(let i=0;i<240;i++)p.update(1/120,keys(['Space']),floor,silent,false);
 assert.equal(p.y,35);assert(p.flying);
 for(let i=0;i<180;i++)p.update(1/120,keys([]),floor,silent,false);
 assert(p.grounded);assert(!p.flying);
 for(let i=0;i<2400;i++)p.update(1/120,keys([]),floor,silent,false);
 assert.equal(p.power,0);assert(p.grounded);
});

test('vidro, espinhos e pontas causam dano mesmo com a camisa; invulnerabilidade evita dano por frame',()=>{
 for(const type of ['glass','thorns','spikes']){
  start();const h=g.level.hazards.find(h=>h.type===type);g.player.x=h.x;g.player.y=199;g.player.power=10;tick();
  assert.equal(g.player.hp,2,type);tick();assert.equal(g.player.hp,2);
 }
});

test('chefe sinaliza investida, recupera, respeita invulnerabilidade e não pode ser travado por spam',()=>{
 const b=new Boss(0,1000);b.active=true;const p=new Beethoven(650);
 b.update(.01,p);b.update(.81,p);assert.equal(b.state,'windup');
 const warning=b.timer;assert(b.hit());assert.equal(b.state,'windup');assert.equal(b.timer,warning);assert(!b.hit());
 b.update(1,p);assert.equal(b.state,'charge');b.update(.8,p);assert.equal(b.state,'recover');
 assert.equal(b.hp,b.maxHp-1);
});

test('latido direcional e pisão ferem o chefe; investida bloqueia latido',()=>{
 start();const b=g.level.boss;b.active=true;b.state='recover';b.timer=5;
 g.player.x=b.x-70;g.player.face=1;tick([],['KeyE']);assert.equal(b.hp,b.maxHp-1);
 b.inv=0;g.player.bark=0;g.player.face=-1;tick([],['KeyE']);assert.equal(b.hp,b.maxHp-1);
 b.state='charge';b.timer=1;g.player.face=1;g.player.bark=0;tick([],['KeyE']);assert.equal(b.hp,b.maxHp-1);
 b.state='recover';b.timer=2;b.inv=0;g.player.x=b.x+10;g.player.y=b.y-g.player.h-1;g.player.vy=160;
 tick();assert.equal(b.hp,b.maxHp-2);assert(g.player.vy<0);
});

test('superpum impulsiona, acalma cães próximos e causa dois danos interrompendo a investida',()=>{
 start();const b=g.level.boss;b.active=true;b.state='charge';b.timer=.5;
 g.player.x=b.x-70;g.player.y=199;g.player.eatChicken();g.player.boostCooldown=0;
 const dog=g.level.dogs[0];dog.x=g.player.x+20;
 tick(['Space']);assert(g.player.flying&&g.player.vy<0);assert.equal(b.hp,b.maxHp-2);
 assert.equal(b.state,'recover');assert(dog.calm>3);assert.equal(g.player.hp,3);
});

test('voar não pula o chefe; todas as saídas e o portão exigem vitória',()=>{
 for(let i=0;i<5;i++){
  start(i);const b=g.level.boss;g.player.x=g.level.end+100;g.player.y=35;g.player.power=10;
  tick(['Space'],['KeyE']);assert.equal(g.mode,'play');assert(b.active);assert(g.player.x<=b.right-g.player.w);
  while(!b.defeated){b.inv=0;g.hitBoss()}
  assert(save.data.bosses.includes(i));g.player.x=g.level.end-20;tick([],i===4?['KeyE']:[]);
  if(i===4){g.player.bark=0;tick([],['KeyE'])}
  assert.equal(g.mode,i===4?'ending':'transition');
 }
});

test('retry restaura a luta; vitória e checkpoints antigos sobrevivem a recarga; novo jogo limpa',()=>{
 start(2);const l=g.level,b=l.boss,cp=l.checkpoints[1];g.checkpoint=cp.x;save.data.checkpoint=cp.x;
 b.active=true;g.hitBoss();g.retry();assert.equal(b.hp,b.maxHp);assert(!b.active);assert.equal(g.player.x,cp.x);
 b.active=true;while(!b.defeated){b.inv=0;g.hitBoss()}
 const restored=new Save();assert(restored.data.bosses.includes(2));
 g.start(2,true);assert(g.level.boss.defeated);assert.equal(g.checkpoint,cp.x);
 save.data.checkpoint=cp.x+50;g.start(2,true);assert.equal(g.checkpoint,cp.x);
 save.reset();assert.deepEqual(save.data.bosses,[]);g.start(2);assert(!g.level.boss.defeated);
 const old={...fresh()};delete old.bosses;assert.deepEqual(validate(old).bosses,[]);
 assert.deepEqual(validate({...fresh(),bosses:[2,2,9,-1,'1',1]}).bosses,[2,1]);
});
