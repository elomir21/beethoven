import {dogBreeds,catCoats} from './assets.js';
const themes=[
 ['Beira-Mar de Florianópolis','O começo da jornada','backgrounds/beira-mar-florianopolis/03_beira_mar_florianopolis-hd.png',8500,'sun','O cheiro do mar ficou para trás. Entre caminhos e novas paisagens, Beethoven chegou ao Parque Costa Azul.'],
 ['Parque Costa Azul','Aventuras no parque','backgrounds/parque-costa-azul/04_parque_costa_azul-hd.png',9500,'cloud','Depois do parque, uma longa travessia o levou até Palhoça. As primeiras gotas caíam no Passeio Pedra Branca.'],
 ['Passeio Pedra Branca','Chuva na cidade','backgrounds/passeio-pedra-branca/01_passeio_pedra_branca_palhoca-hd.png',11000,'rain','Sob uma marquise, Beethoven lembrou do aconchego de casa. Quando a chuva aliviou, seguiu em direção ao Caminho Novo.'],
 ['Caminho Novo','Cada vez mais perto','backgrounds/caminho-novo/06_caminho_novo_palhoca-hd.png',9500,'drizzle','Os jardins e os portões pareciam familiares. Depois de tanto caminhar, Beethoven reconheceu o Terra Nova.'],
 ['Terra Nova','Finalmente em casa','backgrounds/terra-nova/05_terra_nova_palhoca-hd.png',6000,'sunset','O portão de casa! Use E para chamar Elomir e Júlia.']];
export function makeLevel(index){const [name,subtitle,bg,width,weather,story]=themes[index];const platforms=[],hazards=[],dogs=[],cats=[],bones=[],checkpoints=[],gaps=[],slippery=[];let id=0;
 for(let x=420,n=0;x<width-400;x+=340,n++){
  const section=n%5;const height=section===2?170:section===3?177:194;
  platforms.push({x:x+40,y:height,w:section===2?105:80,h:10,oneWay:true,moving:index===1&&section===2,origin:x+40,phase:n});
  if(section===1||section===4){const gap=index===0?48:index===4?40:60;gaps.push({x:x+155,w:gap});platforms.push({x:x+125,y:185,w:110,h:10,oneWay:true})}
  if(section===0||section===3)dogs.push({breed:dogBreeds[(dogs.length+index)%dogBreeds.length],x:x+170,y:199,w:28,h:23,origin:x+170,range:55,vx:20+index*3,state:'patrol',calm:0});
  if(section===2&&index!==4)hazards.push({x:x+190,y:208,w:index===0?24:40,h:14,type:index===0?'bike':index===1?'swing':'puddle',origin:x+190,phase:n});
  if((index===2||index===3)&&section===4)slippery.push({x:x-25,w:150});
  for(let k=0;k<3;k++)bones.push({id:`${index}-${id++}`,x:x+45+k*23,y:height-17});
  if(section===0)bones.push({id:`${index}-${id++}`,x:x+240,y:202});
 }
 for(let x=1500;x<width-500;x+=1800)checkpoints.push({x,y:222});
 let start=0;const ground=[];for(const g of gaps){ground.push({x:start,y:222,w:g.x-start,h:80});start=g.x+g.w}ground.push({x:start,y:222,w:width-start,h:80});
 for(let x=260,n=0;x<width-300;x+=1300,n++){
  if(ground.some(s=>x-55>=s.x&&x+55<=s.x+s.w))cats.push({coat:catCoats[(n+index)%catCoats.length],x,y:222,origin:x,range:40,vx:12,state:'stroll',flee:0});
 }
 return {index,name,subtitle,bg,width,weather,story,platforms,hazards,dogs,cats,bones,checkpoints,slippery,ground,gaps,start:{x:50,y:222},end:width-120};
}
export const levels=themes.map((_,i)=>makeLevel(i));
