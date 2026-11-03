export class AudioSystem {
 constructor(muted){this.muted=muted;this.time=0;this.note=0;this.mode=0}
 unlock(){try{this.ctx??=new AudioContext();this.ctx.resume().catch(()=>{})}catch{}}
 tone(freq,duration=.12,type='triangle',volume=.06){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration)}
 sfx(name){const notes={jump:530,bone:880,bark:150,hurt:120,checkpoint:660,land:90,step:65,interact:440};this.tone(notes[name]||440,name==='bark'?.19:.12,name==='bark'?'sawtooth':'triangle',name==='step'?.012:.05);if(name==='checkpoint')this.tone(990,.35)}
 update(dt,rain=false){this.time+=dt;if(this.time>.33){this.time=0;const tunes=[[262,330,392,494,440,392,330,294],[294,370,440,554,494,440,370,330],[220,262,330,392,349,330,262,247],[262,330,392,523,494,440,392,330],[330,392,494,659,587,523,494,392]];const tune=tunes[this.mode%5];this.tone(tune[this.note++%8],.5,'triangle',.022);if(rain)this.tone(55+Math.random()*80,.12,'sawtooth',.007)}}
}
