// Keep the game inside the visual viewport as mobile browser chrome changes.
// Fullscreen is requested directly from the user's click (transient activation).
export class Display {
 constructor(shell,render,input){
  this.shell=shell;this.render=render;this.input=input;this.fallback=false;
  this.button=document.querySelector('#fullscreen');this.status=document.querySelector('#display-status');
  this.coarse=window.matchMedia('(any-pointer:coarse)');
  this.schedule=()=>{if(this.pending)return;this.pending=requestAnimationFrame(()=>{this.pending=0;this.sync()})};
  for(const event of ['resize','orientationchange','pageshow'])window.addEventListener(event,this.schedule);
  window.visualViewport?.addEventListener('resize',this.schedule);
  window.visualViewport?.addEventListener('scroll',this.schedule);
  window.screen.orientation?.addEventListener('change',this.schedule);
  this.coarse.addEventListener?.('change',this.schedule);
  for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,this.schedule);
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.fallback){this.fallback=false;this.message('');this.sync()}});
  this.button.addEventListener('click',()=>this.toggle());this.sync();
 }
 native(){return (document.fullscreenElement||document.webkitFullscreenElement)===this.shell}
 message(text){this.status.textContent=text}
 sync(){
  const viewport=window.visualViewport;
  const width=viewport?.width||window.innerWidth,height=viewport?.height||window.innerHeight;
  const landscape=width>height,native=this.native(),expanded=native||this.fallback||this.coarse.matches&&landscape;
  if(this.landscape!==undefined&&this.landscape!==landscape)this.input.clear();
  this.landscape=landscape;
  const root=document.documentElement;
  for(const [name,value]of Object.entries({'width':width,'height':height,'left':viewport?.offsetLeft||0,'top':viewport?.offsetTop||0}))root.style.setProperty('--viewport-'+name,value+'px');
  root.classList.toggle('game-expanded',expanded);
  this.shell.dataset.expanded=String(expanded);this.shell.dataset.touch=String(this.coarse.matches);
  this.shell.dataset.screenMode=native?'native':this.fallback?'expanded':'inline';
  this.button.textContent=native||this.fallback?'Sair':'Tela cheia';
  this.button.setAttribute('aria-pressed',String(native||this.fallback));
  this.button.setAttribute('aria-label',native?'Sair da tela cheia':this.fallback?'Sair do modo ampliado':'Entrar em tela cheia');
  this.button.title=this.button.getAttribute('aria-label');
  // Layout changes first; measure the resulting Canvas size on the next frame.
  requestAnimationFrame(()=>this.render.resize());
 }
 async toggle(){
  this.input.clear();this.message('');
  if(this.native()){
   try{await (document.exitFullscreen?.()||document.webkitExitFullscreen?.())}catch{this.message('Use o comando do navegador para sair da tela cheia.')}
  }else if(this.fallback){this.fallback=false}
  else{
   try{
    const request=this.shell.requestFullscreen||this.shell.webkitRequestFullscreen;
    if(!request)throw new Error('Fullscreen unavailable');
    await request.call(this.shell);
   }catch{
    this.fallback=true;this.message('Modo ampliado ativado. Este navegador mantém as próprias barras.');
   }
  }
  this.sync();this.render.canvas.focus({preventScroll:true});
 }
}
