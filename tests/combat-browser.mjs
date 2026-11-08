import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const report={status:'running',checks:[],errors:[],battles:[],screens:[]};
let browser,server;
async function check(name,fn){await fn();report.checks.push(name);console.log('✓ '+name)}
async function release(page){for(const key of ['KeyD','KeyA','Shift','Space'])await page.keyboard.up(key)}
try{
 await mkdir('test-results',{recursive:true});
 let url=process.env.E2E_BASE_URL;
 if(!url){
  server=spawn(process.execPath,['scripts/serve.mjs','dist'],{env:{...process.env,PORT:'5178'},stdio:'ignore'});url='http://127.0.0.1:5178';
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert(ready);
 }
 report.url=url;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const html=process.env.E2E_BASE_URL?await(await fetch(url+'/Beethoven.html')).text():await readFile('dist/Beethoven.html','utf8');
 const entry="await require('src/main.js');";assert(html.includes(entry));
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 async function fixture(context){
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  // Select test positions through existing exports, only in this intercepted HTML.
  // The shipped game retains its read-only snapshot API.
  await page.route('**/__combat_qa',r=>r.fulfill({contentType:'text/html',body:html.replace(entry,"window.__combatQA=await require('src/main.js');")}));
  await page.goto(url+'/__combat_qa');await page.waitForFunction(()=>window.__combatQA);return page;
 }
 const page=await fixture(context),snapshot=()=>page.evaluate(()=>window.beethoven.snapshot());
 await check('Teclado: patada e mordida vencem rival e atingem os cinco chefes',async()=>{
  await page.evaluate(()=>{const {game,save}=window.__combatQA;save.reset();game.start(0);const d=game.level.dogs[0];game.player.x=d.x-35;game.player.grounded=true;game.cam=game.player.x-180});
  await page.keyboard.press('KeyJ');await page.waitForFunction(()=>window.beethoven.snapshot().npcs[0].hp===2);
  await page.locator('#stage').screenshot({path:'test-results/paw-rival.png'});report.screens.push('paw-rival.png');
  await page.waitForFunction(()=>window.beethoven.snapshot().attackCooldown===0);
  await page.evaluate(()=>{const {game}=window.__combatQA;game.player.x=game.level.dogs[0].x-35});
  await page.keyboard.press('KeyK');await page.waitForFunction(()=>window.beethoven.snapshot().npcs[0].defeated);assert.equal((await snapshot()).hp,3);
  for(let index=0;index<5;index++){
   await page.evaluate(index=>{const {game,save}=window.__combatQA;save.reset();game.start(index);const b=game.level.boss;b.active=true;b.state='recover';b.timer=5;game.player.x=b.x-35;game.player.grounded=true;game.cam=game.player.x-180},index);
   const hp=(await snapshot()).boss.maxHp;await page.keyboard.press('KeyJ');await page.waitForFunction(hp=>window.beethoven.snapshot().boss.hp===hp-1,hp);
   await page.waitForFunction(()=>window.beethoven.snapshot().attackCooldown===0&&window.__combatQA.game.level.boss.inv===0);
   await page.keyboard.press('KeyK');await page.waitForFunction(hp=>window.beethoven.snapshot().boss.hp===hp-3,hp);
   if(index===2){await page.locator('#stage').screenshot({path:'test-results/bite-boss.png'});report.screens.push('bite-boss.png')}
  }
 });
 await check('Frango alcançável por salto: camisa, voo, pausa e expiração no browser',async()=>{
  await page.evaluate(()=>{const {game,save}=window.__combatQA;save.reset();game.start(0);const c=game.level.chickens[0];game.player.x=c.x-50;game.player.y=199;game.player.grounded=true;game.cam=game.player.x-180});
  await page.keyboard.down('KeyD');await page.keyboard.down('Shift');await page.keyboard.down('Space');
  await page.waitForFunction(()=>window.beethoven.snapshot().power>0);await release(page);
  await page.locator('[data-key="Space"]').getByText('Voar',{exact:true}).waitFor({state:'attached'});
  assert((await snapshot()).chickens[0].eaten);
  await page.locator('#pause').click();const power=(await snapshot()).power;await page.waitForTimeout(350);assert.equal((await snapshot()).power,power);await page.locator('#pause').click();
  await page.keyboard.down('Space');await page.keyboard.down('KeyD');await page.waitForTimeout(650);
  assert((await snapshot()).flying);assert((await snapshot()).y<100);
  await page.locator('#stage').screenshot({path:'test-results/vasco-flight.png'});report.screens.push('vasco-flight.png');await release(page);
  await page.evaluate(()=>{window.__combatQA.game.player.power=.12;window.__combatQA.game.player.launch=0});
  await page.waitForFunction(()=>window.beethoven.snapshot().power===0&&!window.beethoven.snapshot().flying);
  await page.waitForFunction(()=>document.querySelector('[data-key="Space"]').textContent==='Pular');
 });
 await check('Cinco chefes vencidos por teclas, sem poder ou alteração de vida',async()=>{
  for(let index=0;index<5;index++){
   await page.evaluate(index=>{const {game,save}=window.__combatQA;save.reset();game.start(index);game.player.x=game.level.checkpoints[1].x-5;game.player.y=199;game.player.grounded=true;game.cam=game.player.x-180},index);
   await page.keyboard.down('KeyD');let lastBark=0,lastJump=0,holdUntil=0,retries=0;const started=Date.now(),deadline=started+90000;
   while(Date.now()<deadline){
    const p=await snapshot(),b=p.boss;if(b.defeated)break;
    if(p.mode==='over'){
     assert(++retries<=3,`excesso de tentativas contra ${b.name}`);await release(page);
     await page.getByRole('button',{name:'Tentar do checkpoint',exact:true}).click();await page.keyboard.down('KeyD');holdUntil=0;continue;
    }
    assert.equal(p.mode,'play');const now=Date.now();
    if(b.active){
     const delta=b.x+b.w/2-p.x-13.5,axis=b.state==='charge'?0:Math.abs(delta)>85||p.face!==Math.sign(delta)?Math.sign(delta):0;
     for(const [key,dir]of [['KeyD',1],['KeyA',-1]])await page.keyboard[axis===dir?'down':'up'](key);
     if(p.grounded&&b.state==='windup'&&b.timer<.28&&now-lastJump>400){await page.keyboard.down('Space');holdUntil=now+540;lastJump=now}
     if(now-lastBark>500){await page.keyboard.press('KeyE');lastBark=now}
     if(index===2&&b.state==='windup'&&!report.screens.includes('rat-boss.png')){await page.locator('#stage').screenshot({path:'test-results/rat-boss.png'});report.screens.push('rat-boss.png')}
    }
    if(now>holdUntil)await page.keyboard.up('Space');await page.waitForTimeout(35);
   }
   await release(page);const p=await snapshot();assert(p.boss.defeated,p.boss.name);
   report.battles.push({level:index+1,name:p.boss.name,hp:p.hp,retries,seconds:Math.round((Date.now()-started)/1000)});console.log('  '+p.boss.name+' vencido');
   assert.equal(p.power,0);
  }
 });
 await check('Celular: comer frango e voar usando multitoque nos controles',async()=>{
  const mobile=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}),phone=await fixture(mobile);
  await phone.evaluate(()=>{const {game,save}=window.__combatQA;save.reset();game.start(0);const c=game.level.chickens[0];game.player.x=c.x-50;game.player.y=199;game.player.grounded=true;game.cam=game.player.x-180});
  const cdp=await mobile.newCDPSession(phone);
  const points=[];for(const [id,key]of [[1,'Run'],[2,'Space']]){const r=await phone.locator(`[data-key="${key}"]`).boundingBox();points.push({id,x:r.x+r.width/2,y:r.y+r.height/2})}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  await phone.waitForFunction(()=>window.beethoven.snapshot().power>0&&window.beethoven.snapshot().flying&&window.beethoven.snapshot().y<100);
  const p=await phone.evaluate(()=>window.beethoven.snapshot());assert.equal(p.hp,3);
  assert.equal(await phone.locator('[data-key="Space"]').textContent(),'Voar');
  await phone.locator('#stage').screenshot({path:'test-results/mobile-superpum.png'});report.screens.push('mobile-superpum.png');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await phone.evaluate(()=>{const {game}=window.__combatQA;game.start(2);game.player.x=game.level.boss.x-85;game.cam=game.player.x-180});
  await phone.waitForFunction(()=>window.beethoven.snapshot().boss.active);
  const hud=await phone.evaluate(()=>{
   const {game,render}=window.__combatQA,original=render.rect;let panel;
   try{render.rect=function(x,y,w,h,color){if(color==='#271d2aee')panel={x,y,w,h};return original.call(this,x,y,w,h,color)};game.draw()}finally{render.rect=original}
   const canvas=document.querySelector('#game').getBoundingClientRect(),toolbar=document.querySelector('.footer-actions').getBoundingClientRect();
   return {top:canvas.top+panel.y*canvas.height/270,toolbarBottom:toolbar.bottom};
  });
  assert(hud.top>hud.toolbarBottom,'Barra do chefe deve ficar abaixo dos botões de pausa/som/fullscreen');
  await phone.screenshot({path:'test-results/mobile-boss-hud.png'});report.screens.push('mobile-boss-hud.png');await mobile.close();
 });
 await check('Celular: correr e dar patada com multitoque, depois vencer rival com Morder',async()=>{
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),phone=await fixture(mobile);
  await phone.evaluate(()=>{const {game,save}=window.__combatQA;save.reset();game.start(0);game.player.x=game.level.dogs[0].x-35;game.player.grounded=true;game.cam=game.player.x-180});
  const cdp=await mobile.newCDPSession(phone),points=[];
  for(const [id,key]of [[1,'Run'],[2,'KeyJ']]){const r=await phone.locator(`[data-key="${key}"]`).boundingBox();points.push({id,x:r.x+r.width/2,y:r.y+r.height/2})}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  await phone.waitForFunction(()=>window.beethoven.snapshot().npcs[0].hp===2);
  assert(await phone.locator('[data-key="KeyJ"]').evaluate(b=>b.classList.contains('is-recovering')));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await phone.waitForFunction(()=>window.beethoven.snapshot().attackCooldown===0&&Math.abs(window.beethoven.snapshot().vx)<5);
  await phone.evaluate(()=>{const {game}=window.__combatQA;game.player.x=game.level.dogs[0].x-35;game.player.face=1});
  await phone.getByRole('button',{name:'Morder',exact:true}).tap();await phone.waitForFunction(()=>window.beethoven.snapshot().npcs[0].defeated);
  assert.equal((await phone.evaluate(()=>window.beethoven.snapshot())).hp,3);
  await phone.screenshot({path:'test-results/mobile-melee.png'});report.screens.push('mobile-melee.png');await mobile.close();
 });
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.failure=error.stack||String(error);console.error(error);process.exitCode=1}
finally{await browser?.close();server?.kill();await mkdir('test-results',{recursive:true});await writeFile('test-results/combat-report.json',JSON.stringify(report,null,2))}
