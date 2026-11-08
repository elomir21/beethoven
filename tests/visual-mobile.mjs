import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {characterFiles} from '../src/data/assets.js';
import {levels} from '../src/data/levels.js';

const report={status:'running',checks:[],errors:[],screens:[]};
let browser,server;
await mkdir('test-results',{recursive:true});
async function check(name,fn){await fn();report.checks.push(name);console.log('✓ '+name)}
try{
 let url=process.env.E2E_BASE_URL;
 if(!url){
  const port='5176';server=spawn(process.execPath,['scripts/serve.mjs','dist'],{env:{...process.env,PORT:port},stdio:'ignore'});url='http://127.0.0.1:'+port;
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert(ready,'Servidor visual não iniciou');
 }
 report.url=url;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const desktop=await browser.newContext({viewport:{width:2560,height:1440},deviceScaleFactor:2});
 const page=await desktop.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await check('Desktop 16:9, backing store 4K e atlas HD carregados',async()=>{
  await page.goto(url);await page.getByRole('button',{name:'Jogar',exact:true}).waitFor();
  await page.waitForFunction(()=>window.beethoven?.snapshot().resolution.width===3840);
  assert.deepEqual(await page.evaluate(()=>window.beethoven.snapshot().errors),[]);
  const sizes=await page.evaluate(async files=>Promise.all(files.map(async file=>{const image=new Image();image.src='/assets/'+file;await image.decode();return image.width})),characterFiles);assert(sizes.every(w=>w>1000));
  const backgrounds=await page.evaluate(async files=>Promise.all(files.map(async file=>{const image=new Image();image.src='/assets/'+file;await image.decode();return {width:image.width,height:image.height}})),levels.map(l=>l.bg));assert(backgrounds.every(i=>i.width>=2048&&i.height>512));
  await page.getByRole('button',{name:'Jogar',exact:true}).click();await page.locator('#story-skip').click();await page.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
  await page.keyboard.down('KeyD');await page.keyboard.down('Shift');await page.waitForTimeout(2500);await page.keyboard.up('KeyD');await page.keyboard.up('Shift');
  const data=await page.evaluate(()=>window.beethoven.snapshot());assert(data.cats.length>0);assert(data.npcs.every(n=>n.breed&&n.breed!=='beethoven'));
  await page.screenshot({path:'test-results/desktop-hd.png'});report.screens.push('desktop-hd.png');
 });
 await check('Tela cheia nativa desktop: entrar, controles incluídos e sair',async()=>{
  await page.locator('#fullscreen').click();
  await page.waitForFunction(()=>document.fullscreenElement?.id==='game-shell');
  assert(await page.evaluate(()=>document.fullscreenElement.contains(document.querySelector('#fullscreen'))&&document.fullscreenElement.contains(document.querySelector('#touch-controls'))));
  await page.waitForFunction(()=>document.querySelector('#fullscreen').getAttribute('aria-pressed')==='true');
  await page.locator('#fullscreen').click();await page.waitForFunction(()=>!document.fullscreenElement&&document.querySelector('#game-shell').dataset.expanded==='false');
  // Also cover a browser-initiated exit, which reports fullscreenchange.
  await page.locator('#fullscreen').click();await page.waitForFunction(()=>document.fullscreenElement?.id==='game-shell');
  await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>document.querySelector('#fullscreen').getAttribute('aria-pressed')==='false');
 });
 await desktop.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const phone=await mobile.newPage();phone.on('pageerror',e=>report.errors.push(e.message));
 await phone.goto(url);await phone.getByRole('button',{name:'Jogar',exact:true}).tap();
 await phone.locator('#story-next').tap();await phone.locator('#story-skip').tap();await phone.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
 const snapshot=()=>phone.evaluate(()=>window.beethoven.snapshot());
 async function assertLayout(){
  await phone.waitForFunction(()=>{const root=document.documentElement,c=document.querySelector('#game'),r=c.getBoundingClientRect();return Math.abs(parseFloat(root.style.getPropertyValue('--viewport-width'))-visualViewport.width)<1&&Math.abs(parseFloat(root.style.getPropertyValue('--viewport-height'))-visualViewport.height)<1&&c.width>=r.width*2.9&&Math.abs(r.width/r.height-16/9)<.01});
  const layout=await phone.evaluate(()=>({width:visualViewport.width,height:visualViewport.height,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('[data-key],#pause,#mute,#fullscreen')].map(b=>{const r=b.getBoundingClientRect();return {id:b.id||b.dataset.key,x:r.x,y:r.y,w:r.width,h:r.height}})}));
  assert(layout.scroll<=layout.width+1,'Overflow horizontal');
  for(const r of layout.buttons){assert(r.w>=44&&r.h>=40);assert(r.x>=0&&r.x+r.w<=layout.width+1);assert(r.y>=0&&r.y+r.h<=layout.height+1,'Controle fora da tela: '+JSON.stringify({button:r,viewport:[layout.width,layout.height]}))}
  const controls=layout.buttons.filter(r=>['KeyA','KeyD','Run','KeyE','KeyJ','KeyK','Space'].includes(r.id));assert.equal(controls.length,7);
  for(const r of controls)assert(r.w>=56&&r.h>=56,'Alvo de toque pequeno: '+r.id);
  for(let i=0;i<controls.length;i++)for(const b of controls.slice(i+1)){
   const a=controls[i],dx=Math.max(0,a.x-b.x-b.w,b.x-a.x-a.w),dy=Math.max(0,a.y-b.y-b.h,b.y-a.y-a.h);
   assert(Math.hypot(dx,dy)>=15.9,'Controles próximos: '+JSON.stringify({a,b}));
  }
  for(const a of controls)for(const b of layout.buttons.filter(r=>!controls.includes(r))){
   const dx=Math.max(0,a.x-b.x-b.w,b.x-a.x-a.w),dy=Math.max(0,a.y-b.y-b.h,b.y-a.y-a.h);
   assert(Math.hypot(dx,dy)>=15.9,'Controle próximo da barra de pausa/som/tela cheia: '+JSON.stringify({a,b}));
  }
  const button=id=>controls.find(r=>r.id===id),left=button('KeyA'),right=button('KeyD'),run=button('Run'),bark=button('KeyE'),paw=button('KeyJ'),bite=button('KeyK'),jump=button('Space');
  assert(run.y+run.h+16<=left.y+.1&&Math.abs(left.y-right.y)<1,'Corrida deve ficar acima das direções');
  assert(paw.y+paw.h+16<=bark.y+.1&&bite.y+bite.h+16<=jump.y+.1&&bark.x+bark.w+16<=jump.x+.1,'Ataques devem ficar acima do latido e salto, com espaço entre botões');
  assert(jump.w>=right.w+15.9&&jump.h>=right.h+15.9,'Salto deve ter um alvo maior');
  assert(Math.min(paw.x,bark.x,jump.x)-Math.max(run.x+run.w,right.x+right.w)>=23.9,'Grupos dos polegares muito próximos');
 }
 await check('Celular retrato: alvos de 56 px, espaços de 16 px e grupos por polegar',assertLayout);
 const client=await mobile.newCDPSession(phone);
 async function points(keys){return Promise.all(keys.map(async(key,index)=>{const r=await phone.locator(`[data-key="${key}"]`).boundingBox();assert(r);return {id:index+1,x:r.x+r.width/2,y:r.y+r.height/2,radiusX:3,radiusY:3,force:1}}))}
 const touch=(type,touchPoints)=>client.send('Input.dispatchTouchEvent',{type,touchPoints});
 await check('Multitoque real: correr e pular simultaneamente; soltar e cancelar',async()=>{
  await phone.waitForFunction(()=>window.beethoven.snapshot().grounded);
  const start=(await snapshot()).x;
  await touch('touchStart',await points(['Run']));await phone.waitForTimeout(300);assert((await snapshot()).vx>100);assert((await snapshot()).x>start+15);
  await touch('touchStart',await points(['Run','Space']));await phone.waitForTimeout(100);assert((await snapshot()).vy<0);
  await touch('touchEnd',[]);await phone.waitForFunction(()=>window.beethoven.snapshot().grounded);await phone.waitForTimeout(350);assert(Math.abs((await snapshot()).vx)<5);
  await touch('touchStart',await points(['KeyD']));await phone.waitForTimeout(100);await touch('touchCancel',[]);await phone.waitForTimeout(500);assert(Math.abs((await snapshot()).vx)<5);
 });
 await check('Latido, som, pausa, retomada e save por toque',async()=>{
  await phone.locator('[data-key="KeyE"]').tap();await phone.waitForFunction(()=>window.beethoven.snapshot().bark>0);
  await phone.locator('#mute').tap();await phone.waitForFunction(()=>document.querySelector('#mute').textContent.includes('desligado'));
  await phone.locator('#pause').tap();await phone.waitForFunction(()=>window.beethoven.snapshot().mode==='pause');const x=(await snapshot()).x;await phone.waitForTimeout(150);assert.equal((await snapshot()).x,x);
  await phone.getByRole('button',{name:'Continuar',exact:true}).tap();await phone.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
  await phone.reload();await phone.getByRole('button',{name:'Continuar',exact:true}).tap();await phone.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
 });
 await phone.screenshot({path:'test-results/mobile-portrait.png'});report.screens.push('mobile-portrait.png');
 await check('Rotação e telas pequenas: paisagem e retrato sem distorção',async()=>{
  for(const size of [{width:844,height:390},{width:640,height:360},{width:568,height:320},{width:320,height:568},{width:360,height:640}]){
   await phone.setViewportSize(size);await assertLayout();
   if(size.width>size.height){
    await phone.waitForFunction(()=>document.querySelector('#game-shell').dataset.expanded==='true');
    const fill=await phone.evaluate(()=>{const r=document.querySelector('#stage').getBoundingClientRect();return r.width/Math.min(visualViewport.width,visualViewport.height*16/9)});
    assert(fill>.95,'Paisagem deve usar o maior retângulo 16:9 disponível');
   }else await phone.waitForFunction(()=>document.querySelector('#game-shell').dataset.expanded==='false');
   if(size.width===844){await phone.screenshot({path:'test-results/mobile-landscape.png'});report.screens.push('mobile-landscape.png')}
  }
 });
 await check('Orientação real emulada e barras móveis: reajuste sem reiniciar a fase',async()=>{
  const before=await snapshot();
  for(const height of [390,320,390]){
   await client.send('Emulation.setDeviceMetricsOverride',{width:844,height,deviceScaleFactor:3,mobile:true,screenWidth:844,screenHeight:390,screenOrientation:{type:'landscapePrimary',angle:90}});
   await phone.waitForFunction(h=>Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--viewport-height'))-h)<1,height);
   await assertLayout();
   const size=await phone.locator('#stage').boundingBox();assert(Math.abs(size.height-height)<2);
   assert.equal((await snapshot()).level,before.level);assert.equal((await snapshot()).checkpoint,before.checkpoint);
  }
 });
 await check('Tela cheia móvel nativa: girar, jogar e sair sem perder os controles',async()=>{
  await phone.locator('#fullscreen').tap();await phone.waitForFunction(()=>document.fullscreenElement?.id==='game-shell');
  await phone.setViewportSize({width:844,height:390});await phone.waitForFunction(()=>visualViewport.width>visualViewport.height);
  await assertLayout();await phone.screenshot({path:'test-results/mobile-fullscreen.png'});report.screens.push('mobile-fullscreen.png');
  await touch('touchStart',await points(['KeyD']));await phone.waitForTimeout(200);assert((await snapshot()).vx>20);await touch('touchEnd',[]);
  await phone.setViewportSize({width:390,height:844});await assertLayout();assert(await phone.evaluate(()=>document.fullscreenElement?.id==='game-shell'));
  await phone.locator('#fullscreen').tap();await phone.waitForFunction(()=>!document.fullscreenElement&&document.querySelector('#game-shell').dataset.expanded==='false');
  await assertLayout();
 });
 await check('Fallback quando o navegador recusa tela cheia: ampliar, avisar e sair',async()=>{
  await phone.evaluate(()=>Object.defineProperty(document.querySelector('#game-shell'),'requestFullscreen',{configurable:true,value:()=>Promise.reject(new Error('Fullscreen unavailable in test'))}));
  await phone.locator('#fullscreen').tap();await phone.waitForFunction(()=>document.querySelector('#game-shell').dataset.screenMode==='expanded');
  assert((await phone.locator('#display-status').textContent()).includes('mantém as próprias barras'));await assertLayout();
  await phone.locator('#fullscreen').tap();await phone.waitForFunction(()=>document.querySelector('#game-shell').dataset.screenMode==='inline');
  assert.equal(await phone.locator('#display-status').textContent(),'');await assertLayout();
 });
 assert.deepEqual(report.errors,[]);report.status='passed';await mobile.close();
}catch(error){report.status='failed';report.failure=error.stack||String(error);console.error(report.failure);process.exitCode=1}
finally{await browser?.close();server?.kill();await writeFile('test-results/visual-mobile-report.json',JSON.stringify(report,null,2))}
