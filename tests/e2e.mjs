import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {mkdir,writeFile,stat,access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {makeLevel} from '../src/data/levels.js';

const result={status:'running',browser:null,url:null,checks:[],errors:[]};
await mkdir('test-results',{recursive:true});
let browser,server,page;
async function check(name,fn){await fn();result.checks.push(name);console.log(`✓ ${name}`)}
async function waitForServer(url){for(let i=0;i<100;i++){if(server?.exitCode!==null&&server?.exitCode!==undefined)throw Error('O servidor de teste encerrou antes de responder.');try{if((await fetch(url)).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Servidor de teste não respondeu em 10 segundos.')}
async function releaseKeys(){for(const key of ['KeyD','KeyA','Shift','Space'])await page.keyboard.up(key)}
try{
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
  const executable=process.env.CHROMIUM_EXECUTABLE_PATH;
  if(executable){const info=await stat(executable);if(!info.isFile())throw Error(`CHROMIUM_EXECUTABLE_PATH deve apontar para um executável, não uma pasta: ${executable}`);await access(executable,constants.X_OK)}
  result.browser=executable||chromium.executablePath();
  browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
  page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>result.errors.push(e.message));
  let url=process.env.E2E_BASE_URL;
  if(!url){const port=process.env.E2E_PORT||'5175';server=spawn(process.execPath,['scripts/serve.mjs','dist'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});server.on('error',e=>result.errors.push(e.message));server.stderr.on('data',data=>process.stderr.write(data));url=`http://127.0.0.1:${port}`;await waitForServer(url)}
  result.url=url;
  await check('Menu e assets de produção',async()=>{await page.goto(url);await page.getByRole('button',{name:'Jogar',exact:true}).waitFor();assert.deepEqual(await page.evaluate(()=>window.beethoven.snapshot().errors),[]);await page.screenshot({path:'test-results/menu.png'})});
  await check('Intro e opção de pular',async()=>{await page.getByRole('button',{name:'Jogar',exact:true}).click();await page.waitForFunction(()=>window.beethoven.snapshot().mode==='intro');await page.keyboard.press('Escape');await page.waitForFunction(()=>window.beethoven.snapshot().mode==='play')});
  const snapshot=()=>page.evaluate(()=>window.beethoven.snapshot());
  await check('Andar nas duas direções e correr',async()=>{await page.keyboard.down('KeyD');await page.waitForTimeout(700);await page.keyboard.up('KeyD');const right=await snapshot();assert(right.x>80);await page.keyboard.down('KeyA');await page.waitForTimeout(550);await page.keyboard.up('KeyA');assert((await snapshot()).x<right.x);await page.keyboard.down('KeyD');await page.keyboard.down('Shift');await page.waitForTimeout(450);assert((await snapshot()).vx>100);await releaseKeys()});
  await check('Pulo, gravidade e colisão com chão',async()=>{await page.waitForTimeout(300);await page.keyboard.down('Space');await page.waitForTimeout(170);assert((await snapshot()).vy<0);await page.keyboard.up('Space');await page.waitForFunction(()=>window.beethoven.snapshot().grounded)});
  await check('Latido, mute e pausa',async()=>{await page.keyboard.press('KeyE');await page.keyboard.press('KeyM');await page.waitForFunction(()=>document.querySelector('#mute').textContent.includes('desligado'));await page.keyboard.press('Escape');await page.getByRole('button',{name:'Continuar',exact:true}).waitFor();const p=await snapshot();await page.keyboard.down('KeyD');await page.waitForTimeout(250);await page.keyboard.up('KeyD');assert.equal((await snapshot()).x,p.x);await page.screenshot({path:'test-results/pause.png'});await page.getByRole('button',{name:'Continuar',exact:true}).click()});
  await check('Save, reload e continuar',async()=>{await page.reload();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForFunction(()=>window.beethoven.snapshot().mode==='play');assert((await page.locator('#mute').textContent()).includes('desligado'))});
  // Full route is optional because it takes several real-time minutes.
  if(process.env.E2E_FULL==='1'){
    await check('Cinco fases e reencontro pelo teclado',async()=>{
      const deadline=Date.now()+12*60*1000;let holdUntil=0,lastJump=0,lastBark=0,lastLevel=-1,model,retries=0;
      while(Date.now()<deadline){const p=await snapshot();if(p.mode==='finish')break;
        if(p.mode==='transition'){await releaseKeys();await page.getByRole('button',{name:'Seguir viagem',exact:true}).click();continue}
        if(p.mode==='over'){assert(++retries<25,'Recuperações excessivas');await releaseKeys();await page.getByRole('button',{name:'Tentar do checkpoint',exact:true}).click();continue}
        if(p.mode==='ending'){await releaseKeys();await page.screenshot({path:'test-results/ending.png'});await page.keyboard.press('Escape');continue}
        assert.equal(p.mode,'play');
        if(lastLevel!==p.level){lastLevel=p.level;model=makeLevel(p.level);holdUntil=0;console.log(`Percorrendo fase ${p.level+1}/5`)}
        const now=Date.now();const danger=[...model.dogs,...model.hazards].some(d=>d.x>p.x-40&&d.x<p.x+60&&Math.abs(d.y-p.y)<65);const gap=model.ground.some((s,n)=>n<model.ground.length-1&&s.x+s.w>p.x&&s.x+s.w<p.x+68);
        const fighting=p.boss.active&&!p.boss.defeated,delta=p.boss.x+p.boss.w/2-p.x-13.5;
        if(fighting){
          await page.keyboard.up('Shift');
          const axis=Math.abs(delta)>65||p.face!==Math.sign(delta)?Math.sign(delta):0;
          for(const [key,dir]of [['KeyD',1],['KeyA',-1]])await page.keyboard[axis===dir?'down':'up'](key);
        }else{await page.keyboard.up('KeyA');await page.keyboard.down('KeyD');await page.keyboard.down('Shift')}
        const jump=fighting?p.boss.state==='windup'&&p.boss.timer<.28:danger||gap;
        if(p.grounded&&jump&&now-lastJump>380){await page.keyboard.up('Space');await page.keyboard.down('Space');holdUntil=now+540;lastJump=now}
        else if(now>holdUntil)await page.keyboard.up('Space');
        if(now-lastBark>500||p.level===4&&p.x>model.end-50){await page.keyboard.press('KeyE');lastBark=now}
        await page.waitForTimeout(35);
      }
      await releaseKeys();assert.equal((await snapshot()).mode,'finish');assert((await snapshot()).bones>0);
    });
  }
  await check('Nova partida reinicia progresso',async()=>{
    const p=await snapshot();
    if(p.mode==='finish')await page.getByRole('button',{name:'Voltar ao menu',exact:true}).click();
    else{await page.keyboard.press('Escape');await page.getByRole('button',{name:'Menu',exact:true}).click()}
    await page.getByRole('button',{name:'Jogar',exact:true}).click();
    await page.waitForFunction(()=>window.beethoven.snapshot().mode==='intro');
    await page.keyboard.press('Escape');
    // Keyboard events are consumed by the simulation on a later animation frame.
    await page.waitForFunction(()=>window.beethoven.snapshot().mode==='play');
    const fresh=await snapshot();
    assert.equal(fresh.level,0);assert.equal(fresh.bones,0);assert.equal(fresh.checkpoint,0);
  });
  assert.deepEqual(result.errors,[]);await page.screenshot({path:'test-results/level.png'});result.status='passed';
}catch(error){result.status='failed';result.failure=error.stack||String(error);console.error(result.failure);process.exitCode=1;
}finally{await browser?.close();server?.kill();await writeFile('test-results/e2e-report.json',JSON.stringify(result,null,2));}
