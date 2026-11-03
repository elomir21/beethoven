// Minimal DOM adapter for simulation tests. This is not a browser test.
const listeners={};class Element{children=[];innerHTML='';style={};append(x){this.children.push(x)}remove(){}querySelector(){return new Element()}focus(){globalThis.document.activeElement=this}addEventListener(name,fn){listeners[name]=fn}}
globalThis.HTMLButtonElement=class extends Element{};
const noop=()=>{};const context=new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:1}):noop,set:()=>true});
export const canvas=new Element();canvas.getContext=()=>context;
const elements={'#game':canvas,'#overlay':new Element(),'#mute':new Element(),'#loading':new Element(),'footer':new Element()};
globalThis.document={querySelector:s=>elements[s],createElement:()=>new HTMLButtonElement(),addEventListener:noop,activeElement:canvas};globalThis.window={addEventListener:noop};const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};globalThis.Image=class{async decode(){}set src(v){}width=1670;height=512};globalThis.requestAnimationFrame=noop;
export const {game,input,save,audio}=await import('../src/main.js');
export function tick(held=[],pressed=[],dt=1/120){input.down=new Set(held);input.pressed=new Set(pressed);game.update(dt);input.end()}
export function draw(){game.draw()}
