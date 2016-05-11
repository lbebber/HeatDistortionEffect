import curry from 'curry'

export default (width,height,dpiAware=true)=>{
  const object={
    _width:width,
    _height:height,
    dpi:1,
    canvas:null,
    ctx:null,
    appendTo(obj){
      if(typeof obj=='string') obj=document.querySelector(obj)
      obj.appendChild(this.canvas)
      return this
    },
    set fillStyle(v){
      this.ctx.fillStyle=v
    },
    get fillStyle(){
      return this.ctx.fillStyle
    },
    setFillStyle(v){
      this.fillStyle=v
      return this
    },
    setFill(v){
      return this.setFillStyle(v)
    },
    set strokeStyle(v){
      this.ctx.strokeStyle=v
    },
    get strokeStyle(){
      return this.ctx.strokeStyle
    },
    setStrokeStyle(v){
      this.strokeStyle=v
      return this
    },
    setStroke(v){
      return this.setStrokeStyle(v)
    },
    set lineCap(v){
      this.ctx.lineCap=v
    },
    get lineCap(){
      return this.ctx.lineCap
    },
    setLineCap(v){
      this.lineCap=v
      return this
    },
    set lineWidth(v){
      this.ctx.lineWidth=v
    },
    get lineWidth(){
      return this.ctx.lineWidth
    },
    setLineWidth(v){
      this.lineWidth=v
      return this
    },
    set globalAlpha(v){
      this.ctx.globalAlpha=v
    },
    get globalAlpha(){
      return this.ctx.globalAlpha
    },
    setGlobalAlpha(v){
      this.globalAlpha=v
      return this
    },
    alpha(v){
      return this.setGlobalAlpha(v)
    },
    get width(){
      return this._width
    },
    set width(v){
      this.canvas.setAttribute('width',v*this.dpi)
      this.canvas.style.width=`${v}px`
      this._width=v
    },
    get height(){
      return this._height
    },
    set height(v){
      this.canvas.setAttribute('height',v*this.dpi)
      this.canvas.style.height=`${v}px`
      this._height=v
    },
    clear(){
      this.clearRect(0,0,this.width,this.height)
    },
    clearRect(x,y,w,h){
      this.ctx.clearRect(...d(x,y,w,h))
      return this
    },
    fillRect(x,y,w,h){
      this.ctx.fillRect(...d(x,y,w,h))
      return this
    },
    beginPath(){
      this.ctx.beginPath()
      return this
    },
    moveTo(x,y){
      this.ctx.moveTo(...d(x,y))
      return this
    },
    lineTo(x,y){
      this.ctx.lineTo(...d(x,y))
      return this
    },
    quadraticCurveTo(cpx,cpy,x,y){
      this.ctx.quadraticCurveTo(...d(cpx,cpy,x,y))
      return this
    },
    bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x,y){
      this.ctx.bezierCurveTo(...d(cp1x,cp1y,cp2x,cp2y,x,y))
      return this
    },
    arc(x,y,r,sAngle,eAngle,counterclockwise=false){
      this.ctx.arc(...d(x,y,r,sAngle,eAngle,counterclockwise))
      return this
    },
    circle(x,y,r){
      this.arc(x,y,r,0,Math.PI*2)
      return this
    },
    fill(){
      this.ctx.fill()
      return this
    },
    stroke(){
      this.ctx.stroke()
      return this
    },

  }

  const dpi=dpiAware?window.devicePixelRatio:1
  const d=(...values)=>mult(dpi,values) //multiplies values to the current dpi

  object.dpi=dpi
  object.canvas=createCanvas(width,height,object.dpi)
  object.ctx=object.canvas.getContext('2d')
  return object
}

const mult=curry(
  (multiplier,value)=>!Array.isArray(value)?value*multiplier:value.map(v=>v*multiplier)
)


export function createCanvas(width,height,multiplier=1){
  let canvas=document.createElement("canvas");
  if(multiplier!=1){
    canvas.style.width=`${width}px`
    canvas.style.height=`${height}px`
  }
  canvas.width=width*multiplier;
  canvas.height=height*multiplier;
  return canvas;
}
