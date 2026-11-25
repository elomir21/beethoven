import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/render/Renderer.js';
import {makeLevel} from '../src/data/levels.js';
import {Beethoven} from '../src/entities/Beethoven.js';

function recorder(){
 const calls=[],renderer=Object.create(Renderer.prototype);
 renderer.c=new Proxy({}, {get:(_,name)=>(...args)=>calls.push([name,...args]),set:()=>true});
 renderer.background=renderer.hud=renderer.sprite=()=>{};
 return {renderer,calls};
}
test('latido espelha o arco nas duas direções; placa tem texto único sem sombra e piso não tem aviso',()=>{
 for(const face of [-1,1]){
  const {renderer,calls}=recorder(),level=makeLevel(2),player=new Beethoven(50);player.face=face;player.bark=.2;
  renderer.level({level,player,cam:0,time:0,checkpoint:0,collected:new Set(),particles:[]});
  const arc=calls.findIndex(call=>call[0]==='arc'&&call[1]===23&&call[2]===0);
  assert(arc>0);assert.deepEqual(calls[arc-1],['scale',face,1]);
  assert.equal(calls.filter(call=>call[0]==='fillText'&&call[1]==='CAMINHO →').length,1);
  assert(!calls.some(call=>call[0]==='fillText'&&call[1]==='MOLHADO'));
 }
});
test('chefe prepara e recupera sem avisos textuais de combate',()=>{
 for(const state of ['windup','recover']){
  const {renderer,calls}=recorder(),boss=makeLevel(0).boss;boss.active=true;boss.state=state;renderer.boss(boss,0);
  assert(!calls.some(call=>call[0]==='fillText'));
 }
});
