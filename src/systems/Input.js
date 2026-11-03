export class Input {
 down=new Set(); pressed=new Set(); sources=new Map();
 constructor(canvas){
  this.canvas=canvas;this.touch=window.matchMedia?.('(any-pointer:coarse)')?.matches||false;this.buttons=[...(document.querySelectorAll?.('[data-key]')||[])];
  window.addEventListener('keydown',e=>{
   if(document.activeElement===canvas&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
   if(e.target instanceof HTMLButtonElement)return;this.press(e.code,'keyboard');
  });
  window.addEventListener('keyup',e=>this.release(e.code,'keyboard'));
  window.addEventListener('blur',()=>this.clear());canvas.addEventListener('pointerdown',()=>canvas.focus());
  for(const button of this.buttons){
   button.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();button.setPointerCapture(e.pointerId);this.press(button.dataset.key,`pointer:${e.pointerId}`)});
   const release=e=>{e.preventDefault();this.release(button.dataset.key,`pointer:${e.pointerId}`)};
   for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
   button.addEventListener('contextmenu',e=>e.preventDefault());
  }
 }
 press(key,source){if(!this.down.has(key))this.pressed.add(key);if(!this.sources.has(key))this.sources.set(key,new Set());this.sources.get(key).add(source);this.down.add(key);this.paint()}
 release(key,source){const held=this.sources.get(key);if(!held)return;held.delete(source);if(!held.size){this.sources.delete(key);this.down.delete(key)}this.paint()}
 paint(){for(const button of this.buttons)button.classList.toggle('is-held',this.down.has(button.dataset.key))}
 has(...keys){return keys.some(k=>this.down.has(k))}hit(...keys){return keys.some(k=>this.pressed.has(k))}end(){this.pressed.clear()}
 clear(){this.sources.clear();this.down.clear();this.pressed.clear();this.paint()}
}
