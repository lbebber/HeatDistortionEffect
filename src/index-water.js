import {createCanvas} from './utils/canvas';
import Haze from './haze';
import shader from './shaders/haze-water.frag';
import TweenLite from 'gsap'

let canvas=document.querySelector('.Background-canvas');

let textureAlign={x:0.5,y:0.9};
let textures=[
  {
    file:'img/water.jpg',
    name:'image',
    align:textureAlign,
    scale:{x:1,y:1}
  },
  {
    file:'img/water-maps.jpg',
    name:'maps',
    align:textureAlign,
    scale:{x:0.2,y:0.2},
  },
];

let haze=new Haze({
  canvas,
  shader,
  textures,
  loop:10000
});

// let imageTextureBg=document.createElement('canvas');
// haze.getTextureByName('image').then((texture)=>{
//   imageTexture=texture;
//   imageTexture.addEventListener('resize',()=>{
//     let textureCanvas=texture.canvas;
//     let ctx=imageTextureBg.getContext('2d');
//
//     imageTextureBg.width=textureCanvas.width;
//     imageTextureBg.height=textureCanvas.height;
//
//     ctx.drawImage(textureCanvas,0,0);
//
//     drawOverBG();
//   })
// });
//
// (function(){
//   let titleCanvas=document.querySelector('.Content-title');
//   let titleImage=new Image();
//   titleImage.addEventListener('load',event=>{
//     titleCanvas.width=titleImage.width;
//     titleCanvas.height=titleImage.height;
//     let ctx=titleCanvas.getContext('2d');
//     ctx.drawImage(titleImage,0,0);
//   });
//   titleImage.src='img/air-travel-title.svg';
// }())

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

let isTouchDevice = 'ontouchstart' in document.documentElement;

let parallaxPos={
  _x:0,
  _y:0,
  _willUpdate:false,
  get x(){
    return this._x;
  },
  set x(v){
    this._x=v;
    this.updatePos();
  },
  get y(){
    return this._y;
  },
  set y(v){
    this._y=v;
    this.updatePos();
  },
  updatePos(){
    if(this._willUpdate) return;
    this._willUpdate=true;

    requestAnimationFrame(()=>{
      this._willUpdate=false;
      haze.gl.createUniform('2f','mouse',
        -(-1+(this.x*2)),
        -(-1+(this.y*2))
      );
    });
  }
}
window.addEventListener('mousemove',function(event){
  if(!isTouchDevice){
    TweenLite.to(parallaxPos,1,{
      x:event.pageX/window.innerWidth,
      y:event.pageY/window.innerHeight
    })
  }
});

// window.addEventListener('devicemotion',function(event){
//   if(isTouchDevice){
//     parallaxPos.x=curve(smoothX(-event.accelerationIncludingGravity.x/10))*12;
//     parallaxPos.y=curve(smoothY(-event.accelerationIncludingGravity.y/10))*3;
//   }
// });
function getDPI(){
  if(typeof window.devicePixelRatio!="undefined"){
    return window.devicePixelRatio;
  }else{
    return 1;
  }
}
window.addEventListener('resize',updateSize);
function updateSize(){
  let container=document.querySelector('.Background');
  let dimensions=container.getBoundingClientRect();
  haze.width=dimensions.width;
  haze.height=dimensions.height;
  // haze.dpi=getDPI();
  haze.dpi=1;
  haze.gl.createUniform('1f','dpi',haze.dpi);
  haze.gl.createUniform('2f','resolution',haze.width*haze.dpi,haze.height*haze.dpi);
}
updateSize();
