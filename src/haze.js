import GL from './utils/gl-obj';
import vert from './shaders/simple.vert';

import {createCanvas} from './utils/canvas';
import {assign,throttle} from 'lodash';
import fill from './utils/fill';
import EventDispatcher from './utils/event-dispatcher';

function Haze({
  canvas,
  shader:frag,
  textures=[],
  loops=1000
}){
  this.loops=loops;
  this.canvas=canvas;
  this._width=canvas.width;
  this._height=canvas.height;
  let gl=new GL(canvas,null,vert,frag);
  this.gl=gl;
  let haze=this;
  this._textures=textures.map((v,i)=>loadTexture(this,i,v));

  Promise.all(this._textures).then(start);

  function start(){
    let last=0;
    let frame=1000/60;
    let time=0;
    gl.createUniform("1f","time",time);

    (function update(now){
      let delta=now-last;
      let incr=(delta/frame);
      if(incr>1.5) incr=1.5;
      incr*=haze.timeScale;
      time+=incr;
      if(time>haze.loops) time =0;
      last=now;
      gl.createUniform("1f","time",time);
      haze.dispatchEvent('predraw',{
        deltaTime:incr
      });
      gl.draw();
      requestAnimationFrame(update);
    }(0));
  }
}

function loadTexture(haze,index,options){
  let defaultOptions={
    file:null,
    name:null,
    repeat:false,
    fill:true,
    align:{
      x:0.5,
      y:0.5,
    },
    scale:{
      x:1,
      y:1,
    },
  }
  options = assign(defaultOptions,options);

  return new Promise((resolve,reject)=>{
    let image=new Image();
    image.addEventListener('load',(event)=>{
      haze.gl.createUniform('1i',options.name,index);
      resolve(processTexture(haze,index,image,options));
    });
    image.src=options.file;
  });
}

function processTexture(haze,index,image,options){
  let canvas=document.createElement('canvas');
  let ctx=canvas.getContext('2d');

  let textureObj=assign({
    canvas,
    haze,
    index,
    image,
    options,
    updateTexture(){
      haze.gl.createTexture(canvas,index,options.repeat?haze.gl.gl.REPEAT:null);
    },
    render(){
      canvas.width=(options.fill?haze.width:image.width)*haze.dpi*options.scale.x;
      canvas.height=(options.fill?haze.height:image.height)*haze.dpi*options.scale.y;

      let dimensions={
        x:0,
        y:0,
        width:canvas.width,
        height:canvas.height,
      }

      if(options.fill){
        dimensions=fill(
          image.width,image.height,
          canvas.width,canvas.height,
          options.align.x,options.align.y
        )
      }

      ctx.drawImage(
        image,
        dimensions.x,dimensions.y,
        dimensions.width,dimensions.height
      );

      this.updateTexture();
    },
    updateSize(){
      this.render();
      this.dispatchEvent('resize');
    },
  },EventDispatcher());

  textureObj.updateSize();
  haze.addEventListener('resize',textureObj.updateSize.bind(textureObj));

  return textureObj;
}

Haze.prototype=assign(
  {
    canvas:null,
    _width:0,
    _height:0,
    _dpi:1,
    _willUpdateSize:false,
    _throttledUpdateSize:null,
    timeScale:1,
    _textures:null,
    loops:1000,
    get width(){
      return this._width;
    },
    set width(v){
      if(this._width==v) return;
      this._width=v;
      this.updateSize();
    },
    get height(){
      return this._height;
    },
    set height(v){
      if(this._height==v) return;
      this._height=v;
      this.updateSize();
    },
    get dpi(){
      return this._dpi;
    },
    set dpi(v){
      if(this._dpi==v) return;
      this._dpi=v;
      this.updateSize();
    },
    updateSize(){
      if(this._throttledUpdateSize==null){
        this._throttledUpdateSize=throttle(()=>{
          if(this._willUpdateSize) return;
          this._willUpdateSize=true;

          requestAnimationFrame(()=>{
            this._willUpdateSize=false;

            this.canvas.width=this.width*this.dpi;
            this.canvas.style.width=`${this.width}px`;
            this.canvas.height=this.height*this.dpi;
            this.canvas.style.height=`${this.height}px`;

            this.dispatchEvent('resize');
            this.gl.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
          });
        },300);
      }

      this._throttledUpdateSize();
    },
    getTextureByName(name){
      return new Promise((resolve,reject)=>{
        this._textures.forEach(v=>v.then((texture)=>{
          if(texture.options.name==name) resolve(texture);
        }));
      });
    },
  },
  EventDispatcher()
);

export default Haze;
