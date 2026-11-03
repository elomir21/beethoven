// Blend the tail into the head once, at native resolution. Repetition then has
// no hard end/start edge and never mirrors signs or buildings.
export function createParallaxStrip(image,createCanvas){
 const width=image.width,height=image.height,overlap=Math.max(2,Math.round(width*.06)),period=width-overlap;
 const make=createCanvas||((w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas});
 const strip=make(period,height),context=strip.getContext?.('2d');
 if(!context)return image; // The Node simulation adapter has no raster surface.
 context.drawImage(image,overlap,0,period,height,0,0,period,height);
 const blend=make(overlap,height),c=blend.getContext('2d');
 c.drawImage(image,0,0,overlap,height,0,0,overlap,height);
 c.globalCompositeOperation='destination-in';
 const alpha=c.createLinearGradient(0,0,overlap-1,0);alpha.addColorStop(0,'rgba(255,255,255,0)');alpha.addColorStop(1,'white');
 c.fillStyle=alpha;c.fillRect(0,0,overlap,height);
 context.drawImage(blend,period-overlap,0);
 return strip;
}

export function parallaxPhase(offset,period){
 if(!Number.isFinite(period)||period<=0)throw new RangeError('Período de parallax inválido');
 return ((offset%period)+period)%period;
}
