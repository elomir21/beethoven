import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Input} from '../src/systems/Input.js';
import {makeLevel} from '../src/data/levels.js';
import {dogBreeds,characterFiles} from '../src/data/assets.js';
import {spriteFrames} from '../src/data/spriteFrames.js';
import {canvas,game,tick} from './harness.mjs';

test('toque e teclado mantêm origens independentes e limpam teclas ao cancelar',()=>{
 const input=new Input(canvas);
 input.press('KeyD','pointer:1');input.press('ShiftLeft','pointer:2');input.press('Space','pointer:3');
 assert(input.has('KeyD')&&input.has('ShiftLeft')&&input.hit('Space'));
 input.end();input.press('KeyD','keyboard');input.release('KeyD','pointer:1');
 assert(input.has('KeyD'));assert(!input.hit('KeyD'));
 input.release('Space','pointer:3');assert(!input.has('Space'));assert(input.has('ShiftLeft'));
 input.clear();assert.equal(input.down.size,0);assert.equal(input.sources.size,0);assert.equal(input.pressed.size,0);
});

test('raças distintas em todas as fases e gatos neutros em solo seguro',()=>{
 for(let i=0;i<5;i++){
  const level=makeLevel(i);assert.deepEqual(new Set(level.dogs.map(d=>d.breed)),new Set(dogBreeds));assert(level.cats.length>0);
  for(const cat of level.cats)assert(level.ground.some(s=>cat.origin-cat.range>=s.x&&cat.origin+cat.range<=s.x+s.w));
 }
 game.start(0);const cat=game.level.cats[0];game.player.x=cat.x-8;
 for(let i=0;i<30;i++)tick();assert.equal(game.player.hp,3);assert.equal(cat.state,'watch');
 tick([],['KeyE']);assert(cat.flee>0);assert.equal(cat.state,'startled');assert.equal(game.player.hp,3);
});

test('atlas HD e recortes correspondem aos PNGs entregues, sem quadros fora da imagem',async()=>{
 for(const file of characterFiles){
  const bytes=await readFile('public/assets/'+file),layout=spriteFrames[file];
  assert.equal(bytes.readUInt32BE(16),layout.width);assert.equal(bytes.readUInt32BE(20),layout.height);
  assert(layout.width>1000);assert.equal(layout.frames.length,file.endsWith('/beethoven-hd.png')||file.endsWith('/family-hd.png')?12:file.endsWith('/rivals-hd.png')?16:8);
  for(const frame of layout.frames){assert(frame.w>50&&frame.h>50);assert(frame.x>=0&&frame.y>=0);assert(frame.x+frame.w<=layout.width&&frame.y+frame.h<=layout.height)}
 }
});
