import {mkdir,writeFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';
import {characterFiles} from '../src/data/assets.js';
import {createParallaxStrip} from '../src/render/parallax.js';
if(!process.env.NATIVE_CANVAS_MODULE)throw Error('Defina NATIVE_CANVAS_MODULE para o módulo @napi-rs/canvas instalado.');
const {createCanvas,loadImage}=await import(pathToFileURL(process.env.NATIVE_CANVAS_MODULE).href);const {game:g,tick}=await import('../tests/harness.mjs');const {render}=await import('../src/main.js');const {levels}=await import('../src/data/levels.js');
const canvas=createCanvas(960,540);render.c=canvas.getContext('2d');render.c.scale(2,2);render.c.imageSmoothingEnabled=false;
for(const l of levels)render.images[l.bg]=await loadImage('public/assets/'+l.bg);for(const file of characterFiles)render.images[file]=await loadImage('public/assets/'+file);
for(const l of levels)render.strips[l.bg]=createParallaxStrip(render.images[l.bg],createCanvas);
await mkdir('docs/screenshots',{recursive:true});
for(let i=0;i<5;i++){g.start(i);g.player.x=i===4?g.level.end-70:1800;g.cam=Math.max(0,g.player.x-150);for(let j=0;j<20;j++)tick();g.draw();await writeFile(`docs/screenshots/level-${i+1}.png`,canvas.toBuffer('image/png'))}
g.story('ending');g.part=1;g.partTime=5;g.draw();await writeFile('docs/screenshots/ending.png',canvas.toBuffer('image/png'));console.log('Seis renders Canvas gerados (não são capturas de navegador).');
