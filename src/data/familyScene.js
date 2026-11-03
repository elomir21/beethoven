export function walkFrame(time,speed=6){return 1+Math.floor(Math.max(0,time)*speed)%4}

// A deterministic animation timeline, independent of gameplay physics/save.
export function introFamily(part,time){
 const t=Math.max(0,time),y=222;
 if(part===0){
  const walk=Math.max(0,t-1.2),x=132+Math.min(walk,10.8)*7;
  return {camera:walk*28,elomir:{x,y,frame:walk?walkFrame(walk):5},julia:{x:x-42,y,frame:walk?walkFrame(walk+.25):0},dog:{x:x+64,y,frame:walk?walkFrame(walk,7):0},leash:{attached:true,handY:walk?188:204},friend:null};
 }
 if(part===1){
  const x=202+Math.min(t,.8)*7;
  return {camera:302+t*18,elomir:{x,y,frame:t<.8?walkFrame(t):0},julia:{x:x-42,y,frame:t<.8?walkFrame(t+.25):0},dog:{x:x+64,y,frame:t<.8?walkFrame(t,7):[0,9,0,10][Math.floor(t*7)%4]},leash:{attached:true,handY:188},friend:{x:380-Math.min(t*8,65),y}};
 }
 if(part===2){
  const x=208+Math.min(t,2.8)*6;
  return {camera:482+t*22,elomir:{x,y,frame:t<1.5?5:walkFrame(t,8)},julia:{x:x-42,y,frame:walkFrame(t+.25,8)},dog:{x:272+t*38,y,frame:5+Math.floor(t*12)%4},leash:{attached:t<.35,handY:198,fall:Math.min(1,Math.max(0,(t-.35)/.65))},friend:{x:350+t*32,y}};
 }
 if(part===3){const x=100+Math.min(t,11)*21;return {camera:702+t*22,elomir:{x,y,frame:walkFrame(t,10)},julia:{x:x-44,y,frame:walkFrame(t+.2,10)},dog:{x:430+t*45,y,frame:5+Math.floor(t*12)%4},leash:null,friend:null}}
 return {camera:966+t*8,elomir:null,julia:null,dog:{x:235,y,frame:0},leash:null,friend:null};
}
