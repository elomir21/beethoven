import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Beethoven} from '../src/entities/Beethoven.js';
import {introFamily} from '../src/data/familyScene.js';
import {humanSprites} from '../src/data/assets.js';
import {parallaxPhase} from '../src/render/parallax.js';

const floor=[{x:-10000,y:222,w:20000,h:100}],audio={sfx(){}};
function advance(player,held,frames=90){const input={has:(...keys)=>keys.some(k=>held.includes(k)),hit:()=>false};for(let i=0;i<frames;i++)player.update(1/120,input,floor,audio,false)}

test('Correr sozinho move na direção atual, seta muda direção e soltar para',()=>{
 const p=new Beethoven(50);advance(p,['Run']);assert(p.x>120&&p.vx>100);
 advance(p,[]);assert(Math.abs(p.vx)<1);
 advance(p,['Run','KeyA']);assert(p.vx< -100&&p.face===-1);
 const x=p.x;advance(p,['Run']);assert(p.x<x&&p.vx< -100);
 const keyboard=new Beethoven(50);advance(keyboard,['ShiftLeft']);assert.equal(keyboard.x,50);
});

test('abertura: família caminha com guia, depois Beethoven se solta e fica sozinho',()=>{
 const attach=introFamily(0,.5),walk=introFamily(0,3),later=introFamily(0,4);
 assert.equal(attach.elomir.frame,5);assert(attach.leash.attached);
 for(const actor of ['elomir','julia','dog'])assert(later[actor].x>walk[actor].x);
 assert(introFamily(2,.2).leash.attached);assert(!introFamily(2,1).leash.attached);assert.equal(introFamily(2,2).leash.fall,1);
 assert(introFamily(2,3).dog.x>introFamily(2,1).dog.x);
 assert.equal(introFamily(5,0).julia,null);assert.equal(introFamily(5,0).elomir,null);
 assert.equal(humanSprites.julia.height,humanSprites.elomir.height);
});

test('parallax não para e conserva fase para câmeras negativas ou muitas repetições',()=>{
 const period=653;
 for(const x of [-20000,-1,0,20,10000,1000000]){const phase=parallaxPhase(x,period);assert(phase>=0&&phase<period);assert(Math.abs(phase-parallaxPhase(x+period*1000,period))<1e-7)}
 const before=parallaxPhase(period-.001,period),after=parallaxPhase(period+.001,period);
 assert(Math.abs(parallaxPhase(after-before,period)-.002)<1e-6);
 assert.throws(()=>parallaxPhase(0,0),RangeError);
});
