import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {levels} from '../src/data/levels.js';

const result={status:'running',checks:[],errors:[],screens:[]};
let browser,server;
await mkdir('test-results',{recursive:true});
async function check(name,fn){await fn();result.checks.push(name);console.log('✓ '+name)}
try{
 let url=process.env.E2E_BASE_URL;
 if(!url){server=spawn(process.execPath,['scripts/serve.mjs','dist'],{env:{...process.env,PORT:'5177'},stdio:'ignore'});url='http://127.0.0.1:5177';let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert(ready)}
 result.url=url;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>result.errors.push(e.message));
 const html=process.env.E2E_BASE_URL?await(await fetch(url+'/Beethoven.html')).text():await readFile('dist/Beethoven.html','utf8'),entry="await require('src/main.js');";assert(html.includes(entry));
 // Test-only fixture exposes existing module exports to choose narrative times.
 // No teleport or mutable debug API is added to the production game.
 await page.route('**/__story_qa',route=>route.fulfill({contentType:'text/html',body:html.replace(entry,"window.__storyQA=await require('src/main.js');")}));
 await page.goto(url+'/__story_qa');await page.waitForFunction(()=>window.__storyQA);
 await check('Quatro atlas carregados e duas alturas humanas equivalentes',async()=>{
  const data=await page.evaluate(()=>{const {render}=window.__storyQA;const frames=[];const scratch=document.createElement('canvas');scratch.width=120;scratch.height=100;const c=scratch.getContext('2d'),original=render.c;try{render.c=c;for(const actor of ['julia','elomir']){c.clearRect(0,0,120,100);render.sprite(actor,60,85,0);const p=c.getImageData(0,0,120,100).data;let top=100,bottom=0;for(let y=0;y<100;y++)for(let x=0;x<120;x++)if(p[(y*120+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y)}frames.push(bottom-top)}}finally{render.c=original}return {errors:render.errors,loaded:Object.keys(render.images).filter(f=>f.includes('characters')).length,heights:frames}});
  assert.deepEqual(data.errors,[]);assert.equal(data.loaded,4);assert(Math.abs(data.heights[0]-data.heights[1])<=2);
 });
 await check('Parallax: extremidades contínuas e nenhuma mudança brusca ao cruzar o período',async()=>{
  const stats=await page.evaluate(files=>{
   const {render}=window.__storyQA,output=[];
   for(let index=0;index<5;index++){
    const name=files[index],image=render.images[name];
    render.background(index,0,0);const strip=render.strips[name],overlap=image.width-strip.width;
    const raw=document.createElement('canvas');raw.width=image.width;raw.height=image.height;const r=raw.getContext('2d');r.drawImage(image,0,0);
    const s=strip.getContext('2d'),left=s.getImageData(0,0,1,image.height).data,right=s.getImageData(strip.width-1,0,1,image.height).data,a=r.getImageData(overlap,0,1,image.height).data,b=r.getImageData(overlap-1,0,1,image.height).data;
    let edgeError=0;for(let i=0;i<left.length;i++)edgeError=Math.max(edgeError,Math.abs(left[i]-a[i]),Math.abs(right[i]-b[i]));
    const period=strip.width*272/strip.height;
    render.background(index,(period-.001)/.24,0);const before=render.c.getImageData(0,0,render.canvas.width,render.canvas.height).data;
    render.background(index,(period+.001)/.24,0);const after=render.c.getImageData(0,0,render.canvas.width,render.canvas.height).data;
    let difference=0,samples=0;for(let i=0;i<before.length;i+=52){difference+=Math.abs(before[i]-after[i]);samples++}
    output.push({name,edgeError,temporalError:difference/samples});
   }
   return output;
  },levels.map(l=>l.bg));
  for(const stat of stats){assert(stat.edgeError<=1,JSON.stringify(stat));assert(stat.temporalError<1.5,JSON.stringify(stat))}result.parallax=stats;
 });
 await check('Abertura animada: guia, caminhada conjunta e separação',async()=>{
  for(const [part,time,file]of [[0,.5,'intro-leash.png'],[0,3,'intro-walk.png'],[2,1.5,'intro-release.png']]){
   await page.evaluate(({part,time})=>{const {game}=window.__storyQA;game.story('intro');game.part=part;game.partTime=time;game.draw()},{part,time});
   await page.locator('#stage').screenshot({path:'test-results/'+file});result.screens.push(file);
  }
 });
 assert.deepEqual(result.errors,[]);result.status='passed';
}catch(error){result.status='failed';result.failure=error.stack||String(error);console.error(result.failure);process.exitCode=1}
finally{await browser?.close();server?.kill();await writeFile('test-results/story-assets-report.json',JSON.stringify(result,null,2))}
