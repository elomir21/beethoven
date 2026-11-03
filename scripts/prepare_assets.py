from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'assets/source/characters/beethoven/sprite_de_cachorro_beethoven_em_pixel_art.png').convert('RGBA')
# Segmentação por células da composição original, recorte pelo alpha real.
rows=[(0,270,[(0,390)]),(270,535,[(0,370),(370,710),(710,1050),(1050,1448)]),(535,790,[(0,350),(350,710),(710,1080),(1080,1448)]),(790,1086,[(0,400),(400,780),(780,1250)])]
frames=[]
for top,bottom,cells in rows:
 for left,right in cells:
  c=im.crop((left,top,right,bottom)); b=c.getchannel('A').getbbox()
  if b:
   c=c.crop(b);c.thumbnail((60,44),Image.Resampling.NEAREST)
   # Remove pixels quase transparentes e franja, preservando transparência real.
   c.putalpha(c.getchannel('A').point(lambda a:255 if a>100 else 0))
   pixels=c.load()
   for yy in range(c.height):
    for xx in range(c.width):
     r,g,b,a=pixels[xx,yy]
     if r>170 and g<85 and b<90:pixels[xx,yy]=(0,0,0,0)
   frames.append(c)
out=Image.new('RGBA',(64*len(frames),48))
for i,c in enumerate(frames):out.alpha_composite(c,(i*64+(64-c.width)//2,46-c.height))
output=root/'assets/legacy/characters/beethoven/beethoven.png'
output.parent.mkdir(parents=True,exist_ok=True)
out.save(output)
print('frames',len(frames),'alpha',out.getchannel('A').getextrema())
