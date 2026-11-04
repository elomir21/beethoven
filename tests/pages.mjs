import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {characterFiles} from '../src/data/assets.js';
import {levels} from '../src/data/levels.js';

// Deliberately return 404 outside the project path, as on project Pages.
const prefix='/beethoven/',root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const report={status:'running',checks:[],errors:[]};
// Chromium probes this root URL even when the document declares no favicon.
const isBrowserIcon=url=>new URL(url).pathname==='/favicon.ico';
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  assert(pathname.startsWith(prefix));
  const file=path.resolve(root,pathname.slice(prefix.length)||'index.html');
  assert(file.startsWith(root+path.sep));
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Arquivo não encontrado')}
});
let browser;
async function check(name,fn){await fn();report.checks.push(name);console.log('✓ '+name)}
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}${prefix}`;
 report.url=url;
 assert.equal((await fetch(new URL('/assets/'+characterFiles[0],url))).status,404);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();
 const failed=[];
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!isBrowserIcon(r.url()))failed.push(r.url())});
 page.on('requestfailed',r=>{if(!isBrowserIcon(r.url()))failed.push(r.url())});
 await check('Build Vite, nove imagens HD e início no subdiretório /beethoven/',async()=>{
  await page.goto(url);await page.getByRole('button',{name:'Jogar',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>window.beethoven.snapshot().errors),[]);
  const loaded=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));
  for(const file of [...levels.map(l=>l.bg),...characterFiles])assert(loaded.includes(new URL('assets/'+file,url).href),file);
  assert.deepEqual(loaded.filter(resource=>!isBrowserIcon(resource)&&!new URL(resource).pathname.startsWith(prefix)),[]);
  await page.getByRole('button',{name:'Jogar',exact:true}).click();await page.locator('#story-skip').click();
  await page.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
  const x=await page.evaluate(()=>window.beethoven.snapshot().x);
  await page.keyboard.down('KeyD');await page.waitForTimeout(450);await page.keyboard.up('KeyD');
  assert((await page.evaluate(()=>window.beethoven.snapshot().x))>x);
  await page.getByRole('link',{name:'Página inicial'}).click();
  await page.getByRole('button',{name:'Jogar',exact:true}).waitFor();assert.equal(page.url(),url);
 });
 await check('Celular: corrida por toque e rotação em endereço de projeto Pages',async()=>{
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const phone=await mobile.newPage();phone.on('pageerror',e=>report.errors.push(e.message));
  await phone.goto(url);await phone.getByRole('button',{name:'Jogar',exact:true}).tap();await phone.locator('#story-skip').tap();
  await phone.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
  const x=await phone.evaluate(()=>window.beethoven.snapshot().x);
  const box=await phone.getByRole('button',{name:'Correr',exact:true}).boundingBox();
  const cdp=await mobile.newCDPSession(phone);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  await phone.waitForTimeout(450);
  assert((await phone.evaluate(()=>window.beethoven.snapshot().x))>x+20);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await phone.setViewportSize({width:844,height:390});
  await phone.waitForFunction(()=>{const r=document.querySelector('#game').getBoundingClientRect();return r.width>600&&Math.abs(r.width/r.height-16/9)<0.02});
  assert.deepEqual(await phone.evaluate(()=>window.beethoven.snapshot().errors),[]);
  await mobile.close();
 });
 await check('Edição autocontida também abre no subdiretório',async()=>{
  await page.goto(url+'Beethoven.html');await page.getByRole('button',{name:'Jogar',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>window.beethoven.snapshot().errors),[]);
 });
 assert.deepEqual(failed,[]);assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.errors.push(error.stack||String(error));process.exitCode=1;console.error(error)}
finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
 await mkdir('test-results',{recursive:true});await writeFile('test-results/pages-report.json',JSON.stringify(report,null,2));
}
