import {createCanvas} from './utils/canvas';
import Haze from './haze';
import shader from './shaders/haze-flight.frag';

let canvas=document.querySelector('.Background-canvas');

let textureAlign={x:0.1,y:0.5};
let textures=[
  {
    file:'img/flight.jpg',
    name:'image',
    align:textureAlign,
    scale:{x:1,y:1}
  },
  {
    file:'img/flight-mask.jpg',
    name:'mask',
    align:textureAlign,
    scale:{x:0.05,y:0.05},
  },
  {
    file:'img/flight-depth.jpg',
    name:'depth',
    align:textureAlign,
    scale:{x:0.5,y:0.5},
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

let haze=new Haze({
  canvas,
  shader,
  textures,
});


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
    'img/air-travel-title.svg',
    document.querySelector('.Text-title')
  ),
  loadContent(
    'img/air-travel-title-medium.svg',
    document.querySelector('.Text-titleMedium'),
    0.5
  ),
  loadContent(
    'img/air-travel-title-small.svg',
    document.querySelector('.Text-titleSmall'),
    0.8
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


haze.gl.createUniform('2f','parallax',0,0);
let t=0;
haze.addEventListener('predraw',function(event){
  t+=event.deltaTime;
  haze.gl.createUniform('2f','parallax',
    Math.sin(t*0.03)+Math.sin(t*0.026),
    Math.sin(t*0.04)+Math.sin(t*0.012)
  );
});
haze.gl.createUniform('1f','distort',0);
haze.gl.createUniform('1i','noiseSize',256);
haze.gl.createUniform('2f','noiseR',Math.random()*255,Math.random()*255);
haze.gl.createUniform('2f','noiseG',Math.random()*255,Math.random()*255);
haze.gl.createUniform('2f','noiseB',Math.random()*255,Math.random()*255);

const curve=(v,p=0.8)=>v==0?0:Math.pow(Math.abs(v),p)*(v/Math.abs(v));;

document.addEventListener('scroll',function(){
  let content=getContent();
  haze.gl.createUniform('1f','scroll',content.scroll!=0?document.body.scrollTop:0);
  haze.timeScale=curve(Math.max(0,(1000-document.body.scrollTop)/1000),2);
  updateContent();
})

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


(function(){
  let background=document.querySelector('.Background');
  let resizeThreshold=100;
  let lastwh=0;

  function tryResize(){
    let wh=window.innerHeight;
    if(Math.abs(wh-lastwh)>=resizeThreshold){
      background.style.height=`${wh}px`;
      lastwh=wh;
    }
  }
  window.addEventListener('resize',tryResize)
  tryResize();
}())

function updateSize(){
  let container=document.querySelector('.Background');
  let dimensions=container.getBoundingClientRect();
  haze.width=dimensions.width;
  haze.height=dimensions.height;
  // haze.dpi=window.devicePixelRatio;
  haze.dpi=1;
  haze.gl.createUniform('2f','resolution',haze.width*haze.dpi,haze.height*haze.dpi);
  updateContent();
};
window.addEventListener('resize',updateSize);
updateSize();
