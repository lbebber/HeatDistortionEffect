import {createCanvas} from './utils/canvas';
import Haze from './haze';
import shader from './shaders/haze-desert.frag';

let canvas=document.querySelector('.background__canvas');

let textureAlign={x:0.9,y:0.9};
let textures=[
  {
    file:'img/desert.jpg',
    name:'image',
    align:textureAlign,
    scale:{x:1,y:1}
  },
  {
    file:'img/desert-maps.jpg',
    name:'maps',
    align:textureAlign,
    scale:{x:0.8,y:0.8},
  },
  {
    file:'img/noise.png',
    name:'noise',
    repeat:true,
    fill:false,
  },
];

let getTextureIndex=(function(){
  let i=textures.length;
  return function(){
    return i++;
  }
}());


let contentTextureIndex=getTextureIndex();

function loadContent(src,canvas,scroll=0){

  let breakpoint=canvas.getAttribute('data-breakpoint');
  breakpoint=(breakpoint==null)?Infinity:breakpoint;

  let value={
    canvas,
    breakpoint,
    textureIndex:contentTextureIndex,
    loaded:false,
    scroll,
    size:{
      width:0,
      height:0,
    },
  }

  let titleImage=new Image();
  titleImage.addEventListener('load',event=>{
    let dpi=haze.dpi;
    canvas.width=titleImage.width*dpi;
    canvas.height=titleImage.height*dpi;
    canvas.style.width=`${titleImage.width}px`;
    canvas.style.height=`${titleImage.height}px`;
    let ctx=canvas.getContext('2d');
    ctx.drawImage(titleImage,0,0,canvas.width,canvas.height);

    value.size={
      width:canvas.width,
      height:canvas.height,
    };
    value.loaded=true;

    updateContent();
  });

  titleImage.src=src;

  return value;
};

let contents=[
  loadContent(
    'img/desert-title.svg',
    document.querySelector('.background__title--big')
  ),
  loadContent(
    'img/desert-title-medium.svg',
    document.querySelector('.background__title--medium')
  ),
  loadContent(
    'img/desert-title-small.svg',
    document.querySelector('.background__title--small')
  ),
]

let getContent=(function(){
  let lastContent={};
  let wasLoaded=false;
  let lastww=0;
  return function(){
    let ww=window.innerWidth;
    let content=(ww!=lastww)
      ?
      contents.reduce(
        (last,content)=>window.innerWidth<=content.breakpoint?content:last
      )
      :
      lastContent;

    lastww=ww;

    if((content==lastContent && content.loaded!=wasLoaded) || content!=lastContent){
      haze.gl.createUniform('1i','content',content.textureIndex);
      haze.gl.createTexture(content.canvas,content.textureIndex);
      haze.gl.createUniform('1i','contentLoaded',content.loaded?1:0);
      haze.gl.createUniform('2f','contentPos',0,0);
      haze.gl.createUniform('2f','contentSize',content.canvas.width,content.canvas.height);

      lastContent=content;
      wasLoaded=content.loaded;
      return content;

    }else return lastContent;
  }
}());
function updateContent(){
  let content=getContent();
  if(content.loaded){
    let title=content.canvas;
    let bb=title.getBoundingClientRect();
    haze.gl.createUniform(
      '2f','contentPos',
      bb.left*haze.dpi,
      (bb.top+
        (content.scroll!=0?document.body.scrollTop*content.scroll:0)
      )*haze.dpi
    );
  }
}
let haze=new Haze({
  canvas,
  shader,
  textures,
});


haze.gl.createUniform('2f','mouse',0.5,0.5);

const smooth=(n=6)=>{
  let samples=[];
  return (v)=>{
    samples=samples.concat(v);
    if(samples.length>n){
      samples=samples.slice(samples.length-n,samples.length);
    }
    return samples.reduce((l,cur)=>(l+cur))/samples.length;
  }
}

const curve=(v,p=0.8)=>v==0?0:Math.pow(Math.abs(v),p)*(v/Math.abs(v));

let smoothX=smooth();
let smoothY=smooth();

var isTouchDevice = 'ontouchstart' in document.documentElement;

window.addEventListener('mousemove',function(event){
  if(!isTouchDevice){
    haze.gl.createUniform('2f','mouse',
      -curve(-1+((event.pageX/window.innerWidth)*2)),
      -curve(-1+((event.pageY/window.innerHeight)*2))
    );
  }
});

window.addEventListener('devicemotion',function(event){
  if(isTouchDevice){
    haze.gl.createUniform('2f','mouse',
      curve(smoothX(-event.accelerationIncludingGravity.x/10))*12,
      curve(smoothY(-event.accelerationIncludingGravity.y/10))*3
    );
  }
});


haze.gl.createUniform('1i','noiseSize',256);

haze.addEventListener('predraw',function(){
  haze.gl.createUniform("2f","noiseR",Math.round(Math.random()*256),Math.round(Math.random()*256));
  haze.gl.createUniform("2f","noiseG",Math.round(Math.random()*256),Math.round(Math.random()*256));
  haze.gl.createUniform("2f","noiseB",Math.round(Math.random()*256),Math.round(Math.random()*256));
})
function getDPI(){
  if(typeof window.devicePixelRatio!="undefined"){
    return window.devicePixelRatio;
  }else{
    return 1;
  }
}
window.addEventListener('resize',updateSize);
function updateSize(){
  let container=document.querySelector('.background');
  let dimensions=container.getBoundingClientRect();
  haze.width=dimensions.width;
  haze.height=dimensions.height;
  haze.dpi=getDPI();
  haze.gl.createUniform('1f','dpi',haze.dpi);
  haze.gl.createUniform('2f','resolution',haze.width*haze.dpi,haze.height*haze.dpi);
  updateContent();
}
updateSize();
